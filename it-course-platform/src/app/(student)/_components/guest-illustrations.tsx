import { cn } from '@/lib/utils';

// Minh hoạ trang chủ khách, vẽ phẳng bằng SVG theo token màu (tự đổi theo theme sáng/tối).
// Nhân vật là chính ký hiệu Aolumi: thân là bong bóng chữ "a", lỗ của chữ "a" thành khuôn mặt.

function Mascot({ x, y, scale = 1, look = 0 }: { x: number; y: number; scale?: number; look?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Thân lấy từ LogoMark (viewBox 38 46 176 160), dời về gốc 0,0 */}
      <g transform="translate(-38 -46)">
        <path
          fill="var(--primary)"
          d="M118 46A80 80 0 0 1 198 126A80 80 0 0 1 118 206H38L61.43 182.57A80 80 0 0 1 118 46Z"
        />
        <rect x="170" y="46" width="44" height="160" rx="22" fill="var(--primary)" />
        <rect x="170" y="46" width="44" height="160" rx="22" fill="var(--ink)" opacity="0.12" />
        <circle cx="118" cy="126" r="40" fill="var(--ink-foreground)" />
        {/* Mắt chớp: scaleY theo keyframe gh-blink (tắt khi giảm chuyển động) */}
        <g className="gh-blink" style={{ transformOrigin: '118px 122px' }}>
          <ellipse cx={104 + look} cy="122" rx="6" ry="7.5" fill="var(--ink)" />
          <ellipse cx={132 + look} cy="122" rx="6" ry="7.5" fill="var(--ink)" />
          <circle cx={106 + look} cy="119" r="2" fill="var(--ink-foreground)" />
          <circle cx={134 + look} cy="119" r="2" fill="var(--ink-foreground)" />
        </g>
        <path d="M108 140q10 9 20 0" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="92" cy="138" r="6" fill="var(--brand-accent)" opacity="0.35" />
        <circle cx="144" cy="138" r="6" fill="var(--brand-accent)" opacity="0.35" />
      </g>
    </g>
  );
}

const frame = 'h-auto w-full select-none';

// Cảnh tự học buổi tối: cửa sổ đêm, đèn bàn, laptop đang mở bài code, vài dấu hỏi lơ lửng.
export function SelfStudyScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-label="Minh hoạ: tự học lập trình một mình vào buổi tối" className={cn(frame, className)}>
      <rect width="480" height="360" rx="28" fill="var(--secondary)" />
      {/* Cửa sổ đêm */}
      <rect x="40" y="36" width="170" height="140" rx="14" fill="var(--ink)" />
      <circle cx="160" cy="80" r="18" fill="var(--illus-glow)" />
      <circle cx="168" cy="74" r="16" fill="var(--ink)" />
      {[[70, 70], [100, 110], [82, 140], [130, 132], [186, 150]].map(([cx, cy], i) => (
        <circle key={i} className="gh-twinkle" style={{ animationDelay: `${i * 0.7}s` }} cx={cx} cy={cy} r="2.2" fill="var(--ink-foreground)" />
      ))}
      <rect x="123" y="36" width="4" height="140" fill="var(--secondary)" />
      <rect x="40" y="104" width="170" height="4" fill="var(--secondary)" />
      {/* Kệ sách */}
      <rect x="300" y="64" width="140" height="8" rx="4" fill="var(--border)" />
      <rect x="312" y="30" width="16" height="34" rx="3" fill="var(--tertiary)" />
      <rect x="331" y="38" width="14" height="26" rx="3" fill="var(--brand-accent)" />
      <rect x="348" y="26" width="18" height="38" rx="3" fill="var(--primary)" />
      <rect x="372" y="34" width="12" height="30" rx="3" fill="var(--muted-foreground)" opacity="0.5" />
      {/* Đèn bàn + quầng sáng */}
      <path d="M392 260 L360 150 L410 150 Z" fill="var(--illus-glow)" opacity="0.35" />
      <rect x="382" y="250" width="22" height="10" rx="3" fill="var(--ink)" />
      <rect x="390" y="150" width="5" height="102" fill="var(--ink)" />
      <path d="M362 152 q23 -40 50 0 z" fill="var(--brand-accent)" />
      {/* Mascot ngồi sau laptop */}
      <Mascot x={150} y={88} scale={0.62} look={3} />
      {/* Bàn */}
      <rect x="20" y="256" width="440" height="16" rx="8" fill="var(--ink)" opacity="0.85" />
      {/* Laptop: màn hình với các dòng code */}
      <g>
        <rect x="186" y="164" width="150" height="96" rx="10" fill="var(--ink)" />
        <rect x="196" y="176" width="40" height="6" rx="3" fill="var(--tertiary)" />
        <rect x="242" y="176" width="56" height="6" rx="3" fill="var(--ink-builtin)" />
        <rect x="206" y="190" width="70" height="6" rx="3" fill="var(--ink-muted)" />
        <rect x="206" y="204" width="48" height="6" rx="3" fill="var(--brand-accent)" />
        <rect x="260" y="204" width="44" height="6" rx="3" fill="var(--ink-muted)" />
        <rect x="196" y="218" width="30" height="6" rx="3" fill="var(--tertiary)" />
        <rect x="206" y="232" width="80" height="6" rx="3" fill="var(--ink-muted)" />
        <rect x="176" y="256" width="170" height="8" rx="4" fill="var(--muted-foreground)" />
      </g>
      {/* Cốc + giấy ghi chú */}
      <rect x="76" y="226" width="30" height="30" rx="6" fill="var(--card)" stroke="var(--border)" strokeWidth="3" />
      <path d="M106 234 q14 6 0 14" fill="none" stroke="var(--border)" strokeWidth="4" />
      <rect x="120" y="234" width="44" height="22" rx="3" fill="var(--illus-glow)" transform="rotate(-6 142 245)" />
      {/* Dấu hỏi lơ lửng: chưa biết mình đang ở đâu */}
      {[[300, 134, 0], [346, 102, 0.6], [282, 84, 1.2]].map(([cx, cy, d], i) => (
        <g key={i} className="gh-float" style={{ animationDelay: `${d}s` }}>
          <circle cx={cx} cy={cy} r="16" fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--muted-foreground)">?</text>
        </g>
      ))}
    </svg>
  );
}

// Cảnh giảng viên: bảng khung chương trình có dấu tích, mascot đứng cạnh chỉ vào bảng.
export function TeachScene({ className }: { className?: string }) {
  const rows = [
    ['var(--primary)', 'var(--success)'],
    ['var(--tertiary)', 'var(--success)'],
    ['var(--brand-accent)', 'var(--warning)'],
  ];
  return (
    <svg viewBox="0 0 480 360" role="img" aria-label="Minh hoạ: giảng viên soạn khung chương trình khoá học" className={cn(frame, className)}>
      <rect width="480" height="360" rx="28" fill="var(--secondary)" />
      <rect x="150" y="44" width="290" height="210" rx="18" fill="var(--card)" stroke="var(--border)" strokeWidth="3" />
      <rect x="174" y="68" width="120" height="12" rx="6" fill="var(--foreground)" opacity="0.85" />
      <rect x="174" y="88" width="180" height="8" rx="4" fill="var(--muted-foreground)" opacity="0.45" />
      {rows.map(([icon, mark], i) => (
        <g key={i}>
          <rect x="174" y={116 + i * 42} width="242" height="32" rx="9" fill="var(--muted)" />
          <rect x="184" y={123 + i * 42} width="18" height="18" rx="5" fill={icon} />
          <rect x="212" y={128 + i * 42} width={110 - i * 18} height="8" rx="4" fill="var(--muted-foreground)" opacity="0.6" />
          <circle cx="398" cy={132 + i * 42} r="9" fill={mark} />
          {mark === 'var(--success)' ? (
            <path d={`M393 ${132 + i * 42}l4 4 7-8`} fill="none" stroke="var(--ink-foreground)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <rect x="394" y={131 + i * 42} width="8" height="3" rx="1.5" fill="var(--ink-foreground)" />
          )}
        </g>
      ))}
      <Mascot x={40} y={170} scale={0.7} look={4} />
      {/* Tay chỉ (thanh phải của chữ "a") vươn về bảng */}
      <rect x="132" y="196" width="40" height="14" rx="7" fill="var(--primary)" transform="rotate(-24 132 203)" />
      <rect x="20" y="300" width="440" height="14" rx="7" fill="var(--ink)" opacity="0.85" />
    </svg>
  );
}

// Cảnh hỏi đáp: mascot cầm kính lúp soi một bong bóng câu hỏi.
export function AskScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 360" role="img" aria-label="Minh hoạ: tìm câu trả lời cho thắc mắc thường gặp" className={cn(frame, className)}>
      <rect width="480" height="360" rx="28" fill="var(--secondary)" />
      <g className="gh-float">
        <path d="M250 60h170a24 24 0 0 1 24 24v80a24 24 0 0 1-24 24h-120l-34 28 6-28h-22a24 24 0 0 1-24-24v-80a24 24 0 0 1 24-24z" fill="var(--card)" stroke="var(--border)" strokeWidth="3" />
        <text x="335" y="148" textAnchor="middle" fontSize="72" fontWeight="800" fill="var(--primary)">?</text>
      </g>
      <Mascot x={70} y={140} scale={0.8} look={5} />
      {/* Kính lúp */}
      <circle cx="250" cy="250" r="30" fill="var(--ink-foreground)" fillOpacity="0.5" stroke="var(--brand-accent)" strokeWidth="9" />
      <rect x="196" y="262" width="12" height="46" rx="6" fill="var(--brand-accent)" transform="rotate(48 202 285)" />
      <rect x="20" y="318" width="440" height="14" rx="7" fill="var(--ink)" opacity="0.85" />
    </svg>
  );
}

// Mascot đứng riêng (không nền), dùng ở hero.
export function MascotFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="-4 -4 184 168" aria-hidden className={cn('h-auto select-none', className)}>
      <Mascot x={0} y={0} look={2} />
    </svg>
  );
}
