// 首页逻辑
const app = getApp()
const { systemAPI, classicsAPI } = require('../../api/index')

Page({
  data: {
    // 用户信息
    userInfo: null,
    hasUserInfo: false,
    
    // 系统信息
    systemInfo: null,
    statusBarHeight: 0,
    
    // 功能模块
    features: [
      {
        id: 'ocr',
        title: '古籍识别',
        desc: 'OCR识别古籍文字',
        icon: '📷',
        path: '/pages/ocr/ocr',
        color: '#1890ff'
      },
      {
        id: 'chat',
        title: '人物对话',
        desc: '与历史人物对话',
        icon: '💬',
        path: '/pages/chat/chat',
        color: '#52c41a'
      },
      {
        id: 'classics',
        title: '经典库',
        desc: '浏览儒家经典',
        icon: '📚',
        path: '/pages/classics/classics',
        color: '#722ed1'
      },
      {
        id: 'knowledge',
        title: '知识图谱',
        desc: '探索概念关系',
        icon: '🕸️',
        path: '/pages/knowledge/knowledge',
        color: '#fa8c16'
      }
    ],
    
    // 今日推荐
    todayRecommend: [],
    
    // 最近使用
    recentUsed: [],
    
    // 学习统计
    studyStats: {
      totalDays: 0,
      totalHours: 0,
      completedChapters: 0,
      ocrCount: 0
    },

    // 每日一句
    dailyQuote: null,

    // 学习打卡
    weekDays: [],
    learningStreak: 0,
    todayChecked: false,
    dailyPoints: 10,

    // AI功能统计数据
    challengeStats: {
      totalUsers: 1256,
      highestScore: 2580
    },
    recommendStats: {
      accuracy: 95,
      totalBooks: 128
    },
    modernizeStats: {
      totalTexts: 456,
      satisfaction: 92
    },

    // 加载状态
    loading: true,
    refreshing: false
  },

  onLoad: function (options) {
    console.log('首页加载', options)
    this.initPage()
  },

  onShow: function () {
    console.log('首页显示')
    this.refreshData()
  },

  onPullDownRefresh: function () {
    console.log('下拉刷新')
    this.refreshData(true)
  },

  onShareAppMessage: function () {
    return {
      title: '儒智 - 传统文化与现代科技的融合',
      path: '/pages/home/home',
      imageUrl: '/images/share/home.png'
    }
  },

  onShareTimeline: function () {
    return {
      title: '儒智 - 探索中国传统文化经典',
      imageUrl: '/images/share/home.png'
    }
  },

  // 初始化页面
  initPage: function () {
    // 获取系统信息
    const systemInfo = app.globalData.systemInfo
    this.setData({
      systemInfo: systemInfo,
      statusBarHeight: app.globalData.statusBarHeight
    })

    // 获取用户信息
    this.getUserInfo()
    
    // 加载页面数据
    this.loadPageData()
  },

  // 获取用户信息
  getUserInfo: function () {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    }
  },

  // 加载页面数据
  loadPageData: function () {
    Promise.all([
      this.loadTodayRecommend(),
      this.loadRecentUsed(),
      this.loadStudyStats(),
      this.loadDailyQuote(),
      this.loadCheckinData()
    ]).then(() => {
      this.setData({ loading: false })
    }).catch((error) => {
      console.error('加载页面数据失败:', error)
      this.setData({ loading: false })
    })
  },

  // 刷新数据
  refreshData: function (isPullRefresh = false) {
    if (isPullRefresh) {
      this.setData({ refreshing: true })
    }

    Promise.all([
      this.loadTodayRecommend(),
      this.loadRecentUsed(),
      this.loadStudyStats(),
      this.loadDailyQuote(),
      this.loadCheckinData()
    ]).then(() => {
      if (isPullRefresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
        app.showSuccess('刷新成功')
      }
    }).catch((error) => {
      console.error('刷新数据失败:', error)
      if (isPullRefresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
        app.showError('刷新失败')
      }
    })
  },

  // 加载今日推荐
  loadTodayRecommend: function () {
    return new Promise((resolve) => {
      try {
        // 获取用户学习历史和偏好
        const userHistory = wx.getStorageSync('reading_history') || []
        const userFavorites = wx.getStorageSync('favorite_books') || []
        const userPreferences = wx.getStorageSync('user_preferences') || {}

        // 基于用户数据生成个性化推荐
        const recommend = this.generatePersonalizedRecommendations(userHistory, userFavorites, userPreferences)

        this.setData({ todayRecommend: recommend })
        resolve()
      } catch (error) {
        console.error('加载今日推荐失败:', error)
        // 使用默认推荐
        const defaultRecommend = this.getDefaultRecommendations()
        this.setData({ todayRecommend: defaultRecommend })
        resolve()
      }
    })
  },

  // 生成个性化推荐
  generatePersonalizedRecommendations: function(userHistory, userFavorites, userPreferences) {
    const allRecommendations = [
      {
        id: 'lunyu_xueer',
        title: '论语·学而篇',
        content: '子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？」',
        type: 'classic',
        category: 'confucian',
        bookId: 'lunyu',
        chapterId: 1,
        image: '',
        reason: '儒家经典入门，适合初学者',
        difficulty: 'beginner',
        readTime: '5分钟'
      },
      {
        id: 'daodejing_1',
        title: '道德经·第一章',
        content: '道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。',
        type: 'classic',
        category: 'taoist',
        bookId: 'daodejing',
        chapterId: 1,
        image: '',
        reason: '道家哲学精髓，启发深度思考',
        difficulty: 'intermediate',
        readTime: '8分钟'
      },
      {
        id: 'mengzi_liloushang',
        title: '孟子·离娄章句上',
        content: '仁之实，事亲是也；义之实，从兄是也。智之实，知斯二者弗去是也。',
        type: 'classic',
        category: 'confucian',
        bookId: 'mengzi',
        chapterId: 1,
        image: '',
        reason: '深入理解仁义思想',
        difficulty: 'intermediate',
        readTime: '6分钟'
      },
      {
        id: 'zhuangzi_xiaoyaoyou',
        title: '庄子·逍遥游',
        content: '北冥有鱼，其名为鲲。鲲之大，不知其几千里也。',
        type: 'classic',
        category: 'taoist',
        bookId: 'zhuangzi',
        chapterId: 1,
        image: '',
        reason: '体验逍遥自在的人生境界',
        difficulty: 'advanced',
        readTime: '10分钟'
      },
      {
        id: 'daxue_zhengxin',
        title: '大学·正心诚意',
        content: '古之欲明明德于天下者，先治其国；欲治其国者，先齐其家。',
        type: 'classic',
        category: 'confucian',
        bookId: 'daxue',
        chapterId: 1,
        image: '',
        reason: '修身治国的理想路径',
        difficulty: 'beginner',
        readTime: '4分钟'
      }
    ]

    // 推荐算法
    let recommendations = allRecommendations.map(item => {
      let score = 0

      // 基于用户历史阅读偏好
      if (userHistory.some(h => h.id === item.bookId)) {
        score += 30 // 用户读过相关书籍
      }

      // 基于用户收藏偏好
      if (userFavorites.includes(item.bookId)) {
        score += 50 // 用户收藏过相关书籍
      }

      // 基于分类偏好
      if (userPreferences.favoriteCategories &&
          userPreferences.favoriteCategories.includes(item.category)) {
        score += 40
      }

      // 基于难度偏好
      const userLevel = userPreferences.level || 'beginner'
      if (item.difficulty === userLevel) {
        score += 20
      }

      // 随机因子，增加多样性
      score += Math.random() * 10

      return { ...item, score }
    })

    // 排序并选择前3个
    recommendations.sort((a, b) => b.score - a.score)
    return recommendations.slice(0, 3)
  },

  // 获取默认推荐
  getDefaultRecommendations: function() {
    return [
      {
        id: 'lunyu_xueer',
        title: '论语·学而篇',
        content: '子曰：「学而时习之，不亦说乎？」',
        type: 'classic',
        bookId: 'lunyu',
        chapterId: 1,
        image: '',
        reason: '经典入门推荐',
        readTime: '5分钟'
      },
      {
        id: 'daodejing_1',
        title: '道德经·第一章',
        content: '道可道，非常道。名可名，非常名。',
        type: 'classic',
        bookId: 'daodejing',
        chapterId: 1,
        image: '',
        reason: '哲学思辨启蒙',
        readTime: '8分钟'
      },
      {
        id: 'daxue_zhengxin',
        title: '大学·正心诚意',
        content: '古之欲明明德于天下者，先治其国。',
        type: 'classic',
        bookId: 'daxue',
        chapterId: 1,
        image: '',
        reason: '修身养性指南',
        readTime: '4分钟'
      }
    ]
  },

  // 加载最近使用
  loadRecentUsed: function () {
    return new Promise((resolve) => {
      try {
        const recentUsed = wx.getStorageSync('recentUsed') || []
        this.setData({ recentUsed: recentUsed.slice(0, 4) })
        resolve()
      } catch (error) {
        console.error('加载最近使用失败:', error)
        resolve()
      }
    })
  },

  // 加载学习统计
  loadStudyStats: function () {
    return new Promise((resolve) => {
      // 从本地存储获取统计数据
      try {
        const stats = wx.getStorageSync('studyStats') || {
          totalDays: 0,
          totalHours: 0,
          completedChapters: 0,
          ocrCount: 0
        }
        this.setData({ studyStats: stats })
        resolve()
      } catch (error) {
        console.error('加载学习统计失败:', error)
        resolve()
      }
    })
  },

  // 点击功能模块
  onFeatureClick: function (e) {
    const { feature } = e.currentTarget.dataset
    console.log('点击功能模块:', feature)

    // 记录使用历史
    this.recordRecentUsed(feature)

    // 检查是否为TabBar页面
    const tabBarPages = [
      '/pages/home/home',
      '/pages/ocr/ocr',
      '/pages/chat/chat',
      '/pages/knowledge/knowledge',
      '/pages/profile/profile'
    ]

    if (tabBarPages.includes(feature.path)) {
      // TabBar页面使用switchTab
      wx.switchTab({
        url: feature.path,
        fail: (error) => {
          console.error('TabBar页面跳转失败:', error)
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    } else {
      // 普通页面使用navigateTo
      wx.navigateTo({
        url: feature.path,
        fail: (error) => {
          console.error('页面跳转失败:', error)
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    }
  },

  // 点击AI功能
  onAIFeatureClick: function(e) {
    const { feature } = e.currentTarget.dataset
    console.log('点击AI功能:', feature)

    // 记录AI功能使用
    this.recordAIFeatureUsage(feature)

    // 根据功能类型跳转
    const featureRoutes = {
      challenge: '/pages/challenge/challenge',
      recommend: '/pages/recommend/recommend',
      modernize: '/pages/modernize/modernize',
      immersive: '/pages/immersive/immersive'
    }

    const route = featureRoutes[feature]
    if (route) {
      wx.navigateTo({
        url: route,
        fail: (error) => {
          console.error('AI功能页面跳转失败:', error)
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          })
        }
      })
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    }
  },

  // 记录AI功能使用
  recordAIFeatureUsage: function(feature) {
    try {
      let aiUsageHistory = wx.getStorageSync('ai_usage_history') || []

      aiUsageHistory.unshift({
        feature: feature,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
      })

      // 限制记录数量
      aiUsageHistory = aiUsageHistory.slice(0, 100)

      wx.setStorageSync('ai_usage_history', aiUsageHistory)

      // 更新统计数据
      this.updateAIStats(feature)
    } catch (error) {
      console.error('记录AI功能使用失败:', error)
    }
  },

  // 更新AI统计数据
  updateAIStats: function(feature) {
    const updates = {}

    switch (feature) {
      case 'challenge':
        updates['challengeStats.totalUsers'] = this.data.challengeStats.totalUsers + 1
        break
      case 'recommend':
        updates['recommendStats.totalBooks'] = this.data.recommendStats.totalBooks + 1
        break
      case 'modernize':
        updates['modernizeStats.totalTexts'] = this.data.modernizeStats.totalTexts + 1
        break
    }

    if (Object.keys(updates).length > 0) {
      this.setData(updates)
    }
  },

  // 记录最近使用
  recordRecentUsed: function (feature) {
    try {
      let recentUsed = wx.getStorageSync('recentUsed') || []
      
      // 移除已存在的项目
      recentUsed = recentUsed.filter(item => item.id !== feature.id)
      
      // 添加到开头
      recentUsed.unshift({
        ...feature,
        lastUsed: new Date().toISOString()
      })
      
      // 限制数量
      recentUsed = recentUsed.slice(0, 10)
      
      // 保存到本地存储
      wx.setStorageSync('recentUsed', recentUsed)
      
      // 更新页面数据
      this.setData({ recentUsed: recentUsed.slice(0, 4) })
    } catch (error) {
      console.error('记录最近使用失败:', error)
    }
  },

  // 点击推荐内容
  onRecommendClick: function (e) {
    const { item } = e.currentTarget.dataset
    console.log('点击推荐内容:', item)

    // 记录点击行为
    this.recordRecommendationClick(item)

    if (item.type === 'classic') {
      // 跳转到经典详情页
      wx.navigateTo({
        url: `/pages/classics/detail/detail?id=${item.bookId}&chapter=${item.chapterId || 1}`,
        fail: (error) => {
          console.error('跳转经典详情失败:', error)
          // 降级到经典库页面
          wx.navigateTo({
            url: '/pages/classics/classics'
          })
        }
      })
    } else {
      // 其他类型的推荐内容
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    }
  },

  // 记录推荐点击行为
  recordRecommendationClick: function(item) {
    try {
      let clickHistory = wx.getStorageSync('recommendation_clicks') || []

      clickHistory.unshift({
        id: item.id,
        title: item.title,
        type: item.type,
        category: item.category,
        timestamp: new Date().toISOString()
      })

      // 限制记录数量
      clickHistory = clickHistory.slice(0, 100)

      wx.setStorageSync('recommendation_clicks', clickHistory)

      // 更新用户偏好
      this.updateUserPreferences(item)
    } catch (error) {
      console.error('记录推荐点击失败:', error)
    }
  },

  // 更新用户偏好
  updateUserPreferences: function(item) {
    try {
      let preferences = wx.getStorageSync('user_preferences') || {
        favoriteCategories: [],
        level: 'beginner',
        interests: []
      }

      // 更新分类偏好
      if (item.category && !preferences.favoriteCategories.includes(item.category)) {
        preferences.favoriteCategories.push(item.category)

        // 限制分类数量
        if (preferences.favoriteCategories.length > 5) {
          preferences.favoriteCategories = preferences.favoriteCategories.slice(-5)
        }
      }

      // 更新兴趣标签
      if (item.tags) {
        item.tags.forEach(tag => {
          if (!preferences.interests.includes(tag)) {
            preferences.interests.push(tag)
          }
        })

        // 限制兴趣数量
        if (preferences.interests.length > 10) {
          preferences.interests = preferences.interests.slice(-10)
        }
      }

      wx.setStorageSync('user_preferences', preferences)
    } catch (error) {
      console.error('更新用户偏好失败:', error)
    }
  },

  // 点击用户头像
  onUserAvatarClick: function () {
    if (this.data.hasUserInfo) {
      wx.switchTab({
        url: '/pages/profile/profile'
      })
    } else {
      this.getUserProfile()
    }
  },

  // 获取用户授权信息
  getUserProfile: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('获取用户信息成功:', res)
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        
        // 保存到本地存储
        wx.setStorageSync(app.globalData.cacheKeys.userInfo, res.userInfo)
      },
      fail: (error) => {
        console.error('获取用户信息失败:', error)
        app.showError('获取用户信息失败')
      }
    })
  },

  // 查看更多推荐
  onViewMoreRecommend: function () {
    wx.navigateTo({
      url: '/pages/classics/classics'
    })
  },

  // 查看学习统计
  onViewStudyStats: function () {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  },

  // 加载每日一句
  loadDailyQuote: function() {
    return new Promise((resolve) => {
      try {
        const today = new Date().toDateString()
        const savedQuote = wx.getStorageSync('daily_quote')

        // 检查是否是今天的句子
        if (savedQuote && savedQuote.date === today) {
          this.setData({ dailyQuote: savedQuote })
          resolve()
          return
        }

        // 生成今天的句子
        const quotes = [
          {
            content: '学而时习之，不亦说乎？',
            author: '孔子',
            source: '论语·学而',
            explanation: '学习知识并时常温习，不是很快乐的事情吗？'
          },
          {
            content: '道可道，非常道。',
            author: '老子',
            source: '道德经',
            explanation: '可以言说的道，就不是永恒不变的道。'
          },
          {
            content: '仁者爱人，智者知人。',
            author: '孟子',
            source: '孟子·离娄下',
            explanation: '仁德的人爱护他人，智慧的人了解他人。'
          },
          {
            content: '知己知彼，百战不殆。',
            author: '孙子',
            source: '孙子兵法',
            explanation: '了解自己也了解敌人，就能百战百胜。'
          },
          {
            content: '天行健，君子以自强不息。',
            author: '周易',
            source: '易经·乾卦',
            explanation: '天道运行刚健不息，君子应效法天道，自强不息。'
          }
        ]

        // 基于日期选择句子
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
        const selectedQuote = quotes[dayOfYear % quotes.length]

        const dailyQuote = {
          ...selectedQuote,
          date: today,
          dayOfYear: dayOfYear
        }

        // 保存到本地
        wx.setStorageSync('daily_quote', dailyQuote)
        this.setData({ dailyQuote: dailyQuote })
        resolve()
      } catch (error) {
        console.error('加载每日一句失败:', error)
        resolve()
      }
    })
  },

  // 加载打卡数据
  loadCheckinData: function() {
    return new Promise((resolve) => {
      try {
        const today = new Date()
        const checkinData = wx.getStorageSync('checkin_data') || {
          streak: 0,
          lastCheckinDate: null,
          totalDays: 0,
          checkinHistory: []
        }

        // 生成本周数据
        const weekDays = this.generateWeekDays(today, checkinData.checkinHistory)

        // 检查今天是否已打卡
        const todayStr = today.toDateString()
        const todayChecked = checkinData.checkinHistory.includes(todayStr)

        this.setData({
          weekDays: weekDays,
          learningStreak: checkinData.streak,
          todayChecked: todayChecked
        })

        resolve()
      } catch (error) {
        console.error('加载打卡数据失败:', error)
        resolve()
      }
    })
  },

  // 生成本周数据
  generateWeekDays: function(today, checkinHistory) {
    const weekDays = []
    const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const dateStr = date.toDateString()
      const isChecked = checkinHistory.includes(dateStr)
      const isToday = dateStr === today.toDateString()

      let status = 'normal'
      if (isToday) status = 'today'
      if (isChecked) status = 'checked'
      if (isToday && isChecked) status = 'today-checked'

      weekDays.push({
        date: dateStr,
        label: dayLabels[date.getDay()],
        status: status,
        isToday: isToday,
        isChecked: isChecked
      })
    }

    return weekDays
  },

  // 每日打卡
  onDailyCheckin: function() {
    if (this.data.todayChecked) return

    try {
      const today = new Date()
      const todayStr = today.toDateString()

      let checkinData = wx.getStorageSync('checkin_data') || {
        streak: 0,
        lastCheckinDate: null,
        totalDays: 0,
        checkinHistory: []
      }

      // 更新打卡数据
      checkinData.checkinHistory.push(todayStr)
      checkinData.totalDays += 1

      // 计算连续天数
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (checkinData.lastCheckinDate === yesterdayStr) {
        checkinData.streak += 1
      } else {
        checkinData.streak = 1
      }

      checkinData.lastCheckinDate = todayStr

      // 保存数据
      wx.setStorageSync('checkin_data', checkinData)

      // 更新页面
      this.setData({
        todayChecked: true,
        learningStreak: checkinData.streak
      })

      // 重新生成本周数据
      const weekDays = this.generateWeekDays(today, checkinData.checkinHistory)
      this.setData({ weekDays: weekDays })

      // 显示奖励
      wx.showToast({
        title: `打卡成功！连续${checkinData.streak}天`,
        icon: 'success'
      })

      // 更新学习统计
      this.updateStudyStats()

    } catch (error) {
      console.error('打卡失败:', error)
      wx.showToast({
        title: '打卡失败',
        icon: 'none'
      })
    }
  },

  // 更新学习统计
  updateStudyStats: function() {
    try {
      let stats = wx.getStorageSync('studyStats') || {
        totalDays: 0,
        totalHours: 0,
        completedChapters: 0,
        ocrCount: 0
      }

      stats.totalDays += 1
      wx.setStorageSync('studyStats', stats)
      this.setData({ studyStats: stats })
    } catch (error) {
      console.error('更新学习统计失败:', error)
    }
  },

  // 点击每日一句
  onQuoteClick: function() {
    const quote = this.data.dailyQuote
    if (!quote) return

    wx.showModal({
      title: quote.content,
      content: `${quote.explanation}\n\n—— ${quote.author}《${quote.source}》`,
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
