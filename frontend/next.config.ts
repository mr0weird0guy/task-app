/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow connecting to the local backend during development
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/:path*`,
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
