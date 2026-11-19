import { createCommentSchema, listPostsQuery, postUploadSchema, removePostSchema, savePostSchema } from './posts.schemas.js';

const id = '0192f0c0-0000-7000-8000-000000000001';

describe('savePostSchema', () => {
  it('nhận body rỗng (tự lưu từng phần)', () => {
    expect(savePostSchema.parse({})).toEqual({});
  });
  it('cắt khoảng trắng tiêu đề, tóm tắt rỗng → null', () => {
    expect(savePostSchema.parse({ title: '  A  ', excerpt: '   ' })).toEqual({ title: 'A', excerpt: null });
  });
  it('từ chối tiêu đề quá 150 ký tự', () => {
    expect(savePostSchema.safeParse({ title: 'a'.repeat(151) }).success).toBe(false);
  });
  it('từ chối quá 3 chủ đề và chủ đề trùng', () => {
    expect(savePostSchema.safeParse({ topicIds: [id, id] }).success).toBe(false);
    const four = [1, 2, 3, 4].map((n) => id.slice(0, -1) + n);
    expect(savePostSchema.safeParse({ topicIds: four }).success).toBe(false);
  });
  it('từ chối nội dung quá dài hoặc có ký tự 0x00', () => {
    expect(savePostSchema.safeParse({ bodyHtml: 'a'.repeat(300_001) }).success).toBe(false);
    expect(savePostSchema.safeParse({ bodyHtml: 'a\u0000b' }).success).toBe(false);
  });
  it('từ chối trường lạ', () => {
    expect(savePostSchema.safeParse({ status: 'published' }).success).toBe(false);
  });
});

describe('listPostsQuery', () => {
  it('mặc định trang 1, 12 bài', () => {
    expect(listPostsQuery.parse({})).toEqual({ page: 1, limit: 12 });
  });
  it('bỏ qua tham số lạ (utm_*)', () => {
    expect(listPostsQuery.parse({ utm_source: 'x', page: '2' }).page).toBe(2);
  });
});

describe('postUploadSchema', () => {
  const ok = { fileName: 'a.png', mimeType: 'image/png', sizeBytes: 1000 };
  it('nhận ảnh hợp lệ', () => {
    expect(postUploadSchema.safeParse(ok).success).toBe(true);
  });
  it('từ chối gif và ảnh quá 5 MB', () => {
    expect(postUploadSchema.safeParse({ ...ok, mimeType: 'image/gif' }).success).toBe(false);
    expect(postUploadSchema.safeParse({ ...ok, sizeBytes: 5 * 1024 ** 2 + 1 }).success).toBe(false);
  });
});

describe('removePostSchema', () => {
  it('bắt buộc có lý do', () => {
    expect(removePostSchema.safeParse({ reason: '  ' }).success).toBe(false);
    expect(removePostSchema.parse({ reason: ' Quảng cáo ' })).toEqual({ reason: 'Quảng cáo' });
  });
});

describe('createCommentSchema', () => {
  it('trim, chặn rỗng / quá dài / NUL, replyToCommentId là GUID', () => {
    expect(createCommentSchema.parse({ body: '  hi  ' })).toEqual({ body: 'hi' });
    expect(createCommentSchema.parse({ body: 'a', replyToCommentId: id })).toEqual({ body: 'a', replyToCommentId: id });
    expect(createCommentSchema.safeParse({ body: '   ' }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: 'x'.repeat(2001) }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: 'a\u0000' }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: 'a', replyToCommentId: 'nope' }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: 'a', extra: 1 }).success).toBe(false);
  });
});
