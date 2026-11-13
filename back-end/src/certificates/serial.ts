// Chỉ import node:crypto: script cấp bù chạy file này trực tiếp bằng node --experimental-strip-types.
import { randomInt } from 'node:crypto';

// Bỏ 0 1 I L O: người đọc mã từ bản in dễ nhầm các ký tự này.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const C = '[2-9A-HJKMNP-Z]';
export const SERIAL_RE = new RegExp(`^SP-${C}{4}-${C}{4}-${C}{2}$`);

export function newSerial(): string {
  const c = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `SP-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}
