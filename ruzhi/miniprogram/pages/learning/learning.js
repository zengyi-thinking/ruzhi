// 学习中心页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const ApiUtils = require('../../utils/api.js')
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
    return ApiUtils.learning.getStats(app.globalData.currentUser.id).then(function(result) {
      if (result.success) {
        self.setData({ learningStats: result.data })
      } else {
        // 使用模拟数据
        self.setData({
          learningStats: LearningUtils.generateMockStats()
        })
      }
    }).catch(function(error) {
      console.error('加载学习统计失败:', error)
      // 使用模拟数据
      self.setData({
        learningStats: LearningUtils.generateMockStats()
      })
    })
  },

  // 加载学习进度
  loadLearningProgress: function() {
    const self = this
    return ApiUtils.learning.getProgress(app.globalData.currentUser.id).then(function(result) {
      if (result.success) {
        self.setData({ learningProgress: result.data })
      } else {
        // 使用模拟数据
        self.setData({
          learningProgress: LearningUtils.generateMockProgress()
        })
      }
    }).catch(function(error) {
      console.error('加载学习进度失败:', error)
      // 使用模拟数据
      self.setData({
        learningProgress: LearningUtils.generateMockProgress()
      })
    })
  },

  // 加载成就
  loadAchievements: function() {
    const self = this
    return ApiUtils.learning.getAchievements(app.globalData.currentUser.id).then(function(result) {
      if (result.success) {
        self.setData({ achievements: result.data })
      } else {
        // 使用模拟数据
        self.setData({
          achievements: LearningUtils.generateMockAchievements()
        })
      }
    }).catch(function(error) {
      console.error('加载成就失败:', error)
      // 使用模拟数据
      self.setData({
        achievements: LearningUtils.generateMockAchievements()
      })
    })
  },

  // 加载推荐
  loadRecommendations: function() {
    const self = this

    // 加载概念推荐
    return ApiUtils.knowledge.getRecommendations([], 'learning').then(function(conceptResult) {
      if (conceptResult.success) {
        self.setData({ conceptRecommendations: conceptResult.data.recommendations })
      } else {
        self.setData({
          conceptRecommendations: LearningUtils.generateConceptRecommendations()
        })
      }

      // 设置其他推荐数据
      self.setData({
        classicsRecommendations: LearningUtils.generateClassicsRecommendations(),
        dialogueRecommendations: LearningUtils.generateDialogueRecommendations()
      })
    }).catch(function(error) {
      console.error('加载推荐失败:', error)
      // 使用模拟数据
      self.setData({
        conceptRecommendations: LearningUtils.generateConceptRecommendations(),
        classicsRecommendations: LearningUtils.generateClassicsRecommendations(),
        dialogueRecommendations: LearningUtils.generateDialogueRecommendations()
      })
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
    wx.navigateTo({
      url: '/pages/knowledge/concept/concept?concept=' + encodeURIComponent(concept)
    })
  },

  // 阅读经典
  readClassic: function(e) {
    const classic = e.currentTarget.dataset.classic
    wx.navigateTo({
      url: '/pages/classics/reader/reader?classic=' + encodeURIComponent(classic)
    })
  },

  // 开始对话
  startDialogue: function(e) {
    const character = e.currentTarget.dataset.character
    const topic = e.currentTarget.dataset.topic
    wx.navigateTo({
      url: '/pages/dialogue/chat/chat?character=' + character + '&topic=' + encodeURIComponent(topic)
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
      app.showSuccess('任务完成！获得积分奖励')
      // 这里可以调用API更新用户积分
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
