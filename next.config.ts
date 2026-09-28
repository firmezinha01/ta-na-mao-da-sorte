import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/afiliados',
        destination: '/afiliados/index.html',
      },
      {
        source: '/area-do-afiliado',
        destination: '/afiliados/index.html',
      },
      {
        source: '/afiliados/:path((?!assets/).*)',
        destination: '/afiliados/index.html',
      },
    ];
  },
};

export default nextConfig;
