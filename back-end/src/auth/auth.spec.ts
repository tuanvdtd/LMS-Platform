import { APIError } from 'better-auth/api';
import { isServerError } from './auth.js';

describe('isServerError', () => {
  it('lỗi không phải APIError → gửi Sentry', () => {
    expect(isServerError(new Error('db down'))).toBe(true);
  });
  it('APIError 500 → gửi Sentry', () => {
    expect(isServerError(new APIError('INTERNAL_SERVER_ERROR'))).toBe(true);
  });
  it('APIError 4xx (sai mật khẩu, chưa xác minh) → bỏ qua', () => {
    expect(isServerError(new APIError('BAD_REQUEST'))).toBe(false);
    expect(isServerError(new APIError('UNAUTHORIZED'))).toBe(false);
    expect(isServerError(new APIError('FORBIDDEN'))).toBe(false);
  });
});
