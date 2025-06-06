/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  publicRuntimeConfig: {
    API_URL: process.env.API_URL || 'http://localhost:8003',
  },
  // 添加环境变量前缀NEXT_PUBLIC_以允许在浏览器中访问
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:8003',
  },
  // 配置代理，解决跨域问题
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8003/api/:path*', // 指向后端AI服务API
      },
    ];
  },
}

module.exports = nextConfig 