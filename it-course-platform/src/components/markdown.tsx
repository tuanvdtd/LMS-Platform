import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const remarkPlugins = [remarkGfm, remarkBreaks];
const rehypePlugins = [rehypeHighlight];
// Nội dung người dùng tự nhập (Hỏi đáp): không ảnh (pixel theo dõi, ảnh tràn layout), không heading
// (dòng "#include <iostream>" gõ ngoài khối code không biến thành chữ to).
const USER_CONTENT_BLOCKED = ['img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

// Nội dung quiz. Không bật rehype-raw: HTML trong nội dung bị escape (chống XSS).
// remark-breaks: xuống dòng 1 lần = xuống dòng thật, giảng viên không biết Markdown vẫn hiện đúng.
export function Markdown({ children, className, userContent }: { children: string; className?: string; userContent?: boolean }) {
  return (
    <div className={cn('markdown text-sm leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        disallowedElements={userContent ? USER_CONTENT_BLOCKED : undefined}
        unwrapDisallowed={userContent}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
