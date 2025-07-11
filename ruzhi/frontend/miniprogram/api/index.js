// API接口封装
const { request } = require('../utils/request')

// OCR相关API
const ocrAPI = {
  // 获取OCR模式列表
  getModes() {
    return request.get('/api/v1/ocr/modes')
  },

  // OCR识别
  analyze(filePath, options = {}) {
    const formData = {
      mode: options.mode || 'ancient',
      enhance_image: options.enhance_image || true,
      enhance_options: JSON.stringify(options.enhance_options || {}),
      detect_layout: options.detect_layout || true,
      recognize_variants: options.recognize_variants || true
    }

    return request.upload('/api/v1/ocr/analyze', filePath, {
      name: 'file',
      formData,
      loadingText: '识别中...'
    })
  },

  // 获取OCR历史记录
  getHistory(userId) {
    return request.get(`/api/v1/ocr/history/${userId}`)
  },

  // 保存OCR结果
  saveResult(data) {
    return request.post('/api/v1/ocr/save', data)
  }
}

// AI对话相关API
const chatAPI = {
  // 获取历史人物列表
  getCharacters() {
    return request.get('/api/v1/chat/characters')
  },

  // 发送对话消息
  sendMessage(data) {
    return request.post('/api/v1/chat/send', data, {
      loadingText: '思考中...'
    })
  },

  // 获取对话历史列表
  getConversationHistory(userId) {
    return request.get(`/api/v1/chat/conversations/${userId}`)
  },

  // 获取与特定人物的对话历史
  getCharacterHistory(userId, characterId) {
    return request.get(`/api/v1/chat/character-history/${userId}/${characterId}`)
  },

  // 保存对话记录
  saveConversation(data) {
    return request.post('/api/v1/chat/save', data)
  },

  // 删除对话记录
  deleteConversation(conversationId) {
    return request.delete(`/api/v1/chat/delete/${conversationId}`)
  }
}

// 知识图谱相关API
const knowledgeAPI = {
  // 搜索概念
  searchConcepts(query) {
    return request.post('/api/v1/knowledge/search', { query })
  },

  // 获取概念详情
  getConceptDetail(conceptId) {
    return request.get(`/api/v1/knowledge/concept/${conceptId}`)
  },

  // 获取概念关系
  getConceptRelations(conceptId) {
    return request.get(`/api/v1/knowledge/concept/${conceptId}/relations`)
  },

  // 获取知识图谱数据
  getGraphData(params = {}) {
    return request.get('/api/v1/knowledge/graph', params)
  }
}

// 经典文献相关API
const classicsAPI = {
  // 获取经典列表
  getClassicsList() {
    return request.get('/api/v1/classics/list')
  },

  // 获取经典详情
  getClassicDetail(classicId) {
    return request.get(`/api/v1/classics/${classicId}`)
  },

  // 获取章节内容
  getChapterContent(classicId, chapterId) {
    return request.get(`/api/v1/classics/${classicId}/chapters/${chapterId}`)
  },

  // 搜索经典内容
  searchClassics(query) {
    return request.post('/api/v1/classics/search', { query })
  },

  // 获取用户阅读进度
  getReadingProgress(userId) {
    return request.get(`/api/v1/classics/progress/${userId}`)
  },

  // 保存阅读进度
  saveReadingProgress(data) {
    return request.post('/api/v1/classics/progress', data)
  }
}

// 用户相关API
const userAPI = {
  // 用户登录
  login(data) {
    return request.post('/api/v1/user/login', data)
  },

  // 获取用户信息
  getUserInfo(userId) {
    return request.get(`/api/v1/user/${userId}`)
  },

  // 更新用户信息
  updateUserInfo(userId, data) {
    return request.put(`/api/v1/user/${userId}`, data)
  },

  // 获取用户收藏
  getFavorites(userId) {
    return request.get(`/api/v1/user/${userId}/favorites`)
  },

  // 添加收藏
  addFavorite(userId, data) {
    return request.post(`/api/v1/user/${userId}/favorites`, data)
  },

  // 删除收藏
  removeFavorite(userId, favoriteId) {
    return request.delete(`/api/v1/user/${userId}/favorites/${favoriteId}`)
  },

  // 获取学习统计
  getStudyStats(userId) {
    return request.get(`/api/v1/user/${userId}/stats`)
  },

  // 获取用户学习历史
  getLearningHistory(userId) {
    return request.get(`/api/v1/user/${userId}/learning-history`)
  },

  // 获取AI分析结果
  getAIAnalysis(userId, data) {
    return request.post(`/api/v1/user/${userId}/ai-analysis`, data)
  },

  // 获取个性化推荐
  getRecommendations(userId) {
    return request.get(`/api/v1/user/${userId}/recommendations`)
  },

  // 获取学习路径
  getLearningPaths(userId) {
    return request.get(`/api/v1/user/${userId}/learning-paths`)
  },

  // 记录学习会话
  recordSession(userId, data) {
    return request.post(`/api/v1/user/${userId}/learning-session`, data)
  },

  // 获取用户资料
  getUserProfile(userId) {
    return request.get(`/api/v1/auth/profile/${userId}`)
  },

  // 更新用户资料
  updateUserProfile(userId, data) {
    return request.put(`/api/v1/auth/profile/${userId}`, data)
  }
}

// 学习中心相关API
const learningAPI = {
  // 获取学习统计
  getStudyStats(userId) {
    return request.get(`/api/v1/learning/stats/${userId}`)
  },

  // 获取学习进度
  getProgressData(userId) {
    return request.get(`/api/v1/learning/progress/${userId}`)
  },

  // 获取今日计划
  getTodayPlans(userId, date) {
    return request.get(`/api/v1/learning/plans/${userId}/${date}`)
  },

  // 获取用户成就
  getAchievements(userId) {
    return request.get(`/api/v1/learning/achievements/${userId}`)
  },

  // 创建学习计划
  createPlan(planData) {
    return request.post('/api/v1/learning/plans', planData)
  },

  // 更新计划状态
  updatePlanStatus(userId, planId, completed) {
    return request.put(`/api/v1/learning/plans/${userId}/${planId}/status`, {
      completed: completed
    })
  },

  // 获取某日学习记录
  getDayStudyRecords(userId, date) {
    return request.get(`/api/v1/learning/records/${userId}/${date}`)
  },

  // 获取统计数据
  getStatsData(userId, type) {
    return request.get(`/api/v1/learning/stats/${userId}?type=${type}`)
  }
}

// 用户认证相关API
const authAPI = {
  // 用户注册
  register(userData) {
    return request.post('/api/v1/auth/register', userData)
  },

  // 用户登录
  login(credentials) {
    return request.post('/api/v1/auth/login', credentials)
  },

  // 验证令牌
  verifyToken(token) {
    return request.post('/api/v1/auth/verify', { token })
  },

  // 获取用户资料
  getUserProfile(userId) {
    return request.get(`/api/v1/auth/profile/${userId}`)
  },

  // 更新用户资料
  updateUserProfile(userId, data) {
    return request.put(`/api/v1/auth/profile/${userId}`, data)
  }
}

// 系统相关API
const systemAPI = {
  // 健康检查
  healthCheck() {
    return request.get('/health')
  },

  // 获取系统配置
  getConfig() {
    return request.get('/api/v1/system/config')
  },

  // 错误上报
  reportError(data) {
    return request.post('/api/v1/system/error-report', data, {
      showLoading: false,
      showError: false
    })
  },

  // 用户反馈
  submitFeedback(data) {
    return request.post('/api/v1/system/feedback', data)
  }
}

// 导出所有API
module.exports = {
  ocrAPI,
  chatAPI,
  knowledgeAPI,
  classicsAPI,
  userAPI,
  learningAPI,
  authAPI,
  systemAPI
}
