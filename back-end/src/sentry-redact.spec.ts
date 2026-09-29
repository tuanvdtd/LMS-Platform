import type { ErrorEvent } from '@sentry/nestjs';
import {
  redactEvent,
  redactResetToken,
  redactSpan,
  type SpanJSON,
} from './sentry-redact.js';

describe('redactResetToken', () => {
  it('token trong path kèm query', () => {
    expect(
      redactResetToken(
        'http://api.tuandt.me/api/auth/reset-password/abc123?callbackURL=x',
      ),
    ).toBe(
      'http://api.tuandt.me/api/auth/reset-password/[token]?callbackURL=x',
    );
  });
  it('token ở cuối', () => {
    expect(redactResetToken('GET /api/auth/reset-password/abc123')).toBe(
      'GET /api/auth/reset-password/[token]',
    );
  });
  it('token trước #', () => {
    expect(redactResetToken('/api/auth/reset-password/abc#x')).toBe(
      '/api/auth/reset-password/[token]#x',
    );
  });
  it('URL không liên quan giữ nguyên', () => {
    expect(redactResetToken('/api/auth/sign-in/email?x=1')).toBe(
      '/api/auth/sign-in/email?x=1',
    );
  });
  it('POST /api/auth/reset-password (token trong body) giữ nguyên', () => {
    expect(redactResetToken('/api/auth/reset-password')).toBe(
      '/api/auth/reset-password',
    );
    expect(redactResetToken('/api/auth/reset-password?x=1')).toBe(
      '/api/auth/reset-password?x=1',
    );
  });
});

describe('redactSpan / redactEvent', () => {
  it('xoá token trong tên span và mọi attribute chuỗi', () => {
    const span = {
      name: 'GET /api/auth/reset-password/abc',
      attributes: {
        'url.full': 'http://h/api/auth/reset-password/abc',
        'url.path': { value: '/api/auth/reset-password/abc' },
        'http.response.status_code': 302,
      },
    } as unknown as SpanJSON;
    expect(redactSpan(span)).toMatchObject({
      name: 'GET /api/auth/reset-password/[token]',
      attributes: {
        'url.full': 'http://h/api/auth/reset-password/[token]',
        'url.path': { value: '/api/auth/reset-password/[token]' },
        'http.response.status_code': 302,
      },
    });
  });
  it('xoá token trong request.url, transaction, breadcrumb', () => {
    const event = {
      request: { url: 'http://h/api/auth/reset-password/abc' },
      transaction: 'GET /api/auth/reset-password/abc',
      breadcrumbs: [
        {
          message: 'GET /api/auth/reset-password/abc',
          data: { url: '/api/auth/reset-password/abc' },
        },
      ],
    } as ErrorEvent;
    expect(redactEvent(event)).toMatchObject({
      request: { url: 'http://h/api/auth/reset-password/[token]' },
      transaction: 'GET /api/auth/reset-password/[token]',
      breadcrumbs: [
        {
          message: 'GET /api/auth/reset-password/[token]',
          data: { url: '/api/auth/reset-password/[token]' },
        },
      ],
    });
  });
  it('span redis: db.query.text chỉ còn tên lệnh (key/giá trị là token)', () => {
    const span = {
      name: 'SET 127.0.0.1:6379',
      attributes: {
        'db.system.name': 'redis',
        'db.operation.name': 'SET',
        'db.query.text': 'SET sessTok123 {"user":1} EX 60',
        'server.port': 6379,
      },
    } as unknown as SpanJSON;
    expect(redactSpan(span).attributes).toEqual({
      'db.system.name': 'redis',
      'db.operation.name': 'SET',
      'db.query.text': 'SET',
      'server.port': 6379,
    });
  });
  it('span redis thiếu db.operation.name: fallback "redis", không undefined', () => {
    const span = {
      name: 'redis 127.0.0.1:6379',
      attributes: {
        'db.system.name': 'redis',
        'db.query.text': 'GET sessTok123',
      },
    } as unknown as SpanJSON;
    expect(redactSpan(span).attributes['db.query.text']).toBe('redis');
  });
  it('span DB khác redis giữ nguyên db.query.text', () => {
    const span = {
      name: 'prisma:engine:db_query',
      attributes: {
        'db.system.name': 'postgresql',
        'db.query.text': 'SELECT 1 FROM "user" WHERE id = $1',
      },
    } as unknown as SpanJSON;
    expect(redactSpan(span).attributes['db.query.text']).toBe(
      'SELECT 1 FROM "user" WHERE id = $1',
    );
  });
});
