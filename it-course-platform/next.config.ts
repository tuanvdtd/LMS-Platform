import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Cache chủ động bằng 'use cache' + cacheLife (spec E5). Xem docs 01-getting-started/08-caching.md
  cacheComponents: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    return [
      { source: "/instructor/dashboard", destination: "/instructor", permanent: false },
      // Trang quản lý không có mục mặc định (spec course-create-basics §5.4)
      { source: "/instructor/courses/:id/manage", destination: "/instructor/courses/:id/manage/goals", permanent: false },
    ];
  },
};

// Không có SENTRY_AUTH_TOKEN (dev local) → chỉ bỏ qua upload source map.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Đi qua domain của mình, trình chặn quảng cáo không chặn được.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
