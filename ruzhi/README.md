# 儒智系统（RuZhi System）

结合 AI 与传统国学的智能应用系统，旨在帮助用户深入了解、学习和应用中国传统文化知识。

## 项目架构

儒智系统采用微服务架构，包含以下主要组件：

### 后端服务

- **OCR 服务**：提供古籍文字识别能力，支持繁体字和异体字识别
- **知识图谱服务**：管理国学概念、人物、典籍之间的复杂关系
- **AI 对话服务**：基于经典著作的专业问答系统
- **用户服务**：管理用户账号、学习进度和个性化推荐

### 前端实现

- **Web 端**：响应式网页应用，提供完整功能
- **Android 应用**：移动端实现（规划中）
- **iOS 应用**：移动端实现（规划中）

### AI 模型

- **OCR 模型**：针对古籍特点优化的文字识别模型
- **NLP 模型**：理解古文语义的自然语言处理模型
- **RAG 系统**：基于检索增强的生成式问答系统

## 开发环境设置

### 前提条件

- Python 3.9+
- Node.js 16+
- Neo4j 数据库 (用于知识图谱)
- Docker (可选，用于容器化部署)

### 后端设置

1. 安装 Python 依赖

```bash
# OCR服务
cd ruzhi/backend/ocr-service
pip install -r requirements.txt

# 知识图谱服务
cd ruzhi/backend/knowledge-graph
pip install -r requirements.txt
```

2. 配置 Neo4j

```bash
# 设置环境变量
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="password"
```

### 前端设置

```bash
# Web前端
cd ruzhi/frontend/web
npm install
```

## 启动系统

### 启动后端服务

```bash
# OCR服务
cd ruzhi/backend/ocr-service
uvicorn main:app --reload --port 8001

# 知识图谱服务
cd ruzhi/backend/knowledge-graph
uvicorn main:app --reload --port 8002
```

### 启动前端

```bash
# Web前端
cd ruzhi/frontend/web
npm start
```

访问 http://localhost:3000 查看 Web 应用

## API 文档

启动各微服务后，可通过以下 URL 访问 Swagger API 文档：

- OCR 服务: http://localhost:8001/docs
- 知识图谱服务: http://localhost:8002/docs

## 项目计划与进度

详见 [改进计划文档](docs/improvement-plan.md)

## 贡献指南

1. 分支命名规范：feature/_, bugfix/_, docs/\*
2. 提交前请确保通过所有单元测试
3. 代码风格请遵循项目既有规范

## 许可证

本项目采用 MIT 许可证 - 详情请参见 LICENSE 文件
