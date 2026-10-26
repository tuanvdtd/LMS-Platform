// src/components/markdown-input.tsx
'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import '@uiw/react-md-editor/markdown-editor.css';
import { Skeleton } from '@/components/ui/skeleton';
import { Markdown } from '@/components/markdown';

// Toolbar gọn cho người dùng không nhớ cú pháp Markdown (Hỏi đáp). Không có nút ảnh / tiêu đề: Markdown userContent chặn cả hai.
const Editor = dynamic(
  () =>
    import('@uiw/react-md-editor').then(({ default: MDEditor, commands: c }) => {
      const toolbar = [c.bold, c.italic, c.code, c.codeBlock, c.link, c.divider, c.unorderedListCommand, c.orderedListCommand, c.quote];
      const modes = [c.codeEdit, c.codePreview];
      return function Editor(props: React.ComponentProps<typeof MDEditor>) {
        return <MDEditor commands={toolbar} extraCommands={modes} {...props} />;
      };
    }),
  { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> },
);

export function MarkdownInput({
  value,
  onChange,
  height = 160,
  ...textarea
}: {
  value: string;
  onChange: (value: string) => void;
  height?: number;
} & Pick<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'placeholder' | 'maxLength' | 'aria-label' | 'autoFocus'>) {
  const { resolvedTheme } = useTheme();
  return (
    <div className="quiz-md" data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      <Editor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        preview="edit"
        defaultTabEnable // Tab chuyển focus như ô nhập thường, không chèn khoảng trắng (không bẫy bàn phím)
        height={height}
        textareaProps={textarea}
        components={{ preview: (source) => <Markdown userContent>{source}</Markdown> }}
      />
    </div>
  );
}
