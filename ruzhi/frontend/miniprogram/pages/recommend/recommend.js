// 智能典籍推荐页面
const app = getApp()
const { aiService } = require('../../utils/ai.js')

Page({
  data: {
    // 显示状态
    showSettings: false,
    loading: false,
    
    // 用户偏好
    userPreferences: {
      level: 'beginner',
      interests: ['论语', '道德经'],
      goals: ['文化素养', '人生智慧'],
      dailyTime: 30
    },
    
    // 偏好选项
    levelOptions: [
      { value: 'beginner', label: '初学者', icon: '🌱' },
      { value: 'intermediate', label: '进阶者', icon: '🌿' },
      { value: 'advanced', label: '高级者', icon: '🌳' }
    ],
    
    interestOptions: [
      '论语', '道德经', '孟子', '庄子', '易经', '诗经',
      '史记', '资治通鉴', '唐诗', '宋词', '元曲', '红楼梦'
    ],
    
    goalOptions: [
      { value: '文化素养', label: '提升文化素养', icon: '📚' },
      { value: '人生智慧', label: '获得人生智慧', icon: '💡' },
      { value: '写作能力', label: '提高写作能力', icon: '✍️' },
      { value: '思维训练', label: '训练思维能力', icon: '🧠' },
      { value: '修身养性', label: '修身养性', icon: '🧘' },
      { value: '学术研究', label: '学术研究', icon: '🔬' }
    ],
    
    // 推荐内容
    todayRecommend: null,
    currentCategory: 'personalized',
    categoryTabs: [
      { id: 'personalized', name: '个性化' },
      { id: 'trending', name: '热门' },
      { id: 'classic', name: '经典' },
      { id: 'new', name: '新增' }
    ],
    categoryRecommendations: [],
    
    // 学习路径
    learningPath: [],
    
    // 相似用户推荐
    similarUsersReading: []
  },

  onLoad: function(options) {
    console.log('智能推荐页面加载')
    this.loadUserPreferences()
    this.loadRecommendations()
  },

  onShow: function() {
    this.refreshRecommendations()
  },

  // 加载用户偏好
  loadUserPreferences: function() {
    try {
      const preferences = wx.getStorageSync('user_preferences') || this.data.userPreferences
      this.setData({ userPreferences: preferences })
    } catch (error) {
      console.error('加载用户偏好失败:', error)
    }
  },

  // 保存用户偏好
  saveUserPreferences: function() {
    try {
      wx.setStorageSync('user_preferences', this.data.userPreferences)
    } catch (error) {
      console.error('保存用户偏好失败:', error)
    }
  },

  // 加载推荐内容
  loadRecommendations: async function() {
    this.setData({ loading: true })
    
    try {
      // 获取个性化推荐
      const result = await aiService.recommendClassics({
        userId: app.globalData.userId || 'anonymous',
        preferences: this.data.userPreferences,
        readingHistory: this.getReadingHistory(),
        currentLevel: this.data.userPreferences.level
      })
      
      if (result.success) {
        this.setData({
          todayRecommend: result.recommendations[0],
          categoryRecommendations: result.recommendations.slice(1)
        })
      } else {
        this.generateMockRecommendations()
      }
      
      // 生成学习路径
      this.generateLearningPath()
      
      // 加载相似用户推荐
      this.loadSimilarUsersReading()
      
    } catch (error) {
      console.error('加载推荐失败:', error)
      this.generateMockRecommendations()
    } finally {
      this.setData({ loading: false })
    }
  },

  // 生成模拟推荐数据
  generateMockRecommendations: function() {
    const mockRecommendations = [
      {
        id: 'lunyu_xueer',
        title: '论语·学而篇',
        author: '孔子',
        description: '儒家经典的开篇之作，阐述学习的重要性和方法',
        image: '/images/classics/lunyu.jpg',
        matchScore: 95,
        estimatedTime: '25分钟',
        difficulty: '初级',
        reason: '基于您的学习水平和兴趣偏好，这是最适合的入门内容',
        tags: ['儒家', '学习方法', '人生智慧'],
        collected: false
      },
      {
        id: 'daodejing_1',
        title: '道德经·第一章',
        author: '老子',
        description: '道家哲学的核心思想，探讨道的本质',
        image: '/images/classics/daodejing.jpg',
        matchScore: 88,
        estimatedTime: '20分钟',
        difficulty: '中级',
        reason: '您对哲学思辨有兴趣，这章内容能拓展思维深度',
        tags: ['道家', '哲学', '思辨'],
        collected: false
      }
    ]
    
    this.setData({
      todayRecommend: mockRecommendations[0],
      categoryRecommendations: mockRecommendations
    })
  },

  // 生成学习路径
  generateLearningPath: function() {
    const { level } = this.data.userPreferences
    
    let pathData = []
    
    if (level === 'beginner') {
      pathData = [
        {
          id: 1,
          title: '论语入门',
          description: '从最基础的儒家思想开始',
          level: '初级',
          estimatedTime: '1周',
          completed: false,
          current: true,
          progress: 0
        },
        {
          id: 2,
          title: '道德经基础',
          description: '了解道家哲学的核心概念',
          level: '初级',
          estimatedTime: '1周',
          completed: false,
          current: false,
          progress: 0
        },
        {
          id: 3,
          title: '孟子选读',
          description: '深入理解儒家的人性论',
          level: '中级',
          estimatedTime: '2周',
          completed: false,
          current: false,
          progress: 0
        }
      ]
    }
    
    this.setData({ learningPath: pathData })
  },

  // 加载相似用户推荐
  loadSimilarUsersReading: function() {
    const mockData = [
      {
        id: 'similar_1',
        title: '诗经·关雎',
        image: '/images/classics/shijing.jpg',
        readers: [
          { id: '1', avatar: '/images/avatar1.png' },
          { id: '2', avatar: '/images/avatar2.png' }
        ],
        readersCount: 156
      },
      {
        id: 'similar_2',
        title: '史记·项羽本纪',
        image: '/images/classics/shiji.jpg',
        readers: [
          { id: '3', avatar: '/images/avatar3.png' },
          { id: '4', avatar: '/images/avatar4.png' }
        ],
        readersCount: 89
      }
    ]
    
    this.setData({ similarUsersReading: mockData })
  },

  // 获取阅读历史
  getReadingHistory: function() {
    try {
      return wx.getStorageSync('reading_history') || []
    } catch (error) {
      console.error('获取阅读历史失败:', error)
      return []
    }
  },

  // 显示设置面板
  onShowSettings: function() {
    this.setData({ showSettings: true })
  },

  // 关闭设置面板
  onCloseSettings: function() {
    this.setData({ showSettings: false })
    this.saveUserPreferences()
    this.refreshRecommendations()
  },

  // 学习水平变化
  onLevelChange: function(e) {
    const level = e.currentTarget.dataset.level
    this.setData({
      'userPreferences.level': level
    })
  },

  // 兴趣偏好切换
  onInterestToggle: function(e) {
    const interest = e.currentTarget.dataset.interest
    const interests = [...this.data.userPreferences.interests]
    
    const index = interests.indexOf(interest)
    if (index > -1) {
      interests.splice(index, 1)
    } else {
      interests.push(interest)
    }
    
    this.setData({
      'userPreferences.interests': interests
    })
  },

  // 学习目标切换
  onGoalToggle: function(e) {
    const goal = e.currentTarget.dataset.goal
    const goals = [...this.data.userPreferences.goals]
    
    const index = goals.indexOf(goal)
    if (index > -1) {
      goals.splice(index, 1)
    } else {
      goals.push(goal)
    }
    
    this.setData({
      'userPreferences.goals': goals
    })
  },

  // 学习时间变化
  onTimeChange: function(e) {
    this.setData({
      'userPreferences.dailyTime': e.detail.value
    })
  },

  // 刷新推荐
  onRefreshRecommendations: function() {
    this.loadRecommendations()
  },

  // 收藏推荐
  onCollectRecommend: function(e) {
    const item = e.currentTarget.dataset.item
    
    // 切换收藏状态
    item.collected = !item.collected
    
    this.setData({ todayRecommend: item })
    
    wx.showToast({
      title: item.collected ? '已收藏' : '已取消收藏',
      icon: 'success'
    })
  },

  // 开始阅读
  onStartReading: function(e) {
    const item = e.currentTarget.dataset.item
    
    // 记录阅读历史
    this.recordReading(item)
    
    // 跳转到阅读页面
    wx.navigateTo({
      url: `/pages/classics/detail/detail?id=${item.id}`
    })
  },

  // 记录阅读
  recordReading: function(item) {
    try {
      let history = wx.getStorageSync('reading_history') || []
      
      // 添加到历史记录
      history.unshift({
        ...item,
        readTime: new Date().toISOString()
      })
      
      // 保持最近50条记录
      if (history.length > 50) {
        history = history.slice(0, 50)
      }
      
      wx.setStorageSync('reading_history', history)
    } catch (error) {
      console.error('记录阅读历史失败:', error)
    }
  },

  // 分类切换
  onCategoryChange: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.loadCategoryRecommendations(category)
  },

  // 加载分类推荐
  loadCategoryRecommendations: function(category) {
    // 这里可以根据不同分类加载不同的推荐内容
    // 暂时使用相同的数据
  },

  // 推荐项点击
  onRecommendClick: function(e) {
    const item = e.currentTarget.dataset.item
    this.onStartReading(e)
  },

  // 快速收藏
  onQuickCollect: function(e) {
    e.stopPropagation()
    const item = e.currentTarget.dataset.item
    
    item.collected = !item.collected
    
    // 更新数据
    const recommendations = this.data.categoryRecommendations.map(rec => 
      rec.id === item.id ? item : rec
    )
    
    this.setData({ categoryRecommendations: recommendations })
    
    wx.showToast({
      title: item.collected ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  },

  // 学习路径项点击
  onPathItemClick: function(e) {
    const item = e.currentTarget.dataset.item
    
    if (item.current || item.completed) {
      wx.navigateTo({
        url: `/pages/classics/detail/detail?id=${item.id}`
      })
    } else {
      wx.showToast({
        title: '请先完成前面的内容',
        icon: 'none'
      })
    }
  },

  // 相似内容点击
  onSimilarItemClick: function(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/classics/detail/detail?id=${item.id}`
    })
  },

  // 查看阅读历史
  onViewHistory: function() {
    wx.navigateTo({
      url: '/pages/profile/history/history'
    })
  },

  // 查看收藏
  onViewCollections: function() {
    wx.navigateTo({
      url: '/pages/profile/collections/collections'
    })
  },

  // 生成推荐报告
  onGenerateReport: function() {
    wx.showLoading({ title: '生成中...' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.navigateTo({
        url: '/pages/recommend/report/report'
      })
    }, 2000)
  },

  // 刷新推荐
  refreshRecommendations: function() {
    // 简单的刷新逻辑
    this.loadRecommendations()
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '发现了很棒的传统文化学习内容！',
      desc: 'AI为我推荐的个性化学习内容，一起来学习吧',
      path: '/pages/recommend/recommend',
      imageUrl: '/images/share/recommend.png'
    }
  }
})
