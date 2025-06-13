// 学习中心页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const LearningUtils = require('../../utils/learning.js')

Page({
  data: {
    learningStats: {
      totalDays: 0,
      totalHours: 0,
      totalPoints: 0,
      currentStreak: 0
    },
    learningProgress: [],
    achievements: [],
    activeTab: 'concepts',
    conceptRecommendations: [],
    classicsRecommendations: [],
    dialogueRecommendations: [],
    todayPlan: [],
    recentHistory: []
  },

  onLoad: function() {
    console.log('学习中心页面加载')
    this.loadAllData()
  },

  onShow: function() {
    console.log('学习中心页面显示')
    this.refreshStats()
  },

  onPullDownRefresh: function() {
    const self = this
    this.loadAllData().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 加载所有数据
  loadAllData: function() {
    const self = this
    return Promise.all([
      self.loadLearningStats(),
      self.loadLearningProgress(),
      self.loadAchievements(),
      self.loadRecommendations(),
      self.loadTodayPlan(),
      self.loadRecentHistory()
    ]).catch(function(error) {
      console.error('加载数据失败:', error)
    })
  },

  // 加载学习统计
  loadLearningStats: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 使用模拟数据
        self.setData({
          learningStats: LearningUtils.generateMockStats()
        })
        resolve()
      } catch (error) {
        console.error('加载学习统计失败:', error)
        resolve()
      }
    })
  },

  // 加载学习进度
  loadLearningProgress: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 使用模拟数据并计算百分比
        const progressData = LearningUtils.generateMockProgress()
        const processedData = progressData.map(function(item) {
          return Object.assign({}, item, {
            progressPercentage: Math.round(item.progress * 100)
          })
        })
        self.setData({
          learningProgress: processedData
        })
        resolve()
      } catch (error) {
        console.error('加载学习进度失败:', error)
        resolve()
      }
    })
  },

  // 加载成就
  loadAchievements: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 使用模拟数据并计算百分比
        const achievementsData = LearningUtils.generateMockAchievements()
        const processedData = achievementsData.map(function(item) {
          const result = Object.assign({}, item)
          if (!item.unlocked && item.current && item.required) {
            result.achievementPercentage = Math.round((item.current / item.required) * 100)
          }
          return result
        })
        self.setData({
          achievements: processedData
        })
        resolve()
      } catch (error) {
        console.error('加载成就失败:', error)
        resolve()
      }
    })
  },

  // 加载推荐
  loadRecommendations: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 使用模拟数据
        self.setData({
          conceptRecommendations: LearningUtils.generateConceptRecommendations(),
          classicsRecommendations: LearningUtils.generateClassicsRecommendations(),
          dialogueRecommendations: LearningUtils.generateDialogueRecommendations()
        })
        resolve()
      } catch (error) {
        console.error('加载推荐失败:', error)
        resolve()
      }
    })
  },

  // 加载今日计划
  loadTodayPlan: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 模拟今日计划数据
        self.setData({
          todayPlan: LearningUtils.generateTodayPlan()
        })
        resolve()
      } catch (error) {
        console.error('加载今日计划失败:', error)
        resolve()
      }
    })
  },

  // 加载最近历史
  loadRecentHistory: function() {
    const self = this
    return new Promise(function(resolve) {
      try {
        // 模拟历史数据
        self.setData({
          recentHistory: LearningUtils.generateRecentHistory()
        })
        resolve()
      } catch (error) {
        console.error('加载历史记录失败:', error)
        resolve()
      }
    })
  },

  // 刷新统计数据
  refreshStats: function() {
    return this.loadLearningStats().catch(function(error) {
      console.error('刷新统计失败:', error)
    })
  },

  // 切换推荐标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 查看成就详情
  viewAchievement: function(e) {
    const achievement = e.currentTarget.dataset.achievement
    const content = LearningUtils.formatAchievementDescription(achievement)
    wx.showModal({
      title: achievement.name,
      content: content,
      showCancel: false
    })
  },

  // 查看全部成就
  viewAllAchievements: function() {
    wx.navigateTo({
      url: '/pages/learning/achievements/achievements'
    })
  },

  // 学习概念
  learnConcept: function(e) {
    const concept = e.currentTarget.dataset.concept
    wx.switchTab({
      url: '/pages/knowledge/knowledge'
    })
  },

  // 阅读经典
  readClassic: function(e) {
    const classic = e.currentTarget.dataset.classic
    wx.navigateTo({
      url: '/pages/classics/classics'
    })
  },

  // 开始对话
  startDialogue: function(e) {
    const character = e.currentTarget.dataset.character
    const topic = e.currentTarget.dataset.topic
    wx.switchTab({
      url: '/pages/chat/chat'
    })
  },

  // 切换计划项目状态
  togglePlanItem: function(e) {
    const id = e.currentTarget.dataset.id
    const todayPlan = LearningUtils.togglePlanItemStatus(this.data.todayPlan, id)

    this.setData({ todayPlan: todayPlan })

    // 如果完成了任务，给予奖励
    const completedItem = todayPlan.find(function(item) {
      return item.id === id
    })
    if (completedItem && completedItem.completed) {
      wx.showToast({
        title: '任务完成！获得积分奖励',
        icon: 'success'
      })
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智学习中心 - 我的传统文化学习之旅',
      desc: '智能学习统计，个性化推荐，与我一起探索传统文化的魅力',
      path: '/pages/learning/learning'
    }
  }
})
