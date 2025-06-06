# 儒智 - 儒家经典学习与 AI 辅助平台

儒智是一个结合儒家经典和现代 AI 技术的学习平台，旨在帮助用户更好地理解和学习儒家思想。

## 项目概述

儒智平台集成了多种功能：

- **经典浏览**: 提供论语、孟子等儒家经典著作的浏览和学习
- **AI 对话**: 通过 AI 技术模拟孔子、孟子等儒家先贤，与用户进行对话交流
- **学习工具**: 提供笔记、标注、思维导图等学习辅助工具
- **OCR 识别**: 支持文本识别功能，便于用户导入学习资料

## 项目结构

```
ruzhi/
├── frontend/             # 前端代码
│   ├── web/              # Web前端 (Next.js)
│   └── android/          # Android客户端 (React Native)
├── backend/              # 后端服务
│   ├── ai-service/       # AI服务 (FastAPI)
│   └── api-server/       # 主API服务
├── models/               # AI模型
├── data/                 # 数据文件
├── docs/                 # 文档
└── tools/                # 工具脚本
```

## 快速开始

### 1. 启动后端 AI 服务

```bash
# 进入AI服务目录
cd ruzhi/backend/ai-service

# Windows:
start_services.bat
# 或
python -m uvicorn simple_app:app --host 127.0.0.1 --port 8003

# Linux/Mac:
chmod +x start_services.sh
./start_services.sh
# 或
python3 -m uvicorn simple_app:app --host 127.0.0.1 --port 8003
```

### 2. 启动前端 Web 应用

```bash
# 进入Web前端目录
cd ruzhi/frontend/web

# 安装依赖
npm install
# 或
yarn install

# 开发模式启动
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000 查看 web 应用

### 3. 配置 AI 服务

1. 在 web 应用中，进入"学习中心"页面
2. 点击右上角设置图标，打开 API 设置对话框
3. 选择一个 AI 提供商(DeepSeek, 智谱清言, OpenAI 等)
4. 输入 API 密钥
5. 保存设置

## 目前支持的 AI 提供商

- **DeepSeek AI** - https://www.deepseek.com/
- **智谱清言 (ZhipuAI)** - https://open.bigmodel.cn/
- **OpenAI** - https://platform.openai.com/

## 常见问题解决

### 前端无法连接到后端

**问题**: 前端显示"连接后端服务失败"等错误

**解决方案**:

1. 确保后端 AI 服务已启动并监听在 8003 端口
2. 检查前端项目的`next.config.js`中的代理配置是否正确

### API 设置问题

**问题**: 配置 API 密钥后无法正常使用 AI 功能

**解决方案**:

1. 确认 API 密钥是否正确
2. 检查所选 AI 提供商的服务状态
3. 查看浏览器控制台或后端日志获取详细错误信息

### 环境变量编码错误

**问题**: 启动完整版后端服务时出现 UTF-8 编码错误

**解决方案**:

1. 使用简化版服务(`simple_app.py`)进行开发测试
2. 确保`.env`文件使用 UTF-8 编码保存

## 技术栈

- **前端**: Next.js, React, TypeScript, Ant Design
- **后端**: FastAPI, SQLAlchemy, PostgreSQL
- **AI**: 多种大语言模型集成

## 贡献指南

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的修改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

[MIT License](LICENSE)
