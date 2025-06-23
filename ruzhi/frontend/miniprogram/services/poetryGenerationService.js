/**
 * 古诗文生成服务
 * 提供基于用户输入主题创作符合古典风格的诗文
 */

const app = getApp()
const { BASE_URL } = require('../config/ai')

// 离线数据 - 风格模板
const OFFLINE_STYLES = {
  'tang': {
    name: '唐诗风格',
    description: '格律严谨，意境优美，以五言、七言为主',
    examples: [
      {
        title: '静夜思',
        author: '李白',
        content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
        form: '五言绝句'
      },
      {
        title: '登鹳雀楼',
        author: '王之涣',
        content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
        form: '五言绝句'
      }
    ]
  },
  'song': {
    name: '宋词风格',
    description: '婉约或豪放，音律和谐，以抒情为主',
    examples: [
      {
        title: '江城子·密州出猎',
        author: '苏轼',
        content: '老夫聊发少年狂，左牵黄，右擎苍，锦帽貂裘，千骑卷平冈。\n为报倾城随太守，亲射虎，看孙郎。\n酒酣胸胆尚开张，鬓微霜，又何妨？持节云中，何日遣冯唐？\n会挽雕弓如满月，西北望，射天狼。',
        form: '词牌·江城子'
      }
    ]
  },
  'pre-qin': {
    name: '先秦散文',
    description: '简约朴素，寓意深刻，多用比兴手法',
    examples: [
      {
        title: '《论语》选段',
        author: '孔子及弟子',
        content: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"',
        form: '语录体'
      }
    ]
  },
  'han-fu': {
    name: '汉赋风格',
    description: '辞藻华丽，篇幅宏大，气势磅礴',
    examples: [
      {
        title: '《思玄赋》选段',
        author: '张衡',
        content: '窥阊阖以直驰兮，御龙而南征。\n超无为以上游兮，与造物乎窈冥。',
        form: '赋体'
      }
    ]
  }
}

// 离线数据 - 预设主题诗文
const OFFLINE_POEMS = {
  '春天': [
    {
      title: '春日',
      content: '春风轻拂面，花香满庭前。\n小鸟枝头唱，新绿遍山川。\n农夫耕种忙，村童戏水间。\n一年好时节，万物正欣然。',
      style: 'tang',
      form: '五言律诗'
    }
  ],
  '思乡': [
    {
      title: '乡思',
      content: '他乡为异客，每逢佳节倍思亲。\n远山含黛碧，近水映斜晖。\n故园虽千里，魂梦夜夜归。',
      style: 'tang',
      form: '七言绝句'
    }
  ],
  '友情': [
    {
      title: '赠友',
      content: '海内存知己，天涯若比邻。\n相逢意气合，一笑泯恩仇。\n把酒话桑麻，何须问短长。',
      style: 'tang',
      form: '五言组诗'
    }
  ],
  '山水': [
    {
      title: '山居',
      content: '远看山有色，近听水无声。\n春去花还在，人来鸟不惊。\n闲云潭影日悠悠，物换星移几度秋。',
      style: 'tang',
      form: '七言绝句'
    }
  ],
  '读书': [
    {
      title: '劝学',
      content: '书山有路勤为径，学海无涯苦作舟。\n少壮不努力，老大徒伤悲。\n立身百行，以学为基。读书破万卷，下笔如有神。',
      style: 'pre-qin',
      form: '格言联璧'
    }
  ]
}

// 离线数据 - 辅助创作资源
const OFFLINE_CREATION_AIDS = {
  'rhymes': {
    '平水韵': [
      { name: '一东', chars: '东同童僮铜桐峒筒洞恫侗' },
      { name: '二冬', chars: '冬咚氹' },
      { name: '三江', chars: '江红钟龙凤籽宗螽冯' }
    ]
  },
  'patterns': {
    '对仗': [
      { first: '春风又绿江南岸', second: '明月何时照我还' },
      { first: '洛阳亲友如相问', second: '一片冰心在玉壶' }
    ]
  },
  'idioms': [
    '山重水复', '柳暗花明', '小桥流水', '高山流水', '春华秋实'
  ]
}

const poetryGenerationService = {
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
   * 生成古诗
   * @param {string} theme 主题
   * @param {string} style 风格（tang - 唐诗风格, song - 宋词风格）
   * @returns {Promise<Object>} 生成的古诗
   */
  async generatePoetry(theme, style = 'tang') {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/generate-poetry`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                theme,
                style
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
          
          // 保存生成历史
          this.saveGenerationHistory({
            type: 'poetry',
            theme,
            style,
            result: response,
            timestamp: new Date().toISOString()
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('生成古诗失败:', error)
        }
      }
      
      // 离线模式：返回预设诗文
      const offlinePoems = OFFLINE_POEMS[theme] || []
      
      if (offlinePoems.length > 0) {
        // 优先返回匹配风格的诗
        const matchStylePoem = offlinePoems.find(poem => poem.style === style)
        const poem = matchStylePoem || offlinePoems[0]
        
        const result = {
          title: poem.title || `咏${theme}`,
          content: poem.content,
          style: poem.style,
          form: poem.form,
          analysis: `这首诗以${theme}为主题，采用${OFFLINE_STYLES[poem.style]?.name || '传统'}风格创作。诗中描绘了...（离线模式下无法提供详细分析）`
        }
        
        return {
          success: true,
          data: result,
          source: 'offline'
        }
      }
      
      // 没有预设诗，返回模板提示
      return {
        success: false,
        error: '离线模式下无法生成新诗，且没有匹配的预设诗',
        data: {
          title: `咏${theme}`,
          content: '离线模式下无法生成新诗\n请连接网络后再试\n或选择其他主题',
          style,
          form: '提示'
        }
      }
    } catch (error) {
      console.error('生成古诗错误:', error)
      return {
        success: false,
        error: error.message || '生成古诗失败',
        data: {
          title: `咏${theme}`,
          content: '生成失败，请稍后再试',
          style,
          form: '错误'
        }
      }
    }
  },

  /**
   * 生成古文
   * @param {string} theme 主题
   * @param {string} style 风格（pre-qin - 先秦散文, han-fu - 汉赋风格）
   * @returns {Promise<Object>} 生成的古文
   */
  async generateClassicProse(theme, style = 'pre-qin') {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/generate-prose`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                theme,
                style
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
          
          // 保存生成历史
          this.saveGenerationHistory({
            type: 'prose',
            theme,
            style,
            result: response,
            timestamp: new Date().toISOString()
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('生成古文失败:', error)
        }
      }
      
      // 离线模式：根据主题返回简短的格言或语录
      let content = ''
      
      switch (theme) {
        case '修身':
          content = '修身齐家治国平天下。见贤思齐焉，见不贤而内自省也。'
          break
        case '处世':
          content = '君子坦荡荡，小人长戚戚。与朋友交，言而有信。'
          break
        case '学习':
          content = '学而不思则罔，思而不学则殆。学而时习之，不亦说乎？'
          break
        case '仁义':
          content = '仁者爱人。己所不欲，勿施于人。老吾老以及人之老，幼吾幼以及人之幼。'
          break
        default:
          content = '君子务本，本立而道生。人无远虑，必有近忧。'
      }
      
      const result = {
        title: `论${theme}`,
        content,
        style,
        form: style === 'pre-qin' ? '语录体' : '赋体',
        analysis: `这段文字以${theme}为主题，采用${OFFLINE_STYLES[style]?.name || '传统'}风格创作。文中阐述了...（离线模式下无法提供详细分析）`
      }
      
      return {
        success: true,
        data: result,
        source: 'offline'
      }
    } catch (error) {
      console.error('生成古文错误:', error)
      return {
        success: false,
        error: error.message || '生成古文失败',
        data: {
          title: `论${theme}`,
          content: '生成失败，请稍后再试',
          style,
          form: '错误'
        }
      }
    }
  },

  /**
   * 获取可用风格列表
   * @returns {Promise<Object>} 风格列表
   */
  async getAvailableStyles() {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/poetry-styles`
        
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
          console.error('获取风格列表失败:', error)
        }
      }
      
      // 离线模式：返回预设风格
      const styles = Object.entries(OFFLINE_STYLES).map(([id, style]) => ({
        id,
        name: style.name,
        description: style.description
      }))
      
      return {
        success: true,
        data: { styles },
        source: 'offline'
      }
    } catch (error) {
      console.error('获取风格列表错误:', error)
      return {
        success: false,
        error: error.message || '获取风格列表失败',
        data: { styles: [] }
      }
    }
  },

  /**
   * 获取风格示例
   * @param {string} style 风格ID
   * @returns {Promise<Object>} 风格示例
   */
  async getStyleExamples(style) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/style-examples/${style}`
        
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
          console.error('获取风格示例失败:', error)
        }
      }
      
      // 离线模式：返回预设示例
      const styleInfo = OFFLINE_STYLES[style]
      
      if (!styleInfo) {
        return {
          success: false,
          error: '未知的风格',
          data: { examples: [] }
        }
      }
      
      return {
        success: true,
        data: {
          style: {
            id: style,
            name: styleInfo.name,
            description: styleInfo.description
          },
          examples: styleInfo.examples
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('获取风格示例错误:', error)
      return {
        success: false,
        error: error.message || '获取风格示例失败',
        data: { examples: [] }
      }
    }
  },

  /**
   * 基于已有作品改编
   * @param {string} workId 原作ID或文本
   * @param {string} theme 新主题
   * @returns {Promise<Object>} 改编作品
   */
  async adaptExistingWork(workId, theme) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/adapt-work`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: {
                workId,
                theme
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
          console.error('改编作品失败:', error)
        }
      }
      
      // 离线模式：无法提供复杂的改编功能
      return {
        success: false,
        error: '离线模式下无法提供改编功能',
        data: null
      }
    } catch (error) {
      console.error('改编作品错误:', error)
      return {
        success: false,
        error: error.message || '改编作品失败',
        data: null
      }
    }
  },

  /**
   * 协助创作（提供韵脚、对仗等）
   * @param {string} partialWork 部分作品
   * @returns {Promise<Object>} 创作建议
   */
  async assistComposition(partialWork) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/assist-composition`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: { partialWork },
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
          console.error('获取创作建议失败:', error)
        }
      }
      
      // 离线模式：提供基础创作辅助
      // 根据最后一个字提供韵脚
      const lastChar = partialWork.trim().slice(-1)
      const rhymes = []
      
      for (const rhymeGroup of OFFLINE_CREATION_AIDS.rhymes['平水韵']) {
        if (rhymeGroup.chars.includes(lastChar)) {
          // 找到韵部，提供几个同韵字
          rhymes.push(...rhymeGroup.chars.split('').filter(char => char !== lastChar).slice(0, 5))
          break
        }
      }
      
      // 提供几个成语或短语作为参考
      const phrases = OFFLINE_CREATION_AIDS.idioms.slice(0, 3)
      
      // 对仗建议
      let parallelSuggestion = null
      if (partialWork.length >= 5 && partialWork.length <= 7) {
        // 简单对仗建议
        parallelSuggestion = OFFLINE_CREATION_AIDS.patterns['对仗'][0].second
      }
      
      const result = {
        rhymeSuggestions: rhymes.length > 0 ? rhymes : ['风', '松', '中', '空', '通'],
        phraseSuggestions: phrases,
        parallelSuggestion,
        completionSuggestions: ['（离线模式下无法提供智能续写）']
      }
      
      return {
        success: true,
        data: result,
        source: 'offline'
      }
    } catch (error) {
      console.error('协助创作错误:', error)
      return {
        success: false,
        error: error.message || '协助创作失败',
        data: {
          rhymeSuggestions: [],
          phraseSuggestions: [],
          parallelSuggestion: null,
          completionSuggestions: []
        }
      }
    }
  },

  /**
   * 评价生成作品质量
   * @param {string} work 作品文本
   * @returns {Promise<Object>} 评价结果
   */
  async evaluateGeneration(work) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/evaluate-poetry`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: { work },
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
          console.error('评价作品失败:', error)
        }
      }
      
      // 离线模式：无法提供专业评价
      return {
        success: true,
        data: {
          overall: 80,
          aspects: {
            rhythm: 75,
            imagery: 80,
            emotion: 85,
            originality: 70
          },
          comments: ['作品结构完整', '用词优美', '（离线模式下无法提供详细评价）']
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('评价作品错误:', error)
      return {
        success: false,
        error: error.message || '评价作品失败',
        data: null
      }
    }
  },

  /**
   * 获取离线生成
   * @param {string} theme 主题
   * @returns {Object} 离线生成结果
   */
  getOfflineGeneration(theme) {
    // 从预设诗中选择
    const offlinePoems = OFFLINE_POEMS[theme] || []
    
    if (offlinePoems.length > 0) {
      return offlinePoems[0]
    }
    
    // 如果没有匹配主题的预设诗，返回默认诗
    return OFFLINE_POEMS['春天'][0]
  },

  /**
   * 保存生成历史
   * @param {Object} record 生成记录
   */
  saveGenerationHistory(record) {
    try {
      const history = wx.getStorageSync('poetry_generation_history') || []
      history.unshift(record)
      
      // 限制历史记录数量
      if (history.length > 20) {
        history.pop()
      }
      
      wx.setStorageSync('poetry_generation_history', history)
    } catch (error) {
      console.error('保存生成历史失败:', error)
    }
  }
}

module.exports = poetryGenerationService 