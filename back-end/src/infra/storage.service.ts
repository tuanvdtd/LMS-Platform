import { createPrivateKey } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl as signCloudFrontUrl } from '@aws-sdk/cloudfront-signer';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadGatewayException, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { optionalEnv, requireEnv } from '../env.js';

export type Bucket = 'public' | 'private' | 'video';
export type ByteRange = { offset: number; length: number };

type Cdn = { domain: string; keyPairId: string; privateKey: string };

// CloudFront trước bucket video là tuỳ chọn: bỏ trống cả 3 biến → null (presign S3).
// Đặt thiếu hoặc khoá hỏng → lỗi lúc khởi động, không lặng lẽ rơi về S3 hay đợi học viên bấm xem mới lộ.
function cdnFromEnv(): Cdn | null {
  const names = ['CLOUDFRONT_DOMAIN', 'CLOUDFRONT_KEY_PAIR_ID', 'CLOUDFRONT_PRIVATE_KEY_BASE64'] as const;
  const [domain, keyPairId, keyBase64] = names.map((name) => optionalEnv(name));
  if (!domain && !keyPairId && !keyBase64) return null;
  if (!domain || !keyPairId || !keyBase64) {
    throw new Error(`Thiếu biến môi trường ${names.filter((name) => !optionalEnv(name)).join(', ')}`);
  }
  const privateKey = Buffer.from(keyBase64, 'base64').toString('utf8');
  try {
    createPrivateKey(privateKey);
  } catch {
    throw new Error('CLOUDFRONT_PRIVATE_KEY_BASE64 không phải private key PEM hợp lệ');
  }
  return { domain: domain.replace(/^https?:\/\//, '').replace(/\/+$/, ''), keyPairId, privateKey };
}

// R2 cho ảnh bìa, PDF, video giới thiệu; AWS S3 cho video bài giảng
// Cả hai qua S3 SDK, chọn client theo bucket. Video phát qua CloudFront nếu có cấu hình (cache ở edge, egress rẻ);
// upload/kiểm tra/xoá video vẫn gọi thẳng S3.
@Injectable()
export class StorageService {
  // Mặc định SDK gắn x-amz-checksum-crc32 vào URL ký PUT; trình duyệt không gửi header đó → bị từ chối.
  private static readonly CHECKSUM = {
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  } as const;
  private readonly r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    ...StorageService.CHECKSUM,
  });
  private readonly s3 = new S3Client({
    region: requireEnv('AWS_REGION'),
    credentials: {
      accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    },
    ...StorageService.CHECKSUM,
  });
  private readonly buckets: Record<Bucket, string> = {
    public: requireEnv('R2_PUBLIC_BUCKET'),
    private: requireEnv('R2_PRIVATE_BUCKET'),
    video: requireEnv('S3_VIDEO_BUCKET'),
  };
  private readonly publicBase = requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '');
  private readonly cdn = cdnFromEnv();

  get hasCdn(): boolean {
    return this.cdn !== null;
  }

  private clientOf(bucket: Bucket) {
    return bucket === 'video' ? this.s3 : this.r2;
  }

  // Chữ ký gắn Content-Type + Content-Length: gửi file khác loại / khác cỡ → 403.
  presignPut(bucket: Bucket, key: string, contentType: string, size: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    return this.call(() =>
      getSignedUrl(this.clientOf(bucket), command, {
        expiresIn: 600,
        signableHeaders: new Set(['content-type', 'content-length']),
      }),
    );
  }

  // download: tải về với tên gốc (tên có dấu → filename* RFC 5987); bỏ trống = xem inline như cũ.
  presignGet(bucket: Bucket, key: string, ttlSec: number, download?: { fileName: string }): Promise<string> {
    // Canned URL CloudFront không đặt được Content-Disposition → video tải về (chưa có nơi nào dùng) đi S3.
    if (bucket === 'video' && this.cdn && !download) {
      const { domain, keyPairId, privateKey } = this.cdn;
      return this.call(async () =>
        signCloudFrontUrl({
          url: `https://${domain}/${key}`,
          keyPairId,
          privateKey,
          dateLessThan: new Date(Date.now() + ttlSec * 1000),
        }),
      );
    }
    const command = new GetObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ResponseContentDisposition: download
        ? `attachment; filename*=UTF-8''${encodeURIComponent(download.fileName).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`
        : 'inline',
    });
    return this.call(() => getSignedUrl(this.clientOf(bucket), command, { expiresIn: ttlSec }));
  }

  // HLS gồm playlist con + hàng trăm segment: ký một lần cho cả thư mục (custom policy, Resource wildcard),
  // player gắn cùng bộ query chữ ký vào mọi request trong thư mục.
  signVideoPrefix(prefix: string, key: string, ttlSec: number): Promise<string> {
    return this.call(async () => {
      if (!this.cdn) throw new Error('Chưa cấu hình CloudFront');
      const { domain, keyPairId, privateKey } = this.cdn;
      const policy = JSON.stringify({
        Statement: [
          {
            Resource: `https://${domain}/${prefix}*`,
            Condition: { DateLessThan: { 'AWS:EpochTime': Math.floor(Date.now() / 1000) + ttlSec } },
          },
        ],
      });
      return signCloudFrontUrl({ url: `https://${domain}/${key}`, keyPairId, privateKey, policy });
    });
  }

  // Không có object → null (chưa upload xong / key sai), lỗi khác → 502.
  // S3 chỉ trả 404 khi IAM có s3:ListBucket, không thì 403 → 502.
  async head(bucket: Bucket, key: string): Promise<{ size: number } | null> {
    try {
      const res = await this.clientOf(bucket).send(new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
      return { size: res.ContentLength ?? 0 };
    } catch (err) {
      if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) return null;
      throw this.fail(err);
    }
  }

  // range: chỉ đọc một khoảng (GET có Range), bỏ trống = cả object.
  read(bucket: Bucket, key: string, range?: ByteRange): Promise<Buffer> {
    return this.call(async () => {
      // Range độ dài ≤0 bị S3/R2 bỏ qua → trả cả object; offset ≥ size → 416. Caller tự kẹp theo head().size.
      if (range && range.length <= 0) throw new Error(`Range rỗng cho ${key}`);
      const res = await this.clientOf(bucket).send(
        new GetObjectCommand({
          Bucket: this.buckets[bucket],
          Key: key,
          Range: range ? `bytes=${range.offset}-${range.offset + range.length - 1}` : undefined,
        }),
      );
      if (!res.Body) throw new Error(`Lưu trữ trả body rỗng cho ${key}`);
      return Buffer.from(await res.Body.transformToByteArray());
    });
  }

  delete(bucket: Bucket, key: string): Promise<void> {
    return this.call(async () => {
      await this.clientOf(bucket).send(new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
    });
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  // URL ảnh bìa do mình sinh → key để xoá; URL ngoài (seed, Unsplash…) → null.
  keyOfPublicUrl(url: string | null): string | null {
    const prefix = `${this.publicBase}/`;
    return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      throw this.fail(err);
    }
  }

  // 502 là HttpException nên SentryGlobalFilter bỏ qua → tự gửi Sentry trước.
  private fail(err: unknown) {
    Sentry.captureException(err);
    return new BadGatewayException({ statusCode: 502, message: 'Lưu trữ đang lỗi, thử lại' });
  }
}
