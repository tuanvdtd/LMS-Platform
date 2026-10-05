'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type RevenueFilterValue = { from: string; to: string; courseId: string };

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const END_DATE = '2026-10-04';

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function shiftDate(iso: string, offset: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function CalendarPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(value.slice(0, 7));
  const [year, month] = visibleMonth.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();

  function moveMonth(offset: number) {
    setVisibleMonth(new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7));
  }

  return (
    <div className="min-w-40 flex-1 sm:flex-none">
      <span className="mb-2 block text-xs font-semibold text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setVisibleMonth(value.slice(0, 7)); }}>
        <PopoverTrigger render={<Button variant="outline" className="w-full justify-between bg-card font-medium sm:w-43" />}>
          {formatDate(value)} <CalendarDays aria-hidden="true" className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3">
          <div className="mb-3 flex items-center justify-between">
            <Button variant="ghost" size="icon-sm" aria-label="Tháng trước" onClick={() => moveMonth(-1)}><ChevronLeft /></Button>
            <strong className="text-sm">Tháng {month}/{year}</strong>
            <Button variant="ghost" size="icon-sm" aria-label="Tháng sau" onClick={() => moveMonth(1)}><ChevronRight /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {DAYS.map((day) => <span key={day} className="py-1 text-muted-foreground">{day}</span>)}
            {Array.from({ length: firstDay }, (_, index) => <span key={`gap-${index}`} />)}
            {Array.from({ length: dayCount }, (_, index) => {
              const day = index + 1;
              const date = `${visibleMonth}-${String(day).padStart(2, '0')}`;
              return (
                <button
                  key={date}
                  type="button"
                  aria-label={formatDate(date)}
                  aria-pressed={value === date}
                  className="size-8 rounded-md hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                  onClick={() => { onChange(date); setOpen(false); }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function RevenueFilters({ courses, onApply }: {
  courses: { id: string; title: string }[];
  onApply: (value: RevenueFilterValue) => void;
}) {
  const [from, setFrom] = useState('2026-09-05');
  const [to, setTo] = useState(END_DATE);
  const [courseId, setCourseId] = useState('all');
  const [preset, setPreset] = useState<number | null>(30);
  const [error, setError] = useState('');

  function choosePreset(days: number) {
    setFrom(shiftDate(END_DATE, 1 - days));
    setTo(END_DATE);
    setPreset(days);
    setError('');
  }

  function apply() {
    if (from > to) {
      setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setError('');
    onApply({ from, to, courseId });
  }

  return (
    <section aria-label="Bộ lọc doanh thu" className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-52 flex-1">
          <span className="mb-2 block text-xs font-semibold text-muted-foreground">Khoảng ngày thanh toán</span>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                type="button"
                size="sm"
                variant={preset === days ? 'default' : 'outline'}
                aria-pressed={preset === days}
                onClick={() => choosePreset(days)}
              >
                {days} ngày
              </Button>
            ))}
          </div>
        </div>
        <CalendarPicker label="Từ ngày" value={from} onChange={(value) => { setFrom(value); setPreset(null); setError(''); }} />
        <CalendarPicker label="Đến ngày" value={to} onChange={(value) => { setTo(value); setPreset(null); setError(''); }} />
        <div className="min-w-50 flex-1 sm:flex-none">
          <label htmlFor="revenue-course" className="mb-2 block text-xs font-semibold text-muted-foreground">Khoá học</label>
          <Select
            items={{ all: 'Tất cả', ...Object.fromEntries(courses.map((course) => [course.id, course.title])) }}
            value={courseId}
            onValueChange={(value) => setCourseId(value ?? 'all')}
          >
            <SelectTrigger id="revenue-course" className="h-9 w-full bg-card sm:w-54" aria-label="Lọc doanh thu theo khoá học">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={apply}>Xem báo cáo</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
