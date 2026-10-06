import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // using this instead of a redirect() in the page itself - that approach
  // never sent a real redirect, just a blank page until js kicked in
  async redirects() {
    return [
      {
        source: "/become-owner",
        destination: "/list-your-gear",
        permanent: true,
      },
    ];
  },
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
 