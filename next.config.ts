import type { NextConfig } from "next";
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.panoramaresort.com",
      },
      {
        protocol: "https",
        hostname: "thtssbxfmzgbowqtlxnu.supabase.co",
      },
    ],
  },
};
 
export default nextConfig;
 