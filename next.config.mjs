/** @type {import('next').NextConfig} */
const nextConfig = {
  // `experimental.turbo` is deprecated in Next.js 15+
  allowedDevOrigins: ["http://192.168.1.13:3000"],
  turbopack: {}
}

export default nextConfig
