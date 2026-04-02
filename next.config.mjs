// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images configuration
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  
  // Environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'razorpay'],
  },
};

export default nextConfig;