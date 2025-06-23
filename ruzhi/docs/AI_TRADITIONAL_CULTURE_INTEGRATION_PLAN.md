# AI+传统文化创新功能实现计划

## 1. 服务层设计

### 新建服务文件

```
/ruzhi/frontend/miniprogram/services/
  - classicInterpretService.js    // 古文今译与解析服务
  - virtualDialogueService.js     // 虚拟人物对话服务
  - learningAssistantService.js   // 经典学习助手服务
  - knowledgeGraphService.js      // 知识图谱可视化服务
  - poetryGenerationService.js    // 古诗文生成服务
```

## 2. 页面实现

```
/ruzhi/frontend/miniprogram/pages/
  - classics/interpret/          // 古文今译与解析页面
    - interpret.js
    - interpret.wxml
    - interpret.wxss
    - interpret.json
  - dialogue/scenario/          // 情景对话页面
    - scenario.js
    - scenario.wxml
    - scenario.wxss
    - scenario.json
  - learning/assistant/         // 学习助手页面
    - assistant.js
    - assistant.wxml
    - assistant.wxss
    - assistant.json
  - knowledge/visualization/    // 知识图谱可视化页面
    - visualization.js
    - visualization.wxml
    - visualization.wxss
    - visualization.json
  - creation/poetry/           // 古诗文生成页面
    - poetry.js
    - poetry.wxml
    - poetry.wxss
    - poetry.json
```

## 3. 数据模型扩展

```
/ruzhi/frontend/miniprogram/models/
  - classicInterpret.js       // 古籍解析数据模型
  - dialogueScenario.js       // 对话场景数据模型
  - learningPath.js           // 学习路径数据模型
  - knowledgeGraph.js         // 知识图谱数据模型
  - poetryGeneration.js       // 诗文生成数据模型
```

## 4. API 接口扩展

```
/ruzhi/frontend/miniprogram/api/
  - classicAPI.js             // 古籍解析API
  - dialogueAPI.js            // 对话场景API
  - learningAPI.js            // 学习路径API
  - knowledgeGraphAPI.js      // 知识图谱API
  - poetryAPI.js              // 诗文生成API
```

## 5. 实现细节

### 5.1 古文今译与解析服务 (classicInterpretService.js)

```javascript
const classicInterpretService = {
  // 初始化服务
  init() {},

  // 获取古文解析（分词、注释、翻译）
  getClassicInterpretation(text, options = {}) {},

  // 分层解析（字词义、句义、篇章义、思想价值）
  getLayeredAnalysis(text, level) {},

  // 获取重点难点词汇解释
  getKeyTermExplanations(text) {},

  // 获取相关典故
  getRelatedAllusions(text) {},

  // 获取思想精华提炼
  getThoughtEssence(text) {},

  // 离线功能支持
  getOfflineInterpretation(text) {},

  // 错误处理与降级策略
  handleError(error) {},
};
```

### 5.2 虚拟人物对话服务 (virtualDialogueService.js)

```javascript
const virtualDialogueService = {
  // 初始化服务
  init() {},

  // 获取历史人物列表
  getHistoricalFigures() {},

  // 获取情景对话场景列表
  getScenarios(figureId) {},

  // 启动特定情景对话
  startScenarioDialogue(figureId, scenarioId) {},

  // 发送用户消息并获取回复
  sendMessage(sessionId, message) {},

  // 获取预设问题建议
  getSuggestedQuestions(figureId, context) {},

  // 情景角色扮演
  roleplayScenario(scenarioId, userRole) {},

  // 历史对话重现
  reenactHistoricalDialogue(dialogueId) {},

  // 离线功能支持
  getOfflineResponses(figureId, message) {},
};
```

### 5.3 经典学习助手服务 (learningAssistantService.js)

```javascript
const learningAssistantService = {
  // 初始化服务
  init() {},

  // 分析用户学习难点
  analyzeLearningSituation(userId) {},

  // 生成个性化学习路径
  generateLearningPath(userId, topic) {},

  // 提供学习建议
  provideLearningTips(userId, context) {},

  // 获取适合的学习资源
  getSuggestedResources(userId, topic) {},

  // 检测学习进度并调整
  trackProgressAndAdjust(userId, topic) {},

  // 智能复习提醒
  generateReviewSchedule(userId) {},

  // 离线功能支持
  getOfflineRecommendations() {},
};
```

### 5.4 知识图谱可视化服务 (knowledgeGraphService.js)

```javascript
const knowledgeGraphService = {
  // 初始化服务
  init() {},

  // 获取知识图谱数据
  getGraphData(concept = null, depth = 1) {},

  // 搜索概念
  searchConcepts(query) {},

  // 获取概念详情
  getConceptDetails(conceptId) {},

  // 获取概念关系
  getConceptRelations(conceptId) {},

  // 探索关联路径
  exploreConnectionPath(conceptA, conceptB) {},

  // 生成概念地图
  generateConceptMap(topics) {},

  // 离线功能支持
  getOfflineGraphData() {},
};
```

### 5.5 古诗文生成服务 (poetryGenerationService.js)

```javascript
const poetryGenerationService = {
  // 初始化服务
  init() {},

  // 生成古诗
  generatePoetry(theme, style = "tang") {},

  // 生成古文
  generateClassicProse(theme, style = "pre-qin") {},

  // 获取可用风格列表
  getAvailableStyles() {},

  // 获取风格示例
  getStyleExamples(style) {},

  // 基于已有作品改编
  adaptExistingWork(workId, theme) {},

  // 协助创作（提供韵脚、对仗等）
  assistComposition(partialWork) {},

  // 评价生成作品质量
  evaluateGeneration(work) {},

  // 离线功能支持
  getOfflineGeneration(theme) {},
};
```

## 6. 与现有框架集成

### 6.1 app.json 配置更新

将新页面添加到 app.json 的 pages 配置中：

```json
{
  "pages": [
    "pages/classics/interpret/interpret",
    "pages/dialogue/scenario/scenario",
    "pages/learning/assistant/assistant",
    "pages/knowledge/visualization/visualization",
    "pages/creation/poetry/poetry"
  ]
}
```

### 6.2 API 集成 (api/index.js)

扩展 API 接口集合：

```javascript
const classicAPI = require("./classicAPI");
const dialogueAPI = require("./dialogueAPI");
const learningAPI = require("./learningAPI");
const knowledgeGraphAPI = require("./knowledgeGraphAPI");
const poetryAPI = require("./poetryAPI");

module.exports = {
  classicAPI,
  dialogueAPI,
  learningAPI,
  knowledgeGraphAPI,
  poetryAPI,
};
```

### 6.3 服务实例化 (app.js)

在 app.js 中初始化服务：

```javascript
const classicInterpretService = require("./services/classicInterpretService");
const virtualDialogueService = require("./services/virtualDialogueService");
const learningAssistantService = require("./services/learningAssistantService");
const knowledgeGraphService = require("./services/knowledgeGraphService");
const poetryGenerationService = require("./services/poetryGenerationService");

App({
  onLaunch: function () {
    // 初始化各服务
    classicInterpretService.init();
    virtualDialogueService.init();
    learningAssistantService.init();
    knowledgeGraphService.init();
    poetryGenerationService.init();

    // 将服务挂载到全局
    this.globalData.services = {
      classicInterpretService,
      virtualDialogueService,
      learningAssistantService,
      knowledgeGraphService,
      poetryGenerationService,
    };
  },
  globalData: {
    services: {},
  },
});
```

## 7. 导航与入口

### 7.1 首页功能入口 (pages/home/home.wxml)

在首页添加新功能入口：

```html
<view class="feature-grid">
  <!-- 古文今译与解析 -->
  <navigator url="/pages/classics/interpret/interpret" class="feature-item">
    <image src="/images/features/interpret.png" />
    <text>古文今译</text>
  </navigator>

  <!-- 情景对话 -->
  <navigator url="/pages/dialogue/scenario/scenario" class="feature-item">
    <image src="/images/features/scenario.png" />
    <text>情景对话</text>
  </navigator>

  <!-- 更多功能... -->
</view>
```

## 8. 实现步骤

1. **准备阶段**：

   - 创建必要的目录结构
   - 收集和整理数据资源

2. **服务层实现**：

   - 实现基础服务功能
   - 集成 DeepSeek API
   - 添加错误处理和离线功能

3. **UI 层实现**：

   - 设计和实现各功能页面
   - 实现交互效果

4. **集成与测试**：
   - 集成到现有小程序中
   - 功能测试和优化

## 9. 数据准备

为支持这些功能，需要准备以下数据：

1. **扩展历史人物库**：

   - 路径：`/ruzhi/data/characters/historical_figures_extended.json`
   - 添加更多历史人物及其特点、对话风格

2. **对话场景库**：

   - 路径：`/ruzhi/data/dialogues/dialogue_scenarios.json`
   - 定义各种历史场景和对话模板

3. **知识图谱数据**：

   - 路径：`/ruzhi/data/concepts/concept_hierarchy.json`
   - 扩展现有概念关系数据

4. **学习路径模板**：

   - 路径：`/ruzhi/data/learning/learning_paths.json`
   - 预定义的学习路径模板

5. **古诗文风格模板**：
   - 路径：`/ruzhi/data/poetry/style_templates.json`
   - 各朝代文学风格特点和示例
