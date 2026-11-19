import type { Element, ElementContent, Root, RootContent } from 'hast';
import rehypeHighlight from 'rehype-highlight';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { unified } from 'unified';

// File thuần, không import alias → test bằng node:test.
export type PostHeading = { id: string; text: string; level: 2 | 3 };

const ALIGN = /^text-align: (left|center|right|justify);?$/;
const align: [string, RegExp][] = [['style', ALIGN]];

// Chỉ những gì trình soạn (components/post-editor/extensions.ts) sinh ra. Thêm node mới ở trình soạn thì thêm ở đây.
const SCHEMA = {
  ...defaultSchema,
  // Mặc định chỉ bỏ nội dung <script>; <style> bị gỡ thẻ nhưng chữ bên trong sẽ lọt ra trang.
  strip: ['script', 'style'],
  tagNames: [...(defaultSchema.tagNames ?? []), 'mark', 'u', 'figure', 'figcaption', 'aside'],
  protocols: { ...defaultSchema.protocols, src: ['https'], href: ['http', 'https', 'mailto'] },
  attributes: {
    ...defaultSchema.attributes,
    code: [['className', /^language-[\w-]+$/]],
    p: align,
    h2: align,
    h3: align,
    img: ['src', 'alt', 'title'],
    aside: [['dataCallout', 'note', 'tip', 'warning']],
  },
};

const textOf = (n: RootContent | Root): string =>
  n.type === 'text' ? n.value : 'children' in n ? n.children.map(textOf).join('') : '';

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Sau khi lọc: bỏ ảnh không phải https tuyệt đối (bộ lọc vẫn cho URL tương đối), link ngoài mở tab mới + nofollow
// (blog không thành chỗ rải link SEO), ảnh bọc figure và title thành figcaption, h2/h3 nhận id cho mục lục.
function finish(tree: Root, headings: PostHeading[]) {
  const used = new Map<string, number>();
  const walk = (parent: Root | Element) => {
    parent.children = parent.children.flatMap((node): ElementContent[] => {
      if (node.type !== 'element') return node.type === 'text' ? [node] : [];
      const p = node.properties;
      if (node.tagName === 'img') {
        if (typeof p.src !== 'string' || !p.src.startsWith('https://')) return [];
        p.loading = 'lazy';
        const caption = typeof p.title === 'string' ? p.title.trim() : '';
        delete p.title;
        return [
          {
            type: 'element',
            tagName: 'figure',
            properties: {},
            children: caption
              ? [node, { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] }]
              : [node],
          },
        ];
      }
      if (node.tagName === 'a' && typeof p.href === 'string' && /^https?:/i.test(p.href)) {
        p.target = '_blank';
        p.rel = ['noopener', 'noreferrer', 'nofollow'];
      }
      if (node.tagName === 'h2' || node.tagName === 'h3') {
        const text = textOf(node).trim();
        const base = slug(text) || 'muc';
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        p.id = n ? `${base}-${n + 1}` : base;
        if (text) headings.push({ id: p.id, text, level: node.tagName === 'h2' ? 2 : 3 });
      }
      walk(node);
      return [node];
    });
  };
  walk(tree);
}

const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSanitize, SCHEMA as never)
  .use(rehypeHighlight, { detect: false });

// Nơi DUY NHẤT biến bodyHtml (do người dùng nhập) thành cây hiển thị. Không in bodyHtml bằng dangerouslySetInnerHTML ở đâu khác.
export function renderPostHtml(html: string): { tree: Root; headings: PostHeading[] } {
  const tree = processor.runSync(processor.parse(html)) as Root;
  const headings: PostHeading[] = [];
  finish(tree, headings);
  return { tree, headings };
}
