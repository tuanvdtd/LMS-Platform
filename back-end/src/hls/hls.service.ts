import { timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { type Mp4Size, mp4Size, videoSizeProblem } from '../assets/file-check.js';
import { optionalEnv, requireEnv } from '../env.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { hlsPlaylistKey, jobSettings } from './hls-job.js';
import { MediaConvertGateway } from './mediaconvert.gateway.js';

type HlsConfig = { roleArn: string; webhookSecret: string };

// HLS tuỳ chọn: trống cả 2 biến → null (upload xong ready, phát MP4 như cũ).
// Thiếu một biến, hoặc bật mà chưa có CloudFront (cần ký wildcard cho thư mục HLS) → lỗi lúc khởi động.
function hlsFromEnv(hasCdn: boolean): HlsConfig | null {
  const names = ['MEDIACONVERT_ROLE_ARN', 'MEDIACONVERT_WEBHOOK_SECRET'] as const;
  const [roleArn, webhookSecret] = names.map((name) => optionalEnv(name));
  if (!roleArn && !webhookSecret) return null;
  if (!roleArn || !webhookSecret) {
    throw new Error(`Thiếu biến môi trường ${names.filter((name) => !optionalEnv(name)).join(', ')}`);
  }
  if (!hasCdn) throw new Error('MediaConvert cần CloudFront: đặt đủ các biến CLOUDFRONT_*');
  return { roleArn, webhookSecret };
}

const RECONCILE_INTERVAL_MS = 10 * 60_000;

@Injectable()
export class HlsService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(HlsService.name);
  private readonly config: HlsConfig | null;
  private readonly bucket = requireEnv('S3_VIDEO_BUCKET');
  private timer: NodeJS.Timeout | undefined;
  private reconciling = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gateway: MediaConvertGateway,
  ) {
    this.config = hlsFromEnv(storage.hasCdn);
  }

  get enabled(): boolean {
    return this.config !== null;
  }

  async submit(asset: { id: string; storageKey: string }, size: Pick<Mp4Size, 'height' | 'hasAudio'>): Promise<string> {
    if (!this.config) throw new Error('MediaConvert chưa bật');
    return this.gateway.createJob(
      jobSettings({
        roleArn: this.config.roleArn,
        bucket: this.bucket,
        inputKey: asset.storageKey,
        assetId: asset.id,
        height: size.height,
        hasAudio: size.hasAudio,
      }),
    );
  }

  verifySecret(given: string | undefined): boolean {
    const want = this.config?.webhookSecret;
    if (!want || !given) return false;
    const a = Buffer.from(given);
    const b = Buffer.from(want);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  // Dùng chung cho webhook, đối soát. Điều kiện hlsJobId + hlsKey null → sự kiện lặp / tới muộn không đổi gì.
  // Asset đang processing (upload mới) → ready/failed; asset ready (backfill) chỉ thêm hlsKey, lỗi thì vẫn phát MP4.
  async applyJobState(jobId: string, status: string): Promise<void> {
    if (status === 'COMPLETE') {
      const asset = await this.prisma.asset.findUnique({ where: { hlsJobId: jobId }, select: { id: true } });
      if (!asset) return;
      const pending = { id: asset.id, hlsJobId: jobId, hlsKey: null };
      const hlsKey = hlsPlaylistKey(asset.id);
      await this.prisma.asset.updateMany({ where: { ...pending, status: 'processing' }, data: { hlsKey, status: 'ready' } });
      await this.prisma.asset.updateMany({ where: pending, data: { hlsKey } });
      return;
    }
    if (status !== 'ERROR' && status !== 'CANCELED') return;
    const pending = { hlsJobId: jobId, hlsKey: null };
    const failed = await this.prisma.asset.updateMany({
      where: { ...pending, status: 'processing' },
      data: { status: 'failed', hlsJobId: null },
    });
    const backfill = await this.prisma.asset.updateMany({ where: pending, data: { hlsJobId: null } });
    if (failed.count + backfill.count > 0) Sentry.captureMessage(`MediaConvert job ${jobId} ${status}`, 'error');
  }

  // Bù webhook bị mất: chạy nền lúc khởi động (máy tắt > 24h, tunnel tắt) và lặp mỗi 10 phút khi app đang chạy
  // (EventBridge không retry hầu hết lỗi 4xx → không lặp thì asset kẹt processing tới lần khởi động sau).
  onApplicationBootstrap() {
    if (!this.enabled) return;
    this.reconcileInBackground();
    this.timer = setInterval(() => this.reconcileInBackground(), RECONCILE_INTERVAL_MS).unref();
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  // Không chặn app; lượt trước chưa xong thì bỏ qua tick này để không chạy chồng.
  private reconcileInBackground() {
    if (this.reconciling) return;
    this.reconciling = true;
    this.reconcile()
      .catch((err: unknown) => {
        this.logger.error(`Đối soát job HLS lỗi: ${String(err)}`);
        Sentry.captureException(err);
      })
      .finally(() => {
        this.reconciling = false;
      });
  }

  // Một job lỗi không chặn các asset sau. Job không còn trên MediaConvert → coi như ERROR.
  async reconcile(): Promise<void> {
    const rows = await this.prisma.asset.findMany({
      where: { hlsJobId: { not: null }, hlsKey: null },
      select: { hlsJobId: true },
    });
    for (const { hlsJobId } of rows) {
      try {
        const status = await this.gateway.getJob(hlsJobId!);
        await this.applyJobState(hlsJobId!, status ?? 'ERROR');
      } catch (err) {
        this.logger.error(`Đối soát job ${hlsJobId} lỗi: ${String(err)}`);
        Sentry.captureException(err);
      }
    }
  }

  // Video cũ (ready, chưa có HLS): gửi job, giữ status ready (đang được dùng). Không đọc được / dọc / <720p → bỏ qua.
  async backfill(): Promise<{ sent: number; skipped: string[] }> {
    const assets = await this.prisma.asset.findMany({
      where: { kind: 'video', status: 'ready', hlsKey: null, hlsJobId: null },
      select: { id: true, storageKey: true, sizeBytes: true },
    });
    let sent = 0;
    const skipped: string[] = [];
    for (const a of assets) {
      try {
        const size = await mp4Size(
          (offset, length) => this.storage.read('video', a.storageKey, { offset, length }),
          Number(a.sizeBytes),
        );
        const problem = size ? videoSizeProblem(size) : 'Không đọc được kích thước video';
        if (problem || !size) {
          skipped.push(`${a.id}: ${problem}`);
          continue;
        }
        const hlsJobId = await this.submit(a, size);
        await this.prisma.asset.updateMany({ where: { id: a.id, hlsJobId: null }, data: { hlsJobId } });
        sent++;
      } catch (err) {
        skipped.push(`${a.id}: ${String(err)}`);
      }
    }
    return { sent, skipped };
  }
}
