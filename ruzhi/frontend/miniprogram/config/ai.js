/**
 * AI服务配置文件
 * 注意：实际部署时需要通过后端代理调用AI API，不能在小程序中直接调用
 */

// AI服务配置
const AI_CONFIG = {
  // 后端API基础URL（需要部署后端服务）
  backendUrl: 'https://your-backend-domain.com/api',
  
  // 本地开发配置
  development: {
    backendUrl: 'http://localhost:3000/api',
    mockEnabled: true, // 开发时启用模拟数据
    timeout: 10000
  },
  
  // 生产环境配置
  production: {
    backendUrl: 'https://your-backend-domain.com/api',
    mockEnabled: false,
    timeout: 30000
  },
  
  // AI模型配置
  models: {
    deepseek: {
      name: 'DeepSeek Chat',
      provider: 'deepseek',
      model: 'deepseek-chat',
      maxTokens: 2000,
      temperature: 0.7,
      available: true
    },
    
    // 备用免费模型配置
    fallback: {
      name: 'Local Mock',
      provider: 'mock',
      model: 'mock-chat',
      maxTokens: 1000,
      temperature: 0.8,
      available: true
    }
  },
  
  // 功能开关
  features: {
    historicalChat: true,      // 历史人物对话
    ocrExplanation: true,      // OCR文本解释
    knowledgeQA: true,         // 知识问答
    typewriterEffect: true,    // 打字机效果
    conversationHistory: true, // 对话历史
    offlineMode: true          // 离线模式
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    maxSize: 100,              // 最大缓存条数
    expireTime: 24 * 60 * 60 * 1000, // 24小时过期
    storageKey: 'ai_cache'
  },
  
  // 错误处理配置
  errorHandling: {
    maxRetries: 2,             // 最大重试次数
    retryDelay: 1000,          // 重试延迟(ms)
    fallbackEnabled: true,     // 启用降级方案
    showErrorDetails: false    // 是否显示详细错误信息
  }
}

// 获取当前环境配置
function getCurrentConfig() {
  // 判断是否为开发环境
  const isDevelopment = typeof __wxConfig !== 'undefined' && __wxConfig.debug
  
  return {
    ...AI_CONFIG,
    ...(isDevelopment ? AI_CONFIG.development : AI_CONFIG.production),
    isDevelopment
  }
}

// 检查功能是否可用
function isFeatureEnabled(featureName) {
  return AI_CONFIG.features[featureName] || false
}

// 获取模型配置
function getModelConfig(modelName = 'deepseek') {
  return AI_CONFIG.models[modelName] || AI_CONFIG.models.fallback
}

module.exports = {
  AI_CONFIG,
  getCurrentConfig,
  isFeatureEnabled,
  getModelConfig
}
