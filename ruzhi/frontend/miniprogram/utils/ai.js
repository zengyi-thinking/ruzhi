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
  }

  /**
   * 初始化AI服务
   */
  async initialize() {
    try {
      // 检查网络状态
      const networkType = await this.checkNetwork()
      console.log('网络状态:', networkType)
      
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('AI服务初始化失败:', error)
      return false
    }
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
      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/chat', {
        character: character,
        message: message,
        history: history,
        settings: {}
      })

      if (response && response.success) {
        return {
          success: true,
          message: response.data.reply,
          character: character,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
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
      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/explain', {
        text: ocrText,
        context: context
      })

      if (response && response.success) {
        return {
          success: true,
          explanation: response.data.explanation,
          originalText: ocrText,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
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
      // 尝试调用后端API
      const response = await this.callBackendAPI('/ai/qa', {
        question: question,
        category: category
      })

      if (response && response.success) {
        return {
          success: true,
          answer: response.data.answer,
          question: question,
          category: category,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
        }
      }

      return this.generateMockAnswer(question, category)

    } catch (error) {
      console.error('知识问答失败:', error)
      return this.generateMockAnswer(question, category)
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
}

// 创建AI服务实例
const aiService = new AIService()

module.exports = {
  aiService,
  AIService,
  SYSTEM_PROMPTS
}
