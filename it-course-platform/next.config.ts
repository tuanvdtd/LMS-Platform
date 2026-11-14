import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Không bật cacheComponents: nó kéo theo <Activity> giữ route cũ (state sót, video còn tiếng, PDF crash).
  // Cache dữ liệu bằng fetch next.revalidate — xem lib/api/catalog.ts.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "cdn.vietqr.io" },
      { protocol: "https", hostname: "img.vietqr.io" },
    ],
  },
  async redirects() {
    return [
      { source: "/instructor/dashboard", destination: "/instructor", permanent: false },
      // Hồ sơ giảng viên đã gộp vào trang cá nhân chung; giữ link cũ sống.
      { source: "/instructors/:id", destination: "/u/:id", permanent: false },
      // Trang quản lý khoá không có nội dung riêng, mở thẳng mục đầu tiên (Mục tiêu)
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
