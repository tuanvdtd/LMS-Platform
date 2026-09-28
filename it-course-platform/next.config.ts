import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    return [{ source: "/instructor/dashboard", destination: "/instructor", permanent: false }];
  },
};

export default nextConfig;
