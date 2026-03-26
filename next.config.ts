import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
       {
        protocol: "https",
        hostname: "cdn.auth0.com",
      },
    ],
  },
};

export default nextConfig;
