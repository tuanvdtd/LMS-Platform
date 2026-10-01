import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadGatewayException, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { requireEnv } from '../env.js';

export type Bucket = 'public' | 'private';

// R2 qua S3 SDK (spec curriculum-upload K1, K2): một client, 2 bucket theo tên.
// Video lên AWS S3 ở đợt 3 sẽ thêm client riêng.
@Injectable()
export class StorageService {
  private readonly client = new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    // Mặc định SDK gắn x-amz-checksum-crc32 vào URL ký PUT; trình duyệt không gửi header đó → R2 từ chối.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  private readonly buckets: Record<Bucket, string> = {
    public: requireEnv('R2_PUBLIC_BUCKET'),
    private: requireEnv('R2_PRIVATE_BUCKET'),
  };
  private readonly publicBase = requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '');

  // Chữ ký gắn Content-Type + Content-Length: gửi file khác loại / khác cỡ → R2 trả 403 (spec K4).
  presignPut(bucket: Bucket, key: string, contentType: string, size: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    return this.call(() =>
      getSignedUrl(this.client, command, {
        expiresIn: 600,
        signableHeaders: new Set(['content-type', 'content-length']),
      }),
    );
  }

  presignGet(key: string, ttlSec: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.buckets.private,
      Key: key,
      ResponseContentDisposition: 'inline',
    });
    return this.call(() => getSignedUrl(this.client, command, { expiresIn: ttlSec }));
  }

  // Không có object → null (chưa upload xong / key sai), lỗi khác → 502.
  async head(bucket: Bucket, key: string): Promise<{ size: number } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
      return { size: res.ContentLength ?? 0 };
    } catch (err) {
      if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) return null;
      throw this.fail(err);
    }
  }

  // bytes: chỉ đọc n byte đầu (GET có Range), bỏ trống = cả object.
  read(bucket: Bucket, key: string, bytes?: number): Promise<Buffer> {
    return this.call(async () => {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.buckets[bucket],
          Key: key,
          Range: bytes ? `bytes=0-${bytes - 1}` : undefined,
        }),
      );
      if (!res.Body) throw new Error(`R2 trả body rỗng cho ${key}`);
      return Buffer.from(await res.Body.transformToByteArray());
    });
  }

  delete(bucket: Bucket, key: string): Promise<void> {
    return this.call(async () => {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
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
