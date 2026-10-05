// pnpm s3:check — kiểm env, quyền IAM và đường presigned PUT của bucket video S3 thật (spec video-upload §7).
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const Bucket = env('S3_VIDEO_BUCKET');
const client = new S3Client({
  region: env('AWS_REGION'),
  credentials: { accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY') },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

// Object thử nằm dưới videos/ cho khớp policy IAM.
const Key = `videos/s3-check/${Date.now()}.bin`;
const body = 'x'.repeat(1024);
const url = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket, Key, ContentType: 'video/mp4', ContentLength: body.length }),
  { expiresIn: 60, signableHeaders: new Set(['content-type', 'content-length']) },
);
const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body });
if (!put.ok) throw new Error(`Presigned PUT trả ${put.status}: ${await put.text()}`);
const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
const range = await client.send(new GetObjectCommand({ Bucket, Key, Range: 'bytes=0-15' }));
const got = (await range.Body!.transformToByteArray()).length;
if (got !== 16) throw new Error(`GET Range trả ${got} byte, cần 16`);
await client.send(new DeleteObjectCommand({ Bucket, Key }));
console.log(`✓ ${Bucket}: presigned PUT → HEAD (${head.ContentLength} bytes) → GET Range 16 byte → DELETE OK`);

// Key chưa có phải ra 404; 403 = thiếu s3:ListBucket → complete sẽ báo 502 thay vì 400.
let missingStatus: number | undefined = 200;
try {
  await client.send(new HeadObjectCommand({ Bucket, Key: `videos/s3-check/khong-co-${Date.now()}` }));
} catch (err) {
  missingStatus = err instanceof S3ServiceException ? err.$metadata.httpStatusCode : undefined;
}
if (missingStatus !== 404) {
  throw new Error(`HEAD key không tồn tại trả ${missingStatus}, cần 404 — thêm s3:ListBucket cho IAM`);
}
console.log('✓ HEAD key không tồn tại → 404');
