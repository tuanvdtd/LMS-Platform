// pnpm r2:check — kiểm env + quyền + domain công khai của R2 thật (spec curriculum-upload §7).
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

for (const [name, bucket] of [
  ['public', env('R2_PUBLIC_BUCKET')],
  ['private', env('R2_PRIVATE_BUCKET')],
] as const) {
  const Key = `r2-check/${Date.now()}.txt`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body: 'x'.repeat(1024), ContentType: 'text/plain' }));
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key }));
  if (name === 'public') {
    const res = await fetch(`${env('R2_PUBLIC_URL').replace(/\/+$/, '')}/${Key}`);
    if (!res.ok) throw new Error(`Domain công khai trả ${res.status} — kiểm R2_PUBLIC_URL / bật public access`);
  }
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));
  console.log(`✓ ${name} (${bucket}): PUT → HEAD (${head.ContentLength} bytes) → DELETE OK`);

  // Đường trình duyệt dùng (presigned PUT bằng fetch); e2e dùng FakeStorage nên không phủ.
  const body = 'x'.repeat(1024);
  const presignedKey = `r2-check/${Date.now()}-presigned.txt`;
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: presignedKey, ContentType: 'text/plain', ContentLength: body.length }),
    { expiresIn: 60, signableHeaders: new Set(['content-type', 'content-length']) },
  );
  const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body });
  if (!put.ok) throw new Error(`Presigned PUT ${name} trả ${put.status}: ${await put.text()}`);
  await client.send(new HeadObjectCommand({ Bucket: bucket, Key: presignedKey }));
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: presignedKey }));
  console.log(`✓ ${name} (${bucket}): presigned PUT (fetch) → HEAD → DELETE OK`);
}
