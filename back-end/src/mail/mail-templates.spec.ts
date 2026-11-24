import { describe, expect, it } from 'vitest';
import {
  accountLockedMail,
  courseNudgeMail,
  courseReviewedMail,
  instructorApplicationReviewedMail,
  resetPasswordMail,
  staffInviteMail,
  verificationMail,
} from './mail-templates.js';

const FE = 'https://fe.test';

describe('mail templates', () => {
  it('escape nội dung người dùng nhập, giữ nguyên tiêu đề thư', () => {
    const { subject, html } = courseReviewedMail(
      FE,
      '<script>x</script>',
      false,
      'Dòng 1 <b>\nDòng 2',
    );
    expect(subject).toContain('<script>x</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('Dòng 1 &lt;b&gt;<br>Dòng 2');
  });

  it('link có & vẫn là href hợp lệ', () => {
    const url = 'https://api.test/verify?token=a&callbackURL=%2F';
    for (const mail of [verificationMail, resetPasswordMail, staffInviteMail]) {
      expect(mail(url).html).toContain(
        'href="https://api.test/verify?token=a&amp;callbackURL=%2F"',
      );
    }
  });

  it('thư kết quả duyệt dẫn về đúng trang', () => {
    expect(courseReviewedMail(FE, 'A', true, null).html).toContain(
      `href="${FE}/instructor/courses"`,
    );
    expect(
      instructorApplicationReviewedMail(FE, false, 'Ảnh mờ').html,
    ).toContain(`href="${FE}/instructor/verification"`);
    expect(
      instructorApplicationReviewedMail(FE, true, null).html,
    ).not.toContain('Nhận xét của người duyệt');
  });

  it('mail nhắc học: escape lời nhắn và tên, link về trang học của khoá', () => {
    const { subject, html } = courseNudgeMail(FE, {
      instructorName: 'Cô <b>Lan</b>',
      courseTitle: 'JS & DOM',
      courseSlug: 'js-dom',
      kind: 'reminder',
      message: 'Dòng 1 <i>\nDòng 2',
    });
    expect(subject).toBe('Khoá "JS & DOM" đang chờ bạn quay lại');
    expect(html).toContain('Dòng 1 &lt;i&gt;<br>Dòng 2');
    expect(html).toContain('Cô &lt;b&gt;Lan&lt;/b&gt;');
    expect(html).toContain('href="https://fe.test/learn/js-dom"');
  });

  it('thư khoá tài khoản: escape lý do, nêu hạn theo giờ VN, khoá vĩnh viễn ghi rõ', () => {
    const { subject, html } = accountLockedMail(FE, '<b>spam</b>', new Date('2026-11-30T03:00:00Z'));
    expect(subject).toBe('Tài khoản Aolumi của bạn đã bị khoá');
    expect(html).toContain('&lt;b&gt;spam&lt;/b&gt;');
    expect(html).toContain('10:00 ngày 30/11/2026');
    expect(accountLockedMail(FE, 'x', null).html).toContain('vĩnh viễn');
  });
});
