// Tách khỏi post-rules.ts (không import gì) để seed blog (node --experimental-strip-types) dùng chung đúng công thức.
export const EXCERPT_MAX = 300;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

// Chữ thuần của bài: đếm từ, cắt tóm tắt, kiểm rỗng. Không dùng để hiển thị.
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, ' ')
    .trim();
}

const wordCount = (html: string) => plainText(html).split(' ').filter(Boolean).length;

// Văn xuôi 200 từ/phút. Chữ trong khối code đọc chậm gấp đôi (100 từ/phút) vì người đọc phải dừng lại hiểu.
// Ảnh tính kiểu Medium: ảnh đầu 12 giây, mỗi ảnh sau bớt 1 giây, không dưới 3 giây.
export function readingMinutes(html: string): number {
  const codeBlocks = html.match(/<pre[\s\S]*?<\/pre>/gi) ?? [];
  const codeWords = codeBlocks.reduce((n, block) => n + wordCount(block), 0);
  const proseWords = wordCount(html.replace(/<pre[\s\S]*?<\/pre>/gi, ' '));
  const images = html.match(/<img\s/gi)?.length ?? 0;
  let seconds = (proseWords * 60) / 200 + (codeWords * 60) / 100;
  for (let i = 0; i < images; i++) seconds += Math.max(3, 12 - i);
  return Math.max(1, Math.round(seconds / 60));
}

export function excerptOf(html: string, max = EXCERPT_MAX): string {
  const text = plainText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}
