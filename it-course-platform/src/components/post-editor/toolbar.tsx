'use client';

import { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import type { CalloutKind } from './extensions';
import { IMAGE_ACCEPT, imageProblem, uploadPostImage } from './upload-image';

const BLOCKS = { p: 'Đoạn văn', h2: 'Tiêu đề lớn', h3: 'Tiêu đề nhỏ' } as const;
type BlockKey = keyof typeof BLOCKS;

const CALLOUTS: Record<CalloutKind, string> = { note: 'Lưu ý', tip: 'Mẹo', warning: 'Cảnh báo' };

// Tên hiển thị → mã ngôn ngữ của lowlight (gói common). html dùng 'xml'.
const LANGUAGES: Record<string, string> = {
  plaintext: 'Văn bản',
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  css: 'CSS',
  go: 'Go',
  xml: 'HTML / XML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  kotlin: 'Kotlin',
  php: 'PHP',
  python: 'Python',
  rust: 'Rust',
  sql: 'SQL',
  typescript: 'TypeScript',
  yaml: 'YAML',
};

const LINK_RE = /^(https?:\/\/|mailto:)/i;

const ALIGNS = [
  { value: 'left', label: 'Canh trái', icon: AlignLeft },
  { value: 'center', label: 'Canh giữa', icon: AlignCenter },
  { value: 'right', label: 'Canh phải', icon: AlignRight },
] as const;

function Mark({ icon: Icon, label, pressed, onPress }: { icon: LucideIcon; label: string; pressed: boolean; onPress: () => void }) {
  return (
    <Toggle size="sm" pressed={pressed} onPressedChange={onPress} aria-label={label} title={label}>
      <Icon />
    </Toggle>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />
      <div className="flex shrink-0 items-center gap-0.5">{children}</div>
    </>
  );
}

// Ô nhập một dòng trong popover: link, chú thích ảnh, mô tả ảnh.
function TextPopover({
  icon: Icon,
  label,
  active = false,
  initial,
  placeholder,
  max,
  validate,
  onApply,
  onClear,
  clearLabel,
}: {
  icon?: LucideIcon;
  label: string;
  active?: boolean;
  initial: () => string;
  placeholder: string;
  max: number;
  validate?: (v: string) => string | null;
  onApply: (v: string) => void;
  onClear?: () => void;
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const problem = validate?.(v) ?? null;
    if (problem) return setError(problem);
    onApply(v);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setValue(initial());
          setError(null);
        }
        setOpen(o);
      }}
    >
      <PopoverTrigger
        render={
          Icon ? (
            <Button variant="ghost" size="icon-sm" aria-label={label} title={label} className={cn(active && 'bg-muted')} />
          ) : (
            <Button variant="ghost" size="sm" />
          )
        }
      >
        {Icon ? <Icon /> : label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80" initialFocus={inputRef}>
        <form onSubmit={apply} className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor={`tp-${label}`}>
            {label}
          </label>
          <Input
            ref={inputRef}
            id={`tp-${label}`}
            value={value}
            maxLength={max}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? `tp-${label}-err` : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <p id={`tp-${label}-err`} className="text-xs text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                {clearLabel}
              </Button>
            )}
            <Button type="submit" size="sm">
              Áp dụng
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// Thanh công cụ dính trên vùng soạn. Mọi lệnh theo mẫu editor.chain().focus().<lệnh>().run().
export function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      block: (e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p') as BlockKey,
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      highlight: e.isActive('highlight'),
      code: e.isActive('code'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      language: (e.getAttributes('codeBlock').language as string | null) ?? 'plaintext',
      callout: e.isActive('callout'),
      align: (['center', 'right'].find((a) => e.isActive({ textAlign: a })) ?? 'left') as 'left' | 'center' | 'right',
      link: e.isActive('link'),
      table: e.isActive('table'),
    }),
  });
  const run = () => editor.chain().focus();
  const AlignIcon = ALIGNS.find((a) => a.value === s.align)?.icon ?? AlignLeft;

  function pickImage(file: File | undefined) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) return void toast.error(problem);
    const upload = uploadPostImage(file);
    toast.promise(upload, { loading: 'Đang tải ảnh…', success: 'Đã chèn ảnh', error: 'Tải ảnh thất bại, thử lại' });
    upload.then((src) => run().setImage({ src, alt: '' }).run(), () => undefined);
  }

  function setBlock(v: BlockKey) {
    if (v === 'p') run().setParagraph().run();
    else run().toggleHeading({ level: v === 'h2' ? 2 : 3 }).run();
  }

  return (
    <div
      role="toolbar"
      aria-label="Định dạng"
      // Desktop: tự xuống dòng khi hẹp (không thanh cuộn, không cắt nút). Mobile: một hàng vuốt ngang, ẩn thanh cuộn.
      className="sticky top-[7.25rem] z-10 flex flex-wrap items-center gap-y-1 border-y bg-card px-4 py-1.5 sm:px-6 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:[scrollbar-width:none]"
    >
      <div className="flex shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" aria-label="Hoàn tác" title="Hoàn tác (Ctrl+Z)" disabled={!s.canUndo} onClick={() => run().undo().run()}>
          <Undo2 />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Làm lại" title="Làm lại (Ctrl+Y)" disabled={!s.canRedo} onClick={() => run().redo().run()}>
          <Redo2 />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-0.5 h-5 data-vertical:self-center" />
      <Select items={BLOCKS} value={s.block} onValueChange={(v) => v && setBlock(v as BlockKey)}>
        <SelectTrigger size="sm" className="w-32 shrink-0" aria-label="Kiểu đoạn">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(Object.keys(BLOCKS) as BlockKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {BLOCKS[k]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Group>
        <Mark icon={Bold} label="Đậm (Ctrl+B)" pressed={s.bold} onPress={() => run().toggleBold().run()} />
        <Mark icon={Italic} label="Nghiêng (Ctrl+I)" pressed={s.italic} onPress={() => run().toggleItalic().run()} />
        <Mark icon={Underline} label="Gạch chân (Ctrl+U)" pressed={s.underline} onPress={() => run().toggleUnderline().run()} />
        <Mark icon={Strikethrough} label="Gạch ngang" pressed={s.strike} onPress={() => run().toggleStrike().run()} />
        <Mark icon={Highlighter} label="Tô nền" pressed={s.highlight} onPress={() => run().toggleHighlight().run()} />
        <Mark icon={Code} label="Code trong dòng" pressed={s.code} onPress={() => run().toggleCode().run()} />
      </Group>

      <Group>
        <Mark icon={List} label="Danh sách chấm" pressed={s.bullet} onPress={() => run().toggleBulletList().run()} />
        <Mark icon={ListOrdered} label="Danh sách số" pressed={s.ordered} onPress={() => run().toggleOrderedList().run()} />
      </Group>

      <Group>
        <Mark icon={Quote} label="Trích dẫn" pressed={s.quote} onPress={() => run().toggleBlockquote().run()} />
        <Mark icon={SquareCode} label="Khối code" pressed={s.codeBlock} onPress={() => run().toggleCodeBlock().run()} />
        <Button variant="ghost" size="icon-sm" aria-label="Kẻ ngang" title="Kẻ ngang" onClick={() => run().setHorizontalRule().run()}>
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Chèn bảng"
          title="Chèn bảng 3×3"
          className={cn(s.table && 'bg-muted')}
          onClick={() => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Khối ghi chú" title="Khối ghi chú" className={cn(s.callout && 'bg-muted')} />}
          >
            <Info />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              {(Object.keys(CALLOUTS) as CalloutKind[]).map((k) => (
                <DropdownMenuItem key={k} onClick={() => run().toggleCallout(k).run()}>
                  {CALLOUTS[k]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Group>

      <Group>
        {/* Canh lề gộp vào một nút (icon theo kiểu đang dùng) để thanh công cụ vừa một hàng. */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Canh lề" title="Canh lề" />}>
            <AlignIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              {ALIGNS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem key={value} onClick={() => run().setTextAlign(value).run()}>
                  <Icon />
                  {label}
                  {s.align === value && <span className="sr-only">(đang dùng)</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Group>

      <Group>
        <TextPopover
          icon={Link2}
          label="Link"
          active={s.link}
          initial={() => (editor.getAttributes('link').href as string | undefined) ?? ''}
          placeholder="https://…"
          max={500}
          validate={(v) => (LINK_RE.test(v) ? null : 'Link phải bắt đầu bằng http://, https:// hoặc mailto:')}
          onApply={(href) => run().extendMarkRange('link').setLink({ href }).run()}
          onClear={s.link ? () => run().extendMarkRange('link').unsetLink().run() : undefined}
          clearLabel="Gỡ link"
        />
        <Button variant="ghost" size="icon-sm" aria-label="Chèn ảnh" title="Chèn ảnh (JPG, PNG, WebP, tối đa 5 MB)" onClick={() => fileRef.current?.click()}>
          <ImagePlus />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(e) => {
            pickImage(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </Group>

      {/* Thao tác với ảnh (chú thích, mô tả, xoá) nằm ở thanh nổi ngay trên ảnh: image-bubble.tsx. */}
      {s.codeBlock && (
        <Group>
          <Select items={LANGUAGES} value={LANGUAGES[s.language] ? s.language : 'plaintext'} onValueChange={(v) => v && run().updateAttributes('codeBlock', { language: v }).run()}>
            <SelectTrigger size="sm" className="w-36 shrink-0" aria-label="Ngôn ngữ của khối code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(LANGUAGES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Group>
      )}

      {s.table && (
        <Group>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>Bảng</DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => run().addRowAfter().run()}>Thêm hàng dưới</DropdownMenuItem>
                <DropdownMenuItem onClick={() => run().addColumnAfter().run()}>Thêm cột phải</DropdownMenuItem>
                <DropdownMenuItem onClick={() => run().deleteRow().run()}>Xoá hàng</DropdownMenuItem>
                <DropdownMenuItem onClick={() => run().deleteColumn().run()}>Xoá cột</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => run().deleteTable().run()}>
                  Xoá bảng
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Group>
      )}
    </div>
  );
}
