/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // 性能优化配置
  experimental: {
    // 启用现代化构建
    modern: true,
    // 启用并发特性
    concurrentFeatures: true,
  },

  // 图片优化
  images: {
    domains: ['localhost', 'your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // Webpack优化配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 优化代码分割
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui',
          chunks: 'all',
          priority: 20,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    };

    // 生产环境优化
    if (!dev) {
      // 启用Tree Shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  publicRuntimeConfig: {
    API_URL: process.env.API_URL || 'http://localhost:8003',
  },
  // 添加环境变量前缀NEXT_PUBLIC_以允许在浏览器中访问
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || 'http://localhost:8003',
  },
  // 头部优化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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