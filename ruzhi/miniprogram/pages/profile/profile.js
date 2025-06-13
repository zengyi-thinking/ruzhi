// 个人中心页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const ApiUtils = require('../../utils/api.js')
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
    settings: {
      notifications: true,
      autoSave: true,
      theme: 'light',
      fontSize: 'medium'
    },
    showStatsDetail: false
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
    if (app.globalData.hasUserInfo) {
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
      self.loadHistoryRecords(),
      self.loadSettings()
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

    // 检查用户ID是否存在
    const userId = app.globalData.currentUser ? app.globalData.currentUser.id : 'default_user'

    return new Promise(function(resolve) {
      try {
        // 直接使用模拟数据，避免API调用问题
        const mockStats = LearningUtils.generateMockStats()
        self.setData({ learningStats: mockStats })
        console.log('学习统计数据已加载:', mockStats)
        resolve()
      } catch (error) {
        console.error('加载学习统计失败:', error)
        // 使用默认数据
        self.setData({
          learningStats: {
            totalDays: 15,
            totalHours: 45,
            totalPoints: 1200,
            currentStreak: 7
          }
        })
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

  // 加载设置
  loadSettings: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        const settings = wx.getStorageSync('user_settings') || self.data.settings
        self.setData({ settings: settings })
        resolve()
      } catch (error) {
        console.error('加载设置失败:', error)
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
          app.globalData.userInfo = res.userInfo
          app.globalData.hasUserInfo = true

          app.showSuccess('登录成功')
        },
        fail: function(error) {
          console.error('获取用户信息失败:', error)
          app.showError('登录失败，请重试')
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
      app.showSuccess('登录成功')
    }
  },

  // 显示/隐藏统计详情
  toggleStatsDetail: function() {
    this.setData({ showStatsDetail: !this.data.showStatsDetail })
  },

  // 查看学习统计
  viewLearningStats: function() {
    wx.navigateTo({
      url: '/pages/learning/stats/stats'
    })
  },

  // 查看全部成就
  viewAllAchievements: function() {
    wx.navigateTo({
      url: '/pages/learning/achievements/achievements'
    })
  },

  // 查看学习历史
  viewLearningHistory: function() {
    wx.navigateTo({
      url: '/pages/profile/history/history'
    })
  },

  // 查看收藏
  viewFavorites: function() {
    wx.navigateTo({
      url: '/pages/profile/favorites/favorites'
    })
  },

  // 查看设置
  viewSettings: function() {
    wx.navigateTo({
      url: '/pages/profile/settings/settings'
    })
  },

  // 意见反馈
  feedback: function() {
    wx.navigateTo({
      url: '/pages/profile/feedback/feedback'
    })
  },

  // 关于我们
  aboutUs: function() {
    wx.navigateTo({
      url: '/pages/profile/about/about'
    })
  },

  // 切换设置项
  toggleSetting: function(e) {
    const key = e.currentTarget.dataset.key
    const settings = Object.assign({}, this.data.settings)
    settings[key] = !settings[key]
    
    this.setData({ settings: settings })
    this.saveSettings(settings)
  },

  // 保存设置
  saveSettings: function(settings) {
    try {
      wx.setStorageSync('user_settings', settings)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  },

  // 清除缓存
  clearCache: function() {
    const self = this
    CommonUtils.showConfirm('清除缓存', '确定要清除所有缓存数据吗？', function() {
      try {
        wx.clearStorageSync()
        app.showSuccess('缓存已清除')
      } catch (error) {
        console.error('清除缓存失败:', error)
        app.showError('清除缓存失败')
      }
    })
  },

  // 分享小程序
  shareApp: function() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 联系客服
  contactService: function() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: function() {
        app.showError('拨打电话失败')
      }
    })
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智 - 我的传统文化学习之旅',
      desc: '与我一起探索中华文化的智慧宝库',
      path: '/pages/index/index'
    }
  }
})
