import { isProfileVisible, shapeIdentity } from './public-profile.js';

describe('shapeIdentity', () => {
  const own = {
    headline: 'Kỹ sư', bio: 'Mười năm', coverTone: 'green', website: 'https://a.dev', socials: { github: 'https://github.com/a' },
  };

  it('chưa có dòng nào → mặc định', () => {
    expect(shapeIdentity(null, false)).toEqual({
      headline: null, bio: null, coverTone: 'ink', website: null, socials: {}, verified: false,
    });
  });

  it('giảng viên đã xác minh: một bộ duy nhất từ user_profiles, kèm liên kết', () => {
    expect(shapeIdentity(own, true)).toEqual({
      headline: 'Kỹ sư', bio: 'Mười năm', coverTone: 'green', website: 'https://a.dev',
      socials: { github: 'https://github.com/a' }, verified: true,
    });
  });

  it('chưa xác minh: vẫn có chức danh/giới thiệu nhưng không lộ liên kết', () => {
    expect(shapeIdentity(own, false)).toMatchObject({ headline: 'Kỹ sư', bio: 'Mười năm', website: null, socials: {}, verified: false });
  });

  it('tông bìa lạ trong DB → ink; socials không phải object → {}', () => {
    expect(shapeIdentity({ ...own, coverTone: 'x' }, true).coverTone).toBe('ink');
    expect(shapeIdentity({ ...own, socials: 'oops' }, true).socials).toEqual({});
  });
});

describe('isProfileVisible', () => {
  it('ẩn tài khoản nghiệp vụ và tài khoản bị khoá', () => {
    expect(isProfileVisible({ role: 'student', banned: false })).toBe(true);
    expect(isProfileVisible({ role: 'student,instructor', banned: null })).toBe(true);
    expect(isProfileVisible({ role: 'admin', banned: false })).toBe(false);
    expect(isProfileVisible({ role: 'moderator', banned: false })).toBe(false);
    expect(isProfileVisible({ role: 'student', banned: true })).toBe(false);
  });
});
