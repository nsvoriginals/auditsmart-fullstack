// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,

  // remotePatterns replaces deprecated `domains`
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  env: {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },

  experimental: {
    // Tree-shake large packages — only imported icons/components end up in the bundle
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
    ],
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "razorpay"],
  },

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
};

export default nextConfig;