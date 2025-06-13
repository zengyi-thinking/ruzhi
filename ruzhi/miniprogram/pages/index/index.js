// 首页逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    todayStats: {
      studyTime: 0,
      conversations: 0,
      ocrCount: 0,
      points: 0
    },
    recentActivities: [],
    recommendations: [
      {
        id: 1,
        title: '探索"仁"的深层含义',
        description: '了解儒家核心概念"仁"的哲学内涵和现代价值',
        tags: ['儒家思想', '核心概念'],
        type: 'knowledge',
        target: '仁'
      },
      {
        id: 2,
        title: '与孔子对话：教育理念',
        description: '和至圣先师探讨古代教育智慧',
        tags: ['AI对话', '教育'],
        type: 'dialogue',
        target: 'confucius'
      },
      {
        id: 3,
        title: '《论语》学而篇解读',
        description: '深入理解"学而时习之"的真正含义',
        tags: ['经典阅读', '论语'],
        type: 'classics',
        target: 'lunyu'
      }
    ],
    loading: false
  },

  onLoad: function() {
    console.log('首页加载')
    this.initPage()
  },

  onShow: function() {
    console.log('首页显示')
    this.refreshData()
  },

  onPullDownRefresh: function() {
    console.log('下拉刷新')
    const self = this
    this.refreshData().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 初始化页面
  initPage: function() {
    const self = this
    this.setData({ loading: true })

    // 获取用户信息
    this.getUserInfo().then(function() {
      // 加载数据
      return self.loadData()
    }).catch(function(error) {
      console.error('初始化页面失败:', error)
      app.showError('页面加载失败')
    }).finally(function() {
      self.setData({ loading: false })
    })
  },

  // 获取用户信息
  getUserInfo: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        if (app.globalData.hasUserInfo) {
          self.setData({
            userInfo: app.globalData.userInfo,
            hasUserInfo: true
          })
        } else {
          // 使用默认用户信息
          self.setData({
            userInfo: {
              nickName: '文化学者',
              avatarUrl: '/images/default-avatar.png'
            },
            hasUserInfo: false
          })
        }
        resolve()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        resolve()
      }
    })
  },

  // 加载数据
  loadData: function() {
    const self = this
    return Promise.all([
      self.loadTodayStats(),
      self.loadRecentActivities(),
      self.loadRecommendations()
    ]).catch(function(error) {
      console.error('加载数据失败:', error)
    })
  },

  // 加载今日统计
  loadTodayStats: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 从缓存获取
        const cached = app.getCache('todayStats')
        if (cached) {
          self.setData({ todayStats: cached })
          resolve()
          return
        }

        // 模拟数据（实际应该从后端获取）
        const stats = {
          studyTime: CommonUtils.getRandomNumber(30, 150),
          conversations: CommonUtils.getRandomNumber(1, 11),
          ocrCount: CommonUtils.getRandomNumber(1, 6),
          points: CommonUtils.getRandomNumber(100, 600)
        }

        self.setData({ todayStats: stats })
        app.setCache('todayStats', stats, 300000) // 5分钟缓存
        resolve()
      } catch (error) {
        console.error('加载今日统计失败:', error)
        resolve()
      }
    })
  },

  // 加载最近活动
  loadRecentActivities: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 模拟最近活动数据
        const activities = [
          {
            id: 1,
            icon: '📷',
            title: '识别了古籍文本',
            time: '2小时前'
          },
          {
            id: 2,
            icon: '💬',
            title: '与孔子对话',
            time: '昨天 14:30'
          },
          {
            id: 3,
            icon: '📚',
            title: '阅读《道德经》',
            time: '昨天 10:15'
          }
        ]

        self.setData({ recentActivities: activities })
        resolve()
      } catch (error) {
        console.error('加载最近活动失败:', error)
        resolve()
      }
    })
  },

  // 加载推荐内容
  loadRecommendations: function() {
    return new Promise(function(resolve) {
      try {
        // 这里可以调用后端API获取个性化推荐
        // 暂时使用静态数据
        console.log('推荐内容已加载')
        resolve()
      } catch (error) {
        console.error('加载推荐内容失败:', error)
        resolve()
      }
    })
  },

  // 刷新数据
  refreshData: function() {
    const self = this
    return this.loadData().then(function() {
      app.showSuccess('刷新成功')
    }).catch(function(error) {
      console.error('刷新数据失败:', error)
      app.showError('刷新失败')
    })
  },

  // 导航到OCR页面
  navigateToOCR: function() {
    wx.switchTab({
      url: '/pages/ocr/ocr'
    })
  },

  // 导航到对话页面
  navigateToDialogue: function() {
    wx.switchTab({
      url: '/pages/dialogue/dialogue'
    })
  },

  // 导航到知识图谱页面
  navigateToKnowledge: function() {
    wx.switchTab({
      url: '/pages/knowledge/knowledge'
    })
  },

  // 导航到经典阅读页面
  navigateToClassics: function() {
    wx.navigateTo({
      url: '/pages/classics/classics'
    })
  },

  // 处理推荐点击
  handleRecommendTap: function(e) {
    const item = e.currentTarget.dataset.item
    console.log('点击推荐:', item)

    switch (item.type) {
      case 'knowledge':
        wx.navigateTo({
          url: '/pages/knowledge/concept/concept?concept=' + item.target
        })
        break
      case 'dialogue':
        wx.navigateTo({
          url: '/pages/dialogue/chat/chat?character=' + item.target
        })
        break
      case 'classics':
        wx.navigateTo({
          url: '/pages/classics/reader/reader?classic=' + item.target
        })
        break
      default:
        app.showError('功能开发中')
    }
  },

  // 快速OCR
  quickOCR: function() {
    CommonUtils.chooseImage({
      sourceType: ['album', 'camera']
    }).then(function(tempFilePath) {
      wx.navigateTo({
        url: '/pages/ocr/result/result?imagePath=' + encodeURIComponent(tempFilePath)
      })
    }).catch(function(error) {
      console.error('选择图片失败:', error)
      app.showError('选择图片失败')
    })
  },

  // 快速对话
  quickChat: function() {
    // 随机选择一个人物开始对话
    const characters = ['confucius', 'laozi', 'mencius', 'zhuxi', 'wangyangming']
    const randomCharacter = CommonUtils.getRandomArrayItem(characters)

    wx.navigateTo({
      url: '/pages/dialogue/chat/chat?character=' + randomCharacter
    })
  },

  // 分享页面
  onShareAppMessage: function() {
    return {
      title: '儒智 - 传统文化智能学习平台',
      desc: '探索中华文化的智慧宝库，与古代先贤对话交流',
      path: '/pages/index/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '儒智 - 传统文化智能学习平台',
      query: 'from=timeline'
    }
  }
})
