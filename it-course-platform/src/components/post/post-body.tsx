import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { isValidElement, type ComponentProps } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { renderPostHtml } from '@/lib/post-html';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';

function Pre({ children }: ComponentProps<'pre'>) {
  const cls = isValidElement<{ className?: string }>(children) ? (children.props.className ?? '') : '';
  return <CodeBlock lang={/language-([\w-]+)/.exec(cls)?.[1]}>{children}</CodeBlock>;
}

// Cây đã lọc → React. Trang đọc gọi renderPostHtml một lần để lấy cả cây lẫn mục lục rồi truyền cây vào đây.
export function PostTree({ tree, className }: { tree: Root; className?: string }) {
  return (
    <div className={cn('post-body', className)}>{toJsxRuntime(tree, { Fragment, jsx, jsxs, components: { pre: Pre } })}</div>
  );
}

// Dùng khi chỉ cần nội dung (xem trước trong trình soạn).
export function PostBody({ html, className }: { html: string; className?: string }) {
  return <PostTree tree={renderPostHtml(html).tree} className={className} />;
}
