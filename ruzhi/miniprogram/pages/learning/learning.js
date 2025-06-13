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
  async loadRecommendations() {
    try {
      // 加载概念推荐
      const conceptResult = await app.request({
        url: '/api/v1/knowledge/recommend',
        method: 'POST',
        data: {
          current_concepts: [],
          type: 'learning'
        }
      })

      if (conceptResult.success) {
        this.setData({ conceptRecommendations: conceptResult.data.recommendations })
      } else {
        this.setData({
          conceptRecommendations: [
            {
              id: 1,
              concept: '中庸',
              reason: '基于您的学习历史推荐',
              difficulty: '中级',
              estimated_time: '2小时'
            },
            {
              id: 2,
              concept: '格物致知',
              reason: '与您已学概念相关',
              difficulty: '高级',
              estimated_time: '3小时'
            }
          ]
        })
      }

      // 设置其他推荐数据
      this.setData({
        classicsRecommendations: [
          {
            id: 1,
            classic: '大学',
            description: '儒家经典，修身治国之道',
            difficulty: '中级',
            estimated_time: '4小时'
          },
          {
            id: 2,
            classic: '中庸',
            description: '中庸之道的深刻阐述',
            difficulty: '高级',
            estimated_time: '5小时'
          }
        ],
        dialogueRecommendations: [
          {
            id: 1,
            character: '孔子',
            topic: '教育理念探讨',
            difficulty: '初级',
            estimated_time: '30分钟'
          },
          {
            id: 2,
            character: '老子',
            topic: '道法自然的智慧',
            difficulty: '中级',
            estimated_time: '45分钟'
          }
        ]
      })
    } catch (error) {
      console.error('加载推荐失败:', error)
    }
  },

  // 加载今日计划
  async loadTodayPlan() {
    try {
      // 模拟今日计划数据
      this.setData({
        todayPlan: [
          {
            id: 1,
            title: '学习"仁"的概念',
            description: '深入理解儒家核心思想',
            estimatedTime: '30分钟',
            completed: false
          },
          {
            id: 2,
            title: '与孔子对话',
            description: '探讨教育理念',
            estimatedTime: '20分钟',
            completed: true
          },
          {
            id: 3,
            title: '阅读《论语》片段',
            description: '学而篇第一章',
            estimatedTime: '25分钟',
            completed: false
          }
        ]
      })
    } catch (error) {
      console.error('加载今日计划失败:', error)
    }
  },

  // 加载最近历史
  async loadRecentHistory() {
    try {
      // 模拟历史数据
      this.setData({
        recentHistory: [
          {
            id: 1,
            icon: '📷',
            title: 'OCR识别古籍',
            description: '识别了《论语》文本',
            time: '2小时前',
            points: 10
          },
          {
            id: 2,
            icon: '💬',
            title: '与孔子对话',
            description: '讨论了教育理念',
            time: '昨天 15:30',
            points: 15
          },
          {
            id: 3,
            icon: '🧠',
            title: '学习概念"仁"',
            description: '完成了概念分析',
            time: '昨天 10:20',
            points: 20
          }
        ]
      })
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  },

  // 刷新统计数据
  async refreshStats() {
    try {
      await this.loadLearningStats()
    } catch (error) {
      console.error('刷新统计失败:', error)
    }
  },

  // 切换推荐标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 查看成就详情
  viewAchievement(e) {
    const achievement = e.currentTarget.dataset.achievement
    wx.showModal({
      title: achievement.name,
      content: achievement.description + (achievement.unlocked ? `\n解锁时间: ${achievement.unlockedDate}` : `\n进度: ${achievement.current}/${achievement.required}`),
      showCancel: false
    })
  },

  // 查看全部成就
  viewAllAchievements() {
    wx.navigateTo({
      url: '/pages/learning/achievements/achievements'
    })
  },

  // 学习概念
  learnConcept(e) {
    const concept = e.currentTarget.dataset.concept
    wx.navigateTo({
      url: `/pages/knowledge/concept/concept?concept=${encodeURIComponent(concept)}`
    })
  },

  // 阅读经典
  readClassic(e) {
    const classic = e.currentTarget.dataset.classic
    wx.navigateTo({
      url: `/pages/classics/reader/reader?classic=${encodeURIComponent(classic)}`
    })
  },

  // 开始对话
  startDialogue(e) {
    const character = e.currentTarget.dataset.character
    const topic = e.currentTarget.dataset.topic
    wx.navigateTo({
      url: `/pages/dialogue/chat/chat?character=${character}&topic=${encodeURIComponent(topic)}`
    })
  },

  // 切换计划项目状态
  togglePlanItem(e) {
    const id = e.currentTarget.dataset.id
    const todayPlan = this.data.todayPlan.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed }
      }
      return item
    })
    
    this.setData({ todayPlan })
    
    // 如果完成了任务，给予奖励
    const completedItem = todayPlan.find(item => item.id === id)
    if (completedItem && completedItem.completed) {
      app.showSuccess('任务完成！获得积分奖励')
      // 这里可以调用API更新用户积分
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '儒智学习中心 - 我的传统文化学习之旅',
      desc: '智能学习统计，个性化推荐，与我一起探索传统文化的魅力',
      path: '/pages/learning/learning'
    }
  }
})
