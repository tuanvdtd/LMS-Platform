import { mergeAttributes, Node, type Extensions } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

export type CalloutKind = 'note' | 'tip' | 'warning';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: { toggleCallout: (kind: CalloutKind) => ReturnType };
  }
}

// Khối ghi chú: <aside data-callout="note|tip|warning">. Nhãn và màu do CSS .post-body vẽ.
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      kind: {
        default: 'note',
        parseHTML: (el) => el.getAttribute('data-callout') ?? 'note',
        renderHTML: (attrs) => ({ 'data-callout': attrs.kind as string }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      // Đang trong ghi chú cùng loại → bỏ khung; khác loại → đổi loại; chưa có → bọc.
      toggleCallout:
        (kind) =>
        ({ editor, commands }) => {
          if (!editor.isActive(this.name)) return commands.wrapIn(this.name, { kind });
          if (editor.isActive(this.name, { kind })) return commands.lift(this.name);
          return commands.updateAttributes(this.name, { kind });
        },
    };
  },
});

export const lowlight = createLowlight(common);

// Mọi thẻ / thuộc tính sinh ra ở đây phải có trong SCHEMA của lib/post-html.ts, không thì trang đọc sẽ lọc mất.
export function postExtensions(): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [2, 3] }, // h1 là tiêu đề bài
      link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto'] },
    }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
    // Ảnh: chú thích dùng thuộc tính title có sẵn, trang đọc đổi thành <figcaption>.
    Image,
    Callout,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight,
    TableKit.configure({ table: { resizable: false } }),
    Placeholder.configure({ placeholder: 'Bắt đầu viết…' }),
  ];
}
