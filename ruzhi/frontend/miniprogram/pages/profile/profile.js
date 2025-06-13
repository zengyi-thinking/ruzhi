// 个人中心页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const LearningUtils = require('../../utils/learning.js')

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    learningStats: {
      totalDays: 0,
      totalHours: 0,
      totalPoints: 0,
      currentStreak: 0
    },
    recentAchievements: [],
    historyRecords: [],
    showStatsDetail: false,
    averageDailyHours: '0.0',

    // AI设置相关
    showAISettings: false,
    showAPIKey: false,
    testing: false,
    aiConfig: {
      apiKey: '',
      connected: false,
      lastTestTime: '',
      errorMessage: '',
      features: {
        historicalChat: true,
        ocrExplanation: true,
        knowledgeQA: true
      },
      usage: {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0
      }
    }
  },

  onLoad: function() {
    console.log('个人中心页面加载')
    this.initPage()
  },

  onShow: function() {
    console.log('个人中心页面显示')
    this.refreshUserData()
  },

  onReady: function() {
    console.log('个人中心页面渲染完成')
    // 确保页面渲染完成后再加载数据
    this.setData({
      userInfo: {
        nickName: '文化学者',
        avatarUrl: '/images/default-avatar.png'
      },
      learningStats: {
        totalDays: 15,
        totalHours: 45,
        totalPoints: 1200,
        currentStreak: 7
      }
    })
  },

  onPullDownRefresh: function() {
    const self = this
    this.refreshUserData().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 初始化页面
  initPage: function() {
    this.getUserInfo()
    this.loadUserData()
  },

  // 获取用户信息
  getUserInfo: function() {
    if (app.globalData && app.globalData.hasUserInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      // 使用默认用户信息
      this.setData({
        userInfo: {
          nickName: '文化学者',
          avatarUrl: '/images/default-avatar.png'
        },
        hasUserInfo: false
      })
    }
  },

  // 加载用户数据
  loadUserData: function() {
    const self = this
    return Promise.all([
      self.loadLearningStats(),
      self.loadRecentAchievements(),
      self.loadHistoryRecords()
    ]).catch(function(error) {
      console.error('加载用户数据失败:', error)
    })
  },

  // 刷新用户数据
  refreshUserData: function() {
    return this.loadUserData()
  },

  // 加载学习统计
  loadLearningStats: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 直接使用模拟数据
        const mockStats = LearningUtils.generateMockStats()
        // 计算平均每日学习时长
        const averageDailyHours = mockStats.totalDays > 0 ?
          (mockStats.totalHours / mockStats.totalDays).toFixed(1) : '0.0'

        self.setData({
          learningStats: mockStats,
          averageDailyHours: averageDailyHours
        })
        resolve()
      } catch (error) {
        console.error('加载学习统计失败:', error)
        resolve()
      }
    })
  },

  // 加载最近成就
  loadRecentAchievements: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        const achievements = LearningUtils.generateMockAchievements()
        const recentAchievements = achievements.filter(function(achievement) {
          return achievement.unlocked
        }).slice(0, 3)

        self.setData({ recentAchievements: recentAchievements })
        resolve()
      } catch (error) {
        console.error('加载最近成就失败:', error)
        resolve()
      }
    })
  },

  // 加载历史记录
  loadHistoryRecords: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        const historyRecords = LearningUtils.generateRecentHistory().slice(0, 5)
        self.setData({ historyRecords: historyRecords })
        resolve()
      } catch (error) {
        console.error('加载历史记录失败:', error)
        resolve()
      }
    })
  },

  // 登录获取用户信息
  getUserProfile: function() {
    const self = this

    // 检查是否支持getUserProfile
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: function(res) {
          console.log('获取用户信息成功:', res.userInfo)
          self.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })

          // 更新全局数据
          if (app.globalData) {
            app.globalData.userInfo = res.userInfo
            app.globalData.hasUserInfo = true
          }

          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
        },
        fail: function(error) {
          console.error('获取用户信息失败:', error)
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          })
        }
      })
    } else {
      // 降级处理，使用模拟数据
      const mockUserInfo = {
        nickName: '文化学者',
        avatarUrl: '/images/default-avatar.png'
      }
      self.setData({
        userInfo: mockUserInfo,
        hasUserInfo: true
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    }
  },

  // 显示/隐藏统计详情
  toggleStatsDetail: function() {
    this.setData({ showStatsDetail: !this.data.showStatsDetail })
  },

  // 查看学习统计
  viewLearningStats: function() {
    wx.switchTab({
      url: '/pages/learning/learning'
    })
  },

  // 查看全部成就
  viewAllAchievements: function() {
    wx.switchTab({
      url: '/pages/learning/learning'
    })
  },

  // AI设置相关方法
  onAISettings: function() {
    // 加载AI配置
    this.loadAIConfig()
    this.setData({ showAISettings: true })
  },

  onCloseAISettings: function() {
    this.setData({ showAISettings: false })
  },

  loadAIConfig: function() {
    try {
      const savedConfig = wx.getStorageSync('ai_config') || {}
      const usage = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0
      }

      // 解密API密钥
      let apiKey = savedConfig.apiKey || ''
      if (savedConfig.encrypted && apiKey) {
        try {
          apiKey = this.decryptAPIKey(savedConfig).apiKey
        } catch (error) {
          console.error('解密API密钥失败:', error)
          apiKey = ''
        }
      }

      this.setData({
        'aiConfig.apiKey': apiKey,
        'aiConfig.connected': savedConfig.connected || false,
        'aiConfig.lastTestTime': savedConfig.lastTestTime || '',
        'aiConfig.errorMessage': savedConfig.errorMessage || '',
        'aiConfig.features': {
          ...this.data.aiConfig.features,
          ...savedConfig.features
        },
        'aiConfig.usage': usage
      })
    } catch (error) {
      console.error('加载AI配置失败:', error)
    }
  },

  onAPIKeyInput: function(e) {
    this.setData({
      'aiConfig.apiKey': e.detail.value
    })
  },

  onToggleAPIKeyVisibility: function() {
    this.setData({
      showAPIKey: !this.data.showAPIKey
    })
  },

  onTestConnection: async function() {
    const apiKey = this.data.aiConfig.apiKey
    if (!apiKey || !apiKey.startsWith('sk-')) {
      wx.showToast({
        title: '请输入有效的API密钥',
        icon: 'none'
      })
      return
    }

    this.setData({ testing: true })

    try {
      // 测试API连接
      const { aiService } = require('../../utils/ai.js')

      // 临时设置API密钥进行测试
      const testResult = await this.testAPIConnection(apiKey)

      if (testResult.success) {
        this.setData({
          'aiConfig.connected': true,
          'aiConfig.lastTestTime': new Date().toLocaleString(),
          'aiConfig.errorMessage': ''
        })

        wx.showToast({
          title: '连接成功！',
          icon: 'success'
        })
      } else {
        throw new Error(testResult.error || '连接失败')
      }
    } catch (error) {
      console.error('测试连接失败:', error)

      this.setData({
        'aiConfig.connected': false,
        'aiConfig.lastTestTime': new Date().toLocaleString(),
        'aiConfig.errorMessage': error.message
      })

      wx.showToast({
        title: '连接失败：' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ testing: false })
    }
  },

  testAPIConnection: function(apiKey) {
    return new Promise((resolve) => {
      // 模拟API测试
      setTimeout(() => {
        if (apiKey.startsWith('sk-') && apiKey.length > 20) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: 'API密钥格式不正确' })
        }
      }, 2000)
    })
  },

  onFeatureToggle: function(e) {
    const feature = e.currentTarget.dataset.feature
    const value = e.detail.value

    this.setData({
      [`aiConfig.features.${feature}`]: value
    })
  },

  onSaveAISettings: function() {
    try {
      const config = {
        apiKey: this.data.aiConfig.apiKey,
        connected: this.data.aiConfig.connected,
        lastTestTime: this.data.aiConfig.lastTestTime,
        errorMessage: this.data.aiConfig.errorMessage,
        features: this.data.aiConfig.features
      }

      wx.setStorageSync('ai_config', config)

      // 更新AI服务配置
      this.updateAIServiceConfig(config)

      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      })

      this.setData({ showAISettings: false })
    } catch (error) {
      console.error('保存AI配置失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  updateAIServiceConfig: function(config) {
    try {
      // 更新AI服务的配置
      const { aiService } = require('../../utils/ai.js')
      if (aiService && aiService.updateConfig) {
        aiService.updateConfig(config)
      }
    } catch (error) {
      console.error('更新AI服务配置失败:', error)
    }
  },

  // AI设置相关方法
  onAISettings: function() {
    // 加载AI配置
    this.loadAIConfig()
    this.setData({ showAISettings: true })
  },

  onCloseAISettings: function() {
    this.setData({ showAISettings: false })
  },

  loadAIConfig: function() {
    try {
      const savedConfig = wx.getStorageSync('ai_config') || {}
      const usage = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0
      }

      this.setData({
        'aiConfig.apiKey': savedConfig.apiKey || '',
        'aiConfig.connected': savedConfig.connected || false,
        'aiConfig.lastTestTime': savedConfig.lastTestTime || '',
        'aiConfig.errorMessage': savedConfig.errorMessage || '',
        'aiConfig.features': {
          ...this.data.aiConfig.features,
          ...savedConfig.features
        },
        'aiConfig.usage': usage
      })
    } catch (error) {
      console.error('加载AI配置失败:', error)
    }
  },

  onAPIKeyInput: function(e) {
    this.setData({
      'aiConfig.apiKey': e.detail.value
    })
  },

  onToggleAPIKeyVisibility: function() {
    this.setData({
      showAPIKey: !this.data.showAPIKey
    })
  },

  onTestConnection: async function() {
    const apiKey = this.data.aiConfig.apiKey
    if (!apiKey || !apiKey.startsWith('sk-')) {
      wx.showToast({
        title: '请输入有效的API密钥',
        icon: 'none'
      })
      return
    }

    this.setData({ testing: true })

    try {
      // 测试API连接
      const testResult = await this.testAPIConnection(apiKey)

      if (testResult.success) {
        this.setData({
          'aiConfig.connected': true,
          'aiConfig.lastTestTime': new Date().toLocaleString(),
          'aiConfig.errorMessage': ''
        })

        wx.showToast({
          title: '连接成功！',
          icon: 'success'
        })
      } else {
        throw new Error(testResult.error || '连接失败')
      }
    } catch (error) {
      console.error('测试连接失败:', error)

      this.setData({
        'aiConfig.connected': false,
        'aiConfig.lastTestTime': new Date().toLocaleString(),
        'aiConfig.errorMessage': error.message
      })

      wx.showToast({
        title: '连接失败：' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ testing: false })
    }
  },

  testAPIConnection: function(apiKey) {
    return new Promise((resolve) => {
      // 模拟API测试 - 实际应用中应该调用真实的API测试
      setTimeout(() => {
        if (apiKey.startsWith('sk-') && apiKey.length > 20) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: 'API密钥格式不正确' })
        }
      }, 2000)
    })
  },

  onFeatureToggle: function(e) {
    const feature = e.currentTarget.dataset.feature
    const value = e.detail.value

    this.setData({
      [`aiConfig.features.${feature}`]: value
    })
  },

  onSaveAISettings: function() {
    try {
      const config = {
        apiKey: this.data.aiConfig.apiKey,
        connected: this.data.aiConfig.connected,
        lastTestTime: this.data.aiConfig.lastTestTime,
        errorMessage: this.data.aiConfig.errorMessage,
        features: this.data.aiConfig.features,
        updatedAt: new Date().toISOString()
      }

      // 加密存储API密钥
      const encryptedConfig = this.encryptAPIConfig(config)
      wx.setStorageSync('ai_config', encryptedConfig)

      // 更新AI服务配置
      this.updateAIServiceConfig(config)

      // 更新使用统计
      this.updateUsageStats()

      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      })

      this.setData({ showAISettings: false })
    } catch (error) {
      console.error('保存AI配置失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 简单的API密钥加密（实际应用中应使用更安全的加密方法）
  encryptAPIConfig: function(config) {
    try {
      // 这里使用简单的Base64编码，实际应用中应使用更安全的加密
      const encryptedApiKey = config.apiKey ?
        wx.arrayBufferToBase64(new TextEncoder().encode(config.apiKey)) : ''

      return {
        ...config,
        apiKey: encryptedApiKey,
        encrypted: true
      }
    } catch (error) {
      console.error('加密配置失败:', error)
      return config
    }
  },

  // 解密API配置
  decryptAPIConfig: function(encryptedConfig) {
    try {
      if (!encryptedConfig.encrypted) {
        return encryptedConfig
      }

      const decryptedApiKey = encryptedConfig.apiKey ?
        new TextDecoder().decode(wx.base64ToArrayBuffer(encryptedConfig.apiKey)) : ''

      return {
        ...encryptedConfig,
        apiKey: decryptedApiKey,
        encrypted: false
      }
    } catch (error) {
      console.error('解密配置失败:', error)
      return encryptedConfig
    }
  },

  updateAIServiceConfig: function(config) {
    try {
      // 更新AI服务的配置
      const { aiService } = require('../../utils/ai.js')
      if (aiService && aiService.updateConfig) {
        aiService.updateConfig({
          apiKey: config.apiKey,
          features: config.features
        })
      }

      // 通知其他页面配置已更新
      wx.setStorageSync('ai_config_updated', Date.now())
    } catch (error) {
      console.error('更新AI服务配置失败:', error)
    }
  },

  updateUsageStats: function() {
    try {
      const today = new Date().toDateString()
      const currentMonth = new Date().getMonth()

      let usage = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0,
        lastUpdateDate: today,
        lastUpdateMonth: currentMonth
      }

      // 检查是否需要重置日统计
      if (usage.lastUpdateDate !== today) {
        usage.todayCalls = 0
        usage.lastUpdateDate = today
      }

      // 检查是否需要重置月统计
      if (usage.lastUpdateMonth !== currentMonth) {
        usage.monthCalls = 0
        usage.lastUpdateMonth = currentMonth
      }

      this.setData({
        'aiConfig.usage': usage
      })

      wx.setStorageSync('ai_usage', usage)
    } catch (error) {
      console.error('更新使用统计失败:', error)
    }
  },

  // AI设置相关方法
  onAISettings: function() {
    // 加载AI配置
    this.loadAIConfig()
    this.setData({ showAISettings: true })
  },

  onCloseAISettings: function() {
    this.setData({ showAISettings: false })
  },

  loadAIConfig: function() {
    try {
      const savedConfig = wx.getStorageSync('ai_config') || {}
      const usage = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0
      }

      this.setData({
        'aiConfig.apiKey': savedConfig.apiKey || '',
        'aiConfig.connected': savedConfig.connected || false,
        'aiConfig.lastTestTime': savedConfig.lastTestTime || '',
        'aiConfig.errorMessage': savedConfig.errorMessage || '',
        'aiConfig.features': {
          ...this.data.aiConfig.features,
          ...savedConfig.features
        },
        'aiConfig.usage': usage
      })
    } catch (error) {
      console.error('加载AI配置失败:', error)
    }
  },

  onAPIKeyInput: function(e) {
    this.setData({
      'aiConfig.apiKey': e.detail.value
    })
  },

  onToggleAPIKeyVisibility: function() {
    this.setData({
      showAPIKey: !this.data.showAPIKey
    })
  },

  onTestConnection: async function() {
    const apiKey = this.data.aiConfig.apiKey
    if (!apiKey || !apiKey.startsWith('sk-')) {
      wx.showToast({
        title: '请输入有效的API密钥',
        icon: 'none'
      })
      return
    }

    this.setData({ testing: true })

    try {
      // 测试API连接
      const testResult = await this.testAPIConnection(apiKey)

      if (testResult.success) {
        this.setData({
          'aiConfig.connected': true,
          'aiConfig.lastTestTime': new Date().toLocaleString(),
          'aiConfig.errorMessage': ''
        })

        wx.showToast({
          title: '连接成功！',
          icon: 'success'
        })
      } else {
        throw new Error(testResult.error || '连接失败')
      }
    } catch (error) {
      console.error('测试连接失败:', error)

      this.setData({
        'aiConfig.connected': false,
        'aiConfig.lastTestTime': new Date().toLocaleString(),
        'aiConfig.errorMessage': error.message
      })

      wx.showToast({
        title: '连接失败：' + error.message,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ testing: false })
    }
  },

  testAPIConnection: function(apiKey) {
    return new Promise((resolve) => {
      // 模拟API测试 - 实际应用中应该调用真实的API测试
      setTimeout(() => {
        if (apiKey.startsWith('sk-') && apiKey.length > 20) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: 'API密钥格式不正确' })
        }
      }, 2000)
    })
  },

  onFeatureToggle: function(e) {
    const feature = e.currentTarget.dataset.feature
    const value = e.detail.value

    this.setData({
      [`aiConfig.features.${feature}`]: value
    })
  },

  onSaveAISettings: function() {
    try {
      const config = {
        apiKey: this.data.aiConfig.apiKey,
        connected: this.data.aiConfig.connected,
        lastTestTime: this.data.aiConfig.lastTestTime,
        errorMessage: this.data.aiConfig.errorMessage,
        features: this.data.aiConfig.features,
        updatedAt: new Date().toISOString()
      }

      // 加密存储API密钥
      const encryptedConfig = this.encryptAPIKey(config)
      wx.setStorageSync('ai_config', encryptedConfig)

      // 更新AI服务配置
      this.updateAIServiceConfig(config)

      // 更新使用统计
      this.updateUsageStats()

      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      })

      this.setData({ showAISettings: false })
    } catch (error) {
      console.error('保存AI配置失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 简单的API密钥加密（实际应用中应使用更安全的加密方法）
  encryptAPIKey: function(config) {
    if (config.apiKey) {
      try {
        // 简单的Base64编码，实际应用中应使用更安全的加密
        const encoded = wx.arrayBufferToBase64(
          new TextEncoder().encode(config.apiKey)
        )
        return {
          ...config,
          apiKey: encoded,
          encrypted: true
        }
      } catch (error) {
        console.error('加密API密钥失败:', error)
        return config
      }
    }
    return config
  },

  // 解密API密钥
  decryptAPIKey: function(config) {
    if (config.encrypted && config.apiKey) {
      try {
        const decoded = new TextDecoder().decode(
          wx.base64ToArrayBuffer(config.apiKey)
        )
        return {
          ...config,
          apiKey: decoded,
          encrypted: false
        }
      } catch (error) {
        console.error('解密API密钥失败:', error)
        return {
          ...config,
          apiKey: '',
          encrypted: false
        }
      }
    }
    return config
  },

  updateAIServiceConfig: function(config) {
    try {
      // 更新AI服务的配置
      const { aiService } = require('../../utils/ai.js')
      if (aiService && aiService.updateConfig) {
        aiService.updateConfig({
          apiKey: config.apiKey,
          features: config.features
        })
      }

      // 通知其他页面配置已更新
      wx.setStorageSync('ai_config_updated', Date.now())
    } catch (error) {
      console.error('更新AI服务配置失败:', error)
    }
  },

  updateUsageStats: function() {
    try {
      const today = new Date().toDateString()
      const currentMonth = new Date().getMonth()

      let usage = wx.getStorageSync('ai_usage') || {
        todayCalls: 0,
        monthCalls: 0,
        totalCalls: 0,
        lastUpdateDate: today,
        lastUpdateMonth: currentMonth
      }

      // 检查是否需要重置日统计
      if (usage.lastUpdateDate !== today) {
        usage.todayCalls = 0
        usage.lastUpdateDate = today
      }

      // 检查是否需要重置月统计
      if (usage.lastUpdateMonth !== currentMonth) {
        usage.monthCalls = 0
        usage.lastUpdateMonth = currentMonth
      }

      this.setData({
        'aiConfig.usage': usage
      })

      wx.setStorageSync('ai_usage', usage)
    } catch (error) {
      console.error('更新使用统计失败:', error)
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智 - 我的传统文化学习之旅',
      desc: '与我一起探索中华文化的智慧宝库',
      path: '/pages/home/home'
    }
  }
})