/**
 * AI服务工具模块
 * 集成DeepSeek API和其他免费大模型API
 */

const request = require('./request.js')

// AI服务配置
const AI_CONFIG = {
  // DeepSeek API配置
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '', // 需要在小程序后台配置或使用环境变量
    model: 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7
  },
  
  // 备用免费API配置
  fallback: {
    // 可以配置其他免费API作为备用
    enabled: true,
    providers: ['local', 'mock']
  },
  
  // 请求配置
  timeout: 30000,
  retryCount: 2
}

// 系统提示词配置
const SYSTEM_PROMPTS = {
  // 历史人物对话
  historical_chat: `你是一位博学的中国传统文化学者，能够扮演各种历史人物进行对话。
请根据用户选择的历史人物，以第一人称的方式回答问题，体现该人物的思想、性格和语言风格。
回答要准确、生动，富有教育意义，帮助用户更好地理解传统文化。`,

  // OCR文本解释
  ocr_explanation: `你是一位专业的古籍文献专家，擅长解释古代文字和经典内容。
请对用户提供的古籍文字进行详细解释，包括：
1. 文字的现代汉语翻译
2. 重要词汇的含义解释
3. 文化背景和历史意义
4. 相关的典故或延伸知识
请用通俗易懂的语言，让现代人能够理解古代智慧。`,

  // 知识问答
  knowledge_qa: `你是一位中国传统文化专家，精通儒家、道家、佛家等各种思想流派。
请准确回答用户关于传统文化的问题，提供深入浅出的解释，
并适当引用经典原文，帮助用户更好地理解中华文化的精髓。`
}

/**
 * AI服务类
 */
class AIService {
  constructor() {
    this.config = AI_CONFIG
    this.isInitialized = false
    this.userConfig = null
    this.usageStats = {
      todayCalls: 0,
      monthCalls: 0,
      totalCalls: 0
    }
  }

  /**
   * 初始化AI服务
   */
  async initialize() {
    try {
      // 加载用户配置
      this.loadUserConfig()

      // 检查网络状态
      const networkType = await this.checkNetwork()
      console.log('网络状态:', networkType)

      // 加载使用统计
      this.loadUsageStats()

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('AI服务初始化失败:', error)
      return false
    }
  }

  /**
   * 加载用户配置
   */
  loadUserConfig() {
    try {
      const savedConfig = wx.getStorageSync('ai_config') || {}

      // 解密API密钥
      if (savedConfig.encrypted && savedConfig.apiKey) {
        try {
          const decoded = new TextDecoder().decode(
            wx.base64ToArrayBuffer(savedConfig.apiKey)
          )
          savedConfig.apiKey = decoded
        } catch (error) {
          console.error('解密API密钥失败:', error)
          savedConfig.apiKey = ''
        }
      }

      this.userConfig = {
        apiKey: savedConfig.apiKey || '',
        features: savedConfig.features || {
          historicalChat: true,
          ocrExplanation: true,
          knowledgeQA: true
        },
        connected: savedConfig.connected || false
      }

      console.log('用户AI配置已加载:', {
        hasApiKey: !!this.userConfig.apiKey,
        features: this.userConfig.features
      })
    } catch (error) {
      console.error('加载用户配置失败:', error)
      this.userConfig = {
        apiKey: '',
        features: {
          historicalChat: true,
          ocrExplanation: true,
          knowledgeQA: true
        },
        connected: false
      }
    }
  }

  /**
   * 更新用户配置
   */
  updateConfig(newConfig) {
    try {
      this.userConfig = {
        ...this.userConfig,
        ...newConfig
      }

      console.log('AI服务配置已更新:', {
        hasApiKey: !!this.userConfig.apiKey,
        features: this.userConfig.features
      })
    } catch (error) {
      console.error('更新配置失败:', error)
    }
  }

  /**
   * 加载使用统计
   */
  loadUsageStats() {
    try {
      const stats = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0,
        lastUpdateDate: new Date().toDateString(),
        lastUpdateMonth: new Date().getMonth()
      }

      // 检查是否需要重置统计
      const today = new Date().toDateString()
      const currentMonth = new Date().getMonth()

      if (stats.lastUpdateDate !== today) {
        stats.todayCalls = 0
        stats.lastUpdateDate = today
      }

      if (stats.lastUpdateMonth !== currentMonth) {
        stats.monthCalls = 0
        stats.lastUpdateMonth = currentMonth
      }

      this.usageStats = stats
    } catch (error) {
      console.error('加载使用统计失败:', error)
    }
  }

  /**
   * 更新使用统计
   */
  updateUsageStats() {
    try {
      this.usageStats.todayCalls += 1
      this.usageStats.monthCalls += 1
      this.usageStats.totalCalls += 1

      wx.setStorageSync('ai_usage', this.usageStats)
    } catch (error) {
      console.error('更新使用统计失败:', error)
    }
  }

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(featureName) {
    if (!this.userConfig) return false
    return this.userConfig.features[featureName] || false
  }

  /**
   * 检查是否有有效的API密钥
   */
  hasValidApiKey() {
    return this.userConfig &&
           this.userConfig.apiKey &&
           this.userConfig.apiKey.startsWith('sk-') &&
           this.userConfig.apiKey.length > 20
  }

  /**
   * 检查网络状态
   */
  checkNetwork() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => resolve(res.networkType),
        fail: () => resolve('unknown')
      })
    })
  }

  /**
   * 历史人物对话
   * @param {string} character - 历史人物名称
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   */
  async chatWithHistoricalFigure(character, message, history = []) {
    try {
      // 检查功能是否启用
      if (!this.isFeatureEnabled('historicalChat')) {
        return {
          success: false,
          error: '历史人物对话功能未启用',
          message: '请在设置中启用历史人物对话功能'
        }
      }

      // 检查API密钥
      if (!this.hasValidApiKey()) {
        console.log('无有效API密钥，使用模拟回答')
        return this.generateMockResponse(character, message)
      }

      // 更新使用统计
      this.updateUsageStats()

      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/chat', {
        character: character,
        message: message,
        history: history,
        apiKey: this.userConfig.apiKey,
        settings: {}
      })

      if (response && response.success) {
        return {
          success: true,
          message: response.data.reply,
          character: character,
          timestamp: new Date().toISOString(),
          usage: response.data.usage,
          source: 'ai'
        }
      }

      // 降级到本地模拟回答
      return this.generateMockResponse(character, message)

    } catch (error) {
      console.error('历史人物对话失败:', error)
      return this.generateMockResponse(character, message)
    }
  }

  /**
   * OCR文本智能解释
   * @param {string} ocrText - OCR识别的文字
   * @param {string} context - 上下文信息
   */
  async explainOCRText(ocrText, context = '') {
    try {
      // 检查功能是否启用
      if (!this.isFeatureEnabled('ocrExplanation')) {
        return {
          success: false,
          error: 'OCR智能解释功能未启用',
          explanation: '请在设置中启用OCR智能解释功能'
        }
      }

      // 检查API密钥
      if (!this.hasValidApiKey()) {
        console.log('无有效API密钥，使用模拟解释')
        return this.generateMockExplanation(ocrText)
      }

      // 更新使用统计
      this.updateUsageStats()

      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/explain', {
        text: ocrText,
        context: context,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          explanation: response.data.explanation,
          originalText: ocrText,
          timestamp: new Date().toISOString(),
          usage: response.data.usage,
          source: 'ai'
        }
      }

      // 降级到本地解释
      return this.generateMockExplanation(ocrText)

    } catch (error) {
      console.error('OCR文本解释失败:', error)
      return this.generateMockExplanation(ocrText)
    }
  }

  /**
   * 知识问答
   * @param {string} question - 用户问题
   * @param {string} category - 问题分类
   */
  async answerQuestion(question, category = 'general') {
    try {
      // 检查功能是否启用
      if (!this.isFeatureEnabled('knowledgeQA')) {
        return {
          success: false,
          error: '知识问答功能未启用',
          answer: '请在设置中启用知识问答功能'
        }
      }

      // 检查API密钥
      if (!this.hasValidApiKey()) {
        console.log('无有效API密钥，使用模拟回答')
        return this.generateMockAnswer(question, category)
      }

      // 更新使用统计
      this.updateUsageStats()

      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/qa', {
        question: question,
        category: category,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          answer: response.data.answer,
          question: question,
          category: category,
          timestamp: new Date().toISOString(),
          usage: response.data.usage,
          source: 'ai'
        }
      }

      return this.generateMockAnswer(question, category)

    } catch (error) {
      console.error('知识问答失败:', error)
      return this.generateMockAnswer(question, category)
    }
  }

  /**
   * 智能古籍资料查找
   * @param {string} query - 查询内容
   * @param {string} type - 查找类型 (book, author, concept, quote)
   */
  async searchAncientTexts(query, type = 'general') {
    try {
      if (!this.hasValidApiKey()) {
        return this.generateMockSearchResults(query, type)
      }

      this.updateUsageStats()

      const response = await this.callBackendAPI('/ai/search', {
        query: query,
        type: type,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          results: response.data.results,
          query: query,
          type: type,
          timestamp: new Date().toISOString(),
          source: 'ai'
        }
      }

      return this.generateMockSearchResults(query, type)
    } catch (error) {
      console.error('古籍资料查找失败:', error)
      return this.generateMockSearchResults(query, type)
    }
  }

  /**
   * 文化典籍故事生成
   * @param {string} theme - 主题
   * @param {string} style - 故事风格
   */
  async generateCulturalStory(theme, style = 'traditional') {
    try {
      if (!this.hasValidApiKey()) {
        return this.generateMockStory(theme, style)
      }

      this.updateUsageStats()

      const response = await this.callBackendAPI('/ai/story', {
        theme: theme,
        style: style,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          story: response.data.story,
          theme: theme,
          style: style,
          timestamp: new Date().toISOString(),
          source: 'ai'
        }
      }

      return this.generateMockStory(theme, style)
    } catch (error) {
      console.error('文化故事生成失败:', error)
      return this.generateMockStory(theme, style)
    }
  }

  /**
   * 互动式学习体验
   * @param {string} topic - 学习主题
   * @param {string} level - 学习水平
   * @param {Object} userProgress - 用户进度
   */
  async generateInteractiveLearning(topic, level = 'beginner', userProgress = {}) {
    try {
      if (!this.hasValidApiKey()) {
        return this.generateMockLearningContent(topic, level)
      }

      this.updateUsageStats()

      const response = await this.callBackendAPI('/ai/learning', {
        topic: topic,
        level: level,
        userProgress: userProgress,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          content: response.data.content,
          questions: response.data.questions,
          recommendations: response.data.recommendations,
          topic: topic,
          level: level,
          timestamp: new Date().toISOString(),
          source: 'ai'
        }
      }

      return this.generateMockLearningContent(topic, level)
    } catch (error) {
      console.error('互动学习内容生成失败:', error)
      return this.generateMockLearningContent(topic, level)
    }
  }

  /**
   * 深度文化解析
   * @param {string} text - 待解析文本
   * @param {Array} analysisTypes - 解析类型
   */
  async deepCulturalAnalysis(text, analysisTypes = ['literal', 'cultural', 'philosophical', 'modern']) {
    try {
      if (!this.hasValidApiKey()) {
        return this.generateMockAnalysis(text, analysisTypes)
      }

      this.updateUsageStats()

      const response = await this.callBackendAPI('/ai/analysis', {
        text: text,
        analysisTypes: analysisTypes,
        apiKey: this.userConfig.apiKey
      })

      if (response && response.success) {
        return {
          success: true,
          analysis: response.data.analysis,
          text: text,
          analysisTypes: analysisTypes,
          timestamp: new Date().toISOString(),
          source: 'ai'
        }
      }

      return this.generateMockAnalysis(text, analysisTypes)
    } catch (error) {
      console.error('深度文化解析失败:', error)
      return this.generateMockAnalysis(text, analysisTypes)
    }
  }

  /**
   * 调用后端AI代理API
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   */
  async callBackendAPI(endpoint, data) {
    try {
      // 获取配置
      const { getCurrentConfig } = require('../config/ai.js')
      const config = getCurrentConfig()

      // 构建请求URL
      const url = `${config.backendUrl}${endpoint}`

      // 如果是开发环境且启用了模拟数据，直接返回模拟结果
      if (config.isDevelopment && config.mockEnabled) {
        console.log('使用模拟数据模式')
        return { success: false, error: 'Mock mode enabled' }
      }

      // 调用后端API
      const response = await request.post(url, data, {
        timeout: config.timeout || 30000,
        header: {
          'Content-Type': 'application/json'
        }
      })

      if (response && response.success) {
        return {
          success: true,
          data: response.data
        }
      }

      throw new Error(response?.error || 'API响应错误')

    } catch (error) {
      console.error('后端API调用失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 构建历史人物提示词
   */
  buildCharacterPrompt(character) {
    const characterPrompts = {
      '孔子': `我是孔子，春秋时期的思想家和教育家。我主张"仁"的思想，强调礼制和教育的重要性。我会用温和、睿智的语言回答问题，经常引用《论语》中的话语。`,
      '老子': `我是老子，道家学派的创始人。我主张"道法自然"，追求无为而治的境界。我会用深邃、哲理性的语言回答问题，体现道家的智慧。`,
      '庄子': `我是庄子，道家重要代表人物。我善用寓言故事说理，主张逍遥自在的人生态度。我会用幽默、富有想象力的语言回答问题。`,
      '孟子': `我是孟子，儒家学派的重要代表。我主张"性善论"，强调仁政和民本思想。我会用雄辩、激昂的语言回答问题。`,
      '朱熹': `我是朱熹，宋代理学集大成者。我注重格物致知，强调理学思想。我会用严谨、学者式的语言回答问题。`
    }
    
    return characterPrompts[character] || SYSTEM_PROMPTS.historical_chat
  }

  /**
   * 构建对话消息
   */
  buildChatMessages(systemPrompt, message, history) {
    const messages = [{ role: 'system', content: systemPrompt }]
    
    // 添加历史对话
    history.forEach(item => {
      messages.push({ role: 'user', content: item.user })
      messages.push({ role: 'assistant', content: item.assistant })
    })
    
    // 添加当前消息
    messages.push({ role: 'user', content: message })
    
    return messages
  }

  /**
   * 生成模拟回答（降级方案）
   */
  generateMockResponse(character, message) {
    const mockResponses = {
      '孔子': [
        '学而时习之，不亦说乎？学习需要持之以恒，反复实践。',
        '己所不欲，勿施于人。这是做人的基本道理。',
        '三人行，必有我师焉。每个人都有值得学习的地方。'
      ],
      '老子': [
        '道可道，非常道。真正的道理是难以用言语完全表达的。',
        '无为而无不为。顺应自然规律，反而能成就更多事情。',
        '知者不言，言者不知。真正有智慧的人往往不多言。'
      ],
      '庄子': [
        '天地有大美而不言。自然之美无需言语修饰。',
        '逍遥游于天地之间，这是人生的最高境界。',
        '物我两忘，才能达到真正的自由。'
      ]
    }
    
    const responses = mockResponses[character] || mockResponses['孔子']
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      success: true,
      message: randomResponse,
      character: character,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟解释（降级方案）
   */
  generateMockExplanation(ocrText) {
    return {
      success: true,
      explanation: `这段古文的含义需要结合具体语境来理解。"${ocrText}"体现了中国传统文化的深刻内涵，建议进一步学习相关经典著作以获得更深入的理解。`,
      originalText: ocrText,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟答案（降级方案）
   */
  generateMockAnswer(question, category) {
    return {
      success: true,
      answer: `关于"${question}"这个问题，涉及到中国传统文化的重要内容。建议您深入学习相关经典，或咨询专业的文化学者以获得更准确的答案。`,
      question: question,
      category: category,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟搜索结果
   */
  generateMockSearchResults(query, type) {
    const mockResults = [
      {
        id: 1,
        title: '论语·学而篇',
        content: '子曰："学而时习之，不亦说乎？"',
        source: '论语',
        author: '孔子',
        relevance: 0.95
      },
      {
        id: 2,
        title: '道德经·第一章',
        content: '道可道，非常道。名可名，非常名。',
        source: '道德经',
        author: '老子',
        relevance: 0.88
      }
    ]

    return {
      success: true,
      results: mockResults.filter(item =>
        item.title.includes(query) ||
        item.content.includes(query) ||
        item.author.includes(query)
      ),
      query: query,
      type: type,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟故事
   */
  generateMockStory(theme, style) {
    const stories = {
      '仁': '春秋时期，孔子周游列国，传播仁爱思想。有一次，他看到一个孩子跌倒，立即上前扶起，并教导弟子："仁者爱人，这是做人的根本。"',
      '道': '老子骑青牛西出函谷关，关令尹喜请他留下智慧。老子遂著《道德经》五千言，其中"道法自然"四字，道尽了宇宙万物的根本规律。',
      '义': '孟子曰："生，亦我所欲也；义，亦我所欲也。二者不可得兼，舍生而取义者也。"这体现了古代圣贤对道德品格的坚持。'
    }

    return {
      success: true,
      story: stories[theme] || `关于"${theme}"的故事正在整理中，敬请期待。`,
      theme: theme,
      style: style,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟学习内容
   */
  generateMockLearningContent(topic, level) {
    return {
      success: true,
      content: {
        introduction: `欢迎学习"${topic}"相关内容。这是一个重要的传统文化主题。`,
        keyPoints: [
          '理解基本概念和内涵',
          '掌握历史发展脉络',
          '学习经典文献选段',
          '思考现代应用价值'
        ],
        examples: [
          '经典原文示例',
          '历史故事案例',
          '现代应用实例'
        ]
      },
      questions: [
        {
          id: 1,
          question: `请简述"${topic}"的基本含义？`,
          type: 'text',
          difficulty: level
        },
        {
          id: 2,
          question: `"${topic}"在现代社会有什么意义？`,
          type: 'text',
          difficulty: level
        }
      ],
      recommendations: [
        '建议阅读相关经典原文',
        '可以结合历史背景理解',
        '尝试在生活中实践应用'
      ],
      topic: topic,
      level: level,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }

  /**
   * 生成模拟深度解析
   */
  generateMockAnalysis(text, analysisTypes) {
    const analysis = {}

    if (analysisTypes.includes('literal')) {
      analysis.literal = `"${text}"的字面意思是...（需要AI深度解析）`
    }

    if (analysisTypes.includes('cultural')) {
      analysis.cultural = `从文化角度看，这段文字体现了中国传统文化的...（需要AI深度解析）`
    }

    if (analysisTypes.includes('philosophical')) {
      analysis.philosophical = `从哲学层面分析，这里蕴含着...（需要AI深度解析）`
    }

    if (analysisTypes.includes('modern')) {
      analysis.modern = `在现代社会中，这段话的意义在于...（需要AI深度解析）`
    }

    return {
      success: true,
      analysis: analysis,
      text: text,
      analysisTypes: analysisTypes,
      timestamp: new Date().toISOString(),
      isMock: true
    }
  }
}

// 创建AI服务实例
const aiService = new AIService()

module.exports = {
  aiService,
  AIService,
  SYSTEM_PROMPTS
}
