import { bucketCount, isWatched, mergeBuckets, popcount, watchBudget } from './watch-bitmap.js';

describe('watch-bitmap', () => {
  it('bucketCount: làm tròn lên theo đoạn 10s', () => {
    expect(bucketCount(0)).toBe(0);
    expect(bucketCount(1)).toBe(1);
    expect(bucketCount(600)).toBe(60);
    expect(bucketCount(601)).toBe(61);
  });

  it('popcount đếm số bit bật', () => {
    expect(popcount(new Uint8Array([]))).toBe(0);
    expect(popcount(new Uint8Array([0b1011, 0xff]))).toBe(11);
  });

  it('mergeBuckets: bit thấp của byte 0 là đoạn 0; lọc ngoài khoảng, trùng, số lẻ', () => {
    const bits = mergeBuckets(null, [0, 9, 9, 10, -1, 1.5], 10, 100);
    expect([...bits]).toEqual([0b00000001, 0b00000010]);
    expect(popcount(bits)).toBe(2);
  });

  it('mergeBuckets: giữ bit cũ, chỉ nhận tối đa `budget` đoạn MỚI theo thứ tự tăng dần', () => {
    const prev = mergeBuckets(null, [0, 1], 20, 100);
    const bits = mergeBuckets(prev, [1, 5, 3, 4, 2], 20, 2); // 1 đã có → mới: 2,3,4,5 → nhận 2,3
    expect(popcount(bits)).toBe(4);
    expect(bits[0]).toBe(0b00001111);
  });

  it('mergeBuckets: budget âm/0 không nhận gì; bitmap cũ dài hơn (video bị rút ngắn) bị cắt', () => {
    expect(popcount(mergeBuckets(null, [0, 1], 10, -3))).toBe(0);
    const long = new Uint8Array([0xff, 0xff, 0xff]);
    expect(mergeBuckets(long, [], 8, 10).length).toBe(1);
  });

  it('watchBudget: ân hạn 60s, tối đa 2x thời gian thực, trừ phần đã xem', () => {
    expect(watchBudget(0, 0)).toBe(12); // ceil(60 × 2 / 10)
    expect(watchBudget(600, 12)).toBe(120); // ceil(660 × 2 / 10) − 12
    expect(watchBudget(-5, 0)).toBe(12); // âm → coi như 0
    expect(watchBudget(0.4, 0)).toBe(13); // làm tròn lên
  });

  it('isWatched: ≥ ceil(90%) số đoạn; video 0 đoạn không bao giờ xong', () => {
    expect(isWatched(53, 60)).toBe(false);
    expect(isWatched(54, 60)).toBe(true);
    expect(isWatched(1, 1)).toBe(true);
    expect(isWatched(0, 0)).toBe(false);
  });
});

describe('watch-bitmap: video bị rút ngắn / làm tròn', () => {
  it('mergeBuckets: xoá bit > total ở byte cuối khi prev dài hơn', () => {
    const prev = new Uint8Array([0xff, 0xff]); // video cũ 16 đoạn, đã xem hết
    const bits = mergeBuckets(prev, [], 10, 100); // video mới 10 đoạn
    expect(popcount(bits)).toBe(10);
  });

  it('isWatched: 90% không sai số dấu phẩy động (total = 70)', () => {
    expect(isWatched(63, 70)).toBe(true);
    expect(isWatched(62, 70)).toBe(false);
  });
});
