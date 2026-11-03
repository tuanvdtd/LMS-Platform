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
      // Nhãn tiếng Việt cho tooltip + aria-label (thư viện chỉ có tiếng Anh). Phím tắt giữ nguyên của thư viện.
      const vi = (cmd: typeof c.bold, label: string) => ({ ...cmd, buttonProps: { ...cmd.buttonProps, 'aria-label': label, title: label } });
      const toolbar = [
        vi(c.bold, 'In đậm (Ctrl+B)'),
        vi(c.italic, 'In nghiêng (Ctrl+I)'),
        vi(c.code, 'Code trong dòng (Ctrl+J)'),
        vi(c.codeBlock, 'Khối code (Ctrl+Shift+J)'),
        vi(c.link, 'Chèn link (Ctrl+L)'),
        c.divider,
        vi(c.unorderedListCommand, 'Danh sách gạch đầu dòng (Ctrl+Shift+U)'),
        vi(c.orderedListCommand, 'Danh sách đánh số (Ctrl+Shift+O)'),
        vi(c.quote, 'Trích dẫn (Ctrl+Q)'),
      ];
      const modes = [vi(c.codeEdit, 'Soạn thảo (Ctrl+7)'), vi(c.codePreview, 'Xem trước (Ctrl+9)')];
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
