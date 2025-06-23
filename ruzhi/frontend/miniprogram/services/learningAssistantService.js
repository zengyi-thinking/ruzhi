/**
 * 经典学习助手服务
 * 提供AI辅助分析学习难点，生成个性化学习路径和建议
 */

const app = getApp()
const { BASE_URL } = require('../config/ai')

// 离线数据 - 学习路径模板
const OFFLINE_LEARNING_PATHS = {
  'beginners': [
    {
      id: 'path_1',
      title: '儒家思想入门',
      description: '适合初学者的儒家思想入门学习路径',
      duration: '4周',
      difficulty: '初级',
      steps: [
        {
          title: '《论语》导读',
          duration: '1周',
          resources: [
            { type: 'reading', title: '《论语》学而篇、为政篇', difficulty: '基础' },
            { type: 'video', title: '论语核心思想解读', duration: '30分钟' }
          ],
          exercises: [
            { type: 'quiz', title: '论语基础知识测验', questionCount: 10 }
          ],
          completion: 0
        },
        {
          title: '儒家核心概念',
          duration: '1周',
          resources: [
            { type: 'reading', title: '仁、义、礼、智、信基础解读', difficulty: '基础' },
            { type: 'audio', title: '儒家核心价值观解析', duration: '45分钟' }
          ],
          exercises: [
            { type: 'reflection', title: '儒家思想在现代生活中的应用', wordCount: 500 }
          ],
          completion: 0
        },
        {
          title: '孔子生平及影响',
          duration: '1周',
          resources: [
            { type: 'reading', title: '孔子的生平与思想发展', difficulty: '基础' },
            { type: 'video', title: '孔子的教育思想', duration: '40分钟' }
          ],
          exercises: [
            { type: 'discussion', title: '孔子思想对中国文化的影响', topicCount: 3 }
          ],
          completion: 0
        },
        {
          title: '儒家与现代社会',
          duration: '1周',
          resources: [
            { type: 'reading', title: '儒家思想的现代意义', difficulty: '中级' },
            { type: 'case', title: '现代企业中的儒家管理思想案例', count: 2 }
          ],
          exercises: [
            { type: 'project', title: '设计一个融合儒家思想的现代解决方案', difficulty: '中级' }
          ],
          completion: 0
        }
      ]
    }
  ],
  'intermediate': [
    {
      id: 'path_2',
      title: '儒家经典深读',
      description: '深入学习儒家经典著作的进阶学习路径',
      duration: '8周',
      difficulty: '中级',
      steps: [
        {
          title: '《论语》精读',
          duration: '2周',
          resources: [
            { type: 'reading', title: '《论语》全文精读', difficulty: '中级' },
            { type: 'audio', title: '论语注疏讲解', duration: '3小时' }
          ],
          exercises: [
            { type: 'essay', title: '论语中的教育思想分析', wordCount: 1500 }
          ],
          completion: 0
        },
        {
          title: '《孟子》研习',
          duration: '2周',
          resources: [
            { type: 'reading', title: '《孟子》选读', difficulty: '中级' },
            { type: 'video', title: '孟子性善论详解', duration: '50分钟' }
          ],
          exercises: [
            { type: 'debate', title: '性善论与性恶论的现代意义', format: '团队辩论' }
          ],
          completion: 0
        },
        {
          title: '《大学》《中庸》研读',
          duration: '2周',
          resources: [
            { type: 'reading', title: '《大学》《中庸》全文', difficulty: '中级' },
            { type: 'lecture', title: '大学与中庸的思想体系', duration: '60分钟' }
          ],
          exercises: [
            { type: 'presentation', title: '中庸之道的现代应用', duration: '15分钟' }
          ],
          completion: 0
        },
        {
          title: '儒家思想流变',
          duration: '2周',
          resources: [
            { type: 'reading', title: '先秦儒学到宋明理学', difficulty: '高级' },
            { type: 'case', title: '儒家思想在不同历史时期的发展', count: 4 }
          ],
          exercises: [
            { type: 'research', title: '儒家思想的当代转化与创新', wordCount: 2000 }
          ],
          completion: 0
        }
      ]
    }
  ]
}

// 离线学习建议
const OFFLINE_LEARNING_TIPS = {
  'vocabulary': [
    '建议使用古汉语字典辅助理解难解字词',
    '可尝试将难解字词制作成卡片，随时复习',
    '结合字源学理解汉字的本义，有助于深入理解',
    '推荐使用《说文解字》等工具书了解字词本源'
  ],
  'grammar': [
    '注意古代汉语的语序与现代汉语的差异',
    '掌握常见虚词（如"之"、"乎"、"者"等）的用法',
    '注意古汉语中省略主语的现象',
    '学习判断古汉语中词性活用的情况'
  ],
  'context': [
    '了解相关历史背景有助于理解文本含义',
    '把握作者生平和思想背景对理解文本很重要',
    '可以参考权威注疏帮助理解语境',
    '学习时代背景和社会环境有助于理解作品意图'
  ],
  'philosophy': [
    '多角度思考儒家概念的内涵和外延',
    '将抽象概念与具体例子结合起来理解',
    '尝试将古代思想与现代问题联系起来',
    '比较不同思想流派对同一问题的不同见解'
  ]
}

// 离线推荐资源
const OFFLINE_RESOURCES = {
  'beginners': [
    { id: 'res_1', title: '《论语》导读', type: 'book', difficulty: '初级', rating: 4.8 },
    { id: 'res_2', title: '儒家思想十讲', type: 'video', difficulty: '初级', rating: 4.7 },
    { id: 'res_3', title: '孔子的智慧', type: 'audio', difficulty: '初级', rating: 4.5 }
  ],
  'intermediate': [
    { id: 'res_4', title: '四书章句集注', type: 'book', difficulty: '中级', rating: 4.9 },
    { id: 'res_5', title: '儒家经典解读系列', type: 'course', difficulty: '中级', rating: 4.6 },
    { id: 'res_6', title: '孟子思想研究', type: 'book', difficulty: '中级', rating: 4.7 }
  ],
  'advanced': [
    { id: 'res_7', title: '宋明理学史', type: 'book', difficulty: '高级', rating: 4.8 },
    { id: 'res_8', title: '当代新儒学研究', type: 'paper', difficulty: '高级', rating: 4.7 },
    { id: 'res_9', title: '儒家伦理与现代社会', type: 'thesis', difficulty: '高级', rating: 4.9 }
  ]
}

const learningAssistantService = {
  /**
   * 初始化服务
   */
  init() {
    this.apiKey = wx.getStorageSync('deepseekApiKey') || ''
    this.isOnline = true
    this.userPreferences = wx.getStorageSync('learning_preferences') || {
      level: 'beginners',
      interests: [],
      strengths: [],
      weaknesses: []
    }
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
   * 分析用户学习难点
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 学习难点分析结果
   */
  async analyzeLearningSituation(userId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/learning-analysis`
        
        try {
          // 获取用户学习数据
          const userLearningData = await this.getUserLearningData(userId)
          
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
                learningData: userLearningData
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
          
          // 存储分析结果
          wx.setStorageSync('learning_analysis_' + userId, response)
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('分析学习难点失败:', error)
          // 尝试从缓存获取
          const cachedAnalysis = wx.getStorageSync('learning_analysis_' + userId)
          if (cachedAnalysis) {
            return {
              success: true,
              data: cachedAnalysis,
              source: 'cache',
              warning: '使用缓存数据'
            }
          }
        }
      }
      
      // 离线模式：生成模拟分析
      const mockAnalysis = {
        strengths: ['理解儒家基本概念', '古文阅读基础扎实'],
        weaknesses: ['理解古代文化背景', '把握深层思想内涵'],
        recommendations: {
          focus: ['加强历史背景学习', '多做深度思想分析练习'],
          resources: OFFLINE_RESOURCES.beginners.slice(0, 2)
        }
      }
      
      return {
        success: true,
        data: mockAnalysis,
        source: 'offline'
      }
    } catch (error) {
      console.error('分析学习难点错误:', error)
      return {
        success: false,
        error: error.message || '分析学习难点失败',
        data: {
          strengths: [],
          weaknesses: [],
          recommendations: { focus: [], resources: [] }
        }
      }
    }
  },

  /**
   * 获取用户学习数据
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 用户学习数据
   */
  async getUserLearningData(userId) {
    // 从本地缓存或服务器获取用户学习数据
    const cachedData = wx.getStorageSync('user_learning_data_' + userId)
    
    if (cachedData) {
      return cachedData
    }
    
    // 如果没有缓存数据，返回空数据结构
    return {
      completedCourses: [],
      quizResults: [],
      readingHistory: [],
      learningTime: {},
      preferences: this.userPreferences
    }
  },

  /**
   * 生成个性化学习路径
   * @param {string} userId 用户ID
   * @param {string} topic 学习主题
   * @returns {Promise<Object>} 学习路径
   */
  async generateLearningPath(userId, topic) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/learning-path`
        
        try {
          // 获取用户学习数据
          const userLearningData = await this.getUserLearningData(userId)
          
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
                topic,
                learningData: userLearningData
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
          
          // 存储生成的路径
          const pathKey = `learning_path_${userId}_${topic}`
          wx.setStorageSync(pathKey, response)
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('生成学习路径失败:', error)
          // 尝试从缓存获取
          const pathKey = `learning_path_${userId}_${topic}`
          const cachedPath = wx.getStorageSync(pathKey)
          if (cachedPath) {
            return {
              success: true,
              data: cachedPath,
              source: 'cache',
              warning: '使用缓存数据'
            }
          }
        }
      }
      
      // 离线模式：返回预设路径
      let offlinePath
      
      if (this.userPreferences.level === 'beginners') {
        offlinePath = OFFLINE_LEARNING_PATHS.beginners[0]
      } else {
        offlinePath = OFFLINE_LEARNING_PATHS.intermediate[0]
      }
      
      return {
        success: true,
        data: offlinePath,
        source: 'offline'
      }
    } catch (error) {
      console.error('生成学习路径错误:', error)
      return {
        success: false,
        error: error.message || '生成学习路径失败',
        data: OFFLINE_LEARNING_PATHS.beginners[0]
      }
    }
  },

  /**
   * 提供学习建议
   * @param {string} userId 用户ID
   * @param {Object} context 上下文信息
   * @returns {Promise<Object>} 学习建议
   */
  async provideLearningTips(userId, context) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/learning-tips`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
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
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取学习建议失败:', error)
        }
      }
      
      // 离线模式：返回预设建议
      let tips = []
      
      if (context.difficulty === 'vocabulary') {
        tips = OFFLINE_LEARNING_TIPS.vocabulary
      } else if (context.difficulty === 'grammar') {
        tips = OFFLINE_LEARNING_TIPS.grammar
      } else if (context.difficulty === 'context') {
        tips = OFFLINE_LEARNING_TIPS.context
      } else if (context.difficulty === 'philosophy') {
        tips = OFFLINE_LEARNING_TIPS.philosophy
      } else {
        // 随机选择一些建议
        const allTips = [
          ...OFFLINE_LEARNING_TIPS.vocabulary,
          ...OFFLINE_LEARNING_TIPS.grammar,
          ...OFFLINE_LEARNING_TIPS.context,
          ...OFFLINE_LEARNING_TIPS.philosophy
        ]
        
        // 随机选择3条建议
        tips = allTips.sort(() => 0.5 - Math.random()).slice(0, 3)
      }
      
      return {
        success: true,
        data: { tips },
        source: 'offline'
      }
    } catch (error) {
      console.error('提供学习建议错误:', error)
      return {
        success: false,
        error: error.message || '提供学习建议失败',
        data: { tips: ['尝试使用词典辅助阅读', '多积累古文常用字词', '理解文化背景很重要'] }
      }
    }
  },

  /**
   * 获取适合的学习资源
   * @param {string} userId 用户ID
   * @param {string} topic 学习主题
   * @returns {Promise<Object>} 推荐的学习资源
   */
  async getSuggestedResources(userId, topic) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/recommended-resources`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
                topic
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
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取推荐资源失败:', error)
        }
      }
      
      // 离线模式：返回预设资源
      let resources
      
      if (this.userPreferences.level === 'beginners') {
        resources = OFFLINE_RESOURCES.beginners
      } else if (this.userPreferences.level === 'intermediate') {
        resources = OFFLINE_RESOURCES.intermediate
      } else {
        resources = OFFLINE_RESOURCES.advanced
      }
      
      return {
        success: true,
        data: { resources },
        source: 'offline'
      }
    } catch (error) {
      console.error('获取推荐资源错误:', error)
      return {
        success: false,
        error: error.message || '获取推荐资源失败',
        data: { resources: OFFLINE_RESOURCES.beginners }
      }
    }
  },

  /**
   * 检测学习进度并调整
   * @param {string} userId 用户ID
   * @param {string} topic 学习主题
   * @returns {Promise<Object>} 调整后的学习计划
   */
  async trackProgressAndAdjust(userId, topic) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/adjust-learning-plan`
        
        try {
          // 获取用户学习数据和当前学习路径
          const userLearningData = await this.getUserLearningData(userId)
          const pathKey = `learning_path_${userId}_${topic}`
          const currentPath = wx.getStorageSync(pathKey)
          
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
                topic,
                learningData: userLearningData,
                currentPath
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
          
          // 更新学习路径
          wx.setStorageSync(pathKey, response.adjustedPath)
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('调整学习计划失败:', error)
        }
      }
      
      // 离线模式：无法智能调整，返回当前路径
      const pathKey = `learning_path_${userId}_${topic}`
      let currentPath = wx.getStorageSync(pathKey)
      
      // 如果没有缓存的路径，使用默认路径
      if (!currentPath) {
        if (this.userPreferences.level === 'beginners') {
          currentPath = OFFLINE_LEARNING_PATHS.beginners[0]
        } else {
          currentPath = OFFLINE_LEARNING_PATHS.intermediate[0]
        }
      }
      
      return {
        success: true,
        data: {
          adjustedPath: currentPath,
          adjustmentReason: '离线模式下无法智能调整学习计划',
          recommendations: []
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('检测学习进度并调整错误:', error)
      return {
        success: false,
        error: error.message || '检测学习进度并调整失败',
        data: {
          adjustedPath: null,
          adjustmentReason: '服务出错',
          recommendations: []
        }
      }
    }
  },

  /**
   * 智能复习提醒
   * @param {string} userId 用户ID
   * @returns {Promise<Object>} 复习计划
   */
  async generateReviewSchedule(userId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/review-schedule`
        
        try {
          // 获取用户学习数据
          const userLearningData = await this.getUserLearningData(userId)
          
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                userId,
                learningData: userLearningData
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
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('生成复习计划失败:', error)
        }
      }
      
      // 离线模式：生成基础复习计划
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const reviewSchedule = {
        shortTerm: [
          {
            title: '论语学而篇复习',
            dueDate: tomorrow.toISOString().split('T')[0],
            priority: 'high',
            estimatedTime: 30,
            resources: ['《论语》学而篇原文及注释']
          }
        ],
        mediumTerm: [
          {
            title: '儒家核心概念复习',
            dueDate: nextWeek.toISOString().split('T')[0],
            priority: 'medium',
            estimatedTime: 60,
            resources: ['儒家核心概念汇总', '概念应用案例']
          }
        ],
        longTerm: [
          {
            title: '经典综合复习',
            dueDate: null, // 长期复习，无具体日期
            priority: 'low',
            estimatedTime: 120,
            resources: ['四书五经导读', '思想脉络梳理']
          }
        ]
      }
      
      return {
        success: true,
        data: { reviewSchedule },
        source: 'offline'
      }
    } catch (error) {
      console.error('智能复习提醒错误:', error)
      return {
        success: false,
        error: error.message || '智能复习提醒失败',
        data: { reviewSchedule: { shortTerm: [], mediumTerm: [], longTerm: [] } }
      }
    }
  },

  /**
   * 获取离线推荐
   * @returns {Object} 离线推荐结果
   */
  getOfflineRecommendations() {
    const level = this.userPreferences.level || 'beginners'
    
    return {
      learningPath: OFFLINE_LEARNING_PATHS[level][0],
      resources: OFFLINE_RESOURCES[level],
      tips: OFFLINE_LEARNING_TIPS.vocabulary.concat(OFFLINE_LEARNING_TIPS.grammar).slice(0, 3)
    }
  }
}

module.exports = learningAssistantService 