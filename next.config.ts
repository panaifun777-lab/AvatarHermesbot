import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1'

const nextConfig: NextConfig = {
  // Only use standalone output for non-Vercel deployments (Docker, etc.)
  // Vercel handles its own deployment format
  output: isVercel ? undefined : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  allowedDevOrigins: [
    'preview-chat-0c8dec09-20fb-4d79-9762-7020dbdbde2a.space-z.ai',
    '127.0.0.1',
    'localhost',
    '21.0.3.175',
  ],
  serverExternalPackages: ['@libsql/client'],
};

export default nextConfig;
