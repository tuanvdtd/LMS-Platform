import { createHash } from 'node:crypto';
import QRCode from 'qrcode';

export type CertificateView = {
  serialNo: string;
  learnerName: string;
  courseTitle: string;
  instructorName: string;
  skills: string[];
  issuedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
};
export type FontKey = 'playfair' | 'playfairItalic' | 'cormorantItalic' | 'mono' | 'sans' | 'sansSemiBold';
// Bề rộng chuỗi (pt) ở cỡ chữ cho trước. Truyền từ ngoài vào để hàm này thuần và test được bằng hàm đo giả.
export type Measure = (text: string, font: FontKey, size: number) => number;

const W = 842; // A4 ngang, đơn vị pt
const H = 595;
const SEAM = 262; // ranh giới dải mực / giấy
const CY = H / 2;
const X0 = 322; // lề trái vùng chữ trên giấy
const X1 = W - 50;
const TEXT_W = X1 - X0;
const QS = 62; // cạnh mã QR

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function issuedLabel(d: Date): string {
  const p = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)!.value;
  return `${get('day')} tháng ${get('month')}, ${get('year')}`;
}

// Cỡ chữ lớn nhất trong [min, max] (bước 2) mà chuỗi vừa bề rộng; không cỡ nào vừa thì lấy min.
function fitSize(text: string, font: FontKey, max: number, min: number, measure: Measure, spacing = 0): number {
  for (let size = max; size > min; size -= 2) {
    if (measure(text, font, size) + spacing * (text.length - 1) <= TEXT_W) return size;
  }
  return min;
}

function wrap(text: string, size: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && measure(`${last} ${w}`, 'playfairItalic', size) <= TEXT_W) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  return lines;
}

// Tên khoá: tối đa 2 dòng. Giảm cỡ 24 → 16 cho tới khi vừa; vẫn dư thì cắt dòng 2 và thêm dấu ba chấm.
function courseBlock(title: string, measure: Measure): { size: number; lines: string[] } {
  for (let size = 24; size >= 16; size -= 2) {
    const lines = wrap(title, size, measure);
    if (lines.length <= 2) return { size, lines };
  }
  const all = wrap(title, 16, measure);
  const words = all.slice(1).join(' ').split(' ');
  while (words.length > 1 && measure(`${words.join(' ')}…`, 'playfairItalic', 16) > TEXT_W) words.pop();
  return { size: 16, lines: [all[0], `${words.join(' ')}…`] };
}

function skillsLine(skills: string[], measure: Measure): string {
  const kept = skills.map((s) => s.toUpperCase());
  const text = () => kept.join('   ·   ');
  while (kept.length && measure(text(), 'sansSemiBold', 7) + 2.6 * (text().length - 1) > TEXT_W) kept.pop();
  return text();
}

// Một vành hoa văn guilloche: m đường lượn đan nhau quanh bán kính R.
function band(o: { R: number; A: number; n: number; m: number; A2?: number; n2?: number; twist?: number }): string {
  const { R, A, n, m, A2 = 0, n2 = 0, twist = 0 } = o;
  const steps = Math.max(720, n * 48);
  let out = '';
  for (let k = 0; k < m; k++) {
    const phase = (2 * Math.PI * k) / m;
    let d = '';
    for (let s = 0; s <= steps; s++) {
      const t = (2 * Math.PI * s) / steps;
      const r = R + A * Math.sin(n * t + phase) + A2 * Math.sin(n2 * t - phase * 2 + twist);
      d += `${s ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`;
    }
    out += `<path d="${d}Z"/>`;
  }
  return out;
}

// Viền răng cưa của con dấu.
const SCALLOP = Array.from({ length: 80 }, (_, i) => {
  const r = i % 2 ? 39 : 42.6;
  const t = (Math.PI * i) / 40;
  return `${i ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(2)} ${(r * Math.sin(t)).toFixed(2)}`;
}).join('');

// Dải vân ngang phía trên chân trang.
const STRIP_Y = H - 156;
const STRIP = Array.from({ length: 5 }, (_, k) => {
  let d = '';
  for (let x = X0; x <= X1; x += 1.5) {
    const y =
      STRIP_Y + 4.2 * Math.sin((2 * Math.PI * (x - X0)) / 40 + (2 * Math.PI * k) / 5) + 1.2 * Math.sin((2 * Math.PI * (x - X0)) / 13 - k);
    d += `${x === X0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)}`;
  }
  return `<path d="${d}"/>`;
}).join('');

const CORNER_ORNAMENT = band({ R: 5.6, A: 2.3, n: 8, m: 4 });
const CORNERS = [
  [SEAM + 24, 24],
  [W - 24, 24],
  [W - 24, H - 24],
  [SEAM + 24, H - 24],
]
  .map(
    ([x, y]) =>
      `<g transform="translate(${x} ${y})"><circle r="9.6" fill="#f6f0e2" stroke="none"/><g fill="none">${CORNER_ORNAMENT}<circle r="9"/></g></g>`,
  )
  .join('');
const RINGS = [208, 146, 99, 48].map((r) => `<circle r="${r}"/>`).join('');

export function certificateSvg(view: CertificateView, opts: { verifyBase: string; measure: Measure }): string {
  const { measure } = opts;

  // Hoa văn sinh từ mã số: mỗi chứng chỉ một hoa văn, trang xác thực dựng lại đúng hoa văn đó.
  const bytes = [...createHash('sha256').update(view.serialNo).digest()];
  const pickFrom = (i: number, arr: number[]) => arr[bytes[i] % arr.length];
  const unit = (i: number) => bytes[i] / 255;
  const rosette = [
    band({ R: 196, A: 9, n: pickFrom(0, [36, 40, 44, 48]), m: 6, A2: 3, n2: pickFrom(1, [8, 10, 12]), twist: unit(2) * 6 }),
    band({ R: 166, A: 17, n: pickFrom(3, [18, 20, 22, 24]), m: 10, A2: 5, n2: pickFrom(4, [5, 6, 7]), twist: unit(5) * 6 }),
    band({ R: 122, A: 21, n: pickFrom(6, [12, 14, 16]), m: 12, A2: 6, n2: pickFrom(7, [3, 4, 5]), twist: unit(8) * 6 }),
    band({ R: 74, A: 24, n: pickFrom(9, [8, 9, 10, 11]), m: 12, A2: 7, n2: pickFrom(10, [2, 3]), twist: unit(11) * 6 }),
  ].join('');

  const qr = QRCode.create(`${opts.verifyBase}${view.serialNo}`, { errorCorrectionLevel: 'M' });
  const QN = qr.modules.size;
  const cell = QS / QN;
  let qrPath = '';
  for (let y = 0; y < QN; y++) {
    for (let x = 0; x < QN; x++) {
      if (qr.modules.data[y * QN + x]) {
        qrPath += `M${(x * cell).toFixed(2)} ${(y * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
      }
    }
  }

  const nameSize = fitSize(view.learnerName, 'playfair', 46, 16, measure, -0.4);
  const course = courseBlock(view.courseTitle, measure);
  const lineH = course.size * 1.25;
  const TOP = 184;
  const DV = TOP + nameSize + 26.8;
  const courseY = 342;
  const skills = skillsLine(view.skills, measure);
  const skillsY = courseY + (course.lines.length - 1) * lineH + 34;
  const verifyHost = opts.verifyBase.replace(/^https?:\/\//, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="ink" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#0a1020"/><stop offset="0.55" stop-color="#101a36"/><stop offset="1" stop-color="#0b1226"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8f6b2b"/><stop offset="0.22" stop-color="#f6e2a8"/><stop offset="0.45" stop-color="#c9a054"/>
    <stop offset="0.68" stop-color="#fbf0cb"/><stop offset="1" stop-color="#9c7630"/>
  </linearGradient>
  <radialGradient id="paper" cx="0.62" cy="0.42" r="0.8">
    <stop offset="0" stop-color="#fdfbf5"/><stop offset="1" stop-color="#f3ecdd"/>
  </radialGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#3a59c7" stop-opacity="0.38"/><stop offset="1" stop-color="#3a59c7" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="left"><rect x="0" y="0" width="${SEAM}" height="${H}"/></clipPath>
  <clipPath id="right"><rect x="${SEAM}" y="0" width="${W - SEAM}" height="${H}"/></clipPath>
  <path id="sealText" d="M -25 0 A 25 25 0 1 1 25 0 A 25 25 0 1 1 -25 0"/>
</defs>

<rect width="${W}" height="${H}" fill="url(#paper)"/>
<rect width="${SEAM}" height="${H}" fill="url(#ink)"/>
<circle cx="${SEAM}" cy="${CY}" r="250" fill="url(#glow)" clip-path="url(#left)"/>

<g clip-path="url(#left)"><g transform="translate(${SEAM} ${CY})" fill="none" stroke="url(#gold)" stroke-width="0.38" opacity="0.95">${rosette}<g stroke-width="0.6">${RINGS}</g></g></g>
<g clip-path="url(#right)"><g transform="translate(${SEAM} ${CY})" fill="none" stroke="#1b2a5a" stroke-width="0.32" opacity="0.13">${rosette}<g stroke-width="0.5">${RINGS}</g></g></g>

<g fill="none" stroke="#b08a43">
  <rect x="${SEAM + 22}" y="22" width="${W - SEAM - 44}" height="${H - 44}" stroke-width="0.6"/>
  <rect x="${SEAM + 26}" y="26" width="${W - SEAM - 52}" height="${H - 52}" stroke-width="0.25"/>
</g>
<g stroke="#9a7430" stroke-width="0.35">${CORNERS}</g>
<rect x="14" y="14" width="${SEAM - 14}" height="${H - 28}" fill="none" stroke="url(#gold)" stroke-width="0.45" opacity="0.6"/>
<line x1="${SEAM}" y1="0" x2="${SEAM}" y2="${H}" stroke="url(#gold)" stroke-width="1.2"/>

<g transform="translate(${SEAM} ${CY})">
  <path d="${SCALLOP}Z" fill="url(#gold)"/><circle r="35.6" fill="#0b1226"/>
  <circle r="31.5" fill="none" stroke="url(#gold)" stroke-width="0.4"/>
  <circle r="18" fill="none" stroke="url(#gold)" stroke-width="0.4"/>
  <text font-family="Be Vietnam Pro" font-weight="600" font-size="4.6" letter-spacing="1.32" fill="#ecd9a4"><textPath href="#sealText" startOffset="1.5">ĐÃ XÁC THỰC  •  SKILLPATH  •  VERIFIED  •</textPath></text>
  <path d="M-7.5 0.5 L-2.2 5.8 L8 -5.4" fill="none" stroke="url(#gold)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
</g>

<g font-family="Be Vietnam Pro">
  <text x="36" y="56" font-weight="600" font-size="10.5" letter-spacing="4.2" fill="#f1e2b6">SKILLPATH</text>
  <rect x="36" y="66" width="22" height="1" fill="url(#gold)"/>
  <text x="36" y="${H - 86}" font-weight="400" font-size="6" letter-spacing="2.2" fill="#8e98b8">MÃ CHỨNG CHỈ</text>
  <text x="36" y="${H - 71}" font-family="JetBrains Mono" font-size="10" letter-spacing="0.6" fill="#f6ecd0">${esc(view.serialNo)}</text>
  <text x="36" y="${H - 50}" font-weight="400" font-size="6" letter-spacing="2.2" fill="#8e98b8">NGÀY CẤP</text>
  <text x="36" y="${H - 36}" font-weight="400" font-size="9.5" fill="#f6ecd0">${esc(issuedLabel(view.issuedAt))}</text>
</g>

<g font-family="Be Vietnam Pro" fill="#141c36">
  <text x="${X0}" y="72" font-weight="600" font-size="9" letter-spacing="5.2">CHỨNG CHỈ HOÀN THÀNH</text>
  <text x="${X1}" y="72" text-anchor="end" font-weight="400" font-size="6.5" letter-spacing="2.6" fill="#8a7b5c">CERTIFICATE OF COMPLETION</text>
  <line x1="${X0}" y1="84" x2="${X1}" y2="84" stroke="#b08a43" stroke-width="0.5"/>
  <line x1="${X0}" y1="86.4" x2="${X1}" y2="86.4" stroke="#b08a43" stroke-width="0.2"/>

  <text x="${X0}" y="${TOP}" font-family="Cormorant Garamond" font-style="italic" font-size="17" fill="#7a6c50">Chứng nhận</text>
  <text x="${X0 - 2}" y="${TOP + nameSize + 8}" font-family="Playfair Display" font-size="${nameSize}" letter-spacing="-0.4">${esc(view.learnerName)}</text>
  <rect x="${X0}" y="${TOP + nameSize + 26}" width="54" height="1.6" fill="url(#gold)"/>
  <path d="M${X0 + 62} ${DV} l3.2 -3.2 l3.2 3.2 l-3.2 3.2z" fill="#b08a43"/>
  <line x1="${X0 + 75}" y1="${DV}" x2="${X0 + 210}" y2="${DV}" stroke="#b08a43" stroke-width="0.35"/>

  <text x="${X0}" y="${courseY - 34}" font-family="Cormorant Garamond" font-style="italic" font-size="17" fill="#7a6c50">đã hoàn thành khoá học</text>
  ${course.lines.map((l, i) => `<text x="${X0}" y="${courseY + i * lineH}" font-family="Playfair Display" font-style="italic" font-size="${course.size}" data-course="1">${esc(l)}</text>`).join('')}
  ${skills ? `<text x="${X0}" y="${skillsY}" font-weight="600" font-size="7" letter-spacing="2.6" fill="#9a7430" data-skills="1">${esc(skills)}</text>` : ''}

  <g fill="none" stroke="#b08a43" stroke-width="0.4" opacity="0.75">${STRIP}</g>

  <text x="${X0}" y="${H - 92}" font-family="Cormorant Garamond" font-style="italic" font-size="21">${esc(view.instructorName)}</text>
  <line x1="${X0}" y1="${H - 82}" x2="${X0 + 150}" y2="${H - 82}" stroke="#141c36" stroke-width="0.4"/>
  <text x="${X0}" y="${H - 70}" font-weight="400" font-size="6" letter-spacing="2.2" fill="#8a7b5c">GIẢNG VIÊN</text>

  <g transform="translate(${X1 - QS} ${H - 60 - QS - 16})">
    <rect x="-5" y="-5" width="${QS + 10}" height="${QS + 10}" fill="#fdfbf5" stroke="#b08a43" stroke-width="0.4"/>
    <path d="${qrPath}" fill="#141c36"/>
  </g>
  <text x="${X1 - QS - 16}" y="${H - 104}" text-anchor="end" font-weight="400" font-size="6" letter-spacing="2.2" fill="#8a7b5c">QUÉT ĐỂ XÁC THỰC</text>
  <text x="${X1 - QS - 16}" y="${H - 91}" text-anchor="end" font-family="JetBrains Mono" font-size="6.6" fill="#141c36">${esc(verifyHost)}</text>
  <text x="${X1 - QS - 16}" y="${H - 81}" text-anchor="end" font-family="JetBrains Mono" font-size="6.6" fill="#141c36">${esc(view.serialNo)}</text>
</g>
</svg>`;
}
