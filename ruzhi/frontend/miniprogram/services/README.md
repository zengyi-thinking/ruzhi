# 儒智小程序 AI 服务模块

本目录包含儒智小程序的 AI 增强服务模块，提供古文解析、虚拟对话、学习助手、知识图谱和诗文生成等功能。

## 服务模块列表

### 1. 古文今译与解析服务 (classicInterpretService.js)

提供古籍文本的多层次解析功能，包括字词义、句义、篇章义和思想价值等分析。

**主要功能：**

- 分层解析古文（字词义、句义、篇章义、思想价值）
- 获取重点难点词汇解释
- 获取相关典故与思想精华提炼
- 支持离线模式，预置部分常见文本解析

### 2. 虚拟人物对话服务 (virtualDialogueService.js)

提供与历史人物的对话功能，支持情景对话和多种互动模式。

**主要功能：**

- 获取历史人物列表和情景对话场景
- 启动特定情景对话（如"子路问政"）
- 发送用户消息并获取回复
- 获取预设问题建议和历史对话重现
- 支持情景角色扮演和离线回复

### 3. 经典学习助手服务 (learningAssistantService.js)

提供 AI 辅助分析学习难点，生成个性化学习路径和建议。

**主要功能：**

- 分析用户学习难点与情况
- 生成个性化学习路径
- 提供针对性学习建议和资源推荐
- 检测学习进度并动态调整计划
- 生成智能复习提醒

### 4. 知识图谱可视化服务 (knowledgeGraphService.js)

提供儒家概念知识图谱的交互式探索与可视化功能。

**主要功能：**

- 获取知识图谱数据（支持指定中心概念和探索深度）
- 搜索概念和获取概念详情
- 获取概念关系和探索概念间关联路径
- 生成主题概念地图
- 支持离线模式，预置核心概念关系

### 5. 古诗文生成服务 (poetryGenerationService.js)

提供基于用户输入主题创作符合古典风格的诗文。

**主要功能：**

- 生成古诗和古文（多种风格：唐诗、宋词、先秦散文等）
- 获取可用风格列表和风格示例
- 基于已有作品改编和协助创作
- 评价生成作品质量
- 支持离线模式，预置部分主题诗文

## 使用方法

1. **导入服务**

```javascript
// 导入单个服务
const classicInterpretService = require("../../services/classicInterpretService");

// 或导入所有服务
const {
  classicInterpretService,
  virtualDialogueService,
} = require("../../services/index");
```

2. **初始化服务**

所有服务都提供 `init()` 方法用于初始化，建议在页面加载时调用：

```javascript
Page({
  onLoad: function () {
    // 初始化服务
    classicInterpretService.init();
  },
});
```

3. **调用服务方法**

```javascript
// 异步调用示例
async function getClassicInterpretation() {
  const text = "学而时习之，不亦说乎";
  const result = await classicInterpretService.getClassicInterpretation(text);

  if (result.success) {
    // 使用解析结果
    console.log(result.data);
  } else {
    // 处理错误
    console.error(result.error);
  }
}
```

## 特性

1. **在线/离线模式自动切换**

   - 所有服务都支持检测网络状态，在网络不可用时自动降级到离线模式
   - 离线模式提供基础功能和预设数据，确保应用在无网络环境下依然可用

2. **错误处理与降级策略**

   - 服务方法返回统一的结果格式 `{ success, data, error, source }`
   - 内置多级降级策略：API 调用 → 缓存数据 → 离线数据 → 基础功能

3. **缓存策略**
   - 对频繁使用的数据进行缓存，减少 API 调用
   - 支持内存缓存和本地存储两级缓存

## 依赖

这些服务依赖于：

1. 微信小程序基础库
2. 配置文件 `../config/ai.js` 中的 `BASE_URL` 和 API 密钥设置

## 注意事项

1. 使用服务前请确保 DeepSeek API 已正确配置
2. 大多数方法是异步的，请使用 `async/await` 或 Promise 处理
3. 离线模式功能有限，主要用于网络不可用时的降级使用
