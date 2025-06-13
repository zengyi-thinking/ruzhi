// 学习中心页面
const app = getApp()
const { learningAPI, userAPI } = require('../../api/index')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      name: '学习者',
      avatar: '/images/default-avatar.png',
      level: 'LV.3',
      title: '勤学者'
    },

    // 学习统计
    studyStats: {
      totalDays: 15,
      totalHours: 42,
      totalPoints: 1250
    },

    // 学习进度数据
    progressData: [
      {
        id: 'classics',
        icon: '📚',
        title: '经典阅读',
        subtitle: '论语·学而篇',
        progress: 75,
        currentStep: 15,
        totalSteps: 20,
        estimatedTime: '2小时'
      },
      {
        id: 'dialogue',
        icon: '💬',
        title: 'AI对话',
        subtitle: '与孔子对话',
        progress: 60,
        currentStep: 12,
        totalSteps: 20,
        estimatedTime: '3小时'
      },
      {
        id: 'ocr',
        icon: '🔍',
        title: '古籍识别',
        subtitle: '识别练习',
        progress: 90,
        currentStep: 18,
        totalSteps: 20,
        estimatedTime: '1小时'
      }
    ],

    // 今日学习计划
    todayPlans: [
      {
        id: 'plan1',
        title: '阅读《论语》学而篇第三章',
        type: '经典阅读',
        duration: 30,
        difficulty: '中等',
        progress: 0,
        completed: false
      },
      {
        id: 'plan2',
        title: '与孟子对话：性善论探讨',
        type: 'AI对话',
        duration: 45,
        difficulty: '困难',
        progress: 100,
        completed: true
      },
      {
        id: 'plan3',
        title: '古籍OCR识别练习',
        type: 'OCR练习',
        duration: 20,
        difficulty: '简单',
        progress: 60,
        completed: false
      }
    ],

    // 学习成就
    achievements: [
      {
        id: 'first_dialogue',
        icon: '🎭',
        title: '初次对话',
        description: '完成第一次AI对话',
        unlocked: true,
        unlockedDate: '2024-01-10',
        rewardPoints: 50
      },
      {
        id: 'reading_master',
        icon: '📖',
        title: '阅读达人',
        description: '累计阅读10小时',
        unlocked: true,
        unlockedDate: '2024-01-12',
        rewardPoints: 100
      },
      {
        id: 'ocr_expert',
        icon: '🔍',
        title: 'OCR专家',
        description: '完成100次OCR识别',
        unlocked: false,
        currentValue: 65,
        targetValue: 100,
        tips: '继续使用OCR功能识别古籍文本'
      },
      {
        id: 'dialogue_master',
        icon: '💭',
        title: '对话大师',
        description: '与5位不同人物对话',
        unlocked: false,
        currentValue: 3,
        targetValue: 5,
        tips: '尝试与更多历史人物对话'
      },
      {
        id: 'study_streak',
        icon: '🔥',
        title: '学习连击',
        description: '连续学习30天',
        unlocked: false,
        currentValue: 15,
        targetValue: 30,
        tips: '保持每日学习习惯'
      }
    ],

    // 学习统计标签页
    statsTabs: [
      { id: 'week', name: '本周' },
      { id: 'month', name: '本月' },
      { id: 'total', name: '总计' }
    ],
    currentStatsTab: 'week',

    // 本周统计数据
    weekStats: {
      totalHours: 12.5,
      avgHours: 1.8,
      completedTasks: 8
    },

    // 日历数据
    currentMonth: '2024年1月',
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],

    // 总体统计
    totalStats: [
      {
        id: 'total_time',
        icon: '⏰',
        label: '总学习时长',
        value: '42小时',
        trend: 1,
        trendText: '比上月+15%'
      },
      {
        id: 'total_sessions',
        icon: '📝',
        label: '学习会话',
        value: '156次',
        trend: 1,
        trendText: '比上月+8%'
      },
      {
        id: 'avg_score',
        icon: '🎯',
        label: '平均得分',
        value: '85分',
        trend: 1,
        trendText: '比上月+5%'
      },
      {
        id: 'completion_rate',
        icon: '✅',
        label: '完成率',
        value: '92%',
        trend: -1,
        trendText: '比上月-2%'
      }
    ],

    // 计划表单数据
    planForm: {
      title: '',
      type: 'reading',
      duration: 30,
      difficulty: 'medium',
      date: ''
    },

    // 计划类型选项
    planTypes: [
      { id: 'reading', name: '经典阅读', icon: '📚' },
      { id: 'dialogue', name: 'AI对话', icon: '💬' },
      { id: 'ocr', name: 'OCR练习', icon: '🔍' },
      { id: 'review', name: '复习回顾', icon: '🔄' }
    ],

    // 难度等级
    difficultyLevels: [
      { id: 'easy', name: '简单', stars: ['⭐'] },
      { id: 'medium', name: '中等', stars: ['⭐', '⭐'] },
      { id: 'hard', name: '困难', stars: ['⭐', '⭐', '⭐'] }
    ],

    // 弹窗状态
    showPlanModal: false,
    showAchievementModal: false,
    showStudyRecordModal: false,
    showFabMenu: false,

    // 选中的数据
    selectedAchievement: null,
    selectedDate: '',
    dayStudyRecords: [],

    // 加载状态
    loading: false,
    loadingText: '加载中...'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '学习中心'
    })

    // 初始化页面数据
    this.initPageData()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 初始化图表
    this.initChart()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新学习数据
    this.refreshLearningData()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 保存当前状态
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清理资源
  },

  // 初始化页面数据
  initPageData: async function() {
    this.setData({ loading: true, loadingText: '加载学习数据...' })

    try {
      // 加载用户信息
      await this.loadUserInfo()

      // 加载学习统计
      await this.loadStudyStats()

      // 加载学习进度
      await this.loadProgressData()

      // 加载今日计划
      await this.loadTodayPlans()

      // 加载成就数据
      await this.loadAchievements()

      // 初始化日历
      this.initCalendar()

    } catch (error) {
      console.error('初始化页面数据失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载用户信息
  loadUserInfo: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await userAPI.getUserProfile(userId)

      if (result.success) {
        this.setData({
          userInfo: {
            name: result.data.name || '学习者',
            avatar: result.data.avatar || '/images/default-avatar.png',
            level: result.data.level || 'LV.1',
            title: result.data.title || '初学者'
          }
        })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  // 加载学习统计
  loadStudyStats: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await learningAPI.getStudyStats(userId)

      if (result.success) {
        this.setData({
          studyStats: result.data
        })
      }
    } catch (error) {
      console.error('加载学习统计失败:', error)
    }
  },

  // 加载学习进度
  loadProgressData: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await learningAPI.getProgressData(userId)

      if (result.success) {
        this.setData({
          progressData: result.data
        })
      }
    } catch (error) {
      console.error('加载学习进度失败:', error)
    }
  },

  // 加载今日计划
  loadTodayPlans: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const today = new Date().toISOString().split('T')[0]
      const result = await learningAPI.getTodayPlans(userId, today)

      if (result.success) {
        this.setData({
          todayPlans: result.data
        })
      }
    } catch (error) {
      console.error('加载今日计划失败:', error)
    }
  },

  // 加载成就数据
  loadAchievements: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await learningAPI.getAchievements(userId)

      if (result.success) {
        this.setData({
          achievements: result.data
        })
      }
    } catch (error) {
      console.error('加载成就数据失败:', error)
    }
  },

  // 刷新学习数据
  refreshLearningData: function() {
    // 刷新关键数据
    this.loadStudyStats()
    this.loadProgressData()
    this.loadTodayPlans()
  },

  // 初始化日历
  initCalendar: function() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // 生成日历数据
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const calendarDays = []
    const today = new Date().toDateString()

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      calendarDays.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        isToday: date.toDateString() === today,
        hasStudy: Math.random() > 0.7, // 模拟学习记录
        studyColor: this.getStudyColor(Math.random())
      })
    }

    this.setData({
      calendarDays: calendarDays,
      currentMonth: `${year}年${month + 1}月`
    })
  },

  // 获取学习强度颜色
  getStudyColor: function(intensity) {
    if (intensity > 0.8) return '#667eea'
    if (intensity > 0.6) return '#8b9cf7'
    if (intensity > 0.4) return '#b1c0f9'
    return '#d7e0fb'
  },

  // 初始化图表
  initChart: function() {
    // 这里可以使用图表库初始化周统计图表
    // 由于小程序限制，这里只是占位
    console.log('初始化图表')
  },

  // 进度卡片点击
  onProgressCardClick: function(e) {
    const progress = e.currentTarget.dataset.progress

    // 根据进度类型跳转到对应页面
    switch (progress.id) {
      case 'classics':
        wx.navigateTo({
          url: '/pages/reading/reading'
        })
        break
      case 'dialogue':
        wx.navigateTo({
          url: '/pages/chat/chat'
        })
        break
      case 'ocr':
        wx.navigateTo({
          url: '/pages/ocr/ocr'
        })
        break
    }
  },

  // 查看全部进度
  onViewAllProgress: function() {
    wx.navigateTo({
      url: '/pages/progress/progress'
    })
  },

  // 管理计划
  onManagePlans: function() {
    this.setData({ showPlanModal: true })
  },

  // 创建计划
  onCreatePlan: function() {
    this.setData({
      showPlanModal: true,
      planForm: {
        title: '',
        type: 'reading',
        duration: 30,
        difficulty: 'medium',
        date: new Date().toISOString().split('T')[0]
      }
    })
  },

  // 计划项点击
  onPlanItemClick: function(e) {
    const plan = e.currentTarget.dataset.plan

    // 根据计划类型执行对应操作
    switch (plan.type) {
      case '经典阅读':
        wx.navigateTo({
          url: '/pages/reading/reading'
        })
        break
      case 'AI对话':
        wx.navigateTo({
          url: '/pages/chat/chat'
        })
        break
      case 'OCR练习':
        wx.navigateTo({
          url: '/pages/ocr/ocr'
        })
        break
    }
  },

  // 切换计划完成状态
  onTogglePlan: async function(e) {
    const planId = e.currentTarget.dataset.id
    const plans = this.data.todayPlans.map(plan => {
      if (plan.id === planId) {
        return { ...plan, completed: !plan.completed, progress: plan.completed ? 0 : 100 }
      }
      return plan
    })

    this.setData({ todayPlans: plans })

    // 保存到服务器
    try {
      const userId = app.globalData.userId || 'anonymous'
      await learningAPI.updatePlanStatus(userId, planId, !plans.find(p => p.id === planId).completed)
    } catch (error) {
      console.error('更新计划状态失败:', error)
    }
  },

  // 成就点击
  onAchievementClick: function(e) {
    const achievement = e.currentTarget.dataset.achievement
    this.setData({
      selectedAchievement: achievement,
      showAchievementModal: true
    })
  },

  // 查看全部成就
  onViewAllAchievements: function() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },

  // 统计标签切换
  onStatsTabChange: function(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentStatsTab: tab })

    // 根据标签加载对应数据
    this.loadStatsData(tab)
  },

  // 加载统计数据
  loadStatsData: async function(tab) {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await learningAPI.getStatsData(userId, tab)

      if (result.success) {
        switch (tab) {
          case 'week':
            this.setData({ weekStats: result.data })
            break
          case 'month':
            this.initCalendar() // 重新初始化日历
            break
          case 'total':
            this.setData({ totalStats: result.data })
            break
        }
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 查看详细统计
  onViewDetailedStats: function() {
    wx.navigateTo({
      url: '/pages/stats/stats'
    })
  },

  // 日历月份切换
  onPrevMonth: function() {
    // 实现上一月逻辑
    console.log('上一月')
  },

  onNextMonth: function() {
    // 实现下一月逻辑
    console.log('下一月')
  },

  // 日历日期点击
  onCalendarDayClick: function(e) {
    const date = e.currentTarget.dataset.date
    this.setData({
      selectedDate: date,
      showStudyRecordModal: true
    })

    // 加载该日期的学习记录
    this.loadDayStudyRecords(date)
  },

  // 加载某日学习记录
  loadDayStudyRecords: async function(date) {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await learningAPI.getDayStudyRecords(userId, date)

      if (result.success) {
        this.setData({
          dayStudyRecords: result.data
        })
      }
    } catch (error) {
      console.error('加载学习记录失败:', error)
      this.setData({
        dayStudyRecords: []
      })
    }
  },

  // 图表触摸事件
  onChartTouch: function(e) {
    // 处理图表交互
    console.log('图表触摸:', e)
  },

  // 弹窗控制
  onHidePlanModal: function() {
    this.setData({ showPlanModal: false })
  },

  onHideAchievementModal: function() {
    this.setData({ showAchievementModal: false })
  },

  onHideStudyRecordModal: function() {
    this.setData({ showStudyRecordModal: false })
  },

  // 计划表单处理
  onPlanFormInput: function(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`planForm.${field}`]: value
    })
  },

  onPlanTypeSelect: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      'planForm.type': type
    })
  },

  onDurationChange: function(e) {
    const change = parseInt(e.currentTarget.dataset.change)
    const currentDuration = this.data.planForm.duration
    const newDuration = Math.max(15, Math.min(180, currentDuration + change))

    this.setData({
      'planForm.duration': newDuration
    })
  },

  onDifficultySelect: function(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      'planForm.difficulty': difficulty
    })
  },

  onDateChange: function(e) {
    const date = e.detail.value
    this.setData({
      'planForm.date': date
    })
  },

  // 保存计划
  onSavePlan: async function() {
    const planForm = this.data.planForm

    // 验证表单
    if (!planForm.title.trim()) {
      wx.showToast({
        title: '请输入计划标题',
        icon: 'none'
      })
      return
    }

    if (!planForm.date) {
      wx.showToast({
        title: '请选择计划日期',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ loading: true, loadingText: '保存计划中...' })

      const userId = app.globalData.userId || 'anonymous'
      const planData = {
        ...planForm,
        id: `plan_${Date.now()}`,
        userId: userId,
        progress: 0,
        completed: false,
        createdAt: new Date().toISOString()
      }

      const result = await learningAPI.createPlan(planData)

      if (result.success) {
        // 如果是今日计划，更新本地数据
        const today = new Date().toISOString().split('T')[0]
        if (planForm.date === today) {
          const todayPlans = [...this.data.todayPlans, planData]
          this.setData({ todayPlans })
        }

        this.setData({ showPlanModal: false })

        wx.showToast({
          title: '计划创建成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.message || '创建失败')
      }
    } catch (error) {
      console.error('保存计划失败:', error)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 浮动按钮控制
  onToggleFabMenu: function() {
    this.setData({
      showFabMenu: !this.data.showFabMenu
    })
  },

  // 快速操作
  onQuickAction: function(e) {
    const action = e.currentTarget.dataset.action

    this.setData({ showFabMenu: false })

    switch (action) {
      case 'study':
        // 开始学习 - 跳转到学习页面
        wx.navigateTo({
          url: '/pages/study/study'
        })
        break
      case 'plan':
        // 制定计划
        this.onCreatePlan()
        break
      case 'review':
        // 复习回顾
        wx.navigateTo({
          url: '/pages/review/review'
        })
        break
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshLearningData()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多数据
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const studyStats = this.data.studyStats
    return {
      title: `我在儒智学习中心已学习${studyStats.totalHours}小时，获得${studyStats.totalPoints}积分！`,
      path: '/pages/knowledge/knowledge',
      imageUrl: '/images/share-learning.png'
    }
  }
})
