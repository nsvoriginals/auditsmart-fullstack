// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image configuration
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  
  // Environment variables
  env: {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  },
  
  // Runtime configs
  serverRuntimeConfig: {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  
  publicRuntimeConfig: {
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  
  // Webpack configuration (if needed)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Experimental features (if needed)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

export default nextConfig;