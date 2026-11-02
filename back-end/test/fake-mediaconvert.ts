import { randomUUID } from 'node:crypto';
import type { CreateJobCommandInput } from '@aws-sdk/client-mediaconvert';
import { MediaConvertGateway } from '../src/hls/mediaconvert.gateway.js';

// Thay 2 hàm gọi mạng. Job lạ → PROGRESSING: e2e dùng chung DB dev, đối soát lúc khởi động
// không được đánh failed nhầm asset thật đang processing / backfill.
export class FakeMediaConvert extends MediaConvertGateway {
  readonly jobs = new Map<string, { input: CreateJobCommandInput; status: string }>();

  override createJob(input: CreateJobCommandInput) {
    const id = `fake-${randomUUID()}`;
    this.jobs.set(id, { input, status: 'SUBMITTED' });
    return Promise.resolve(id);
  }
  override getJob(id: string) {
    return Promise.resolve(this.jobs.get(id)?.status ?? 'PROGRESSING');
  }
}
