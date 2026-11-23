import { describe, expect, it } from 'vitest';
import { banSeconds, lockState, rolesOf } from './user-rules.js';

const now = new Date('2026-11-23T00:00:00Z');

describe('lockState', () => {
  it('banned + chưa hết hạn → locked, giữ lý do và hạn', () => {
    const until = new Date('2026-11-30T00:00:00Z');
    expect(lockState({ banned: true, banReason: 'spam', banExpires: until }, now)).toEqual({
      status: 'locked',
      lockReason: 'spam',
      lockedUntil: until,
    });
  });
  it('banned vĩnh viễn → locked', () => {
    expect(lockState({ banned: true, banReason: null, banExpires: null }, now).status).toBe('locked');
  });
  it('banned nhưng đã quá hạn → active (Better Auth chỉ gỡ cờ khi đăng nhập lại)', () => {
    expect(lockState({ banned: true, banReason: 'x', banExpires: new Date('2026-11-22T00:00:00Z') }, now)).toEqual({
      status: 'active',
      lockReason: null,
      lockedUntil: null,
    });
  });
  it('banned null/false → active', () => {
    expect(lockState({ banned: null, banReason: null, banExpires: null }, now).status).toBe('active');
    expect(lockState({ banned: false, banReason: null, banExpires: null }, now).status).toBe('active');
  });
});

describe('banSeconds', () => {
  it('đổi thời hạn sang giây; vĩnh viễn = undefined', () => {
    expect(banSeconds('7d')).toBe(604_800);
    expect(banSeconds('30d')).toBe(2_592_000);
    expect(banSeconds('permanent')).toBeUndefined();
  });
});

describe('rolesOf', () => {
  it('chỉ giữ vai trò của tài khoản cá nhân, null = học viên', () => {
    expect(rolesOf('student,instructor')).toEqual(['student', 'instructor']);
    expect(rolesOf('instructor')).toEqual(['instructor']);
    expect(rolesOf(null)).toEqual(['student']);
  });
});
