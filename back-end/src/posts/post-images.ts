import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

const IMG_SRC = /<img\b[^>]*?\ssrc="([^"]+)"/gi;

// File ảnh trên R2 mà một bài đang dùng: mọi <img src> trong nội dung + ảnh bìa.
// Link trang ngoài, hoặc file R2 ngoài thư mục posts/, không phải ảnh bài viết → bỏ qua.
export function postImageKeys(bodyHtml: string, coverUrl: string | null, keyOf: (url: string) => string | null): string[] {
  const urls = [...bodyHtml.matchAll(IMG_SRC)].map((m) => m[1]);
  if (coverUrl) urls.push(coverUrl);
  const keys = urls.map(keyOf).filter((k): k is string => !!k?.startsWith('posts/'));
  return [...new Set(keys)];
}

// Ảnh không còn bài nào dùng → đánh dấu để job dọn xoá sau 24 giờ. Đã đánh dấu từ trước thì giữ mốc cũ.
export async function markOrphans(tx: Tx, keys: string[]): Promise<void> {
  if (!keys.length) return;
  await tx.postImage.updateMany({
    where: { key: { in: keys }, orphanedAt: null, uses: { none: {} } },
    data: { orphanedAt: new Date() },
  });
}

// Ghi lại đúng danh sách ảnh bài đang dùng. Chạy trong transaction lưu bài.
// Ảnh chưa có dòng (upload trước khi có bảng này, hoặc dán link ảnh từ bài khác) được tạo luôn ở trạng thái đang dùng.
export async function syncPostImages(tx: Tx, postId: string, keys: string[]): Promise<void> {
  const old = (await tx.postImageUse.findMany({ where: { postId }, select: { key: true } })).map((u) => u.key);
  const removed = old.filter((k) => !keys.includes(k));
  if (removed.length) await tx.postImageUse.deleteMany({ where: { postId, key: { in: removed } } });
  if (keys.length) {
    await tx.postImage.createMany({ data: keys.map((key) => ({ key })), skipDuplicates: true });
    await tx.postImageUse.createMany({ data: keys.map((key) => ({ postId, key })), skipDuplicates: true });
    await tx.postImage.updateMany({ where: { key: { in: keys } }, data: { orphanedAt: null } });
  }
  await markOrphans(tx, removed);
}
