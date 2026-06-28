const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build (for Node hosting such as cPanel "Setup Node.js App").
  output: "standalone",
  experimental: {
    // Trace from the monorepo root so the workspace library (@prisri/jyotish) and
    // astronomy-engine are copied into the standalone bundle. In Next 14 this key
    // lives under `experimental` (it only moves top-level in Next 15).
    outputFileTracingRoot: path.join(__dirname, ".."),
    // Keep the CJS calc library and astronomy-engine out of the webpack bundle — Next
    // require()s them natively at runtime on the server (where getKundli runs).
    serverComponentsExternalPackages: ["@prisri/jyotish", "astronomy-engine"],
  },
};

module.exports = nextConfig;
