import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';
import { redactBreadcrumb, redactEvent, redactSpan, redactToken, type SpanJSON } from './sentry-redact.ts';

test('che token trong query, giữ param khác', () => {
  assert.equal(redactToken('/reset-password?token=abc123'), '/reset-password?token=[token]');
  assert.equal(
    redactToken('https://h/reset-password?x=1&token=abc#f'),
    'https://h/reset-password?x=1&token=[token]#f',
  );
  assert.equal(redactToken('/login?access_token=x&q=1'), '/login?access_token=x&q=1');
  assert.equal(redactToken('/reset-password?error=INVALID_TOKEN'), '/reset-password?error=INVALID_TOKEN');
  assert.equal(redactToken('/reset-password?Token=abc'), '/reset-password?Token=[token]');
});

test('span: tên + attribute chuỗi (http.target của Next server)', () => {
  const span = {
    name: 'GET /reset-password?token=abc',
    attributes: {
      'http.target': '/reset-password?token=abc',
      'url.full': { value: 'https://h/reset-password?token=abc' },
      'http.status_code': 200,
    },
  } as unknown as SpanJSON;
  assert.deepEqual(redactSpan(span), {
    name: 'GET /reset-password?token=[token]',
    attributes: {
      'http.target': '/reset-password?token=[token]',
      'url.full': { value: 'https://h/reset-password?token=[token]' },
      'http.status_code': 200,
    },
  });
});

test('breadcrumb navigation from/to', () => {
  const b: Breadcrumb = {
    category: 'navigation',
    data: { from: '/reset-password?token=abc', to: '/login' },
  };
  assert.deepEqual(redactBreadcrumb(b).data, { from: '/reset-password?token=[token]', to: '/login' });
});

test('event: request.url (httpcontext không lọc query)', () => {
  const event = { request: { url: 'https://h/reset-password?token=abc' } } as ErrorEvent;
  assert.equal(redactEvent(event).request?.url, 'https://h/reset-password?token=[token]');
});

test('event: contexts.nextjs.request_path (captureRequestError)', () => {
  const event = {
    contexts: { nextjs: { request_path: '/reset-password?token=abc123' } },
  } as unknown as ErrorEvent;
  assert.equal(redactEvent(event).contexts?.nextjs?.request_path, '/reset-password?token=[token]');
});
