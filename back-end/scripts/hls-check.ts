// pnpm hls:check <file.mp4> — chạy job MediaConvert thật với settings của app, rồi kiểm CloudFront phát HLS:
// playlist/segment ký wildcard đọc được, có CORS, segment không chữ ký bị chặn. Dọn object thử ở cuối.
import { readFileSync } from 'node:fs';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { CreateJobCommand, GetJobCommand, MediaConvertClient } from '@aws-sdk/client-mediaconvert';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { mp4Size } from '../src/assets/file-check.ts';
import { hlsPrefix, jobSettings, ladder } from '../src/hls/hls-job.ts';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const file = process.argv[2];
if (!file) throw new Error('Cách dùng: pnpm hls:check <đường-dẫn.mp4>');
const Bucket = env('S3_VIDEO_BUCKET');
const region = env('AWS_REGION');
const credentials = { accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY') };
const s3 = new S3Client({
  region,
  credentials,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const mc = new MediaConvertClient({ region, credentials });
const domain = env('CLOUDFRONT_DOMAIN').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const keyPairId = env('CLOUDFRONT_KEY_PAIR_ID');
const privateKey = Buffer.from(env('CLOUDFRONT_PRIVATE_KEY_BASE64'), 'base64').toString('utf8');

async function expectStatus(label: string, url: string, want: number, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status !== want) throw new Error(`${label}: trả ${res.status}, cần ${want} — ${(await res.text()).slice(0, 300)}`);
  console.log(`✓ ${label} → ${want}`);
  return res;
}
const firstUri = (playlist: string) => playlist.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const body = readFileSync(file);
const size = await mp4Size((offset, length) => Promise.resolve(body.subarray(offset, offset + length)), body.length);
if (!size) throw new Error('Không đọc được kích thước video');
console.log(`✓ ${size.width}×${size.height}, ${size.hasAudio ? 'có' : 'không có'} tiếng`);

const ts = Date.now();
const inputKey = `videos/hls-check/${ts}.mp4`;
const assetId = `hls-check-${ts}`;
const prefix = hlsPrefix(assetId);
await s3.send(new PutObjectCommand({ Bucket, Key: inputKey, Body: body, ContentType: 'video/mp4' }));
try {
  const created = await mc.send(
    new CreateJobCommand(jobSettings({ roleArn: env('MEDIACONVERT_ROLE_ARN'), bucket: Bucket, inputKey, assetId, ...size })),
  );
  const jobId = created.Job!.Id!;
  console.log(`✓ CreateJob ${jobId}`);
  const deadline = Date.now() + 10 * 60_000;
  for (;;) {
    const { Job } = await mc.send(new GetJobCommand({ Id: jobId }));
    if (Job?.Status === 'COMPLETE') break;
    if (Job?.Status === 'ERROR' || Job?.Status === 'CANCELED') throw new Error(`Job ${Job.Status}: ${Job.ErrorMessage}`);
    if (Date.now() > deadline) throw new Error('Job chạy quá 10 phút');
    await new Promise((r) => setTimeout(r, 5_000));
  }
  console.log('✓ Job COMPLETE');

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${domain}/${prefix}*`,
        Condition: { DateLessThan: { 'AWS:EpochTime': Math.floor(Date.now() / 1000) + 60 } },
      },
    ],
  });
  const signed = new URL(getSignedUrl({ url: `https://${domain}/${prefix}index.m3u8`, keyPairId, privateKey, policy }));
  const master = await expectStatus('master playlist ký wildcard', signed.href, 200, {
    headers: { Origin: 'http://localhost:3000' },
  });
  if (!master.headers.get('access-control-allow-origin')) {
    throw new Error('Thiếu CORS: gắn response headers policy CORS-With-Preflight vào behavior');
  }
  console.log('✓ Có Access-Control-Allow-Origin');
  const variants = firstUri(await master.text());
  if (variants.length !== ladder(size.height).length) {
    throw new Error(`Có ${variants.length} rendition, cần ${ladder(size.height).length}`);
  }
  console.log(`✓ Rendition: ${variants.join(', ')}`);
  const variant = await expectStatus('playlist con + chữ ký', `https://${domain}/${prefix}${variants[0]}${signed.search}`, 200);
  const segment = `https://${domain}/${prefix}${firstUri(await variant.text())[0]}`;
  await expectStatus('segment + chữ ký', `${segment}${signed.search}`, 200);
  // 403 = Restrict viewer access vẫn bật cho thư mục HLS.
  await expectStatus('segment không chữ ký', segment, 403);
} finally {
  await s3.send(new DeleteObjectCommand({ Bucket, Key: inputKey }));
  const listed = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix }));
  const objects = (listed.Contents ?? []).map((o) => ({ Key: o.Key! }));
  if (objects.length) await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: objects } }));
  console.log(`✓ Đã xoá object thử (${objects.length} file HLS)`);
}
