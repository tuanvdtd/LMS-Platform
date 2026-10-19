import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginUrlFor, parseAction, withoutAction } from './resume-action.ts';

test('loginUrlFor giữ query cũ và thêm action', () => {
  assert.equal(
    loginUrlFor('/course/react', '?couponCode=SALE', 'add-to-cart'),
    '/login?redirect=' + encodeURIComponent('/course/react?couponCode=SALE&action=add-to-cart'),
  );
  assert.equal(
    loginUrlFor('/course/react', '', 'buy-now'),
    '/login?redirect=' + encodeURIComponent('/course/react?action=buy-now'),
  );
});

test('loginUrlFor thay action cũ, không nhân đôi', () => {
  assert.equal(
    loginUrlFor('/course/react', '?action=enroll', 'add-to-cart'),
    '/login?redirect=' + encodeURIComponent('/course/react?action=add-to-cart'),
  );
});

test('parseAction chỉ nhận giá trị hợp lệ', () => {
  assert.equal(parseAction('add-to-cart'), 'add-to-cart');
  assert.equal(parseAction('enroll'), 'enroll');
  assert.equal(parseAction('buy-now'), 'buy-now');
  assert.equal(parseAction('delete-all'), null);
  assert.equal(parseAction(null), null);
});

test('withoutAction chỉ bỏ action', () => {
  assert.equal(withoutAction('/course/react', '?couponCode=SALE&action=enroll'), '/course/react?couponCode=SALE');
  assert.equal(withoutAction('/course/react', '?action=enroll'), '/course/react');
  assert.equal(withoutAction('/course/react', ''), '/course/react');
});
