/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ keep your existing configs
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 🚀 REQUIRED FOR PUPPETEER
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-core",
      "@sparticuz/chromium"
    ],
  },

  // 🚀 EXTRA SAFETY (very important for Vercel)
  webpack: (config) => {
    config.externals.push("puppeteer-core", "@sparticuz/chromium");
    return config;
  },
};

export default nextConfig;