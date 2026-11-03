import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    const headers = [
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'none'; form-action 'self'; base-uri 'self'",
      },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];
    return ["/admin/:path*", "/api/admin/:path*", "/api/auth/:path*"].map((source) => ({
      source,
      headers,
    }));
  },
};
export default nextConfig;
