import { fileURLToPath } from 'node:url';
import resvgPkg from '@resvg/resvg-js';
import * as fontkit from 'fontkit';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import type { FontKey, Measure } from './certificate-template.js';

const { Resvg } = resvgPkg;

// Tính từ vị trí file này để chạy đúng cả khi test (src) lẫn khi đã build (dist, font được chép kèm).
const FONT_DIR = fileURLToPath(new URL('./fonts/', import.meta.url));
const FONT_FILE: Record<FontKey, string> = {
  playfair: 'PlayfairDisplay.ttf',
  playfairItalic: 'PlayfairDisplay-Italic.ttf',
  cormorantItalic: 'CormorantGaramond-Italic.ttf',
  mono: 'JetBrainsMono.ttf',
  sans: 'BeVietnamPro-Regular.ttf',
  sansSemiBold: 'BeVietnamPro-SemiBold.ttf',
};
const fontPath = (key: FontKey) => `${FONT_DIR}${FONT_FILE[key]}`;

const opened = new Map<FontKey, fontkit.Font>();
export const measure: Measure = (text, font, size) => {
  let f = opened.get(font);
  if (!f) opened.set(font, (f = fontkit.openSync(fontPath(font))));
  return (f.layout(text).advanceWidth / f.unitsPerEm) * size;
};

export function renderPng(svg: string): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 1684 },
    font: { fontDirs: [FONT_DIR], loadSystemFonts: false, defaultFontFamily: 'Be Vietnam Pro' },
  })
    .render()
    .asPng();
}

// PDF chỉ biết "đậm hay không" nên mẫu chỉ dùng Be Vietnam Pro ở hai độ đậm.
function pdfFont(family: string, bold: boolean, italic: boolean): FontKey {
  if (family.includes('Playfair')) return italic ? 'playfairItalic' : 'playfair';
  if (family.includes('Cormorant')) return 'cormorantItalic';
  if (family.includes('JetBrains')) return 'mono';
  return bold ? 'sansSemiBold' : 'sans';
}

export function renderPdf(svg: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [842, 595], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    for (const key of Object.keys(FONT_FILE) as FontKey[]) doc.registerFont(key, fontPath(key));
    SVGtoPDF(doc, svg, 0, 0, { assumePt: true, fontCallback: pdfFont });
    doc.end();
  });
}
