/**
 * 虚拟人物对话服务
 * 提供与历史人物的对话功能，支持情景对话和多种互动模式
 */

const app = getApp()
const { BASE_URL } = require('../config/ai')

// 离线数据 - 基础历史人物信息
const OFFLINE_FIGURES = [
  {
    id: 'confucius',
    name: '孔子',
    title: '至圣先师',
    period: '春秋时期',
    intro: '姓孔名丘，字仲尼，鲁国人。儒家学派创始人，著有《论语》。',
    avatar: '/images/characters/confucius.png',
    greeting: '君子坦荡荡，小人长戚戚。吾与点也。'
  },
  {
    id: 'laozi',
    name: '老子',
    title: '太上老君',
    period: '春秋时期',
    intro: '姓李名耳，道家学派创始人，著有《道德经》。',
    avatar: '/images/characters/laozi.png',
    greeting: '道可道，非常道；名可名，非常名。'
  },
  {
    id: 'mencius',
    name: '孟子',
    title: '亚圣',
    period: '战国时期',
    intro: '姓孟名轲，战国时期儒家代表人物，著有《孟子》。',
    avatar: '/images/characters/mencius.png',
    greeting: '仁，人心也；义，人路也。'
  }
]

// 离线场景数据
const OFFLINE_SCENARIOS = {
  'confucius': [
    {
      id: 'zilu_politics',
      title: '子路问政',
      description: '子路向孔子请教治理国家的方法',
      backgroundStory: '《论语·颜渊》中记载，子路问政于孔子。孔子回答："先之，劳之。"子路又问："还有什么？"孔子回答："无倦。"',
      roles: ['子路', '孔子'],
      dialogueTemplate: [
        { role: '子路', content: '请问如何治理国家？' },
        { role: '孔子', content: '先之，劳之。' },
        { role: '子路', content: '还有什么吗？' },
        { role: '孔子', content: '无倦。' }
      ]
    },
    {
      id: 'yan_hui_learning',
      title: '颜回好学',
      description: '孔子赞赏颜回的好学精神',
      backgroundStory: '《论语·雍也》中记载，孔子说："贤哉，回也！一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐。"',
      roles: ['孔子', '颜回'],
      dialogueTemplate: [
        { role: '孔子', content: '贤哉，回也！一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐。' },
        { role: '颜回', content: '夫子教导我以德，使我安贫乐道。' }
      ]
    }
  ],
  'mencius': [
    {
      id: 'king_hui_talk',
      title: '梁惠王对话',
      description: '孟子与梁惠王讨论王道与霸道',
      backgroundStory: '《孟子·梁惠王上》开篇，孟子见梁惠王。王问："叟！不远千里而来，亦将有以利吾国乎？"',
      roles: ['梁惠王', '孟子'],
      dialogueTemplate: [
        { role: '梁惠王', content: '叟！不远千里而来，亦将有以利吾国乎？' },
        { role: '孟子', content: '王何必曰利？亦有仁义而已矣。' }
      ]
    }
  ]
}

// 离线回复数据
const OFFLINE_RESPONSES = {
  'confucius': {
    '你是谁': '吾，孔丘也，字仲尼，鲁国人士。',
    '论语是什么': '《论语》记录了我与弟子及时人的言行，由弟子及再传弟子编纂而成。',
    '什么是仁': '仁者爱人。克己复礼为仁。',
    '怎样才能成为君子': '君子务本，本立而道生。君子学以致其道，修己以安人。',
    '如何看待学习': '学而时习之，不亦说乎。学而不思则罔，思而不学则殆。',
    'fallback': '此事吾需深思，容我想想。'
  },
  'mencius': {
    '你是谁': '吾乃孟轲，尊称亚圣，儒家代表人物。',
    '什么是性善论': '人之初，性本善。人皆有恻隐之心，羞恶之心，恭敬之心，是非之心。',
    '如何教育孩子': '教亦多术，予不谓不教，教者必以正。',
    'fallback': '此问题需细思。'
  },
  'laozi': {
    '你是谁': '老子李耳，道家创始人。',
    '什么是道': '道可道，非常道。道生一，一生二，二生三，三生万物。',
    '如何处世': '上善若水，水善利万物而不争。',
    'fallback': '无为而无不为。'
  }
}

const virtualDialogueService = {
  /**
   * 初始化服务
   */
  init() {
    this.apiKey = wx.getStorageSync('deepseekApiKey') || ''
    this.isOnline = true
    this.sessionCache = {}
  },

  /**
   * 检查网络连接和API配置
   * @returns {Promise<boolean>} 是否在线可用
   */
  async checkConnection() {
    try {
      if (!this.apiKey) {
        console.log('API密钥未配置')
        this.isOnline = false
        return false
      }

      const networkType = await new Promise(resolve => {
        wx.getNetworkType({
          success: res => resolve(res.networkType)
        })
      })

      this.isOnline = networkType !== 'none'
      return this.isOnline
    } catch (error) {
      console.error('检查连接失败:', error)
      this.isOnline = false
      return false
    }
  },

  /**
   * 获取历史人物列表
   * @returns {Promise<Object>} 历史人物列表
   */
  async getHistoricalFigures() {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/historical-figures`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 缓存到本地存储
          wx.setStorageSync('historical_figures', response.figures)
          
          return {
            success: true,
            data: response.figures,
            source: 'online'
          }
        } catch (error) {
          console.error('获取历史人物失败:', error)
          // 尝试从缓存获取
          const cachedFigures = wx.getStorageSync('historical_figures')
          if (cachedFigures && cachedFigures.length > 0) {
            return {
              success: true,
              data: cachedFigures,
              source: 'cache',
              warning: '使用缓存数据'
            }
          }
          // 使用离线数据
          return {
            success: true,
            data: OFFLINE_FIGURES,
            source: 'offline',
            warning: '使用离线数据'
          }
        }
      }
      
      // 离线模式：返回预设数据
      return {
        success: true,
        data: OFFLINE_FIGURES,
        source: 'offline'
      }
    } catch (error) {
      console.error('获取历史人物列表错误:', error)
      return {
        success: false,
        error: error.message || '获取历史人物失败',
        data: OFFLINE_FIGURES
      }
    }
  },

  /**
   * 获取情景对话场景列表
   * @param {string} figureId 历史人物ID
   * @returns {Promise<Object>} 情景列表
   */
  async getScenarios(figureId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/scenarios?figureId=${figureId}`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 缓存到本地存储
          const cacheKey = `scenarios_${figureId}`
          wx.setStorageSync(cacheKey, response.scenarios)
          
          return {
            success: true,
            data: response.scenarios,
            source: 'online'
          }
        } catch (error) {
          console.error('获取情景对话场景失败:', error)
          // 尝试从缓存获取
          const cacheKey = `scenarios_${figureId}`
          const cachedScenarios = wx.getStorageSync(cacheKey)
          if (cachedScenarios && cachedScenarios.length > 0) {
            return {
              success: true,
              data: cachedScenarios,
              source: 'cache',
              warning: '使用缓存数据'
            }
          }
        }
      }
      
      // 离线模式：返回预设数据
      return {
        success: true,
        data: OFFLINE_SCENARIOS[figureId] || [],
        source: 'offline'
      }
    } catch (error) {
      console.error('获取情景对话场景列表错误:', error)
      return {
        success: false,
        error: error.message || '获取情景对话场景失败',
        data: OFFLINE_SCENARIOS[figureId] || []
      }
    }
  },

  /**
   * 启动特定情景对话
   * @param {string} figureId 历史人物ID
   * @param {string} scenarioId 情景ID
   * @returns {Promise<Object>} 对话会话信息
   */
  async startScenarioDialogue(figureId, scenarioId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/start-scenario`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                figureId,
                scenarioId
              },
              header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 缓存会话
          const sessionId = response.sessionId
          this.sessionCache[sessionId] = {
            figureId,
            scenarioId,
            messages: response.initialMessages || []
          }
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('启动情景对话失败:', error)
        }
      }
      
      // 离线模式：构建模拟会话
      const scenarios = OFFLINE_SCENARIOS[figureId] || []
      const scenario = scenarios.find(s => s.id === scenarioId)
      
      if (!scenario) {
        return {
          success: false,
          error: '情景不存在',
          data: null
        }
      }
      
      // 创建模拟会话
      const sessionId = `offline_${figureId}_${scenarioId}_${Date.now()}`
      const initialMessages = [...scenario.dialogueTemplate]
      
      // 缓存会话
      this.sessionCache[sessionId] = {
        figureId,
        scenarioId,
        messages: initialMessages
      }
      
      return {
        success: true,
        data: {
          sessionId,
          figureId,
          scenarioId,
          backgroundStory: scenario.backgroundStory,
          initialMessages
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('启动情景对话错误:', error)
      return {
        success: false,
        error: error.message || '启动情景对话失败',
        data: null
      }
    }
  },

  /**
   * 发送用户消息并获取回复
   * @param {string} sessionId 会话ID
   * @param {string} message 用户消息
   * @returns {Promise<Object>} 回复消息
   */
  async sendMessage(sessionId, message) {
    try {
      // 获取会话信息
      const session = this.sessionCache[sessionId]
      if (!session) {
        return {
          success: false,
          error: '会话不存在或已过期',
          data: null
        }
      }
      
      // 添加用户消息
      session.messages.push({
        role: 'user',
        content: message
      })
      
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/dialogue-message`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                sessionId,
                message
              },
              header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 添加回复消息
          session.messages.push({
            role: 'assistant',
            content: response.reply
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('发送消息失败:', error)
        }
      }
      
      // 离线模式：生成模拟回复
      const { figureId } = session
      const offlineResponses = OFFLINE_RESPONSES[figureId] || {}
      
      // 简单关键词匹配
      let reply = null
      const keywords = Object.keys(offlineResponses).filter(key => key !== 'fallback')
      
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          reply = offlineResponses[keyword]
          break
        }
      }
      
      // 使用默认回复
      if (!reply) {
        reply = offlineResponses.fallback || '离线模式下无法回复该问题。'
      }
      
      // 添加回复消息
      session.messages.push({
        role: 'assistant',
        content: reply
      })
      
      return {
        success: true,
        data: {
          reply,
          sessionId
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('发送消息错误:', error)
      return {
        success: false,
        error: error.message || '发送消息失败',
        data: {
          reply: '系统错误，无法回复。',
          sessionId
        }
      }
    }
  },

  /**
   * 获取预设问题建议
   * @param {string} figureId 历史人物ID
   * @param {Object} context 上下文信息
   * @returns {Promise<Object>} 建议问题列表
   */
  async getSuggestedQuestions(figureId, context = {}) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/suggested-questions`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                figureId,
                context
              },
              header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response.questions,
            source: 'online'
          }
        } catch (error) {
          console.error('获取建议问题失败:', error)
        }
      }
      
      // 离线模式：返回预设问题
      let questions = []
      
      switch (figureId) {
        case 'confucius':
          questions = [
            '请问什么是仁？',
            '如何成为君子？',
            '什么是礼？',
            '如何看待学习？',
            '孔子对教育有什么看法？'
          ]
          break
        case 'mencius':
          questions = [
            '请解释性善论',
            '如何看待王道与霸道？',
            '为什么说民为贵，社稷次之，君为轻？',
            '孟子如何看待仁政？',
            '如何培养浩然之气？'
          ]
          break
        case 'laozi':
          questions = [
            '什么是道？',
            '如何理解"无为而治"？',
            '为什么说"上善若水"？',
            '如何看待"反者道之动"？',
            '老子对于治国有什么建议？'
          ]
          break
        default:
          questions = [
            '你是谁？',
            '你有什么主要思想？',
            '你生活在什么时代？',
            '你的著作有哪些？',
            '你对后世有什么影响？'
          ]
      }
      
      return {
        success: true,
        data: questions,
        source: 'offline'
      }
    } catch (error) {
      console.error('获取预设问题建议错误:', error)
      return {
        success: false,
        error: error.message || '获取预设问题建议失败',
        data: [
          '你是谁？',
          '你的主要思想是什么？',
          '你对后世有什么影响？'
        ]
      }
    }
  },

  /**
   * 情景角色扮演
   * @param {string} scenarioId 情景ID
   * @param {string} userRole 用户角色
   * @returns {Promise<Object>} 对话会话信息
   */
  async roleplayScenario(scenarioId, userRole) {
    // 实现情景角色扮演功能
    // 这个功能类似startScenarioDialogue，但用户将扮演特定角色
    
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/roleplay-scenario`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                scenarioId,
                userRole
              },
              header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 缓存会话
          const sessionId = response.sessionId
          this.sessionCache[sessionId] = {
            scenarioId,
            userRole,
            messages: response.initialMessages || []
          }
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('启动角色扮演失败:', error)
        }
      }
      
      // 离线模式：暂不支持
      return {
        success: false,
        error: '离线模式下暂不支持角色扮演功能',
        data: null
      }
    } catch (error) {
      console.error('情景角色扮演错误:', error)
      return {
        success: false,
        error: error.message || '情景角色扮演失败',
        data: null
      }
    }
  },

  /**
   * 历史对话重现
   * @param {string} dialogueId 历史对话ID
   * @returns {Promise<Object>} 历史对话内容
   */
  async reenactHistoricalDialogue(dialogueId) {
    // 实现历史对话重现功能
    // 根据历史记载重现经典对话
    
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/historical-dialogue/${dialogueId}`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取历史对话失败:', error)
        }
      }
      
      // 离线模式：返回示例对话
      const exampleDialogues = {
        'lunyu_xue_er': {
          title: '《论语·学而》',
          participants: ['孔子', '子贡', '曾子'],
          content: [
            { speaker: '孔子', text: '学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？' },
            { speaker: '子贡', text: '贫而无谄，富而无骄，何如？' },
            { speaker: '孔子', text: '可也。未若贫而乐，富而好礼者也。' },
            { speaker: '子贡', text: '《诗》云："如切如磋，如琢如磨。"其斯之谓与？' },
            { speaker: '孔子', text: '赐也，始可与言《诗》已矣。告诸往而知来者。' }
          ]
        }
      }
      
      return {
        success: true,
        data: exampleDialogues[dialogueId] || { content: [] },
        source: 'offline'
      }
    } catch (error) {
      console.error('历史对话重现错误:', error)
      return {
        success: false,
        error: error.message || '历史对话重现失败',
        data: { content: [] }
      }
    }
  },

  /**
   * 获取离线响应
   * @param {string} figureId 历史人物ID
   * @param {string} message 用户消息
   * @returns {string} 离线响应内容
   */
  getOfflineResponses(figureId, message) {
    const offlineResponses = OFFLINE_RESPONSES[figureId] || {}
    
    // 简单关键词匹配
    for (const keyword of Object.keys(offlineResponses)) {
      if (keyword !== 'fallback' && message.includes(keyword)) {
        return offlineResponses[keyword]
      }
    }
    
    // 返回默认回复
    return offlineResponses.fallback || '无法在离线模式下回答此问题。'
  }
}

module.exports = virtualDialogueService 