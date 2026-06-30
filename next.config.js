/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Keep Node-only native addons out of the browser bundle entirely
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false,
        path: false, os: false, crypto: false,
        stream: false, http: false, https: false, zlib: false,
      };

      // Hard-exclude the native signing addon from browser bundle
      // The Stellar SDK falls back to a pure-JS implementation automatically
      config.resolve.alias = {
        ...config.resolve.alias,
        "sodium-native": false,
        "require-addon": false,
      };
    }

    // Silence the "critical dependency" noise from sodium-native
    config.module = config.module ?? {};
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;
