import { staffBlocked } from './auth.guard.js';

describe('staffBlocked', () => {
  it('không phải staff → không chặn', () => {
    expect(staffBlocked(['student', 'instructor'], undefined, false)).toBe(false);
    expect(staffBlocked([], ['instructor'], false)).toBe(false);
  });
  it('staff gọi route thường / route của role khác → chặn', () => {
    expect(staffBlocked(['student', 'admin'], undefined, false)).toBe(true);
    expect(staffBlocked(['moderator'], ['instructor'], false)).toBe(true);
  });
  it('@Roles chứa role staff mà user có → cho qua', () => {
    expect(staffBlocked(['student', 'admin'], ['admin'], false)).toBe(false);
    expect(staffBlocked(['moderator'], ['admin', 'moderator'], false)).toBe(false);
  });
  it('@Roles chứa role staff mà user không có → chặn', () => {
    expect(staffBlocked(['moderator'], ['admin', 'instructor'], false)).toBe(true);
  });
  it('@StaffAllowed → cho qua', () => {
    expect(staffBlocked(['moderator'], undefined, true)).toBe(false);
  });
});
