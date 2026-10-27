// pnpm cloudfront:check — kiểm distribution CloudFront thật trước bucket video:
// URL ký đọc được Range; không ký / ký hết hạn / gọi thẳng S3 đều bị chặn 403.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const Bucket = env('S3_VIDEO_BUCKET');
const region = env('AWS_REGION');
const client = new S3Client({
  region,
  credentials: { accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY') },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
const domain = env('CLOUDFRONT_DOMAIN').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const keyPairId = env('CLOUDFRONT_KEY_PAIR_ID');
const privateKey = Buffer.from(env('CLOUDFRONT_PRIVATE_KEY_BASE64'), 'base64').toString('utf8');

// Object thử nằm dưới videos/ cho khớp policy IAM.
const Key = `videos/cloudfront-check/${Date.now()}.bin`;
const plainUrl = `https://${domain}/${Key}`;
const sign = (expiresInSec: number) =>
  getSignedUrl({ url: plainUrl, keyPairId, privateKey, dateLessThan: new Date(Date.now() + expiresInSec * 1000) });

async function expectStatus(label: string, url: string, want: number, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status !== want) {
    throw new Error(`${label}: trả ${res.status}, cần ${want} — ${(await res.text()).slice(0, 300)}`);
  }
  console.log(`✓ ${label} → ${want}`);
  return res;
}

await client.send(new PutObjectCommand({ Bucket, Key, Body: 'x'.repeat(1024), ContentType: 'video/mp4' }));
try {
  const res = await expectStatus('URL ký + Range 0-15', sign(60), 206, { headers: { Range: 'bytes=0-15' } });
  const got = (await res.arrayBuffer()).byteLength;
  if (got !== 16) throw new Error(`Range trả ${got} byte, cần 16`);
  console.log('✓ Range trả đúng 16 byte');
  // 403 ở đây = Restrict viewer access đang bật.
  await expectStatus('URL không ký', plainUrl, 403);
  await expectStatus('URL ký đã hết hạn', sign(-60), 403);
  // 403 ở đây = bucket vẫn private, chỉ CloudFront (OAC) đọc được.
  await expectStatus('Gọi thẳng S3 không ký', `https://${Bucket}.s3.${region}.amazonaws.com/${Key}`, 403);
} finally {
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
  console.log('✓ Đã xoá object thử');
}
