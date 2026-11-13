import { HttpException } from '@nestjs/common';
import type { Request } from 'express';

export const tooManyRequests = () =>
  new HttpException({ statusCode: 429, code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh, thử lại sau ít phút' }, 429);

// Production chạy sau Cloudflare Tunnel: req.ip là địa chỉ của tunnel, mọi người dùng sẽ chung một ô giới hạn.
// Cloudflare ghi IP thật của người gọi vào header này; môi trường dev không có header thì dùng req.ip.
export function clientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  return (Array.isArray(cf) ? cf[0] : cf) || req.ip || 'unknown';
}
