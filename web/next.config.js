/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep the CJS calc library and astronomy-engine out of the bundle — Next will
    // require() them natively at runtime on the server (where getKundli runs).
    serverComponentsExternalPackages: ["@prisri/jyotish", "astronomy-engine"],
  },
};

module.exports = nextConfig;
