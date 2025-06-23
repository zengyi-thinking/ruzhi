# 🚀 儒智项目快速启动指南

## 📋 前置要求

### 系统要求
- **操作系统**: Windows 10/11, macOS, Linux
- **Python**: 3.8+ (推荐 3.9+)
- **Node.js**: 16+ (推荐 18+)
- **微信开发者工具**: 最新稳定版

### 开发工具
- **代码编辑器**: VS Code (推荐) 或其他
- **浏览器**: Chrome, Firefox, Safari
- **终端**: PowerShell, Terminal, 或 Git Bash

## 🏗️ 项目结构

```
ruzhi/
├── frontend/
│   ├── web/                 # Web端 (Next.js + React)
│   └── miniprogram/         # 小程序端
├── backend/                 # 后端API服务 (Flask)
├── PROJECT_PROGRESS_REPORT.md
└── QUICK_START_GUIDE.md
```

## 🚀 快速启动

### 1. 启动后端API服务

```bash
# 进入后端目录
cd ruzhi/backend

# 安装依赖 (首次运行)
pip install -r requirements.txt

# 启动服务
python start_server.py
```

**服务地址**: http://localhost:8000  
**API文档**: 访问根路径查看完整接口列表

### 2. 启动Web端应用

```bash
# 进入Web端目录
cd ruzhi/frontend/web

# 安装依赖 (首次运行)
npm install

# 启动开发服务器
npm run dev
```

**访问地址**: http://localhost:3000

### 3. 运行小程序

1. 打开**微信开发者工具**
2. 选择**导入项目**
3. 项目路径选择: `ruzhi/frontend/miniprogram`
4. AppID: 使用测试号或自己的AppID
5. 点击**确定**开始编译

## 🧪 测试验证

### 后端API测试

```bash
# 在后端目录下运行测试脚本
cd ruzhi/backend
python test_api.py
```

**预期结果**: 9/9 测试通过 ✅

### 手动测试关键接口

1. **健康检查**: http://localhost:8000/health
2. **API概览**: http://localhost:8000/
3. **学习历史**: http://localhost:8000/api/v1/user/user_001/learning-history
4. **AI分析**: POST http://localhost:8000/api/v1/user/user_001/ai-analysis

## 🎯 核心功能体验

### Web端 - 智能历史分析

1. 访问 http://localhost:3000
2. 点击导航栏的**智能分析**
3. 体验以下功能：
   - 📊 **学习概览**: 查看学习统计和数据可视化
   - 🎯 **个性化推荐**: 体验AI推荐算法
   - 🛤️ **学习路径**: 查看智能规划的学习路径
   - 💬 **对话总结**: 查看AI对话分析结果

### 小程序端

1. 在微信开发者工具中预览
2. 体验自定义TabBar导航
3. 查看各页面的基础框架
4. 测试样式和布局效果

## 🔧 常见问题解决

### 后端服务问题

**问题**: 访问根路径返回404错误  
**解决**: ✅ 已修复，现在支持HTML和JSON两种响应格式

**问题**: 依赖安装失败  
**解决**: 
```bash
# 升级pip
python -m pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 小程序编译问题

**问题**: WXSS编译错误，Vant组件库引用  
**解决**: ✅ 已修复，移除了所有Vant引用，使用原生样式

**问题**: 自定义TabBar不显示  
**解决**: 确保 `app.json` 中的 `custom` 字段为 `true`

### Web端问题

**问题**: 依赖安装失败  
**解决**:
```bash
# 清除缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

**问题**: 端口冲突  
**解决**: 修改 `package.json` 中的启动端口或关闭占用端口的程序

## 📊 功能验证清单

### ✅ 后端API验证
- [ ] 根路径访问正常 (HTML + JSON)
- [ ] 健康检查接口正常
- [ ] 用户学习历史接口正常
- [ ] AI分析接口正常
- [ ] 个性化推荐接口正常
- [ ] 学习路径规划接口正常
- [ ] 对话总结接口正常
- [ ] 对话分析接口正常
- [ ] 学习会话记录接口正常

### ✅ Web端验证
- [ ] 首页加载正常
- [ ] 智能分析页面正常
- [ ] 学习概览功能正常
- [ ] 个性化推荐功能正常
- [ ] 学习路径规划功能正常
- [ ] 对话总结功能正常
- [ ] 响应式布局正常

### ✅ 小程序验证
- [ ] 项目编译成功
- [ ] 自定义TabBar显示正常
- [ ] 各页面加载正常
- [ ] 样式显示正常
- [ ] 导航功能正常

## 🎨 开发建议

### 代码规范
- **Python**: 遵循 PEP 8 规范
- **JavaScript**: 使用 ESLint + Prettier
- **CSS**: 使用 BEM 命名规范

### 调试技巧
- **后端**: 使用 Flask 的 debug 模式
- **前端**: 使用浏览器开发者工具
- **小程序**: 使用微信开发者工具的调试功能

### 性能优化
- **API响应时间**: 目标 < 500ms
- **页面加载时间**: 目标 < 3s
- **小程序包大小**: 控制在 2MB 以内

## 📚 学习资源

### 技术文档
- **Flask**: https://flask.palletsprojects.com/
- **React**: https://react.dev/
- **Next.js**: https://nextjs.org/docs
- **微信小程序**: https://developers.weixin.qq.com/miniprogram/dev/

### 项目文档
- **API文档**: `backend/API_DOCUMENTATION.md`
- **项目进度**: `PROJECT_PROGRESS_REPORT.md`
- **测试指南**: `backend/test_api.py`

## 🆘 获取帮助

### 问题排查步骤
1. 检查控制台错误信息
2. 查看相关日志文件
3. 参考文档和示例代码
4. 搜索常见问题解决方案

### 联系方式
- 查看项目文档获取详细信息
- 参考 API 文档了解接口使用方法
- 运行测试脚本验证功能状态

---

**祝您使用愉快！** 🎉

如果遇到问题，请先查看本指南和相关文档。大部分常见问题都有对应的解决方案。
