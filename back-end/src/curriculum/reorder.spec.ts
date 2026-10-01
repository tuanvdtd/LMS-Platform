import { reorder } from './reorder.js';

describe('reorder', () => {
  const ids = ['a', 'b', 'c', 'd'];
  it('đưa lên đầu', () => expect(reorder(ids, 'c', 0)).toEqual(['c', 'a', 'b', 'd']));
  it('đưa xuống cuối', () => expect(reorder(ids, 'a', 3)).toEqual(['b', 'c', 'd', 'a']));
  it('index vượt độ dài → kẹp về cuối', () => expect(reorder(ids, 'b', 99)).toEqual(['a', 'c', 'd', 'b']));
  it('giữ nguyên chỗ', () => expect(reorder(ids, 'b', 1)).toEqual(ids));
  it('chèn id từ danh sách khác', () => expect(reorder(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b']));
  it('chèn vào danh sách rỗng', () => expect(reorder([], 'x', 5)).toEqual(['x']));
  it('không đổi mảng đầu vào', () => {
    const input = [...ids];
    reorder(input, 'd', 0);
    expect(input).toEqual(ids);
  });
});
