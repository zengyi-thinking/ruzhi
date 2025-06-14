import axios from 'axios'
import { useUserStore } from '@/stores/user'

// AI服务配置
const AI_CONFIG = {
  baseURL: import.meta.env.VITE_AI_API_URL || '/api/ai',
  timeout: 30000,
  maxRetries: 3
}

// 创建AI服务实例
const aiService = axios.create({
  baseURL: AI_CONFIG.baseURL,
  timeout: AI_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
aiService.interceptors.request.use(
  (config) => {
    const { aiConfig } = useUserStore.getState()
    
    // 添加API密钥
    if (aiConfig.apiKey) {
      config.headers['Authorization'] = `Bearer ${aiConfig.apiKey}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
aiService.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('AI服务请求失败:', error)
    
    // 处理不同类型的错误
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          throw new Error('API密钥无效，请检查配置')
        case 429:
          throw new Error('请求过于频繁，请稍后再试')
        case 500:
          throw new Error('AI服务暂时不可用')
        default:
          throw new Error(data?.message || '请求失败')
      }
    } else if (error.request) {
      throw new Error('网络连接失败，请检查网络')
    } else {
      throw new Error('请求配置错误')
    }
  }
)

// AI服务接口类型定义
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatResponse {
  success: boolean
  message: string
  character: string
  timestamp: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  source: 'ai' | 'mock'
}

export interface OCRExplanation {
  success: boolean
  explanation: string
  originalText: string
  timestamp: string
  usage?: any
  source: 'ai' | 'mock'
}

export interface KnowledgeAnswer {
  success: boolean
  answer: string
  question: string
  category: string
  timestamp: string
  usage?: any
  source: 'ai' | 'mock'
}

export interface SearchResult {
  success: boolean
  results: Array<{
    id: string
    title: string
    content: string
    source: string
    author: string
    relevance: number
  }>
  query: string
  type: string
  timestamp: string
  source: 'ai' | 'mock'
}

// AI服务方法
export class AIServiceClass {
  // 历史人物对话
  async chatWithHistoricalFigure(
    character: string,
    message: string,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    try {
      const { recordAIUsage } = useUserStore.getState()
      
      const response = await aiService.post('/chat', {
        character,
        message,
        history: history.slice(-10) // 只保留最近10条对话
      })
      
      // 记录使用统计
      recordAIUsage()
      
      return {
        success: true,
        message: response.reply,
        character,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        source: 'ai'
      }
    } catch (error) {
      console.error('AI对话失败:', error)
      
      // 降级到模拟回答
      return this.generateMockChatResponse(character, message)
    }
  }

  // OCR文本智能解释
  async explainOCRText(
    ocrText: string,
    context?: string
  ): Promise<OCRExplanation> {
    try {
      const { recordAIUsage } = useUserStore.getState()
      
      const response = await aiService.post('/explain', {
        text: ocrText,
        context
      })
      
      recordAIUsage()
      
      return {
        success: true,
        explanation: response.explanation,
        originalText: ocrText,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        source: 'ai'
      }
    } catch (error) {
      console.error('OCR解释失败:', error)
      
      // 降级到模拟解释
      return this.generateMockExplanation(ocrText)
    }
  }

  // 知识问答
  async answerQuestion(
    question: string,
    category: string = 'general'
  ): Promise<KnowledgeAnswer> {
    try {
      const { recordAIUsage } = useUserStore.getState()
      
      const response = await aiService.post('/qa', {
        question,
        category
      })
      
      recordAIUsage()
      
      return {
        success: true,
        answer: response.answer,
        question,
        category,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        source: 'ai'
      }
    } catch (error) {
      console.error('知识问答失败:', error)
      
      // 降级到模拟回答
      return this.generateMockAnswer(question, category)
    }
  }

  // 智能古籍资料查找
  async searchAncientTexts(
    query: string,
    type: string = 'general'
  ): Promise<SearchResult> {
    try {
      const { recordAIUsage } = useUserStore.getState()
      
      const response = await aiService.post('/search', {
        query,
        type
      })
      
      recordAIUsage()
      
      return {
        success: true,
        results: response.results,
        query,
        type,
        timestamp: new Date().toISOString(),
        source: 'ai'
      }
    } catch (error) {
      console.error('古籍搜索失败:', error)
      
      // 降级到模拟搜索
      return this.generateMockSearchResults(query, type)
    }
  }

  // 测试API连接
  async testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await aiService.post('/test', {}, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '连接测试失败'
      }
    }
  }

  // 生成模拟对话回答
  private generateMockChatResponse(character: string, message: string): ChatResponse {
    const responses = {
      '孔子': [
        '学而时习之，不亦说乎？关于您的问题，我认为...',
        '仁者爱人，智者知人。您提到的问题很有深度...',
        '三人行，必有我师焉。让我们一起探讨这个问题...'
      ],
      '老子': [
        '道可道，非常道。您的问题触及了事物的本质...',
        '无为而治，顺其自然。对于这个问题，我的看法是...',
        '知者不言，言者不知。但我愿意与您分享一些思考...'
      ],
      '孟子': [
        '人之初，性本善。关于您的疑问，我想说...',
        '民为贵，社稷次之，君为轻。您的问题很重要...',
        '富贵不能淫，贫贱不能移。让我来回答您的问题...'
      ]
    }

    const characterResponses = responses[character as keyof typeof responses] || responses['孔子']
    const randomResponse = characterResponses[Math.floor(Math.random() * characterResponses.length)]

    return {
      success: true,
      message: randomResponse,
      character,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
  }

  // 生成模拟解释
  private generateMockExplanation(text: string): OCRExplanation {
    return {
      success: true,
      explanation: `关于"${text}"这段文字，从传统文化的角度来看，它体现了深厚的文化内涵。建议您深入学习相关经典，以获得更准确的理解。`,
      originalText: text,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
  }

  // 生成模拟回答
  private generateMockAnswer(question: string, category: string): KnowledgeAnswer {
    return {
      success: true,
      answer: `关于"${question}"这个问题，涉及到中国传统文化的重要内容。建议您深入学习相关经典，或咨询专业的文化学者以获得更准确的答案。`,
      question,
      category,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
  }

  // 生成模拟搜索结果
  private generateMockSearchResults(query: string, type: string): SearchResult {
    const mockResults = [
      {
        id: '1',
        title: '论语·学而篇',
        content: '子曰："学而时习之，不亦说乎？"',
        source: '论语',
        author: '孔子',
        relevance: 0.95
      },
      {
        id: '2',
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
      query,
      type,
      timestamp: new Date().toISOString(),
      source: 'mock'
    }
  }
}

// 导出AI服务实例
export const aiServiceInstance = new AIServiceClass()
export default aiServiceInstance
