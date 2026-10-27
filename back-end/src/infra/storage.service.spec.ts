import { generateKeyPairSync } from 'node:crypto';
import { StorageService } from './storage.service.js';

const pem = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' });
const KEY_BASE64 = Buffer.from(pem as string).toString('base64');

// Biến bắt buộc của StorageService; tạo S3Client/ký presign không gọi mạng nên giá trị giả là đủ.
const BASE_ENV = {
  R2_ACCOUNT_ID: 'acc',
  R2_ACCESS_KEY_ID: 'r2-key',
  R2_SECRET_ACCESS_KEY: 'r2-secret',
  R2_PUBLIC_BUCKET: 'pub',
  R2_PRIVATE_BUCKET: 'priv',
  R2_PUBLIC_URL: 'https://cdn.test',
  AWS_REGION: 'ap-southeast-1',
  AWS_ACCESS_KEY_ID: 'AKIATEST',
  AWS_SECRET_ACCESS_KEY: 'aws-secret',
  S3_VIDEO_BUCKET: 'video-bucket',
};
const CF = {
  CLOUDFRONT_DOMAIN: 'd111.cloudfront.net',
  CLOUDFRONT_KEY_PAIR_ID: 'K2TEST',
  CLOUDFRONT_PRIVATE_KEY_BASE64: KEY_BASE64,
};
const VIDEO_KEY = 'videos/u1/a.mp4';

// env.ts nạp .env thật lúc import → luôn gán rõ cả 3 biến CLOUDFRONT_* ('' = không đặt, optionalEnv coi như trống).
function make(cf: Partial<typeof CF>) {
  for (const [name, value] of Object.entries(BASE_ENV)) vi.stubEnv(name, value);
  for (const name of Object.keys(CF) as (keyof typeof CF)[]) vi.stubEnv(name, cf[name] ?? '');
  return new StorageService();
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('StorageService.presignGet — CloudFront cho video', () => {
  it('video + đủ 3 biến → URL CloudFront ký, hạn = now + ttl', async () => {
    const url = new URL(await make(CF).presignGet('video', VIDEO_KEY, 3600));
    expect(url.origin).toBe('https://d111.cloudfront.net');
    expect(url.pathname).toBe(`/${VIDEO_KEY}`);
    expect(url.searchParams.get('Key-Pair-Id')).toBe('K2TEST');
    expect(url.searchParams.get('Signature')).toBeTruthy();
    const expires = Number(url.searchParams.get('Expires'));
    expect(Math.abs(expires - (Date.now() / 1000 + 3600))).toBeLessThan(5);
  });

  it('domain có https:// và / cuối → vẫn đúng host', async () => {
    const url = new URL(
      await make({ ...CF, CLOUDFRONT_DOMAIN: 'https://d111.cloudfront.net/' }).presignGet('video', VIDEO_KEY, 60),
    );
    expect(url.origin).toBe('https://d111.cloudfront.net');
    expect(url.pathname).toBe(`/${VIDEO_KEY}`);
  });

  it('bucket private vẫn ký R2, không qua CloudFront', async () => {
    const url = new URL(await make(CF).presignGet('private', 'documents/u1/a.pdf', 300));
    expect(url.host).toContain('r2.cloudflarestorage.com');
  });

  it('video có download → rơi về presign S3 (CloudFront canned URL không đặt được Content-Disposition)', async () => {
    const url = new URL(await make(CF).presignGet('video', VIDEO_KEY, 300, { fileName: 'a.mp4' }));
    expect(url.host).toContain('amazonaws.com');
  });

  it('không đặt biến nào → video presign S3 như cũ', async () => {
    const url = new URL(await make({}).presignGet('video', VIDEO_KEY, 3600));
    expect(url.host).toContain('amazonaws.com');
    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy();
  });

  it('đặt thiếu → lỗi khởi tạo, nêu tên biến thiếu', () => {
    expect(() => make({ CLOUDFRONT_DOMAIN: 'd111.cloudfront.net' })).toThrow(
      'Thiếu biến môi trường CLOUDFRONT_KEY_PAIR_ID, CLOUDFRONT_PRIVATE_KEY_BASE64',
    );
  });

  it('private key không phải PEM → lỗi khởi tạo', () => {
    expect(() =>
      make({ ...CF, CLOUDFRONT_PRIVATE_KEY_BASE64: Buffer.from('không phải khoá').toString('base64') }),
    ).toThrow('CLOUDFRONT_PRIVATE_KEY_BASE64 không phải private key PEM hợp lệ');
  });
});
