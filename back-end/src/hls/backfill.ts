// pnpm hls:backfill — gửi job MediaConvert cho video bài giảng cũ (ready, chưa có HLS). Asset giữ ready
// (đang phát MP4), job xong webhook / đối soát ghi hlsKey. Dựng service tay, không khởi động Nest app.
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { HlsService } from './hls.service.js';
import { MediaConvertGateway } from './mediaconvert.gateway.js';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();
  try {
    const hls = new HlsService(prisma, new StorageService(), new MediaConvertGateway());
    if (!hls.enabled) throw new Error('Chưa bật MediaConvert: đặt MEDIACONVERT_ROLE_ARN, MEDIACONVERT_WEBHOOK_SECRET');
    const { sent, skipped } = await hls.backfill();
    for (const line of skipped) console.warn(`- bỏ qua ${line}`);
    console.log(`✓ Đã gửi ${sent} job, bỏ qua ${skipped.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
