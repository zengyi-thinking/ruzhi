# 儒智 APP 前端

儒智 APP 的 Web 前端部分，基于 Next.js 和 React 开发，提供儒家经典学习和 AI 助手功能。

## 功能特性

- 儒家经典浏览和学习
- AI 对话助手（支持多种儒家人物角色）
- 笔记和学习工具
- OCR 识别功能
- 用户管理

## 技术栈

- Next.js 13+
- React 18
- TypeScript
- Ant Design 5
- TailwindCSS
- Axios

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 进入前端目录
cd ruzhi/frontend/web

# 安装依赖
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

应用将在 http://localhost:3000 运行。

### 生产构建

```bash
npm run build
npm run start
# 或
yarn build
yarn start
```

## 与后端集成

前端项目通过 API 与后端服务通信。在开发环境中，使用了 Next.js 的 API 路由代理功能来解决跨域问题。

主要的 API 集成点:

1. **AI 对话服务**: 与后端的 AI 服务集成，支持多种模型提供商
2. **经典内容**: 获取和显示儒家经典内容
3. **用户数据**: 管理用户配置和学习进度

## 配置后端连接

默认情况下，前端配置为连接到`http://localhost:8003`的后端服务。如需修改，请更新`next.config.js`文件的代理配置部分。

## 项目结构

```
web/
├── public/          # 静态资源
├── src/
│   ├── components/  # React组件
│   ├── pages/       # 页面组件
│   ├── hooks/       # 自定义React钩子
│   ├── styles/      # 样式文件
│   ├── utils/       # 实用函数
│   └── types/       # TypeScript类型定义
├── next.config.js   # Next.js配置
└── package.json     # 项目依赖
```

## 常见问题解决

### 后端连接问题

问题: 前端无法连接到后端 API，产生类似"Failed to proxy http://localhost:8003/api..."的错误

解决方案:

1. 确保后端 AI 服务正在运行
2. 检查`next.config.js`中的代理配置是否正确
3. 使用网络调试工具(如 Chrome DevTools 的网络面板)检查请求

### AI 模型配置

问题: AI 聊天功能不工作或显示错误

解决方案:

1. 进入"学习中心"页面
2. 点击右上角设置图标，打开 API 设置对话框
3. 选择一个 AI 提供商并配置正确的 API 密钥

## 组件说明

### ApiSettingsModal

此组件用于配置 AI 服务设置，包括:

- 选择 AI 提供商(DeepSeek, 智谱清言, OpenAI 等)
- 配置 API 密钥
- 设置模型参数

### 学习中心页面

学习中心页面(`learning.tsx`)集成了 AI 对话功能，允许用户与各种儒家人物角色进行对话交流。
