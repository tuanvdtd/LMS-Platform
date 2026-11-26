import type { FlagCode, FunnelStepKey, GainBand, ItemStatus, NudgeKind, RiskLevel, RiskReason, SkipReason, Verdict } from '@/types/analytics';
import { formatDuration } from '../types/curriculum.ts';

// Nhãn + định dạng cho dashboard phân tích. Thuần (chỉ import type) để chạy node --test.
// Mỗi trạng thái có tông (variant của Badge) + chữ, không truyền tin chỉ bằng màu.
export type Tone = 'success' | 'warning' | 'danger' | 'secondary' | 'info' | 'tertiary';

export const STATUS_META: Record<ItemStatus, { label: string; tone: Tone }> = {
  good: { label: 'Tốt', tone: 'success' },
  review: { label: 'Nên xem', tone: 'warning' },
  fix: { label: 'Cần sửa', tone: 'danger' },
  insufficient: { label: 'Chưa đủ dữ liệu', tone: 'secondary' },
};

export const RISK_META: Record<RiskLevel, { label: string; tone: Tone }> = {
  high: { label: 'Nguy cơ cao', tone: 'danger' },
  watch: { label: 'Cần theo dõi', tone: 'warning' },
  ok: { label: 'Đang học ổn', tone: 'secondary' },
  new: { label: 'Mới ghi danh', tone: 'info' },
  done: { label: 'Đã hoàn thành', tone: 'success' },
};

// Verdict theo DESIGN.md: Accepted success, Wrong Answer danger, Time Limit warning, Runtime/Compile tertiary.
export const VERDICT_META: Record<Verdict, { label: string; tone: Tone }> = {
  accepted: { label: 'Accepted', tone: 'success' },
  wrong_answer: { label: 'Wrong Answer', tone: 'danger' },
  time_limit_exceeded: { label: 'Time Limit', tone: 'warning' },
  runtime_error: { label: 'Runtime Error', tone: 'tertiary' },
  compile_error: { label: 'Compile Error', tone: 'tertiary' },
};

// Normalized gain (Hake 1998).
export const GAIN_META: Record<GainBand, { label: string; tone: Tone }> = {
  low: { label: 'Tăng thấp', tone: 'warning' },
  medium: { label: 'Tăng trung bình', tone: 'info' },
  high: { label: 'Tăng cao', tone: 'success' },
};

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const df = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const DAY = 86_400_000;

export const fmtNum = (x: number) => nf.format(x);
export const fmtPct = (x: number | null) => (x === null ? '—' : `${nf.format(x)}%`);
export const fmtRatio = (x: number | null) => (x === null ? '—' : x.toFixed(2).replace('.', ','));
export const fmtDate = (iso: string) => df.format(new Date(iso));

export function lastActiveText(iso: string | null, now = new Date()): string {
  if (!iso) return 'Chưa vào học';
  const d = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
  return d <= 0 ? 'Hôm nay' : `${d} ngày trước`;
}
export const withinDays = (iso: string, days: number, now = new Date()) => now.getTime() - new Date(iso).getTime() < days * DAY;

// Bọc phương án trong ngoặc kép, trừ khi nội dung đã có sẵn ngoặc (vd "object").
const quoted = (s = '') => (/^["“'].*["”']$/.test(s.trim()) ? s.trim() : `"${s}"`);

// Lời khuyên cho giảng viên theo từng cờ.
export function flagText(code: FlagCode, option?: string): string {
  switch (code) {
    case 'negative_d':
      return 'Nhóm điểm cao sai nhiều hơn nhóm điểm thấp: kiểm tra lại đáp án đúng hoặc câu chữ mơ hồ.';
    case 'low_d':
      return 'Câu không tách được người đã nắm bài và người chưa nắm.';
    case 'too_easy':
      return 'Gần như ai cũng đúng. Có thể giữ nếu đây là câu khởi động.';
    case 'too_hard':
      return 'Đa số trả lời sai: xem lại bài giảng liên quan hoặc đề bài.';
    case 'dead_distractor':
      return `Phương án ${quoted(option)} gần như không ai chọn: thay bằng phương án hợp lý hơn.`;
    case 'attractive_distractor':
      return `Phương án sai ${quoted(option)} được chọn nhiều hơn đáp án đúng: có thể là hiểu lầm phổ biến, hoặc đáp án đúng bị đặt sai.`;
  }
}

export function reasonText(r: RiskReason): string {
  switch (r.code) {
    case 'inactive':
      return `${r.days} ngày chưa vào học`;
    case 'lagging':
      return `Chậm hơn bạn cùng lứa ${fmtNum(r.lagPts)} điểm % (trung vị nhóm ghi danh ${r.band} ngày: ${fmtPct(r.peerMedianPct)})`;
    case 'low_quiz':
      return `Quiz lượt đầu TB ${fmtPct(r.avgFirstPct)}, dưới điểm đạt ${fmtNum(r.gapPts)} điểm`;
  }
}

export const NUDGE_MAX_CHARS = 500;
export const NUDGE_TEMPLATES: Record<NudgeKind, { label: string; text: string }> = {
  reminder: {
    label: 'Nhắc nhở',
    text: 'Chào {ten}, đã một thời gian bạn chưa quay lại khoá học. Chỉ cần 15 phút mỗi ngày là bạn sẽ về đích. Mình chờ bạn ở bài tiếp theo nhé!',
  },
  encourage: {
    label: 'Động viên',
    text: 'Chào {ten}, mình thấy bạn đang gặp khó ở phần gần đây. Đừng nản nhé: xem lại bài giảng liên quan rồi thử lại, chỗ nào chưa rõ thì đặt câu hỏi ở mục Hỏi đáp, mình sẽ trả lời.',
  },
};
// Tên gọi = từ cuối của họ tên; {ten} được thay ở BE cho từng học viên (đây chỉ để xem trước).
export const givenName = (name: string) => name.trim().split(/\s+/).at(-1) ?? name;
export const personalize = (message: string, name: string) => message.replaceAll('{ten}', givenName(name));

export const SKIP_REASON: Record<SkipReason, string> = {
  not_enrolled: 'không còn trong khoá',
  completed: 'đã hoàn thành khoá',
  recent: 'đã được nhắc trong 7 ngày qua',
};

// --- Tổng quan, hành vi học, doanh thu ---
export const fmtShare = (x: number | null) => fmtPct(x === null ? null : Math.round(x * 1000) / 10);
export const deltaPct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : undefined);
export const fmtClock = (sec: number) => formatDuration(Math.round(sec));
export const dayLabel = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
export const weekLabel = dayLabel;
export const monthLabel = (key: string) => `T${Number(key.slice(5, 7))}/${key.slice(2, 4)}`;
const pctInt = (x: number) => `${Math.round(x * 100)}%`;
export function peakText(p: { fromSec: number; toSec: number; rewatch: number; people: number; multiple: number | null }) {
  const base = `Đoạn ${fmtClock(p.fromSec)}–${fmtClock(p.toSec)}: ${pctInt(p.rewatch)} người xem (${p.people} người) tua lại`;
  return p.multiple ? `${base}, gấp ${fmtNum(Math.round(p.multiple * 10) / 10)} lần mức thường của bài.` : `${base}.`;
}
export const dropText = (d: { fromSec: number; toSec: number; lost: number }) =>
  `Từ ${fmtClock(d.fromSec)} đến ${fmtClock(d.toSec)}, ${pctInt(d.lost)} người xem dừng xem.`;
export const PEAK_ADVICE = 'Đoạn này có thể khó hiểu: cân nhắc giải thích chậm hơn, thêm ví dụ hoặc tách thành bài riêng.';
export const LONG_VIDEO_ADVICE = 'Video dài hơn 12 phút và dưới một nửa người xem xem hết: cân nhắc tách thành các video ngắn hơn.';
// Khoá free: bước `enroll` là bước 2 → FE dùng lời khuyên của `cart` khi weakest.key === 'enroll' && isFree.
export const FUNNEL_STEP_META: Record<FunnelStepKey, { label: string; advice: string }> = {
  view: { label: 'Xem trang khoá', advice: '' },
  cart: { label: 'Thêm giỏ / Mua ngay', advice: 'Ít người thêm giỏ sau khi xem: xem lại tiêu đề, video giới thiệu, mô tả và mục tiêu khoá.' },
  checkout: { label: 'Bắt đầu thanh toán', advice: 'Nhiều người để khoá trong giỏ mà không thanh toán: cân nhắc giá hoặc tạo mã giảm giá.' },
  enroll: { label: 'Ghi danh', advice: 'Nhiều người bỏ ngang ở cổng thanh toán (phiên Stripe hết hạn sau 30 phút): nhắc học viên hoàn tất trong phiên.' },
};
