/**
 * 古文今译与解析服务
 * 提供古籍文本的分层解析、注释和翻译功能
 */

const app = getApp()
const { BASE_URL } = require('../config/ai')

// 离线数据
const OFFLINE_INTERPRETATIONS = {
  '学而时习之，不亦说乎': {
    wordLevel: [
      { word: '学', explanation: '学习、研究' },
      { word: '而', explanation: '连词，表示承接关系' },
      { word: '时', explanation: '时常，经常' },
      { word: '习', explanation: '复习、实践' },
      { word: '之', explanation: '代词，指代所学的内容' },
      { word: '不', explanation: '否定副词' },
      { word: '亦', explanation: '也，表示同样' },
      { word: '说', explanation: '高兴、愉快（同"悦"）' },
      { word: '乎', explanation: '语气助词，表示疑问' }
    ],
    sentenceLevel: '经常学习并复习（所学的知识），不也是很快乐的吗？',
    paragraphLevel: '孔子认为学习并不断复习是一种快乐的事情，表达了对学习态度的基本观点。',
    thoughtLevel: '体现了儒家"好学"的思想，强调学习不是负担而是能带来快乐的过程，重视持续学习的重要性。'
  }
}

const classicInterpretService = {
  /**
   * 初始化服务
   */
  init() {
    this.apiKey = wx.getStorageSync('deepseekApiKey') || ''
    this.isOnline = true
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
   * 获取古文解析（分词、注释、翻译）
   * @param {string} text 古文文本
   * @param {Object} options 选项
   * @returns {Promise<Object>} 解析结果
   */
  async getClassicInterpretation(text, options = {}) {
    try {
      // 首先检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      // 如果有离线数据且断网，则使用离线数据
      if (!isConnected && OFFLINE_INTERPRETATIONS[text]) {
        console.log('使用离线数据')
        return {
          success: true,
          data: OFFLINE_INTERPRETATIONS[text],
          source: 'offline'
        }
      }
      
      // 在线获取解析
      if (isConnected) {
        const result = await this.callInterpretationAPI(text, options)
        return {
          success: true,
          data: result,
          source: 'online'
        }
      }
      
      // 无网络且无离线数据
      return this.handleError(new Error('网络不可用且无离线数据'), text)
    } catch (error) {
      return this.handleError(error, text)
    }
  },

  /**
   * 调用解析API
   * @param {string} text 古文文本
   * @param {Object} options 选项
   * @returns {Promise<Object>} API返回结果
   */
  async callInterpretationAPI(text, options) {
    const url = `${BASE_URL}/interpret`
    
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method: 'POST',
          data: {
            text,
            options
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
      
      return response
    } catch (error) {
      console.error('API调用失败:', error)
      throw error
    }
  },

  /**
   * 分层解析（字词义、句义、篇章义、思想价值）
   * @param {string} text 古文文本
   * @param {string} level 解析层级 ('word', 'sentence', 'paragraph', 'thought')
   * @returns {Promise<Object>} 指定层级的解析结果
   */
  async getLayeredAnalysis(text, level = 'all') {
    try {
      const result = await this.getClassicInterpretation(text)
      
      if (!result.success) {
        throw new Error('获取解析失败')
      }
      
      if (level === 'all') {
        return {
          success: true,
          data: result.data
        }
      }
      
      // 返回指定层级的解析
      switch (level) {
        case 'word':
          return {
            success: true,
            data: { wordLevel: result.data.wordLevel }
          }
        case 'sentence':
          return {
            success: true,
            data: { sentenceLevel: result.data.sentenceLevel }
          }
        case 'paragraph':
          return {
            success: true,
            data: { paragraphLevel: result.data.paragraphLevel }
          }
        case 'thought':
          return {
            success: true,
            data: { thoughtLevel: result.data.thoughtLevel }
          }
        default:
          throw new Error(`未知的解析层级: ${level}`)
      }
    } catch (error) {
      return this.handleError(error, text)
    }
  },

  /**
   * 获取重点难点词汇解释
   * @param {string} text 古文文本
   * @returns {Promise<Object>} 重点词汇解释
   */
  async getKeyTermExplanations(text) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/keyterms`
        
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url,
            method: 'POST',
            data: { text },
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
      }
      
      // 离线处理：从完整解析中提取词汇解释
      const result = await this.getClassicInterpretation(text)
      if (result.success && result.data.wordLevel) {
        return {
          success: true,
          data: {
            keyTerms: result.data.wordLevel.filter(term => 
              term.isKeyTerm || Math.random() > 0.7 // 模拟关键词
            )
          },
          source: 'offline'
        }
      }
      
      throw new Error('无法获取关键词解释')
    } catch (error) {
      return this.handleError(error, text)
    }
  },

  /**
   * 获取相关典故
   * @param {string} text 古文文本
   * @returns {Promise<Object>} 相关典故信息
   */
  async getRelatedAllusions(text) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/allusions`
        
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url,
            method: 'POST',
            data: { text },
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
      }
      
      // 离线返回示例数据
      return {
        success: true,
        data: {
          allusions: [
            {
              title: '学而时习之',
              source: '《论语·学而》',
              content: '孔子强调学习与复习相结合的重要性',
              significance: '成为中国传统教育的重要理念'
            }
          ]
        },
        source: 'offline'
      }
    } catch (error) {
      return this.handleError(error, text)
    }
  },

  /**
   * 获取思想精华提炼
   * @param {string} text 古文文本
   * @returns {Promise<Object>} 思想精华分析
   */
  async getThoughtEssence(text) {
    try {
      const result = await this.getLayeredAnalysis(text, 'thought')
      
      if (!result.success) {
        throw new Error('获取思想层面解析失败')
      }
      
      return result
    } catch (error) {
      return this.handleError(error, text)
    }
  },

  /**
   * 获取离线解析数据
   * @param {string} text 古文文本
   * @returns {Object} 离线解析结果
   */
  getOfflineInterpretation(text) {
    // 尝试从离线数据中获取
    if (OFFLINE_INTERPRETATIONS[text]) {
      return {
        success: true,
        data: OFFLINE_INTERPRETATIONS[text],
        source: 'offline'
      }
    }
    
    // 没有预设数据，返回基础解析
    return {
      success: true,
      data: {
        wordLevel: [],
        sentenceLevel: '（离线模式下无法提供详细翻译）',
        paragraphLevel: '（离线模式下无法提供段落分析）',
        thoughtLevel: '（离线模式下无法提供思想分析）'
      },
      source: 'offline'
    }
  },

  /**
   * 错误处理与降级策略
   * @param {Error} error 错误对象
   * @param {string} text 原始文本
   * @returns {Object} 错误处理结果
   */
  handleError(error, text) {
    console.error('古文解析服务错误:', error)
    
    // 尝试使用离线数据
    const offlineData = this.getOfflineInterpretation(text)
    
    if (offlineData.success) {
      return {
        success: true,
        data: offlineData.data,
        source: 'offline',
        warning: '使用离线数据，可能不完整'
      }
    }
    
    // 完全降级
    return {
      success: false,
      error: error.message || '解析服务出错',
      data: {
        wordLevel: [],
        sentenceLevel: '（服务暂不可用）',
        paragraphLevel: '（服务暂不可用）',
        thoughtLevel: '（服务暂不可用）'
      }
    }
  }
}

module.exports = classicInterpretService 