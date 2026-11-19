import { canWriteFrom, excerptOf, plainText, publishProblems, readingMinutes } from './post-rules.js';

describe('plainText', () => {
  it('bỏ thẻ, giải mã entity, gộp khoảng trắng', () => {
    expect(plainText('<h2>Xin&nbsp;chào</h2><p>a &amp; b</p>\n<pre><code>x &lt; y</code></pre>')).toBe('Xin chào a & b x < y');
  });
  it('rỗng khi chỉ có thẻ', () => {
    expect(plainText('<p></p><p><br></p>')).toBe('');
  });
});

describe('readingMinutes', () => {
  it('tối thiểu 1 phút', () => {
    expect(readingMinutes('<p>ngắn</p>')).toBe(1);
    expect(readingMinutes('')).toBe(1);
  });
  it('200 từ một phút, làm tròn', () => {
    expect(readingMinutes(`<p>${'từ '.repeat(900)}</p>`)).toBe(5);
  });
  it('chữ trong khối code tính 100 từ một phút', () => {
    expect(readingMinutes(`<pre><code class="language-js">${'x '.repeat(300)}</code></pre>`)).toBe(3);
  });
  it('ảnh 12 giây, mỗi ảnh sau bớt 1 giây, tối thiểu 3 giây', () => {
    // 12+11+…+3 = 75 giây cho 10 ảnh đầu, 10 ảnh sau mỗi ảnh 3 giây = 105 giây
    expect(readingMinutes('<img src="a.png">'.repeat(20))).toBe(2);
  });
  it('cộng cả văn xuôi, code và ảnh', () => {
    // 200 từ (60s) + 200 từ code (120s) + 1 ảnh (12s) = 192s
    const html = `<p>${'từ '.repeat(200)}</p><pre><code>${'x '.repeat(200)}</code></pre><p><img src="a.png"></p>`;
    expect(readingMinutes(html)).toBe(3);
  });
});

describe('excerptOf', () => {
  it('giữ nguyên khi đủ ngắn', () => {
    expect(excerptOf('<p>Một đoạn ngắn.</p>')).toBe('Một đoạn ngắn.');
  });
  it('cắt ở ranh giới từ và thêm dấu ba chấm, không vượt max', () => {
    const out = excerptOf(`<p>${'abcde '.repeat(100)}</p>`, 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/abcd…$/);
  });
});

describe('canWriteFrom', () => {
  const none = { hasInstructorProfile: false, hasPublishedCourse: false };
  it('admin luôn được viết', () => {
    expect(canWriteFrom({ role: 'admin', ...none })).toBe(true);
  });
  it('moderator không được viết dù có khoá', () => {
    expect(canWriteFrom({ role: 'moderator', hasInstructorProfile: true, hasPublishedCourse: true })).toBe(false);
  });
  it('tự bật vai trò giảng viên mà chưa có gì thì không được', () => {
    expect(canWriteFrom({ role: 'student,instructor', ...none })).toBe(false);
  });
  it('đã qua duyệt đơn hoặc có khoá đang bán thì được', () => {
    expect(canWriteFrom({ role: 'student,instructor', hasInstructorProfile: true, hasPublishedCourse: false })).toBe(true);
    expect(canWriteFrom({ role: 'student,instructor', hasInstructorProfile: false, hasPublishedCourse: true })).toBe(true);
  });
  it('role null', () => {
    expect(canWriteFrom({ role: null, ...none })).toBe(false);
  });
});

describe('publishProblems', () => {
  const ok = { title: 'Tiêu đề', bodyHtml: '<p>nội dung</p>', topicCount: 1, coverUrl: 'https://cdn.test/bia.png' };
  it('đủ điều kiện', () => {
    expect(publishProblems(ok)).toEqual([]);
  });
  it('báo từng trường thiếu', () => {
    const paths = publishProblems({ title: '  ', bodyHtml: '<p></p>', topicCount: 0, coverUrl: null }).map((e) => e.path[0]);
    expect(paths).toEqual(['title', 'bodyHtml', 'topicIds', 'coverUrl']);
  });
  it('ảnh bìa là bắt buộc', () => {
    expect(publishProblems({ ...ok, coverUrl: null }).map((e) => e.path[0])).toEqual(['coverUrl']);
  });
  it('bài chỉ có ảnh vẫn tính là có nội dung', () => {
    expect(publishProblems({ ...ok, bodyHtml: '<img src="https://cdn.test/a.png">' })).toEqual([]);
  });
  it('quá 3 chủ đề', () => {
    expect(publishProblems({ ...ok, topicCount: 4 }).map((e) => e.path[0])).toEqual(['topicIds']);
  });
});
