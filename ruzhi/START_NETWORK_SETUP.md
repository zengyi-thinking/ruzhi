# 儒智小程序网络连接设置指南

## 🚀 第二阶段：网络功能优先开发 - 实施指南

### 快速启动步骤

#### 1. 运行网络设置脚本
```bash
# 进入后端目录
cd ruzhi/backend

# 运行网络设置脚本
python network_setup.py
```

#### 2. 手动启动后端服务（如果自动启动失败）
```bash
# 启动主服务
cd ruzhi/backend
python app.py

# 服务将在以下地址运行：
# 主服务: http://localhost:8000
```

#### 3. 测试网络连接
1. 在微信开发者工具中打开小程序
2. 进入"个人中心" → "网络测试"
3. 点击"重新测试"按钮
4. 查看各项连接状态

### 📋 网络设置脚本功能

`network_setup.py` 脚本将自动完成以下任务：

#### ✅ 环境检查
- 检查Python依赖包是否安装
- 验证必需的模块是否可用
- 检查系统环境配置

#### ✅ API配置
- 设置DeepSeek API密钥
- 配置环境变量
- 测试AI服务连接

#### ✅ 服务启动
- 启动Flask主服务
- 配置CORS跨域支持
- 设置API路由和端点

#### ✅ 连接测试
- 测试基础API连接
- 验证AI服务可用性
- 检查OCR服务状态
- 确认数据库连接

#### ✅ 前端配置
- 生成网络配置文件
- 设置API端点地址
- 配置超时和重试参数

### 🔧 手动配置步骤（如果自动脚本失败）

#### 1. 安装依赖
```bash
pip install flask flask-cors requests python-dotenv openai pillow pytesseract networkx
```

#### 2. 设置环境变量
创建 `ruzhi/backend/.env` 文件：
```env
DEEPSEEK_API_KEY=sk-d624fca8134b4ecc84c178770118ffb8
FLASK_ENV=development
FLASK_DEBUG=1
DATABASE_URL=sqlite:///ruzhi.db
```

#### 3. 启动服务
```bash
cd ruzhi/backend
python app.py
```

#### 4. 验证服务
访问以下URL确认服务正常：
- http://localhost:8000/api/v1/health
- http://localhost:8000/api/v1/info

### 📱 小程序网络测试功能

新增的网络测试页面提供以下功能：

#### 🔗 基础连接测试
- 测试小程序与后端服务的连接
- 检查API响应时间
- 验证服务可用性

#### 🤖 AI服务测试
- 验证DeepSeek API连接
- 测试AI对话功能
- 检查API密钥有效性

#### 📷 OCR服务测试
- 检查图片识别服务状态
- 验证支持的文件格式
- 测试服务响应

#### 🗄️ 数据库测试
- 检查数据库连接状态
- 验证数据存储功能
- 确认数据同步能力

### 🎯 预期结果

完成网络设置后，您应该看到：

#### ✅ 后端服务正常运行
- Flask服务在8000端口启动
- 所有API端点响应正常
- 日志显示服务状态

#### ✅ 小程序连接成功
- 网络测试页面显示绿色状态
- 所有测试项目通过
- 成功率达到100%

#### ✅ AI功能可用
- DeepSeek API连接正常
- AI对话返回真实回复
- OCR识别功能工作

### 🔍 故障排除

#### 问题1：依赖包安装失败
**解决方案**：
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像源
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ flask flask-cors
```

#### 问题2：端口被占用
**解决方案**：
```bash
# 查看端口占用
netstat -ano | findstr :8000

# 杀死占用进程（Windows）
taskkill /PID <进程ID> /F

# 或修改端口配置
# 在 config/settings.py 中修改 PORT 值
```

#### 问题3：API连接失败
**解决方案**：
1. 检查防火墙设置
2. 确认服务器地址正确
3. 验证网络连接
4. 检查CORS配置

#### 问题4：DeepSeek API失败
**解决方案**：
1. 验证API密钥有效性
2. 检查网络连接
3. 确认API额度充足
4. 查看错误日志详情

### 📊 网络设置报告

脚本执行完成后会生成详细报告：
- 保存位置：`ruzhi/backend/network_setup_report.json`
- 包含所有测试结果和状态信息
- 可用于问题诊断和性能分析

### 🎉 下一步

网络连接建立成功后，可以继续进行：

1. **AI功能测试**：验证所有AI功能是否正常工作
2. **数据同步测试**：测试用户数据的云端同步
3. **性能优化**：根据测试结果优化网络性能
4. **功能完善**：继续开发其他缺失功能

---

**🌐 网络连接是小程序正常运行的基础，确保这一步骤完成后再进行后续开发！**
