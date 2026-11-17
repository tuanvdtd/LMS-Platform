import { GB, LIMITS, storageFullMessage, tierOf, videoMinutesFullMessage, videoMonthKey } from './limits.js';

describe('hạn mức lưu trữ', () => {
  it('giảng viên có hồ sơ đã duyệt dùng mức cao', () => {
    expect(tierOf(true)).toBe('premium');
    expect(tierOf(false)).toBe('standard');
    expect(LIMITS.standard).toEqual({ storageBytes: 5 * GB, videoSecondsPerMonth: 7200 });
    expect(LIMITS.premium).toEqual({ storageBytes: 50 * GB, videoSecondsPerMonth: 180_000 });
  });

  it('khoá bộ đếm đổi theo tháng UTC', () => {
    expect(videoMonthKey('u1', new Date('2026-11-30T23:59:59Z'))).toBe('video-sec:u1:2026-11');
    expect(videoMonthKey('u1', new Date('2026-12-01T00:00:00Z'))).toBe('video-sec:u1:2026-12');
  });

  it('câu báo đầy dung lượng và hết phút video', () => {
    expect(storageFullMessage(4.8 * GB, 5 * GB)).toBe(
      'Đã dùng 4,8 / 5 GB dung lượng. Hãy xoá bớt file chưa dùng trong Thư viện file',
    );
    expect(videoMinutesFullMessage(110 * 60 + 59, 7200)).toBe(
      'Tháng này bạn đã tải lên 110 / 120 phút video. Hạn mức sẽ làm mới vào đầu tháng sau',
    );
  });
});
