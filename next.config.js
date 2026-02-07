/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 會自動處理部署，不需要 output: 'export'
  // 移除 output: 'export' 可以使用 SSR 和 API Routes
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/cannon'],
  turbopack: {},
  images: {
    // Vercel 支援 Next.js Image Optimization
    // 如果要使用外部圖片，可以設定 domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
