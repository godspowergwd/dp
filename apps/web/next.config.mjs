/** @type {import('next').NextConfig} */
// Static export per docs/04-TECH-STACK.md + README (frontend: static hosting).
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
};

export default nextConfig;
