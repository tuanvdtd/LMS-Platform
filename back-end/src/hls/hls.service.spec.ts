import { HlsService } from './hls.service.js';
import type { MediaConvertGateway } from './mediaconvert.gateway.js';
import type { PrismaService } from '../infra/prisma.service.js';
import type { StorageService } from '../infra/storage.service.js';

const make = (env: { role?: string; secret?: string }, hasCdn = true) => {
  // env.ts nạp .env thật lúc import → luôn gán rõ ('' = không đặt).
  vi.stubEnv('S3_VIDEO_BUCKET', 'vb');
  vi.stubEnv('MEDIACONVERT_ROLE_ARN', env.role ?? '');
  vi.stubEnv('MEDIACONVERT_WEBHOOK_SECRET', env.secret ?? '');
  return new HlsService({} as PrismaService, { hasCdn } as StorageService, {} as MediaConvertGateway);
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('HlsService — bật/tắt theo env', () => {
  it('trống cả 2 → tắt', () => {
    expect(make({}).enabled).toBe(false);
  });
  it('đủ 2 + có CloudFront → bật', () => {
    expect(make({ role: 'arn:r', secret: 's' }).enabled).toBe(true);
  });
  it('thiếu một → lỗi nêu tên biến thiếu', () => {
    expect(() => make({ role: 'arn:r' })).toThrow('Thiếu biến môi trường MEDIACONVERT_WEBHOOK_SECRET');
  });
  it('bật mà chưa có CloudFront → lỗi', () => {
    expect(() => make({ role: 'arn:r', secret: 's' }, false)).toThrow('CloudFront');
  });
});

describe('HlsService.verifySecret', () => {
  it('đúng → true; sai / thiếu / khác độ dài / HLS tắt → false', () => {
    const hls = make({ role: 'arn:r', secret: 'abc123' });
    expect(hls.verifySecret('abc123')).toBe(true);
    expect(hls.verifySecret('abc124')).toBe(false);
    expect(hls.verifySecret('abc')).toBe(false);
    expect(hls.verifySecret(undefined)).toBe(false);
    expect(make({}).verifySecret('abc123')).toBe(false);
  });
});
