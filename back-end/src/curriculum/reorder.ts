// Thứ tự mới sau khi đặt `id` vào vị trí `index` (spec curriculum-upload §4.2). `id` có thể chưa có trong `ids`
// (mục chuyển từ phần khác). index vượt độ dài → cuối.
export function reorder(ids: readonly string[], id: string, index: number): string[] {
  const rest = ids.filter((x) => x !== id);
  rest.splice(Math.min(index, rest.length), 0, id);
  return rest;
}
