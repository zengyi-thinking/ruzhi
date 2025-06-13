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
        icon: '/images/features/ocr.png',
        path: '/pages/ocr/ocr',
        color: '#1890ff'
      },
      {
        id: 'chat',
        title: '人物对话',
        desc: '与历史人物对话',
        icon: '/images/features/chat.png',
        path: '/pages/chat/chat',
        color: '#52c41a'
      },
      {
        id: 'classics',
        title: '经典库',
        desc: '浏览儒家经典',
        icon: '/images/features/book.png',
        path: '/pages/classics/classics',
        color: '#722ed1'
      },
      {
        id: 'knowledge',
        title: '知识图谱',
        desc: '探索概念关系',
        icon: '/images/features/knowledge.png',
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
      this.loadStudyStats()
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
      this.loadStudyStats()
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
      // 模拟推荐数据
      const recommend = [
        {
          id: 1,
          title: '论语·学而篇',
          content: '子曰：「学而时习之，不亦说乎？」',
          type: 'classic',
          image: '/images/classics/lunyu.jpg'
        },
        {
          id: 2,
          title: '孟子·离娄章句',
          content: '仁之实，事亲是也；义之实，从兄是也。',
          type: 'classic',
          image: '/images/classics/mengzi.jpg'
        }
      ]
      
      this.setData({ todayRecommend: recommend })
      resolve()
    })
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
          app.showError('页面跳转失败')
        }
      })
    } else {
      // 普通页面使用navigateTo
      wx.navigateTo({
        url: feature.path,
        fail: (error) => {
          console.error('页面跳转失败:', error)
          app.showError('页面跳转失败')
        }
      })
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
    
    if (item.type === 'classic') {
      wx.navigateTo({
        url: `/pages/classics/detail/detail?id=${item.id}`
      })
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
    wx.switchTab({
      url: '/pages/classics/classics'
    })
  },

  // 查看学习统计
  onViewStudyStats: function () {
    wx.switchTab({
      url: '/pages/profile/profile'
    })
  }
})
