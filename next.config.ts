import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 어드민(localhost:5001)에서 iframe으로 로드할 수 있도록 허용
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' http://localhost:5001 http://localhost:5000 http://127.0.0.1:5001",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
