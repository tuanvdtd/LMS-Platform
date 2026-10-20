'use client';

import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Language } from '@/types/exercise';

const MODE = { javascript: () => javascript(), python: () => python(), cpp: () => cpp() } satisfies Record<Language, unknown>;
// Object cố định: basicSetup đổi tham chiếu là CodeMirror cấu hình lại.
const SETUP_2 = { tabSize: 2 };
const SETUP_4 = { tabSize: 4 };

// onChange phải ổn định (useCallback / field.onChange của react-hook-form), không thì editor cấu hình lại mỗi lần gõ.
export function CodeEditor({
  language,
  value,
  onChange,
  readOnly,
  height,
  minHeight = '240px',
  ariaLabel,
  className,
}: {
  language: Language;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  minHeight?: string;
  ariaLabel: string;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  // aria-label đặt trên .cm-content (phần nhận focus), không phải div bọc.
  const extensions = useMemo(
    () => [MODE[language](), EditorView.contentAttributes.of({ 'aria-label': ariaLabel })],
    [language, ariaLabel],
  );
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      readOnly={readOnly}
      height={height}
      minHeight={minHeight}
      basicSetup={language === 'python' ? SETUP_4 : SETUP_2}
      className={cn('overflow-hidden rounded-md border text-sm', className)}
    />
  );
}
