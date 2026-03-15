/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for S3/CloudFront deployment
  output: "export",

  // Trailing slash ensures S3 serves index.html correctly
  trailingSlash: true,

  // Disable Next.js image optimization (not supported in static export)
  images: { unoptimized: true },
};

export default nextConfig;
