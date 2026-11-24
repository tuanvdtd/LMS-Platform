import { clampSegments } from './clamp-segments.js';

describe('clampSegments', () => {
  it('kẹp về thời lượng, bỏ đoạn < 1 s', () => {
    expect(clampSegments([{ s: 0, e: 50 }, { s: 290, e: 400 }, { s: 300, e: 310 }], 300)).toEqual([{ s: 0, e: 50 }, { s: 290, e: 300 }]);
  });
  it('tổng tối đa 300 s: đoạn chạm trần bị cắt ngắn, đoạn sau bỏ', () => {
    expect(clampSegments([{ s: 0, e: 200 }, { s: 200, e: 400 }, { s: 500, e: 510 }], 3600)).toEqual([{ s: 0, e: 200 }, { s: 200, e: 300 }]);
  });
  it('durationSec = 0 (chưa biết thời lượng) thì không kẹp theo thời lượng', () => {
    expect(clampSegments([{ s: 10, e: 70 }], 0)).toEqual([{ s: 10, e: 70 }]);
  });
});
