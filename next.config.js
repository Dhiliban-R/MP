/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double rendering issues
  swcMinify: true,
  
  // Optimize for hydration
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'graph.facebook.com',
      'avatars.githubusercontent.com',
    ],
  },

  experimental: {
    esmExternals: false, // Disable ESM externals to prevent module loading issues
  },

  webpack: (config, { isServer }) => {
    // Simplified webpack config to prevent module loading issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
