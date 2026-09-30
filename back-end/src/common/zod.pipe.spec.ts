import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { type FieldError, validationError, ZodValidationPipe } from './zod.pipe.js';

type Body = { statusCode: number; message: string; errors: FieldError[] };
const bodyOf = (fn: () => unknown): Body => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    return (e as BadRequestException).getResponse() as Body;
  }
  throw new Error('không ném lỗi');
};

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().trim().min(1), tags: z.array(z.string().max(3)) }).strict(),
  );

  it('hợp lệ → trả dữ liệu đã parse (có trim)', () => {
    expect(pipe.transform({ name: '  a ', tags: [] })).toEqual({ name: 'a', tags: [] });
  });

  it('sai → 400, path là mảng chuỗi, message tiếng Việt mặc định', () => {
    const body = bodyOf(() => pipe.transform({ name: ' ', tags: ['abcd'] }));
    expect(body).toMatchObject({ statusCode: 400, message: 'Dữ liệu không hợp lệ' });
    expect(body.errors.map((e) => e.path)).toEqual([['name'], ['tags', '0']]);
    expect(body.errors[0].message).toMatch(/^Quá nhỏ/);
  });

  it('validationError dựng cùng body cho lỗi do service tự kiểm', () => {
    const body = validationError([{ path: ['categoryId'], message: 'x' }]).getResponse();
    expect(body).toEqual({
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: [{ path: ['categoryId'], message: 'x' }],
    });
  });
});
