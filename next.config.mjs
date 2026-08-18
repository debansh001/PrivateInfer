/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias['isomorphic-ws'] = new URL('./src/lib/isomorphic-ws-fix.mjs', import.meta.url).pathname;
    config.resolve.fallback = { fs: false, net: false, tls: false, child_process: false };
    config.experiments = { asyncWebAssembly: true, topLevelAwait: true };
    return config;
  },
};
export default nextConfig;
