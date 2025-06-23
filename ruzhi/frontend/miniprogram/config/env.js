/**
 * 环境配置文件
 * 解决API域名硬编码问题
 */

// 获取当前环境
const getEnv = () => {
  const accountInfo = wx.getAccountInfoSync();
  const envVersion = accountInfo.miniProgram.envVersion;
  
  switch (envVersion) {
    case 'develop':
      return 'development';
    case 'trial':
      return 'staging';
    case 'release':
      return 'production';
    default:
      return 'development';
  }
};

// 环境配置
const envConfig = {
  development: {
    API_BASE_URL: 'http://localhost:8002',
    AI_API_URL: 'http://localhost:8003',
    OCR_API_URL: 'http://localhost:8001',
    WS_URL: 'ws://localhost:8002/ws',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  staging: {
    API_BASE_URL: 'https://api-staging.ruzhi.app',
    AI_API_URL: 'https://ai-staging.ruzhi.app',
    OCR_API_URL: 'https://ocr-staging.ruzhi.app',
    WS_URL: 'wss://api-staging.ruzhi.app/ws',
    DEBUG: true,
    LOG_LEVEL: 'info'
  },
  production: {
    API_BASE_URL: 'https://api.ruzhi.app',
    AI_API_URL: 'https://ai.ruzhi.app',
    OCR_API_URL: 'https://ocr.ruzhi.app',
    WS_URL: 'wss://api.ruzhi.app/ws',
    DEBUG: false,
    LOG_LEVEL: 'error'
  }
};

// 当前环境
const currentEnv = getEnv();

// 导出配置
const config = {
  ...envConfig[currentEnv],
  ENV: currentEnv,
  VERSION: '1.0.0',
  
  // API超时配置
  TIMEOUT: {
    DEFAULT: 10000,
    UPLOAD: 30000,
    AI_CHAT: 60000
  },
  
  // 缓存配置
  CACHE: {
    USER_INFO: 'user_info',
    CHAT_HISTORY: 'chat_history',
    LEARNING_PROGRESS: 'learning_progress',
    APP_CONFIG: 'app_config'
  },
  
  // 页面配置
  PAGES: {
    HOME: '/pages/home/home',
    CHAT: '/pages/chat/chat',
    LEARNING: '/pages/learning/learning',
    PROFILE: '/pages/profile/profile',
    OCR: '/pages/ocr/ocr',
    KNOWLEDGE: '/pages/knowledge/knowledge'
  },
  
  // 错误码配置
  ERROR_CODES: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_FAILED: 'AUTH_FAILED',
    API_ERROR: 'API_ERROR',
    PERMISSION_DENIED: 'PERMISSION_DENIED'
  }
};

// 日志工具
const logger = {
  debug: (...args) => {
    if (config.DEBUG && config.LOG_LEVEL === 'debug') {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    if (config.DEBUG && ['debug', 'info'].includes(config.LOG_LEVEL)) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (config.DEBUG && ['debug', 'info', 'warn'].includes(config.LOG_LEVEL)) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

module.exports = {
  config,
  logger
};
