import { isProfileVisible, shapeIdentity } from './public-profile.js';

describe('shapeIdentity', () => {
  const own = { headline: 'Sinh viên', bio: 'Tự học', coverTone: 'green' };

  it('chưa có dòng nào → mặc định', () => {
    expect(shapeIdentity(null, null)).toEqual({
      headline: null, bio: null, coverTone: 'ink', website: null, socials: {}, verified: false,
    });
  });

  it('học viên: lấy từ user_profiles', () => {
    expect(shapeIdentity(own, null)).toMatchObject({ headline: 'Sinh viên', bio: 'Tự học', coverTone: 'green', verified: false });
  });

  it('giảng viên cao cấp: headline/bio/link của instructor_profiles thắng, tông bìa vẫn của người dùng', () => {
    const ins = { headline: 'Kỹ sư', bio: 'Mười năm', website: 'https://a.dev', socials: { github: 'https://github.com/a' } };
    expect(shapeIdentity(own, ins)).toEqual({
      headline: 'Kỹ sư', bio: 'Mười năm', coverTone: 'green', website: 'https://a.dev',
      socials: { github: 'https://github.com/a' }, verified: true,
    });
  });

  it('tông bìa lạ trong DB → ink; socials không phải object → {}', () => {
    expect(shapeIdentity({ ...own, coverTone: 'x' }, null).coverTone).toBe('ink');
    expect(shapeIdentity(null, { headline: null, bio: null, website: null, socials: 'oops' }).socials).toEqual({});
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
