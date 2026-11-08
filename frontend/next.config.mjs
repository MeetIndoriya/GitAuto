/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  async rewrites() {
    // Only proxy to an external backend if BACKEND_URL is explicitly configured and not localhost
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl && backendUrl !== "http://localhost:8000" && process.env.USE_BACKEND_PROXY === "true") {
      return [
        {
          source: "/backend-api/:path*",
          destination: `${backendUrl}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
