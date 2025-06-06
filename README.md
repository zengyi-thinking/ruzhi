# 儒智 (RuZhi) APP

## 项目简介

"儒智"是一款融合传统儒家经典与现代科技的移动应用，旨在让古代智慧在现代社会焕发新生。通过 AI、OCR、知识图谱等技术，使用户能够便捷地接触、理解和应用传统文化精髓。

## 核心功能

- **古籍智能识别**：支持繁体字/异体字 OCR 识别，生僻字标注，多版本对照
- **《孟子》知识图谱**：动态关系网络，智能问答引擎
- **《论语》AI 智能体**：虚拟导师系统，情境化教学，辩论训练
- **传统文化活化工具**：文言文转白话引擎，AR 礼乐复原，创作工坊

## 技术架构

```
客户端层 <---> 服务层 <---> 数据层
```

- **客户端**：iOS/Android/Web 应用
- **服务层**：微服务架构，API 网关，AI 推理服务
- **数据层**：文本库，知识图谱，媒体资源库

## 项目结构

```
ruzhi/
├── docs/                # 项目文档
├── frontend/            # 前端代码
│   ├── android/         # Android客户端
│   ├── ios/             # iOS客户端
│   └── web/             # Web应用
├── backend/             # 后端代码
│   ├── api-gateway/     # API网关
│   ├── ocr-service/     # OCR服务
│   ├── knowledge-graph/ # 知识图谱服务
│   ├── ai-service/      # AI服务
│   └── user-service/    # 用户服务
├── models/              # AI模型
│   ├── ocr/             # OCR模型
│   ├── nlp/             # NLP模型
│   └── generation/      # 内容生成模型
├── data/                # 数据资源
│   ├── texts/           # 文本资源
│   ├── images/          # 图像资源
│   └── knowledge-base/  # 知识库资源
└── tools/               # 开发工具
```

## 开发环境设置

### 前提条件

- Node.js 18+
- Python 3.9+
- Java 17+
- Android Studio / Xcode
- Docker & Docker Compose

### 后端设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/ruzhi.git
cd ruzhi/backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
docker-compose up -d
```

### 前端设置

```bash
# 进入前端目录
cd ruzhi/frontend/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## API 文档

API 文档可通过以下方式访问：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 许可证

该项目采用 MIT 许可证 - 详情见 [LICENSE](LICENSE) 文件

## 联系方式

项目维护者 - your.email@example.com
