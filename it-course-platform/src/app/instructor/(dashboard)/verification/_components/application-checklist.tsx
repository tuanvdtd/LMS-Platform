'use client';

import { CircleAlert, CircleCheck, CircleDashed, Clock, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ApplicationView, type Screen, SCREEN_OF, wordCount } from '@/types/instructor-application';

type Tone = 'done' | 'todo' | 'wait' | 'optional';
type Item = { tone: Tone; text: string };
type Row = { screen: Exclude<Screen, 'review'>; title: string; items: Item[] };

const TONE: Record<Tone, { icon: LucideIcon; className: string; sr: string }> = {
  done: { icon: CircleCheck, className: 'text-success', sr: 'Đã xong' },
  todo: { icon: CircleAlert, className: 'text-warning', sr: 'Còn thiếu' },
  wait: { icon: Clock, className: 'text-warning', sr: 'Đang chờ' },
  optional: { icon: CircleDashed, className: 'text-muted-foreground', sr: 'Không bắt buộc' },
};

const lastFour = (no: string) => `••••${no.slice(-4)}`;

function identityItem({ status, name, issue }: ApplicationView['identity']): Item {
  if (status === 'approved') return { tone: 'done', text: `Đã xác minh · ${name ?? 'không đọc được tên'}` };
  if (status === 'in_review') return { tone: 'wait', text: 'Didit đang xem xét thêm' };
  if (status === 'pending') return { tone: 'todo', text: 'Chưa hoàn tất xác minh' };
  if (status === 'declined') {
    return { tone: 'todo', text: issue === 'duplicate_document' ? 'Giấy tờ đã dùng cho tài khoản khác' : 'Xác minh chưa thành công' };
  }
  return { tone: 'todo', text: 'Chưa xác minh' };
}

// Cùng tiêu chí người duyệt dùng để xem đơn, để người nộp biết mình được chấm theo gì.
export function checklistRows(view: ApplicationView): Row[] {
  const missing = new Set(view.missing.map((m) => m.step));
  const words = wordCount(view.bio ?? '');
  const links = [view.website, view.socials.linkedin, view.socials.github].filter(Boolean).length;
  const profile: Item[] = [{ tone: view.image ? 'done' : 'todo', text: view.image ? 'Có ảnh hồ sơ' : 'Chưa có ảnh hồ sơ' }];
  // Chức danh, giới thiệu có thể được điền sẵn từ Cài đặt mà chưa lưu vào đơn → tin missing của BE.
  if (missing.has('info')) profile.push({ tone: 'todo', text: 'Chưa lưu chức danh và giới thiệu' });
  else profile.push({ tone: 'done', text: view.headline ?? '' }, { tone: 'done', text: `Giới thiệu ${words} từ` });
  profile.push(
    links
      ? { tone: 'done', text: `${links} liên kết hồ sơ` }
      : { tone: 'optional', text: 'Chưa có liên kết hồ sơ (không bắt buộc)' },
  );
  return [
    { screen: 'profile', title: 'Hồ sơ công khai', items: profile },
    { screen: 'identity', title: 'Xác minh danh tính', items: [identityItem(view.identity)] },
    {
      screen: 'payout',
      title: 'Tài khoản nhận tiền',
      items: [
        view.bank
          ? { tone: 'done', text: `${view.bank.bankAccountName} · ${lastFour(view.bank.bankAccountNo)}` }
          : { tone: 'todo', text: 'Chưa khai tài khoản nhận tiền' },
      ],
    },
  ];
}

// Số màn còn thiếu dữ liệu (không tính điều khoản: đồng ý ngay ở màn gửi đơn).
export const missingScreens = (view: ApplicationView) =>
  new Set(view.missing.filter((m) => m.step !== 'terms').map((m) => SCREEN_OF[m.step])).size;

export function ApplicationChecklist({
  view,
  onEdit,
  compact = false,
}: {
  view: ApplicationView;
  onEdit?: (s: Screen) => void;
  compact?: boolean;
}) {
  return (
    <ul className={cn('flex flex-col', compact ? 'gap-4' : 'divide-y')}>
      {checklistRows(view).map((row) => (
        <li key={row.screen} className={cn('flex flex-col gap-1.5', !compact && 'py-4 first:pt-0 last:pb-0')}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">{row.title}</span>
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(row.screen)}>
                Sửa<span className="sr-only"> {row.title.toLowerCase()}</span>
              </Button>
            )}
          </div>
          <ul className="flex flex-col gap-1">
            {row.items.map((it) => {
              const t = TONE[it.tone];
              return (
                <li key={it.text} className="flex items-start gap-2 text-sm">
                  <t.icon className={cn('mt-0.5 size-4 shrink-0', t.className)} aria-hidden />
                  <span className="sr-only">{t.sr}: </span>
                  <span className={cn('min-w-0 break-words', it.tone === 'done' ? 'text-foreground/85' : 'text-muted-foreground')}>
                    {it.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
