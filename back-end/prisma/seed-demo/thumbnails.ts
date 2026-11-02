import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import resvgPkg from '@resvg/resvg-js';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const { Resvg } = resvgPkg;
const FONT_DIR = fileURLToPath(new URL('./fonts/', import.meta.url));
const FONT_FILES = ['BeVietnamPro-Bold.ttf', 'BeVietnamPro-Medium.ttf'].map((f) => FONT_DIR + f);

// Màu nền theo danh mục gốc, bám bảng màu DESIGN.md.
const PALETTE: Record<string, [string, string]> = {
  development: ['#1d4ed8', '#0ea5e9'],
  'artificial-intelligence': ['#5b21b6', '#c026d3'],
  'it-and-software': ['#0f172a', '#0e7490'],
  design: ['#c2410c', '#e11d48'],
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderThumbnail(o: { label: string; tagline: string; rootSlug: string; seed: string }): Buffer {
  const [from, to] = PALETTE[o.rootSlug] ?? PALETTE.development;
  // Hash slug → góc gradient và vị trí khối, để các khoá cùng danh mục không giống hệt nhau.
  const h = createHash('sha1').update(o.seed).digest();
  const angle = 20 + (h[0] % 50);
  const cx = 860 + (h[1] % 260), cy = 120 + (h[2] % 360), r = 160 + (h[3] % 120);
  const labelSize = o.label.length > 10 ? 104 : 128;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="18"/>
  <rect x="${cx - 40}" y="${cy + r - 30}" width="220" height="220" rx="36" fill="#ffffff" fill-opacity=".10" transform="rotate(${h[4] % 30} ${cx} ${cy})"/>
  <circle cx="${180 + (h[5] % 120)}" cy="${600 + (h[6] % 60)}" r="${40 + (h[7] % 40)}" fill="#ffffff" fill-opacity=".12"/>
  <text x="96" y="370" font-family="Be Vietnam Pro" font-weight="700" font-size="${labelSize}" fill="#ffffff">${esc(o.label)}</text>
  <text x="100" y="450" font-family="Be Vietnam Pro" font-weight="500" font-size="46" fill="#ffffff" fill-opacity=".86">${esc(o.tagline)}</text>
</svg>`;
  const png = new Resvg(svg, { font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Be Vietnam Pro' } }).render().asPng();
  return Buffer.from(png);
}

export function thumbnailKeyFromUrl(url: string, publicUrl: string): string | null {
  const base = publicUrl.replace(/\/+$/, '') + '/';
  if (!url.startsWith(base)) return null;
  const key = url.slice(base.length);
  return key.startsWith('thumbnails/') ? key : null;
}

const env = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Thiếu biến môi trường ${name}`);
  return v;
};

export function r2() {
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  const bucket = env('R2_PUBLIC_BUCKET');
  const publicUrl = env('R2_PUBLIC_URL').replace(/\/+$/, '');
  return {
    async upload(key: string, png: Buffer) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: png, ContentType: 'image/png', CacheControl: 'public, max-age=86400' }));
      return `${publicUrl}/${key}`;
    },
    async removeUrl(url: string) {
      const key = thumbnailKeyFromUrl(url, publicUrl);
      if (key) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
export type R2 = ReturnType<typeof r2>;
