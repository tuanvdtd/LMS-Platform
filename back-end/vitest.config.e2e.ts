import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // E2E boot AppModule thật → không cho MailConsumer ăn message của dev server chạy song song.
    // MEDIACONVERT_* rỗng: .env dev có thể đã bật HLS → e2e sẽ gọi AWS thật (loadEnvFile không ghi đè biến đã có, kể cả rỗng).
    // Spec cần HLS tự stubEnv + override MediaConvertGateway.
    env: { RABBITMQ_CONSUMERS: 'off', MEDIACONVERT_ROLE_ARN: '', MEDIACONVERT_WEBHOOK_SECRET: '' },
  },
});
