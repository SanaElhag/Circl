import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A redirect() call inside a page component only produces a real HTTP 3xx
  // when nothing above it in the tree has already started streaming — under
  // the shared root layout here, the layout shell flushes first, so the page
  // always came back 200 with no Location header and relied on a client-side
  // redirect after hydration (bots/curl/no-JS clients would just see a blank
  // page). redirects() resolves at the routing layer before any component
  // renders, so it's the correct place for permanent path renames like this.
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
 