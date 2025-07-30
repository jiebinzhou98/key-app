// next.config.js
const withPWA = require("next-pwa");

const runtimeCaching: never[] = [
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching,
  fallbacks: {
    document: "/offline.html",
  },
})(nextConfig);
