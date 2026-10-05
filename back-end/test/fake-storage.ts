import type { Bucket, ByteRange, StorageService } from '../src/infra/storage.service.js';

type StoragePort = Pick<
  StorageService,
  'presignPut' | 'presignGet' | 'head' | 'read' | 'delete' | 'publicUrl' | 'keyOfPublicUrl'
>;

// Thay R2 trong e2e (spec curriculum-upload §7): object nằm trong Map, URL ký là chuỗi giả.
// Test "upload" bằng put() thay cho trình duyệt PUT lên URL ký.
export class FakeStorage implements StoragePort {
  private readonly objects = new Map<string, Buffer>();
  static readonly PUBLIC = 'https://cdn.test';

  put(bucket: Bucket, key: string, body: Buffer) {
    this.objects.set(`${bucket}/${key}`, body);
  }
  has(bucket: Bucket, key: string) {
    return this.objects.has(`${bucket}/${key}`);
  }

  presignPut(bucket: Bucket, key: string) {
    return Promise.resolve(`https://fake.r2/${bucket}/${key}`);
  }
  presignGet(bucket: Bucket, key: string) {
    return Promise.resolve(`https://fake.r2/${bucket}/${key}?signed=1`);
  }
  head(bucket: Bucket, key: string) {
    const body = this.objects.get(`${bucket}/${key}`);
    return Promise.resolve(body ? { size: body.length } : null);
  }
  read(bucket: Bucket, key: string, range?: ByteRange) {
    const body = this.objects.get(`${bucket}/${key}`);
    if (!body) return Promise.reject(new Error(`Không có ${bucket}/${key}`));
    return Promise.resolve(range ? body.subarray(range.offset, range.offset + range.length) : body);
  }
  delete(bucket: Bucket, key: string) {
    this.objects.delete(`${bucket}/${key}`);
    return Promise.resolve();
  }
  publicUrl(key: string) {
    return `${FakeStorage.PUBLIC}/${key}`;
  }
  keyOfPublicUrl(url: string | null) {
    const prefix = `${FakeStorage.PUBLIC}/`;
    return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}
