import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  /**
   * API 프록시 설정
   *
   * 브라우저 → https://www.luminsight.xyz/api/** (상대 경로)
   * Next.js 서버 → http://localhost:8080/api/** (Spring Boot)
   *
   * 이 방식으로 클라이언트가 서버 IP:8080에 직접 접근할 필요가 없어,
   * 방화벽 / CORS 문제를 우회한다.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
