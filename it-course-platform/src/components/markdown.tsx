import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const remarkPlugins = [remarkGfm, remarkBreaks];
const rehypePlugins = [rehypeHighlight];

// Nội dung quiz (spec 2026-10-08-quiz-authoring Q6). Không bật rehype-raw: HTML trong nội dung bị escape (chống XSS).
// remark-breaks: xuống dòng 1 lần = xuống dòng thật, giảng viên không biết Markdown vẫn hiện đúng.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('markdown text-sm leading-relaxed', className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
