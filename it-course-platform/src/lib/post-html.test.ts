import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Element, ElementContent, Root } from 'hast';
import { renderPostHtml } from './post-html.ts';

// Gom mọi phần tử trong cây để kiểm thẻ / thuộc tính mà không cần thư viện xuất HTML.
function elements(node: Root | ElementContent, out: Element[] = []): Element[] {
  if (node.type === 'element') out.push(node);
  if ('children' in node) for (const c of node.children) elements(c as ElementContent, out);
  return out;
}
const text = (node: Root | ElementContent): string =>
  node.type === 'text' ? node.value : 'children' in node ? node.children.map((c) => text(c as ElementContent)).join('') : '';
const render = (html: string) => {
  const { tree, headings } = renderPostHtml(html);
  return { tree, headings, els: elements(tree), tags: elements(tree).map((e) => e.tagName) };
};

test('loại script, style, iframe và cả nội dung bên trong', () => {
  const { tree, tags } = render('<p>ok</p><script>alert(1)</script><style>p{color:red}</style><iframe src="https://e.com"></iframe>');
  assert.deepEqual(tags, ['p']);
  assert.equal(text(tree), 'ok');
});

test('loại thuộc tính on*, link javascript:, style ngoài canh lề', () => {
  const { els } = render('<p onclick="x()" style="position:fixed">a <a href="javascript:alert(1)" onmouseover="x()">b</a></p>');
  const [p, a] = els;
  assert.deepEqual(Object.keys(p.properties), []);
  assert.deepEqual(Object.keys(a.properties), []);
});

test('giữ canh lề do trình soạn sinh ra', () => {
  const { els } = render('<h2 style="text-align: center;">T</h2><p style="text-align: right;">p</p>');
  assert.equal(els[0].properties.style, 'text-align: center;');
  assert.equal(els[1].properties.style, 'text-align: right;');
});

test('khối code: giữ lớp ngôn ngữ, tô màu; lớp lạ bị bỏ', () => {
  const { els } = render('<pre><code class="language-js">const a = 1;</code></pre><pre><code class="evil">x</code></pre>');
  const codes = els.filter((e) => e.tagName === 'code');
  assert.deepEqual(codes[0].properties.className, ['hljs', 'language-js']);
  assert.ok(els.some((e) => e.tagName === 'span' && (e.properties.className as string[]).includes('hljs-keyword')));
  assert.ok(!(codes[1].properties.className as string[] | undefined)?.includes('evil'));
});

test('ảnh: chỉ https tuyệt đối, bọc figure, title thành chú thích, bỏ data-size cũ', () => {
  const { els, tree } = render(
    '<img src="https://cdn.test/a.png" alt="A" title="Chú thích" data-size="wide" onerror="x()">' +
      '<img src="http://e.com/a.png"><img src="x.png"><img src="data:image/png;base64,AAA"><img src="https://cdn.test/b.png">',
  );
  const imgs = els.filter((e) => e.tagName === 'img');
  assert.deepEqual(imgs.map((i) => i.properties.src), ['https://cdn.test/a.png', 'https://cdn.test/b.png']);
  assert.deepEqual(Object.keys(imgs[0].properties).sort(), ['alt', 'loading', 'src']);
  // "Rộng hơn cột" đã bỏ (sếp chốt 2026-11-18): bài cũ còn data-size thì hiện như ảnh thường.
  const figures = els.filter((e) => e.tagName === 'figure');
  assert.deepEqual(figures.map((f) => Object.keys(f.properties)), [[], []]);
  assert.equal(text(tree), 'Chú thích');
});

test('link ngoài mở tab mới + nofollow; link nội bộ giữ nguyên', () => {
  const { els } = render('<p><a href="https://e.com">ngoài</a><a href="/blog/x">trong</a></p>');
  const [, out, inside] = els;
  assert.equal(out.properties.target, '_blank');
  assert.deepEqual(out.properties.rel, ['noopener', 'noreferrer', 'nofollow']);
  assert.equal(inside.properties.target, undefined);
});

test('khối ghi chú: chỉ nhận 3 loại', () => {
  const { els } = render('<aside data-callout="tip"><p>a</p></aside><aside data-callout="evil" class="x"><p>b</p></aside>');
  const asides = els.filter((e) => e.tagName === 'aside');
  assert.equal(asides[0].properties.dataCallout, 'tip');
  assert.deepEqual(Object.keys(asides[1].properties), []);
});

test('mục lục: id không dấu, không trùng, bỏ tiêu đề rỗng', () => {
  const { headings, els } = render('<h2>Giới thiệu Đồ thị</h2><h3>Mục con</h3><h2>Giới thiệu Đồ thị</h2><h2> </h2>');
  assert.deepEqual(headings, [
    { id: 'gioi-thieu-do-thi', text: 'Giới thiệu Đồ thị', level: 2 },
    { id: 'muc-con', text: 'Mục con', level: 3 },
    { id: 'gioi-thieu-do-thi-2', text: 'Giới thiệu Đồ thị', level: 2 },
  ]);
  assert.equal(els[0].properties.id, 'gioi-thieu-do-thi');
});

test('giữ các khối định dạng trình soạn hỗ trợ', () => {
  const { tags } = render(
    '<p><strong>a</strong><em>b</em><u>c</u><s>d</s><mark>e</mark><code>f</code></p><ul><li>x</li></ul><ol><li>y</li></ol>' +
      '<blockquote><p>q</p></blockquote><hr><table><tbody><tr><th>h</th><td>d</td></tr></tbody></table>',
  );
  for (const t of ['strong', 'em', 'u', 's', 'mark', 'code', 'ul', 'ol', 'li', 'blockquote', 'hr', 'table', 'th', 'td']) {
    assert.ok(tags.includes(t), `thiếu <${t}>`);
  }
});
