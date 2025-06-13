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
    averageDailyHours: '0.0'
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

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智 - 我的传统文化学习之旅',
      desc: '与我一起探索中华文化的智慧宝库',
      path: '/pages/home/home'
    }
  }
})