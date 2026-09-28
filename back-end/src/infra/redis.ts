import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { SecondaryStorage } from 'better-auth';
import { Redis } from 'ioredis';
import { requireEnv } from '../env.js';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(requireEnv('REDIS_URL'));
  }

  async onModuleDestroy() {
    await this.quit();
  }
}

// ponytail: Redis lỗi thì mọi request có auth lỗi theo (dựa vào độ ổn định của Upstash).
// Nâng cấp: bắt lỗi trong get/set, trả null để Better Auth đọc session từ DB.
export function redisStorage(redis: Redis): SecondaryStorage {
  return {
    get: (key) => redis.get(key),
    getAndDelete: (key) => redis.getdel(key),
    // TTL chỉ đặt lúc tạo key (NX); INCR sau đó không gia hạn — đúng hợp đồng
    // của Better Auth cho rate limit cửa sổ cố định. MULTI đảm bảo nguyên tử.
    increment: async (key, ttl) => {
      const result = await redis
        .multi()
        .set(key, 0, 'EX', ttl, 'NX')
        .incr(key)
        .exec();
      const [err, count] = result?.[1] ?? [new Error('Redis MULTI bị huỷ')];
      if (err) throw err;
      return count as number;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, 'EX', ttl);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  };
}
