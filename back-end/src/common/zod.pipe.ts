import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

// Message mặc định tiếng Việt cho mọi schema (config toàn cục, áp dụng lúc parse).
// Schema nào cần câu chữ riêng thì tự truyền message.
z.config(z.locales.vi());

export type FieldError = { path: string[]; message: string };

// Body 400 chung của API nghiệp vụ (spec course-create-basics §4.3). Service dùng lại cho
// lỗi chỉ kiểm được bằng DB (vd categoryId không tồn tại).
export function validationError(errors: FieldError[]) {
  return new BadRequestException({ statusCode: 400, message: 'Dữ liệu không hợp lệ', errors });
}

// Dùng ở tham số: @Body(new ZodValidationPipe(schema)), @Query(new ZodValidationPipe(schema)).
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw validationError(
      result.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })),
    );
  }
}

// id trên URL sai định dạng → Postgres ném lỗi uuid; service coi như không tồn tại (404).
export const isGuid = (id: string) => z.guid().safeParse(id).success;
