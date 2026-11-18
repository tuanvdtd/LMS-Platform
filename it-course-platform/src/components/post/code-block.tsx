'use client';

import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Khối code trong bài: nhãn ngôn ngữ + nút sao chép. Nội dung (đã tô màu) do server dựng, truyền qua children.
export function CodeBlock({ lang, children }: { lang?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard (http, iframe): người dùng vẫn bôi đen chép tay được.
    }
  }

  return (
    <div className="post-code">
      <div className="post-code-bar">
        <span>{lang ?? 'code'}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>
      <pre ref={ref} tabIndex={0}>
        {children}
      </pre>
    </div>
  );
}
