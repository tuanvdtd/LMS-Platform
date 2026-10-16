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
    env: { RABBITMQ_CONSUMERS: 'off' },
  },
});
