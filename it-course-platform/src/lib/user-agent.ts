// Tên thiết bị cho danh sách phiên đăng nhập. File thuần, không import alias → test bằng node:test.
// ponytail: chỉ nhận các trình duyệt / hệ điều hành phổ biến; cần chi tiết hơn (phiên bản, model máy) thì đổi sang ua-parser-js.
const BROWSERS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/coc_coc_browser/, 'Cốc Cốc'],
  [/SamsungBrowser/, 'Samsung Internet'],
  [/Firefox\/|FxiOS/, 'Firefox'],
  [/Chrome\/|CriOS/, 'Chrome'],
  [/Safari\//, 'Safari'],
];
const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

const match = (ua: string, table: [RegExp, string][]) => table.find(([re]) => re.test(ua))?.[1];

export function describeDevice(ua: string | null | undefined): { label: string; mobile: boolean } {
  if (!ua) return { label: 'Thiết bị không xác định', mobile: false };
  const browser = match(ua, BROWSERS);
  const os = match(ua, SYSTEMS);
  const label = browser && os ? `${browser} trên ${os}` : (browser ?? os ?? 'Thiết bị không xác định');
  return { label, mobile: /Mobi|Android|iPhone|iPad|iPod/.test(ua) };
}
