# 儒智跨平台部署指南

## 🎯 项目概述

儒智传统文化学习平台现已支持三个平台：
- **微信小程序端** - 原生小程序开发
- **Web端** - React + TypeScript + Vite
- **Android端** - Kotlin + Jetpack Compose

所有平台共享统一的后端API和数据同步机制，确保用户体验一致性。

## 🏗️ 架构概览

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   微信小程序     │  │     Web端       │  │   Android端     │
│   (原生开发)     │  │  (React/TS)     │  │ (Kotlin/Compose)│
└─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌─────────┴───────┐
                    │   统一后端API    │
                    │  (Node.js/Express)│
                    └─────────┬───────┘
                              │
                    ┌─────────┴───────┐
                    │   数据存储层     │
                    │ MongoDB + Redis │
                    └─────────────────┘
```

## 🚀 快速部署

### 1. 环境准备

#### 系统要求
- **操作系统**: Linux/macOS/Windows
- **Node.js**: >= 18.0.0
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0

#### 开发工具
- **Web端**: VS Code + Node.js
- **Android端**: Android Studio + JDK 11+
- **小程序端**: 微信开发者工具

### 2. 一键部署

```bash
# 克隆项目
git clone https://github.com/ruzhi-team/ruzhi-platform.git
cd ruzhi-platform

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量

# 启动所有服务
cd deployment
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 环境变量配置

创建 `.env` 文件：

```bash
# API配置
DEEPSEEK_API_KEY=your_deepseek_api_key
JWT_SECRET=your_jwt_secret_key

# 数据库配置
MONGODB_URI=mongodb://mongodb:27017/ruzhi
MONGO_USERNAME=admin
MONGO_PASSWORD=your_mongo_password

# Redis配置
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=your_redis_password

# 文件存储配置
MINIO_ACCESS_KEY=your_minio_access_key
MINIO_SECRET_KEY=your_minio_secret_key

# 域名配置
DOMAIN=ruzhi.com
SSL_EMAIL=admin@ruzhi.com
```

## 📱 平台特定部署

### Web端部署

```bash
# 进入Web目录
cd web

# 安装依赖
npm install

# 构建生产版本
npm run build

# 使用Docker部署
docker build -t ruzhi-web .
docker run -d -p 3000:80 ruzhi-web
```

#### Web端配置

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

### Android端部署

```bash
# 进入Android目录
cd android

# 构建Debug版本
./gradlew assembleDebug

# 构建Release版本
./gradlew assembleRelease

# 安装到设备
./gradlew installDebug
```

#### Android端配置

```kotlin
// BuildConfig配置
buildConfigField "String", "API_BASE_URL", "\"https://api.ruzhi.com\""
buildConfigField "String", "CDN_BASE_URL", "\"https://cdn.ruzhi.com\""
```

### 小程序端部署

```bash
# 进入小程序目录
cd frontend/miniprogram

# 在微信开发者工具中打开项目
# 配置AppID和服务器域名
# 上传代码到微信平台
```

#### 小程序端配置

```javascript
// config/api.js
const API_CONFIG = {
  baseURL: 'https://api.ruzhi.com',
  timeout: 30000
}
```

## 🔄 数据同步机制

### 同步策略

1. **登录同步**: 用户登录时自动同步服务器数据
2. **实时同步**: 关键操作实时同步到所有设备
3. **冲突解决**: 智能合并冲突数据
4. **离线支持**: 离线数据本地存储，联网后同步

### 同步API

```javascript
// 登录同步
POST /api/sync/login
{
  "platform": "web|android|miniprogram",
  "deviceId": "unique_device_id"
}

// 上传本地数据
POST /api/sync/upload
{
  "syncSessionId": "session_id",
  "localData": {
    "userInfo": {...},
    "learningProgress": {...},
    "aiConfig": {...}
  }
}

// 实时同步
WebSocket /api/sync/realtime
```

## 🧪 测试指南

### 功能测试清单

#### 跨平台一致性测试

```bash
# 运行自动化测试
npm run test:cross-platform

# 测试项目：
# ✅ 用户登录和数据同步
# ✅ AI功能在所有平台正常工作
# ✅ OCR识别功能一致性
# ✅ 经典库内容同步
# ✅ 学习进度同步
# ✅ 收藏和笔记同步
```

#### 性能测试

```bash
# Web端性能测试
npm run test:performance:web

# Android端性能测试
./gradlew connectedAndroidTest

# 小程序端性能测试
# 使用微信开发者工具的性能分析
```

#### 兼容性测试

```bash
# 浏览器兼容性测试
npm run test:browsers

# Android设备兼容性测试
./gradlew testDebugUnitTest

# 小程序兼容性测试
# 在不同微信版本中测试
```

### 测试环境搭建

```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 运行集成测试
npm run test:integration

# 运行端到端测试
npm run test:e2e
```

## 📊 监控和维护

### 服务监控

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f ruzhi-backend
docker-compose logs -f ruzhi-web

# 监控资源使用
docker stats
```

### 性能监控

- **Prometheus**: 指标收集
- **Grafana**: 可视化监控
- **ELK Stack**: 日志分析
- **Sentry**: 错误追踪

### 备份策略

```bash
# 数据库备份
docker exec ruzhi-mongodb mongodump --out /backup

# 文件备份
docker exec ruzhi-minio mc mirror /data /backup

# 自动备份脚本
./scripts/backup.sh
```

## 🔧 故障排除

### 常见问题

#### 1. 跨域问题
```bash
# 检查CORS配置
curl -H "Origin: https://ruzhi.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.ruzhi.com/health
```

#### 2. 数据同步失败
```bash
# 检查Redis连接
docker exec ruzhi-redis redis-cli ping

# 检查同步会话
docker exec ruzhi-redis redis-cli keys "sync:*"
```

#### 3. API响应慢
```bash
# 检查数据库性能
docker exec ruzhi-mongodb mongostat

# 检查API响应时间
curl -w "@curl-format.txt" -s -o /dev/null https://api.ruzhi.com/health
```

### 日志分析

```bash
# 查看错误日志
docker-compose logs --tail=100 ruzhi-backend | grep ERROR

# 查看访问日志
docker-compose logs --tail=100 nginx | grep "POST\|GET"

# 实时监控日志
docker-compose logs -f --tail=0 ruzhi-backend
```

## 📈 扩展和优化

### 水平扩展

```yaml
# docker-compose.scale.yml
services:
  ruzhi-backend:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - ruzhi-backend
    # 负载均衡配置
```

### 性能优化

1. **CDN加速**: 静态资源使用CDN
2. **缓存策略**: Redis缓存热点数据
3. **数据库优化**: MongoDB索引优化
4. **代码分割**: 前端代码按需加载

### 安全加固

1. **HTTPS**: 全站HTTPS加密
2. **API限流**: 防止API滥用
3. **数据加密**: 敏感数据加密存储
4. **安全头**: 设置安全HTTP头

## 📞 技术支持

### 联系方式
- **技术文档**: https://docs.ruzhi.com
- **问题反馈**: https://github.com/ruzhi-team/ruzhi-platform/issues
- **技术交流**: tech@ruzhi.com

### 版本更新

```bash
# 检查更新
git fetch origin
git log HEAD..origin/main --oneline

# 更新部署
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

**儒智跨平台部署现已完成！用户可以在微信小程序、Web浏览器和Android设备上享受一致的传统文化学习体验。** 🎉
