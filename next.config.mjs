import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias['isomorphic-ws'] = path.join(process.cwd(), 'src/lib/isomorphic-ws-fix.mjs');
    config.resolve.fallback = { fs: false, net: false, tls: false, child_process: false };
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true, layers: true };
    return config;
  },
};
export default nextConfig;
