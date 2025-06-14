// 欢迎引导页面
const app = getApp()

Page({
  data: {
    currentIndex: 0,
    isFirstTime: true
  },

  onLoad: function(options) {
    // 检查是否首次使用
    const hasShownWelcome = wx.getStorageSync('has_shown_welcome')
    if (hasShownWelcome && !options.force) {
      // 非首次使用，直接跳转到首页
      this.navigateToHome()
      return
    }

    this.setData({ isFirstTime: !hasShownWelcome })
    
    // 预加载首页数据
    this.preloadHomeData()
  },

  onSwiperChange: function(e) {
    this.setData({
      currentIndex: e.detail.current
    })
  },

  onNext: function() {
    const nextIndex = this.data.currentIndex + 1
    if (nextIndex < 4) {
      this.setData({ currentIndex: nextIndex })
    }
  },

  onSkip: function() {
    this.onStartApp()
  },

  onQuickStart: function(e) {
    const type = e.currentTarget.dataset.type
    
    // 记录用户选择的快速开始类型
    wx.setStorageSync('quick_start_preference', type)
    
    // 标记已显示欢迎页
    wx.setStorageSync('has_shown_welcome', true)
    
    // 根据类型跳转到对应页面
    switch (type) {
      case 'reading':
        wx.switchTab({
          url: '/pages/home/home',
          success: () => {
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/classics/classics'
              })
            }, 500)
          }
        })
        break
      case 'chat':
        wx.switchTab({
          url: '/pages/chat/chat'
        })
        break
      case 'ocr':
        wx.switchTab({
          url: '/pages/ocr/ocr'
        })
        break
      default:
        this.navigateToHome()
    }
  },

  onStartApp: function() {
    // 标记已显示欢迎页
    wx.setStorageSync('has_shown_welcome', true)
    
    // 记录用户完成引导的时间
    wx.setStorageSync('welcome_completed_time', new Date().toISOString())
    
    this.navigateToHome()
  },

  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/home/home',
      fail: (error) => {
        console.error('跳转首页失败:', error)
        wx.reLaunch({
          url: '/pages/home/home'
        })
      }
    })
  },

  preloadHomeData: function() {
    // 预加载首页需要的数据
    try {
      // 预加载用户偏好
      const userPreferences = wx.getStorageSync('user_preferences') || {
        favoriteCategories: ['confucian'],
        level: 'beginner',
        interests: ['论语', '道德经']
      }
      
      // 如果是首次使用，设置默认偏好
      if (this.data.isFirstTime) {
        wx.setStorageSync('user_preferences', userPreferences)
      }
      
      // 预加载推荐数据
      this.generateInitialRecommendations()
      
    } catch (error) {
      console.error('预加载数据失败:', error)
    }
  },

  generateInitialRecommendations: function() {
    // 为新用户生成初始推荐
    const initialRecommendations = [
      {
        id: 'lunyu_xueer',
        title: '论语·学而篇',
        content: '子曰：「学而时习之，不亦说乎？」',
        type: 'classic',
        bookId: 'lunyu',
        reason: '儒家经典入门，适合初学者',
        readTime: '5分钟'
      },
      {
        id: 'daodejing_1',
        title: '道德经·第一章',
        content: '道可道，非常道。名可名，非常名。',
        type: 'classic',
        bookId: 'daodejing',
        reason: '道家哲学精髓',
        readTime: '8分钟'
      }
    ]
    
    wx.setStorageSync('initial_recommendations', initialRecommendations)
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智 - 探索中华文化的智慧宝库',
      desc: '与古代圣贤对话，感受传统文化的魅力',
      path: '/pages/welcome/welcome?force=true',
      imageUrl: '/images/share/welcome.png'
    }
  }
})
