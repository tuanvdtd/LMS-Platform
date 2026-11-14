import { updateProfileSchema } from './profiles.schemas.js';

const parse = (v: unknown) => updateProfileSchema.safeParse(v);

describe('updateProfileSchema', () => {
  it('trim; chuỗi rỗng → null; null giữ nguyên', () => {
    expect(parse({ headline: '  Lập trình viên  ', bio: '   ' }).data).toEqual({ headline: 'Lập trình viên', bio: null });
    expect(parse({ headline: null }).data).toEqual({ headline: null });
  });

  it('mọi trường đều tuỳ chọn, trường lạ bị từ chối', () => {
    expect(parse({}).success).toBe(true);
    expect(parse({ learningPublic: true, coverTone: 'violet' }).data).toEqual({ learningPublic: true, coverTone: 'violet' });
    expect(parse({ role: 'admin' }).success).toBe(false);
  });

  it('chặn tông lạ, quá dài, và link trong giới thiệu / chức danh', () => {
    expect(parse({ coverTone: 'rainbow' }).success).toBe(false);
    expect(parse({ headline: 'a'.repeat(61) }).success).toBe(false);
    expect(parse({ bio: 'a'.repeat(2001) }).success).toBe(false);
    expect(parse({ bio: 'xem https://spam.example' }).success).toBe(false);
    expect(parse({ headline: 'www.spam.example' }).success).toBe(false);
    expect(parse({ learningPublic: 'yes' }).success).toBe(false);
  });
});

describe('updateProfileSchema: liên kết', () => {
  it('ô trống → null / bị bỏ; chỉ nhận http(s)', () => {
    expect(parse({ website: '' }).data).toEqual({ website: null });
    expect(parse({ socials: { linkedin: '', github: 'https://github.com/a' } }).data).toEqual({
      socials: { github: 'https://github.com/a' },
    });
    expect(parse({ website: 'javascript:alert(1)' }).success).toBe(false);
    expect(parse({ socials: { tiktok: 'https://x.y' } }).success).toBe(false);
  });
});
