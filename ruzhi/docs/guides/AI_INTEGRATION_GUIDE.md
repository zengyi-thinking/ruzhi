# 儒智小程序 AI 智能化功能集成指南

## 🎯 功能概述

本次更新为儒智小程序集成了AI智能化功能，包括：

1. **首页跳转修复** - 修复TabBar页面跳转问题
2. **AI历史人物对话** - 与孔子、老子等历史人物智能对话
3. **OCR智能解释** - 对识别的古籍文字提供AI解释
4. **知识问答** - 传统文化相关问题的智能回答

## 🔧 技术架构

### 前端（小程序）
```
pages/
├── home/home.js          # 修复跳转逻辑
├── chat/chat.js          # AI对话功能
├── ocr/ocr.js           # OCR + AI解释
└── ...

utils/
├── ai.js                # AI服务核心模块
└── request.js           # 网络请求工具

config/
└── ai.js                # AI配置文件
```

### 后端（代理服务）
```
backend/
└── ai-proxy-server.js   # Node.js代理服务器
```

## 🚀 部署步骤

### 1. 后端代理服务部署

#### 本地开发环境
```bash
# 1. 进入后端目录
cd ruzhi/backend

# 2. 安装依赖
npm install express cors axios dotenv

# 3. 创建环境变量文件
echo "DEEPSEEK_API_KEY=your_deepseek_api_key_here" > .env
echo "PORT=3000" >> .env

# 4. 启动服务
node ai-proxy-server.js
```

#### 生产环境部署
```bash
# 使用 PM2 部署
npm install -g pm2
pm2 start ai-proxy-server.js --name "ruzhi-ai-proxy"

# 或使用 Docker
docker build -t ruzhi-ai-proxy .
docker run -d -p 3000:3000 --env-file .env ruzhi-ai-proxy
```

### 2. 获取 DeepSeek API 密钥

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册账号并获取 API Key
3. 将 API Key 配置到后端服务的环境变量中

### 3. 小程序配置

#### 修改 AI 配置文件
```javascript
// config/ai.js
const AI_CONFIG = {
  production: {
    backendUrl: 'https://your-domain.com/api', // 替换为你的后端域名
    mockEnabled: false,
    timeout: 30000
  }
}
```

#### 配置服务器域名
在微信小程序后台添加服务器域名：
- request合法域名：`https://your-domain.com`

## 🔑 API 密钥安全

### 重要提醒
- **绝对不要**在小程序代码中直接使用 API 密钥
- **必须**通过后端代理服务调用 AI API
- **建议**使用环境变量管理敏感信息

### 安全最佳实践
```javascript
// ❌ 错误做法 - 直接在小程序中调用
const response = await wx.request({
  url: 'https://api.deepseek.com/v1/chat/completions',
  header: {
    'Authorization': 'Bearer your-api-key' // 危险！
  }
})

// ✅ 正确做法 - 通过后端代理
const response = await request.post('/api/ai/chat', {
  character: '孔子',
  message: '什么是仁？'
})
```

## 📱 功能使用说明

### 1. 首页跳转修复

**问题**：点击功能图标无法跳转到对应页面
**解决**：修复了 `wx.navigateTo` 和 `wx.switchTab` 的使用

```javascript
// 修复前
wx.navigateTo({ url: '/pages/chat/chat' }) // ❌ TabBar页面不能用navigateTo

// 修复后
wx.switchTab({ url: '/pages/chat/chat' })  // ✅ 正确使用switchTab
```

### 2. AI历史人物对话

**功能**：与孔子、老子、孟子等历史人物进行智能对话

**使用方法**：
1. 进入"对话"页面
2. 选择历史人物
3. 输入问题开始对话

**技术实现**：
```javascript
// 调用AI对话服务
const response = await aiService.chatWithHistoricalFigure(
  '孔子',           // 历史人物
  '什么是仁？',      // 用户问题
  conversationHistory // 对话历史
)
```

### 3. OCR智能解释

**功能**：对识别的古籍文字提供AI智能解释

**使用方法**：
1. 进入"识别"页面
2. 拍照或选择图片
3. 系统自动识别文字并提供AI解释

**技术实现**：
```javascript
// OCR识别成功后自动调用AI解释
const explanationResult = await aiService.explainOCRText(result.text)
if (explanationResult.success) {
  // 显示AI解释
  result.aiExplanation = explanationResult.explanation
}
```

### 4. 知识问答

**功能**：回答传统文化相关问题

**使用方法**：
```javascript
const answer = await aiService.answerQuestion(
  '儒家思想的核心是什么？',
  'philosophy'
)
```

## 🔄 降级方案

当AI服务不可用时，系统会自动启用降级方案：

### 1. 模拟回答
```javascript
// 历史人物对话降级
generateMockResponse(character, message) {
  const responses = {
    '孔子': ['学而时习之，不亦说乎？', '己所不欲，勿施于人。'],
    '老子': ['道可道，非常道。', '无为而无不为。']
  }
  return responses[character][Math.floor(Math.random() * responses[character].length)]
}
```

### 2. 本地缓存
- 缓存常见问题的回答
- 离线模式下使用本地数据
- 网络恢复后同步最新内容

## 🧪 测试验证

### 1. 功能测试清单

#### 首页跳转测试
- [ ] 点击"古籍识别"图标跳转到OCR页面
- [ ] 点击"人物对话"图标跳转到聊天页面
- [ ] 点击"知识图谱"图标跳转到知识页面
- [ ] 点击"我的"图标跳转到个人中心

#### AI对话测试
- [ ] 选择历史人物（孔子、老子等）
- [ ] 发送消息并接收AI回复
- [ ] 测试打字机效果
- [ ] 测试对话历史保存

#### OCR智能解释测试
- [ ] 上传古籍图片
- [ ] 验证OCR识别结果
- [ ] 检查AI解释内容
- [ ] 测试结果页面显示

### 2. 性能测试
- [ ] AI响应时间 < 10秒
- [ ] 降级方案响应时间 < 2秒
- [ ] 内存使用正常
- [ ] 网络异常处理正确

### 3. 兼容性测试
- [ ] iOS 微信小程序
- [ ] Android 微信小程序
- [ ] 不同网络环境
- [ ] API服务异常情况

## 🐛 常见问题

### 1. AI服务无响应
**原因**：后端服务未启动或API密钥错误
**解决**：
```bash
# 检查后端服务状态
curl http://localhost:3000/api/health

# 检查API密钥配置
echo $DEEPSEEK_API_KEY
```

### 2. 跳转失败
**原因**：使用了错误的跳转方法
**解决**：TabBar页面使用 `wx.switchTab`，普通页面使用 `wx.navigateTo`

### 3. OCR解释不显示
**原因**：AI服务调用失败
**解决**：检查网络连接和后端服务状态

### 4. 对话历史丢失
**原因**：本地存储失败
**解决**：检查存储权限和容量

## 📊 监控和日志

### 1. 关键指标
- AI API调用成功率
- 平均响应时间
- 用户活跃度
- 功能使用频率

### 2. 日志记录
```javascript
// 记录AI服务调用
console.log('AI服务调用:', {
  function: 'chatWithHistoricalFigure',
  character: character,
  success: response.success,
  responseTime: Date.now() - startTime
})
```

## 🔮 后续优化

### 1. 功能增强
- [ ] 支持更多历史人物
- [ ] 增加语音对话功能
- [ ] 优化AI回答质量
- [ ] 添加个性化推荐

### 2. 性能优化
- [ ] 实现请求缓存
- [ ] 优化网络请求
- [ ] 减少包体积
- [ ] 提升加载速度

### 3. 用户体验
- [ ] 优化界面设计
- [ ] 增加动画效果
- [ ] 完善错误提示
- [ ] 添加使用引导

---

## 📞 技术支持

如有问题，请检查：
1. 后端服务是否正常运行
2. API密钥是否正确配置
3. 网络连接是否正常
4. 小程序域名是否已配置

**部署完成后，儒智小程序将具备完整的AI智能化功能！** 🎉
