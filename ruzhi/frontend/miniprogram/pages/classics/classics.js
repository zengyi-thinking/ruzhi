// 经典库页面
const app = getApp()
const { aiService } = require('../../utils/ai.js')

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    showSuggestions: false,
    searchSuggestions: [],

    // 分类相关
    selectedCategory: 'all',
    categories: [
      { id: 'all', name: '全部', icon: '📚' },
      { id: 'confucian', name: '儒家', icon: '🎓' },
      { id: 'taoist', name: '道家', icon: '☯️' },
      { id: 'buddhist', name: '佛家', icon: '🧘' },
      { id: 'poetry', name: '诗词', icon: '📝' },
      { id: 'history', name: '史学', icon: '📜' },
      { id: 'philosophy', name: '哲学', icon: '💭' }
    ],

    // 排序相关
    sortBy: 'default',

    // 书籍数据
    allBooks: [],
    filteredBooks: [],
    recommendedBooks: [],

    // 状态
    loading: true,
    refreshing: false
  },

  onLoad: function(options) {
    console.log('经典库页面加载')
    this.initPage()
  },

  onShow: function() {
    console.log('经典库页面显示')
    this.refreshUserProgress()
  },

  onPullDownRefresh: function() {
    this.refreshData(true)
  },

  onReachBottom: function() {
    this.loadMoreBooks()
  },

  // 初始化页面
  initPage: function() {
    this.loadBooksData()
    this.loadSearchSuggestions()
  },

  // 加载书籍数据
  loadBooksData: function() {
    const books = [
      {
        id: 'lunyu',
        title: '论语',
        author: '孔子及其弟子',
        dynasty: '春秋',
        category: 'confucian',
        description: '记录孔子及其弟子言行的儒家经典，是中国古代思想文化的重要源泉。',
        cover: '/images/classics/lunyu.jpg',
        chapters: 20,
        readCount: 1256,
        tags: ['儒家', '经典', '教育'],
        progress: 0,
        isFavorite: false,
        content: this.getLunyuContent()
      },
      {
        id: 'daodejing',
        title: '道德经',
        author: '老子',
        dynasty: '春秋',
        category: 'taoist',
        description: '道家哲学的根本经典，阐述了道法自然的深刻思想。',
        cover: '/images/classics/daodejing.jpg',
        chapters: 81,
        readCount: 987,
        tags: ['道家', '哲学', '自然'],
        progress: 0,
        isFavorite: false,
        content: this.getDaodejingContent()
      },
      {
        id: 'mengzi',
        title: '孟子',
        author: '孟子',
        dynasty: '战国',
        category: 'confucian',
        description: '儒家重要经典，阐述性善论和仁政思想。',
        cover: '/images/classics/mengzi.jpg',
        chapters: 14,
        readCount: 756,
        tags: ['儒家', '性善论', '仁政'],
        progress: 0,
        isFavorite: false,
        content: this.getMengziContent()
      },
      {
        id: 'zhuangzi',
        title: '庄子',
        author: '庄子',
        dynasty: '战国',
        category: 'taoist',
        description: '道家重要典籍，以寓言故事阐述逍遥自在的人生哲学。',
        cover: '/images/classics/zhuangzi.jpg',
        chapters: 33,
        readCount: 654,
        tags: ['道家', '寓言', '逍遥'],
        progress: 0,
        isFavorite: false,
        content: this.getZhuangziContent()
      },
      {
        id: 'daxue',
        title: '大学',
        author: '曾子',
        dynasty: '春秋',
        category: 'confucian',
        description: '四书之一，阐述修身齐家治国平天下的理想。',
        cover: '/images/classics/daxue.jpg',
        chapters: 1,
        readCount: 543,
        tags: ['四书', '修身', '治国'],
        progress: 0,
        isFavorite: false,
        content: this.getDaxueContent()
      },
      {
        id: 'zhongyong',
        title: '中庸',
        author: '子思',
        dynasty: '春秋',
        category: 'confucian',
        description: '四书之一，论述中庸之道的重要思想。',
        cover: '/images/classics/zhongyong.jpg',
        chapters: 1,
        readCount: 432,
        tags: ['四书', '中庸', '和谐'],
        progress: 0,
        isFavorite: false,
        content: this.getZhongyongContent()
      }
    ]

    // 从本地存储加载用户进度
    this.loadUserProgress(books)

    // 生成推荐书籍
    const recommended = this.generateRecommendations(books)

    this.setData({
      allBooks: books,
      filteredBooks: books,
      recommendedBooks: recommended,
      loading: false
    })
  },

  // 加载用户阅读进度
  loadUserProgress: function(books) {
    try {
      const progress = wx.getStorageSync('reading_progress') || {}
      const favorites = wx.getStorageSync('favorite_books') || []

      books.forEach(book => {
        book.progress = progress[book.id] || 0
        book.isFavorite = favorites.includes(book.id)
      })
    } catch (error) {
      console.error('加载用户进度失败:', error)
    }
  },

  // 刷新用户进度
  refreshUserProgress: function() {
    const books = this.data.allBooks
    this.loadUserProgress(books)
    this.setData({ allBooks: books })
    this.filterBooks()
  },

  // 生成推荐书籍
  generateRecommendations: function(books) {
    // 基于用户阅读历史和偏好生成推荐
    const userHistory = wx.getStorageSync('reading_history') || []
    const userFavorites = wx.getStorageSync('favorite_books') || []

    // 简单推荐算法：优先推荐热门和用户感兴趣的分类
    let recommended = books.filter(book => {
      return book.readCount > 500 || userFavorites.includes(book.id)
    }).slice(0, 3)

    // 如果推荐不足，补充热门书籍
    if (recommended.length < 3) {
      const popular = books.sort((a, b) => b.readCount - a.readCount).slice(0, 3)
      recommended = [...recommended, ...popular].slice(0, 3)
    }

    return recommended
  },

  // 搜索相关方法
  onSearchInput: function(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })

    if (keyword.length > 0) {
      this.showSearchSuggestions(keyword)
    } else {
      this.setData({ showSuggestions: false })
      this.filterBooks()
    }
  },

  onSearchConfirm: function() {
    this.setData({ showSuggestions: false })
    this.filterBooks()
    this.saveSearchHistory(this.data.searchKeyword)
  },

  showSearchSuggestions: function(keyword) {
    const suggestions = []

    // 书籍标题匹配
    this.data.allBooks.forEach(book => {
      if (book.title.includes(keyword)) {
        suggestions.push({
          id: `book_${book.id}`,
          text: book.title,
          type: '书籍',
          data: book
        })
      }
    })

    // 作者匹配
    this.data.allBooks.forEach(book => {
      if (book.author.includes(keyword)) {
        suggestions.push({
          id: `author_${book.id}`,
          text: `${book.author} - ${book.title}`,
          type: '作者',
          data: book
        })
      }
    })

    this.setData({
      searchSuggestions: suggestions.slice(0, 5),
      showSuggestions: suggestions.length > 0
    })
  },

  onSuggestionClick: function(e) {
    const suggestion = e.currentTarget.dataset.suggestion
    this.setData({
      searchKeyword: suggestion.text,
      showSuggestions: false
    })
    this.filterBooks()
  },

  onClearSearch: function() {
    this.setData({
      searchKeyword: '',
      showSuggestions: false
    })
    this.filterBooks()
  },

  // 分类筛选
  onCategorySelect: function(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category.id })
    this.filterBooks()
  },

  // 排序
  onSortChange: function(e) {
    const sortBy = e.currentTarget.dataset.sort
    this.setData({ sortBy: sortBy })
    this.filterBooks()
  },

  // 筛选书籍
  filterBooks: function() {
    let filtered = [...this.data.allBooks]

    // 分类筛选
    if (this.data.selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category === this.data.selectedCategory)
    }

    // 搜索筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(book => {
        return book.title.toLowerCase().includes(keyword) ||
               book.author.toLowerCase().includes(keyword) ||
               book.description.toLowerCase().includes(keyword) ||
               book.tags.some(tag => tag.toLowerCase().includes(keyword))
      })
    }

    // 排序
    switch (this.data.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.readCount - a.readCount)
        break
      case 'latest':
        filtered.sort((a, b) => new Date(b.updateTime || 0) - new Date(a.updateTime || 0))
        break
      default:
        // 默认排序：推荐算法
        filtered.sort((a, b) => {
          const scoreA = this.calculateBookScore(a)
          const scoreB = this.calculateBookScore(b)
          return scoreB - scoreA
        })
    }

    this.setData({ filteredBooks: filtered })
  },

  // 计算书籍推荐分数
  calculateBookScore: function(book) {
    let score = 0

    // 阅读量权重
    score += book.readCount * 0.3

    // 用户进度权重
    score += book.progress * 10

    // 收藏权重
    if (book.isFavorite) score += 100

    // 分类匹配权重
    const userPreferences = wx.getStorageSync('user_preferences') || {}
    if (userPreferences.favoriteCategories &&
        userPreferences.favoriteCategories.includes(book.category)) {
      score += 50
    }

    return score
  },

  // 书籍点击
  onBookClick: function(e) {
    const book = e.currentTarget.dataset.book

    // 记录阅读历史
    this.recordReadingHistory(book)

    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/classics/detail/detail?id=${book.id}`,
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  // 收藏切换
  onToggleFavorite: function(e) {
    const book = e.currentTarget.dataset.book
    const newFavoriteStatus = !book.isFavorite

    // 更新本地数据
    const books = this.data.allBooks.map(b => {
      if (b.id === book.id) {
        return { ...b, isFavorite: newFavoriteStatus }
      }
      return b
    })

    this.setData({ allBooks: books })
    this.filterBooks()

    // 保存到本地存储
    this.saveFavoriteStatus(book.id, newFavoriteStatus)

    wx.showToast({
      title: newFavoriteStatus ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1500
    })
  },

  // 数据持久化方法
  recordReadingHistory: function(book) {
    try {
      let history = wx.getStorageSync('reading_history') || []

      // 移除已存在的记录
      history = history.filter(item => item.id !== book.id)

      // 添加到开头
      history.unshift({
        id: book.id,
        title: book.title,
        author: book.author,
        timestamp: new Date().toISOString()
      })

      // 限制历史记录数量
      history = history.slice(0, 50)

      wx.setStorageSync('reading_history', history)
    } catch (error) {
      console.error('记录阅读历史失败:', error)
    }
  },

  saveFavoriteStatus: function(bookId, isFavorite) {
    try {
      let favorites = wx.getStorageSync('favorite_books') || []

      if (isFavorite) {
        if (!favorites.includes(bookId)) {
          favorites.push(bookId)
        }
      } else {
        favorites = favorites.filter(id => id !== bookId)
      }

      wx.setStorageSync('favorite_books', favorites)
    } catch (error) {
      console.error('保存收藏状态失败:', error)
    }
  },

  saveSearchHistory: function(keyword) {
    if (!keyword || keyword.trim().length === 0) return

    try {
      let searchHistory = wx.getStorageSync('search_history') || []

      // 移除已存在的关键词
      searchHistory = searchHistory.filter(item => item !== keyword)

      // 添加到开头
      searchHistory.unshift(keyword)

      // 限制数量
      searchHistory = searchHistory.slice(0, 20)

      wx.setStorageSync('search_history', searchHistory)
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  },

  loadSearchSuggestions: function() {
    try {
      const searchHistory = wx.getStorageSync('search_history') || []
      // 可以基于搜索历史生成建议
    } catch (error) {
      console.error('加载搜索建议失败:', error)
    }
  },

  // 数据刷新
  refreshData: function(isPullRefresh = false) {
    if (isPullRefresh) {
      this.setData({ refreshing: true })
    }

    // 重新加载数据
    this.loadBooksData()

    if (isPullRefresh) {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    }
  },

  loadMoreBooks: function() {
    // 如果有分页数据，可以在这里加载更多
    console.log('加载更多书籍')
  },

  // 其他方法
  onViewAllRecommended: function() {
    this.setData({
      selectedCategory: 'all',
      sortBy: 'popular'
    })
    this.filterBooks()
  },

  // 获取书籍内容的方法（示例数据）
  getLunyuContent: function() {
    return {
      chapters: [
        {
          id: 1,
          title: '学而篇第一',
          content: [
            {
              id: 1,
              original: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"',
              translation: '孔子说："学了又时常温习和练习，不是很愉快吗？有志同道合的人从远方来，不是很令人高兴的吗？人家不了解我，我也不怨恨、恼怒，不也是一个有德的君子吗？"',
              annotation: '这是《论语》的开篇，体现了孔子对学习、友谊和修养的基本态度。'
            }
          ]
        }
      ]
    }
  },

  getDaodejingContent: function() {
    return {
      chapters: [
        {
          id: 1,
          title: '第一章',
          content: [
            {
              id: 1,
              original: '道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。',
              translation: '可以说出的道，就不是永恒不变的道。可以叫出的名，就不是永恒不变的名。无名是天地的开始；有名是万物的母亲。',
              annotation: '这是道德经的开篇，阐述了道的不可言说性和万物的本源。'
            }
          ]
        }
      ]
    }
  },

  getMengziContent: function() {
    return {
      chapters: [
        {
          id: 1,
          title: '梁惠王章句上',
          content: [
            {
              id: 1,
              original: '孟子见梁惠王。王曰："叟！不远千里而来，亦将有以利吾国乎？"',
              translation: '孟子拜见梁惠王。梁惠王说："老先生，您不远千里而来，一定是有什么对我的国家有利的高见吧？"',
              annotation: '这是孟子与梁惠王对话的开始，体现了当时君主对利益的关注。'
            }
          ]
        }
      ]
    }
  },

  getZhuangziContent: function() {
    return { chapters: [] }
  },

  getDaxueContent: function() {
    return { chapters: [] }
  },

  getZhongyongContent: function() {
    return { chapters: [] }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智经典库 - 传统文化经典阅读',
      path: '/pages/classics/classics',
      imageUrl: '/images/share/classics.png'
    }
  }
})