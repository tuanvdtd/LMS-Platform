import {
  CreateJobCommand,
  type CreateJobCommandInput,
  GetJobCommand,
  MediaConvertClient,
  NotFoundException as JobNotFound,
} from '@aws-sdk/client-mediaconvert';
import { BadGatewayException, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { requireEnv } from '../env.js';

// Chỗ duy nhất trong src/ gọi MediaConvert. E2E thay bằng test/fake-mediaconvert.ts.
// Dùng chung IAM user + region với S3; SDK v3 tự dùng endpoint theo region.
@Injectable()
export class MediaConvertGateway {
  private readonly client = new MediaConvertClient({
    region: requireEnv('AWS_REGION'),
    credentials: {
      accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    },
  });

  // Lỗi → Sentry + 502 (gọi từ request complete; giảng viên bấm thử lại).
  async createJob(input: CreateJobCommandInput): Promise<string> {
    try {
      const { Job } = await this.client.send(new CreateJobCommand(input));
      if (!Job?.Id) throw new Error('CreateJob không trả job id');
      return Job.Id;
    } catch (err) {
      Sentry.captureException(err);
      throw new BadGatewayException({ statusCode: 502, message: 'Dịch vụ xử lý video đang lỗi, thử lại' });
    }
  }

  // Trạng thái job (SUBMITTED, PROGRESSING, COMPLETE, ERROR, CANCELED); job không còn (quá 90 ngày) → null.
  async getJob(id: string): Promise<string | null> {
    try {
      const { Job } = await this.client.send(new GetJobCommand({ Id: id }));
      return Job?.Status ?? null;
    } catch (err) {
      if (err instanceof JobNotFound) return null;
      throw err;
    }
  }
}
