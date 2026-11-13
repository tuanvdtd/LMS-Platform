import { certificateSvg, type CertificateView, type Measure } from './certificate-template.js';

// Hàm đo giả: mỗi ký tự rộng 0.5em.
const measure: Measure = (text, _font, size) => text.length * size * 0.5;
const view = (over: Partial<CertificateView> = {}): CertificateView => ({
  serialNo: 'SP-7K3F-92QX-M4',
  learnerName: 'Nguyễn Thị Minh Anh',
  courseTitle: 'React JS từ cơ bản đến nâng cao',
  instructorName: 'Trần Quốc Bảo',
  skills: ['React JS', 'JavaScript'],
  issuedAt: new Date('2026-11-12T03:00:00Z'),
  revokedAt: null,
  revokeReason: null,
  ...over,
});
const svg = (over?: Partial<CertificateView>) => certificateSvg(view(over), { verifyBase: 'https://fe.test/verify/', measure });
const fontSizeOf = (s: string, text: string) => Number(new RegExp(`font-size="([\\d.]+)"[^>]*>${text}<`).exec(s)![1]);

describe('certificateSvg', () => {
  it('cùng mã số → cùng SVG; khác mã số → hoa văn khác', () => {
    expect(svg()).toBe(svg());
    expect(svg({ serialNo: 'SP-A2B3-C4D5-E6' })).not.toBe(svg());
  });
  it('in tên, khoá, giảng viên, kỹ năng viết hoa, mã số, ngày theo giờ Việt Nam', () => {
    const s = svg();
    for (const t of [
      'Nguyễn Thị Minh Anh',
      'React JS từ cơ bản đến nâng cao',
      'Trần Quốc Bảo',
      'REACT JS   ·   JAVASCRIPT',
      'SP-7K3F-92QX-M4',
      '12 tháng 11, 2026',
      'fe.test/verify/',
    ]) {
      expect(s).toContain(t);
    }
  });
  it('tên dài bị giảm cỡ chữ, không dưới 16', () => {
    expect(fontSizeOf(svg(), 'Nguyễn Thị Minh Anh')).toBe(46);
    const long = 'Công Tằng Tôn Nữ Ngọc Bảo Hân'; // 29 ký tự: không vừa ở cỡ 46, vừa ở cỡ 32 với hàm đo giả
    const size = fontSizeOf(svg({ learnerName: long }), long);
    expect(size).toBeLessThan(46);
    expect(size).toBeGreaterThanOrEqual(16);
    expect(measure(long, 'playfair', size)).toBeLessThanOrEqual(470);
  });
  it('tên khoá dài ra tối đa 2 dòng, quá dài thì cắt và thêm …', () => {
    const title = Array.from({ length: 40 }, (_, i) => `từ${i}`).join(' ');
    const s = svg({ courseTitle: title });
    const lines = [...s.matchAll(/font-style="italic" font-size="[\d.]+" data-course="1">([^<]*)</g)].map((m) => m[1]);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });
  it('thoát ký tự đặc biệt', () => {
    const s = svg({ learnerName: 'A & B <script>"x"' });
    expect(s).toContain('A &amp; B &lt;script&gt;&quot;x&quot;');
    expect(s).not.toContain('<script>');
  });
  it('không có topic → không in dòng kỹ năng', () => {
    expect(svg({ skills: [] })).not.toContain('data-skills');
  });
});
