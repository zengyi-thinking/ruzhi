// 经典阅读页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')

Page({
  data: {
    classics: [
      {
        id: 'lunyu',
        title: '论语',
        author: '孔子及其弟子',
        period: '春秋时期',
        description: '记录孔子及其弟子言行的儒家经典，是中华文化的重要组成部分。',
        cover: '/images/classics/lunyu.jpg',
        chapters: 20,
        difficulty: '初级',
        readTime: '约3小时',
        tags: ['儒家', '教育', '修身']
      },
      {
        id: 'daodejing',
        title: '道德经',
        author: '老子',
        period: '春秋时期',
        description: '道家哲学的根本经典，阐述了"道"的深刻内涵和人生智慧。',
        cover: '/images/classics/daodejing.jpg',
        chapters: 81,
        difficulty: '高级',
        readTime: '约4小时',
        tags: ['道家', '哲学', '自然']
      },
      {
        id: 'mengzi',
        title: '孟子',
        author: '孟子',
        period: '战国时期',
        description: '发展了孔子的思想，提出性善论和民本思想的重要著作。',
        cover: '/images/classics/mengzi.jpg',
        chapters: 14,
        difficulty: '中级',
        readTime: '约3.5小时',
        tags: ['儒家', '性善论', '政治']
      },
      {
        id: 'daxue',
        title: '大学',
        author: '曾子',
        period: '战国时期',
        description: '儒家经典"四书"之一，阐述修身、齐家、治国、平天下的理念。',
        cover: '/images/classics/daxue.jpg',
        chapters: 1,
        difficulty: '中级',
        readTime: '约1小时',
        tags: ['儒家', '修身', '治国']
      },
      {
        id: 'zhongyong',
        title: '中庸',
        author: '子思',
        period: '战国时期',
        description: '阐述中庸之道的儒家经典，强调和谐与平衡的人生哲学。',
        cover: '/images/classics/zhongyong.jpg',
        chapters: 1,
        difficulty: '高级',
        readTime: '约2小时',
        tags: ['儒家', '中庸', '哲学']
      }
    ],
    selectedCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'confucian', name: '儒家' },
      { id: 'taoist', name: '道家' },
      { id: 'buddhist', name: '佛家' }
    ],
    searchQuery: '',
    filteredClassics: []
  },

  onLoad: function() {
    console.log('经典阅读页面加载')
    this.setData({ filteredClassics: this.data.classics })
  },

  onShow: function() {
    console.log('经典阅读页面显示')
  },

  onPullDownRefresh: function() {
    // 刷新数据
    setTimeout(function() {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 搜索输入
  onSearchInput: function(e) {
    const query = e.detail.value
    this.setData({ searchQuery: query })
    this.filterClassics()
  },

  // 选择分类
  selectCategory: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category })
    this.filterClassics()
  },

  // 过滤经典
  filterClassics: function() {
    const self = this
    let filtered = this.data.classics

    // 按分类过滤
    if (this.data.selectedCategory !== 'all') {
      filtered = filtered.filter(function(classic) {
        return classic.tags.some(function(tag) {
          switch (self.data.selectedCategory) {
            case 'confucian':
              return tag === '儒家'
            case 'taoist':
              return tag === '道家'
            case 'buddhist':
              return tag === '佛家'
            default:
              return true
          }
        })
      })
    }

    // 按搜索关键词过滤
    if (this.data.searchQuery) {
      const query = this.data.searchQuery.toLowerCase()
      filtered = filtered.filter(function(classic) {
        return classic.title.toLowerCase().includes(query) ||
               classic.author.toLowerCase().includes(query) ||
               classic.description.toLowerCase().includes(query)
      })
    }

    this.setData({ filteredClassics: filtered })
  },

  // 阅读经典
  readClassic: function(e) {
    const classicId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/classics/reader/reader?classic=' + classicId
    })
  },

  // 查看经典详情
  viewClassicDetail: function(e) {
    const classicId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/classics/detail/detail?classic=' + classicId
    })
  },

  // 获取难度颜色
  getDifficultyColor: function(difficulty) {
    const colors = {
      '初级': '#52c41a',
      '中级': '#faad14',
      '高级': '#f5222d'
    }
    return colors[difficulty] || '#1890ff'
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智经典库 - 传统文化经典阅读',
      desc: '深度阅读传统文化经典，感受古代智慧的魅力',
      path: '/pages/classics/classics'
    }
  }
})
