import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// NEXT_PUBLIC_* được inline lúc build → thiếu biến thì báo ngay, không âm thầm gọi sai host.
const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) throw new Error('Thiếu NEXT_PUBLIC_API_URL (xem .env.example)');

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    // Khớp plugin admin ở back-end → session.user có `role`.
    adminClient(),
    // Khớp user.additionalFields ở back-end/src/auth/auth.ts
    inferAdditionalFields({
      user: {
        targetTrack: { type: 'string', required: false },
        level: { type: 'string', required: false },
      },
    }),
  ],
});
