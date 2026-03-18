/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
      "@sparticuz/chromium"
    ],
  },

  // ✅ FORCE WEBPACK (VERY IMPORTANT)
  webpack: (config) => {
    config.externals.push("puppeteer-core", "@sparticuz/chromium");
    return config;
  },

  // ✅ DISABLE TURBOPACK COMPLETELY
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;