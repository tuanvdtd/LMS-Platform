import { describe, expect, it } from 'vitest';
import {
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
});
