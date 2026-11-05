/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // Enables minimized production builds for server hosting
  // Lets a second local server (e.g. `npm run dev:local`) build into its own
  // folder instead of fighting another dev server over `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // instrumentation.js: process-level error logging (stable in Next 15)
  experimental: { instrumentationHook: true }
};

export default nextConfig;
