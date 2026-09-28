// Nạp .env theo cwd (luôn chạy từ back-end/). Prod chạy Docker không có file này,
// biến đến từ môi trường → chỉ bỏ qua ENOENT, lỗi khác (vd sai cú pháp) ném lại.
// loadEnvFile không ghi đè biến đã có sẵn trong môi trường.
try {
  process.loadEnvFile();
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
