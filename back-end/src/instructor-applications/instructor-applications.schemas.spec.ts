import { infoSchema, wordCount } from './instructor-applications.schemas.js';

const words = (n: number) => Array(n).fill('từ').join(' ');
const base = { name: 'Nguyễn Văn A', headline: 'Senior Backend', bio: words(50) };
const bioError = (bio: string) => {
  const r = infoSchema.safeParse({ ...base, bio });
  return r.success ? null : r.error.issues.find((i) => i.path[0] === 'bio')?.message;
};

describe('wordCount', () => {
  it('đếm theo khoảng trắng, bỏ khoảng trắng thừa', () => expect(wordCount('  a  b\nc\t d ')).toBe(4));
  it('chuỗi rỗng → 0', () => expect(wordCount('')).toBe(0));
});

describe('infoSchema', () => {
  it('hợp lệ: trim, socials mặc định {}', () => {
    const r = infoSchema.parse({ ...base, name: '  Nguyễn Văn A ' });
    expect(r).toMatchObject({ name: 'Nguyễn Văn A', socials: {} });
  });
  it('bio 49 từ → lỗi, 50 từ → qua', () => {
    expect(bioError(words(49))).toBe('Giới thiệu tối thiểu 50 từ');
    expect(bioError(words(50))).toBeNull();
  });
  it('bio chứa link → lỗi', () => {
    expect(bioError(`${words(50)} https://x.com`)).toBe('Giới thiệu không được chứa link');
    expect(bioError(`${words(50)} www.x.com`)).toBe('Giới thiệu không được chứa link');
  });
  it('name 1 ký tự → lỗi; trường lạ → lỗi (strict)', () => {
    expect(infoSchema.safeParse({ ...base, name: 'A' }).success).toBe(false);
    expect(infoSchema.safeParse({ ...base, foo: 1 }).success).toBe(false);
  });
  it('website/socials chỉ nhận http(s)', () => {
    expect(infoSchema.safeParse({ ...base, website: 'javascript:alert(1)' }).success).toBe(false);
    expect(infoSchema.safeParse({ ...base, socials: { github: 'ftp://x.com' } }).success).toBe(false);
    expect(infoSchema.safeParse({ ...base, website: 'https://example.com' }).success).toBe(true);
  });
  it('link chữ hoa bị chặn, www. giữa từ thì không', () => {
    expect(bioError(`${words(50)} HTTPS://X.COM`)).toBe('Giới thiệu không được chứa link');
    expect(bioError(`${words(49)} awww.great`)).toBeNull();
  });
});
