// Nội dung + khung HTML của mọi email. Hàm thuần, không đọc env → test và xem trước được mà không cần dựng app.
// Email client (Gmail, Outlook) bỏ <style>, flexbox và SVG → bố cục bằng table + style inline,
// hình vẽ (logo, nhà ga trên tuyến) ghép từ các ô bo tròn.

export interface Mail {
  subject: string;
  html: string;
}

// Tên khoá / lý do là nội dung người dùng nhập, URL có ký tự & → escape trước khi chèn vào HTML.
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

type StepState = 'done' | 'current' | 'failed' | 'todo';
type Step = [label: string, state: StepState];

interface Content {
  subject: string;
  // Dòng xem trước cạnh tiêu đề trong hộp thư.
  preheader: string;
  status?: ['success' | 'danger', string];
  heading: string;
  // HTML: phần nào do người dùng nhập thì nơi gọi phải escapeHtml trước.
  body: string;
  // Văn bản thô của người duyệt, escape ở đây.
  reason?: string;
  steps?: Step[];
  cta: [label: string, url: string];
  expiry?: string;
  note?: string;
}

const SANS =
  "'Be Vietnam Pro',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace";
const C = {
  ink: '#0f172a',
  inkFg: '#f8fafc',
  inkBlue: '#60a5fa',
  primary: '#2563eb',
  text: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  page: '#f1f5f9',
  panel: '#f8fafc',
  success: ['#15803d', '#f0fdf4', '#bbf7d0'],
  danger: ['#b91c1c', '#fef2f2', '#fecaca'],
} as const;

const TABLE = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';
// Ô rỗng vẫn phải có nội dung, không thì vài client co nó về 0.
const BLANK = 'font-size:0;line-height:0';

// Kích thước đặt trên <div> bên trong ô: đặt trên <td> thì ô bị hàng kéo giãn, hình tròn thành hình thuốc.
const dot = (size: number, style: string, inner = '&nbsp;') =>
  `<td width="${size}" valign="middle" style="${BLANK}"><div style="width:${size}px;height:${size}px;border-radius:${size}px;box-sizing:border-box;${style}">${inner}</div></td>`;

// Logo: ga xuất phát rỗng nối tới ga đích đặc, giống ký hiệu chữ S trên web.
const logo = `<table ${TABLE}><tr>
${dot(12, `border:2px solid ${C.inkBlue}`)}
<td width="14" valign="middle" style="${BLANK}"><div style="width:14px;height:2px;background:${C.inkBlue}">&nbsp;</div></td>
${dot(12, `background:${C.inkBlue}`)}
<td style="padding-left:10px;font-family:${SANS};font-size:18px;font-weight:800;letter-spacing:-0.01em;color:${C.inkFg}">Skill<span style="color:${C.inkBlue}">Path</span></td>
</tr></table>`;

function station(state: StepState): string {
  const filled = (bg: string, mark: string) =>
    dot(
      24,
      `background:${bg};color:#ffffff;font-family:${SANS};font-size:13px;font-weight:700;line-height:24px;text-align:center`,
      mark,
    );
  const ring = (color: string, inner?: string) =>
    dot(24, `border:2px solid ${color};background:#ffffff`, inner);
  if (state === 'done') return filled(C.primary, '&#10003;');
  if (state === 'failed') return filled(C.danger[0], '&#10005;');
  if (state === 'current')
    return ring(
      C.primary,
      `<div style="width:8px;height:8px;border-radius:4px;background:${C.primary};margin:6px auto 0">&nbsp;</div>`,
    );
  return ring('#cbd5e1');
}

// Tuyến đường nằm ngang: đoạn nối sau một ga chỉ tô xanh khi ga đó đã xong.
function route(steps: Step[]): string {
  const labelColor: Record<StepState, string> = {
    done: C.ink,
    current: C.primary,
    failed: C.danger[0],
    todo: C.muted,
  };
  const line = (on: boolean, show: boolean) =>
    `<td width="50%" style="${BLANK}"><div style="height:2px;background:${!show ? 'transparent' : on ? C.primary : C.border}">&nbsp;</div></td>`;
  const cells = steps
    .map(
      (
        [label, state],
        i,
      ) => `<td width="${100 / steps.length}%" valign="top" align="center">
<table ${TABLE} width="100%"><tr>${line(steps[i - 1]?.[1] === 'done', i > 0)}${station(state)}${line(state === 'done', i < steps.length - 1)}</tr></table>
<div style="padding:10px 4px 0;font-family:${SANS};font-size:13px;line-height:1.4;font-weight:600;color:${labelColor[state]}">${label}</div>
</td>`,
    )
    .join('');
  return `<table ${TABLE} width="100%" style="margin:28px 0 0;background:${C.panel};border:1px solid ${C.border};border-radius:10px;border-collapse:separate"><tr><td style="padding:20px 8px">
<table ${TABLE} width="100%"><tr>${cells}</tr></table>
</td></tr></table>`;
}

function render(c: Content): Mail {
  const [ctaLabel, ctaUrl] = c.cta;
  const href = escapeHtml(ctaUrl);
  const p = `margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${C.text}`;
  const small = `margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${C.muted}`;

  let status = '';
  if (c.status) {
    const [fg, bg, border] = C[c.status[0]];
    const mark = c.status[0] === 'success' ? '&#10003;' : '&#10005;';
    status = `<table ${TABLE} style="margin:0 0 14px"><tr><td style="padding:3px 12px;background:${bg};border:1px solid ${border};border-radius:999px;font-family:${SANS};font-size:12px;font-weight:600;line-height:1.5;color:${fg}">${mark}&nbsp; ${c.status[1]}</td></tr></table>`;
  }

  const reason = c.reason
    ? `<table ${TABLE} width="100%" style="margin:20px 0 0"><tr><td style="padding:14px 16px;background:${C.danger[1]};border:1px solid ${C.danger[2]};border-radius:8px">
<p style="${small};font-size:12px;font-weight:600;color:${C.danger[0]}">Nhận xét của người duyệt</p>
<p style="${p};padding-top:4px;color:${C.ink}">${escapeHtml(c.reason).replace(/\n/g, '<br>')}</p>
</td></tr></table>`
    : '';

  const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(c.subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:0;background:${C.page}}
@media (max-width:620px){.px{padding-left:24px!important;padding-right:24px!important}.h1{font-size:24px!important}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(c.preheader)}</div>
<table ${TABLE} width="100%" bgcolor="${C.page}"><tr><td align="center" style="padding:32px 12px">
<table ${TABLE} width="600" style="width:100%;max-width:600px">
<tr><td class="px" bgcolor="${C.ink}" style="padding:28px 40px 34px;background:${C.ink};border-radius:14px 14px 0 0">
${logo}
<div style="height:32px;${BLANK}">&nbsp;</div>
${status}<h1 class="h1" style="margin:0;font-family:${SANS};font-size:28px;line-height:1.25;font-weight:800;letter-spacing:-0.01em;color:${C.inkFg}">${c.heading}</h1>
</td></tr>
<tr><td class="px" bgcolor="#ffffff" style="padding:32px 40px 36px;background:#ffffff;border:1px solid ${C.border};border-top:0;border-radius:0 0 14px 14px">
<p style="${p}">${c.body}</p>
${reason}${c.steps ? route(c.steps) : ''}
<table ${TABLE} style="margin:28px 0 0"><tr><td bgcolor="${C.primary}" style="background:${C.primary};border-radius:8px"><a href="${href}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.3;color:#ffffff;text-decoration:none">${ctaLabel}</a></td></tr></table>
${c.expiry ? `<p style="${small};padding-top:12px">Link có hiệu lực trong <b style="color:${C.ink}">${c.expiry}</b>.</p>` : ''}
<div style="margin:28px 0 20px;height:1px;background:${C.border};${BLANK}">&nbsp;</div>
<p style="${small}">Nút không bấm được? Mở link này trong trình duyệt:</p>
<p style="${small};padding-top:4px;font-family:${MONO};font-size:12px;word-break:break-all"><a href="${href}" target="_blank" style="color:${C.primary};text-decoration:none">${href}</a></p>
${c.note ? `<p style="${small};padding-top:16px">${c.note}</p>` : ''}
</td></tr>
<tr><td align="center" style="padding:24px 16px 0">
<p style="${small};font-size:12px">SkillPath · Khoá học IT chấm bài tự động, gợi ý theo năng lực thực tế</p>
<p style="${small};font-size:12px">Đây là email tự động, vui lòng không trả lời.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
  return { subject: c.subject, html };
}

export const verificationMail = (url: string) =>
  render({
    subject: 'Xác minh email SkillPath',
    preheader: 'Còn một bước nữa là tài khoản của bạn sẵn sàng.',
    heading: 'Xác minh email để bắt đầu học',
    body: 'Còn một bước nữa là tài khoản SkillPath của bạn sẵn sàng. Bấm nút bên dưới để xác nhận đây đúng là email của bạn.',
    steps: [
      ['Tạo tài khoản', 'done'],
      ['Xác minh email', 'current'],
      ['Bắt đầu học', 'todo'],
    ],
    cta: ['Xác minh email', url],
    expiry: '24 giờ',
    note: 'Bạn không đăng ký SkillPath? Cứ bỏ qua email này, sẽ không có tài khoản nào được kích hoạt.',
  });

export const resetPasswordMail = (url: string) =>
  render({
    subject: 'Đặt lại mật khẩu SkillPath',
    preheader: 'Tạo mật khẩu mới cho tài khoản SkillPath của bạn.',
    heading: 'Đặt lại mật khẩu của bạn',
    body: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản SkillPath gắn với email này. Sau khi đổi mật khẩu, mọi thiết bị đang đăng nhập sẽ được đăng xuất.',
    cta: ['Đặt mật khẩu mới', url],
    expiry: '1 giờ',
    note: 'Không phải bạn yêu cầu? Cứ bỏ qua email này, mật khẩu hiện tại vẫn giữ nguyên.',
  });

export const staffInviteMail = (url: string) =>
  render({
    subject: 'Lời mời làm kiểm duyệt viên SkillPath',
    preheader: 'Đặt mật khẩu để bắt đầu duyệt khoá học trên SkillPath.',
    heading: 'Bạn được mời làm kiểm duyệt viên',
    body: 'SkillPath mời bạn tham gia đội kiểm duyệt: xem các khoá học giảng viên gửi lên và quyết định khoá nào đủ chất lượng để xuất bản. Đặt mật khẩu để kích hoạt tài khoản của bạn.',
    steps: [
      ['Nhận lời mời', 'done'],
      ['Đặt mật khẩu', 'current'],
      ['Duyệt khoá học', 'todo'],
    ],
    cta: ['Đặt mật khẩu', url],
    expiry: '1 giờ',
    note: 'Link hết hạn thì bạn nhờ quản trị viên gửi lại lời mời.',
  });

export function courseReviewedMail(
  feUrl: string,
  title: string,
  approved: boolean,
  reason: string | null,
) {
  const t = `<b style="color:${C.ink}">${escapeHtml(title)}</b>`;
  const url = `${feUrl}/instructor/courses`;
  return approved
    ? render({
        subject: `Khoá học "${title}" đã được duyệt`,
        preheader:
          'Khoá học đã qua kiểm duyệt và đang hiển thị trên SkillPath.',
        status: ['success', 'Đã duyệt'],
        heading: 'Khoá học của bạn đã được xuất bản',
        body: `${t} đã qua kiểm duyệt và hiện có mặt trên SkillPath. Học viên có thể tìm thấy và đăng ký ngay từ bây giờ.`,
        steps: [
          ['Gửi duyệt', 'done'],
          ['Kiểm duyệt', 'done'],
          ['Xuất bản', 'done'],
        ],
        cta: ['Xem khoá học của bạn', url],
      })
    : render({
        subject: `Khoá học "${title}" chưa được duyệt`,
        preheader: 'Xem nhận xét của người duyệt, chỉnh sửa rồi gửi duyệt lại.',
        status: ['danger', 'Chưa được duyệt'],
        heading: 'Khoá học cần chỉnh sửa thêm',
        body: `${t} chưa đạt ở lần kiểm duyệt này. Bạn xem nhận xét bên dưới, chỉnh sửa rồi gửi duyệt lại bất cứ lúc nào.`,
        reason: reason ?? '',
        steps: [
          ['Gửi duyệt', 'done'],
          ['Cần chỉnh sửa', 'failed'],
          ['Xuất bản', 'todo'],
        ],
        cta: ['Chỉnh sửa khoá học', url],
      });
}

export function instructorApplicationReviewedMail(
  feUrl: string,
  approved: boolean,
  reason: string | null,
) {
  return approved
    ? render({
        subject: 'Bạn đã là giảng viên cao cấp SkillPath',
        preheader:
          'Đơn của bạn đã được duyệt. Giờ bạn có thể đặt giá cho khoá học.',
        status: ['success', 'Đã duyệt'],
        heading: 'Bạn đã là giảng viên cao cấp',
        body: 'Đơn đăng ký giảng viên cao cấp của bạn đã được duyệt. Từ giờ bạn có thể đặt giá trả phí cho các khoá học của mình.',
        steps: [
          ['Gửi đơn', 'done'],
          ['Xét duyệt', 'done'],
          ['Đặt giá khoá học', 'current'],
        ],
        cta: ['Đặt giá cho khoá học', `${feUrl}/instructor/courses`],
      })
    : render({
        subject: 'Đơn giảng viên cao cấp chưa được duyệt',
        preheader: 'Xem nhận xét của người duyệt, sửa đơn rồi gửi lại.',
        status: ['danger', 'Chưa được duyệt'],
        heading: 'Đơn giảng viên cao cấp cần bổ sung',
        body: 'Đơn đăng ký giảng viên cao cấp của bạn chưa được duyệt ở lần này. Bạn xem nhận xét bên dưới, sửa đơn rồi gửi lại bất cứ lúc nào.',
        reason: reason ?? '',
        steps: [
          ['Gửi đơn', 'done'],
          ['Cần bổ sung', 'failed'],
          ['Giảng viên cao cấp', 'todo'],
        ],
        cta: ['Sửa đơn và gửi lại', `${feUrl}/instructor/verification`],
      });
}
