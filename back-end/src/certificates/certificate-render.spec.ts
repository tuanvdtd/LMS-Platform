import { measure, renderPdf, renderPng } from './certificate-render.js';
import { certificateSvg } from './certificate-template.js';

const svg = certificateSvg(
  {
    serialNo: 'SP-7K3F-92QX-M4',
    learnerName: 'Nguyễn Thị Minh Anh',
    courseTitle: 'React JS từ cơ bản đến nâng cao',
    instructorName: 'Trần Quốc Bảo',
    skills: ['React JS', 'JavaScript', 'TypeScript'],
    issuedAt: new Date('2026-11-12T03:00:00Z'),
    revokedAt: null,
    revokeReason: null,
  },
  { verifyBase: 'https://fe.test/verify/', measure },
);

describe('certificate-render', () => {
  it('measure: chữ rộng hơn khi cỡ lớn hơn, chuỗi dài hơn', () => {
    expect(measure('Nguyễn', 'playfair', 46)).toBeGreaterThan(measure('Nguyễn', 'playfair', 24));
    expect(measure('Nguyễn Thị', 'playfair', 24)).toBeGreaterThan(measure('Nguyễn', 'playfair', 24));
  });
  it('renderPng trả ảnh PNG rộng 1684px', () => {
    const png = renderPng(svg);
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.readUInt32BE(16)).toBe(1684);
  });
  it('renderPdf trả PDF một trang', async () => {
    const pdf = await renderPdf(svg);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).length).toBe(1);
  }, 30_000);
});
