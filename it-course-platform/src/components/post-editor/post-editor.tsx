'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { postExtensions } from './extensions';
import { ImageBubble } from './image-bubble';
import { Toolbar } from './toolbar';
import { imageProblem, uploadPostImage } from './upload-image';

// Dán / thả file ảnh → tải lên rồi chèn. Trả true = đã xử lý, chặn mặc định (chèn ảnh base64 vào bài).
function insertFiles(editor: Editor | null, files: File[]): boolean {
  const images = files.filter((f) => f.type.startsWith('image/'));
  if (!images.length || !editor) return false;
  for (const file of images) {
    const problem = imageProblem(file);
    if (problem) {
      toast.error(problem);
      continue;
    }
    const upload = uploadPostImage(file);
    toast.promise(upload, { loading: 'Đang tải ảnh…', success: 'Đã chèn ảnh', error: 'Tải ảnh thất bại, thử lại' });
    upload.then((src) => editor.chain().focus().setImage({ src, alt: '' }).run(), () => undefined);
  }
  return true;
}

// Trình soạn nội dung bài. value chỉ dùng làm nội dung khởi tạo: sau đó trình soạn là nguồn sự thật, báo ra qua onChange.
export function PostEditor({ value, onChange, invalid = false }: { value: string; onChange: (html: string) => void; invalid?: boolean }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const editorRef = useRef<Editor | null>(null);
  const extensions = useMemo(() => postExtensions(), []);

  const editor = useEditor({
    immediatelyRender: false, // Next render phía server: không dựng editor lúc SSR
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: 'post-body post-editing',
        'aria-label': 'Nội dung bài viết',
        role: 'textbox',
        'aria-multiline': 'true',
      },
      handlePaste: (_view, event) => insertFiles(editorRef.current, Array.from(event.clipboardData?.files ?? [])),
      handleDrop: (_view, event) => insertFiles(editorRef.current, Array.from(event.dataTransfer?.files ?? [])),
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getHTML()),
  });
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    editor?.view.dom.setAttribute('aria-invalid', String(invalid));
  }, [editor, invalid]);

  // Nằm trong "tờ bài" của trang soạn: thanh công cụ là dải ngăn giữa phần đầu bài và nội dung, dính khi cuộn.
  if (!editor) return <div className="min-h-[30rem] border-t" aria-hidden />;
  return (
    <>
      <Toolbar editor={editor} />
      <ImageBubble editor={editor} />
      {/* Cùng bề rộng cột chữ trang đọc (68ch, PostArticle) → xuống dòng và cỡ ảnh y như bài đã đăng. */}
      <EditorContent editor={editor} className="mx-auto max-w-[calc(68ch+4rem)] px-6 py-6 sm:px-8" />
    </>
  );
}
