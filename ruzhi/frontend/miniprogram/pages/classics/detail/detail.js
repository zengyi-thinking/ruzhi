// 经典详情页面
const app = getApp()
const { aiService } = require('../../../utils/ai.js')

Page({
  data: {
    bookId: '',
    chapterId: 1,
    book: null,
    chapters: [],
    recommendations: [],
    userNotes: [],
    viewMode: 'list', // list 或 grid
    loading: true
  },

  onLoad: function(options) {
    console.log('经典详情页加载:', options)

    const bookId = options.id
    const chapterId = parseInt(options.chapter) || 1

    if (!bookId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({
      bookId: bookId,
      chapterId: chapterId
    })

    this.loadBookDetail()
  },

  onShow: function() {
    // 刷新阅读进度
    this.refreshReadingProgress()
  },

  onPullDownRefresh: function() {
    this.loadBookDetail(true)
  },

  // 加载书籍详情
  loadBookDetail: function(isRefresh = false) {
    if (isRefresh) {
      this.setData({ loading: true })
    }

    // 模拟书籍数据
    const booksData = this.getBooksData()
    const book = booksData.find(b => b.id === this.data.bookId)

    if (!book) {
      wx.showToast({
        title: '书籍不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 加载用户进度和收藏状态
    this.loadUserProgress(book)

    // 生成章节数据
    const chapters = this.generateChapters(book)

    // 生成推荐数据
    const recommendations = this.generateRecommendations(book)

    // 加载用户笔记
    const userNotes = this.loadUserNotes(book.id)

    this.setData({
      book: book,
      chapters: chapters,
      recommendations: recommendations,
      userNotes: userNotes,
      loading: false
    })

    // 设置页面标题
    wx.setNavigationBarTitle({
      title: book.title
    })

    if (isRefresh) {
      wx.stopPullDownRefresh()
    }
  },

  // 获取书籍数据
  getBooksData: function() {
    return [
      {
        id: 'lunyu',
        title: '论语',
        author: '孔子及其弟子',
        dynasty: '春秋',
        description: '记录孔子及其弟子言行的儒家经典，是中国古代思想文化的重要源泉。',
        cover: '/images/classics/lunyu.jpg',
        chapters: 20,
        readCount: 1256,
        tags: ['儒家', '经典', '教育'],
        progress: 0,
        isFavorite: false
      },
      {
        id: 'daodejing',
        title: '道德经',
        author: '老子',
        dynasty: '春秋',
        description: '道家哲学的根本经典，阐述了道法自然的深刻思想。',
        cover: '/images/classics/daodejing.jpg',
        chapters: 81,
        readCount: 987,
        tags: ['道家', '哲学', '自然'],
        progress: 0,
        isFavorite: false
      },
      {
        id: 'mengzi',
        title: '孟子',
        author: '孟子',
        dynasty: '战国',
        description: '儒家重要经典，阐述性善论和仁政思想。',
        cover: '/images/classics/mengzi.jpg',
        chapters: 14,
        readCount: 756,
        tags: ['儒家', '性善论', '仁政'],
        progress: 0,
        isFavorite: false
      }
    ]
  },

  // 加载用户进度
  loadUserProgress: function(book) {
    try {
      const progress = wx.getStorageSync('reading_progress') || {}
      const favorites = wx.getStorageSync('favorite_books') || []

      book.progress = progress[book.id] || 0
      book.isFavorite = favorites.includes(book.id)
    } catch (error) {
      console.error('加载用户进度失败:', error)
    }
  },

  // 刷新阅读进度
  refreshReadingProgress: function() {
    if (this.data.book) {
      this.loadUserProgress(this.data.book)
      this.setData({ book: this.data.book })
    }
  },

  // 生成章节数据
  generateChapters: function(book) {
    const chapters = []

    for (let i = 1; i <= book.chapters; i++) {
      chapters.push({
        id: i,
        title: this.getChapterTitle(book.id, i),
        preview: this.getChapterPreview(book.id, i),
        length: Math.floor(Math.random() * 2000) + 500,
        readTime: Math.floor(Math.random() * 10) + 3,
        status: this.getChapterStatus(book.id, i),
        progress: this.getChapterProgress(book.id, i)
      })
    }

    return chapters
  },

  // 获取章节标题
  getChapterTitle: function(bookId, chapterNum) {
    const titles = {
      'lunyu': [
        '学而篇第一', '为政篇第二', '八佾篇第三', '里仁篇第四', '公冶长篇第五',
        '雍也篇第六', '述而篇第七', '泰伯篇第八', '子罕篇第九', '乡党篇第十',
        '先进篇第十一', '颜渊篇第十二', '子路篇第十三', '宪问篇第十四', '卫灵公篇第十五',
        '季氏篇第十六', '阳货篇第十七', '微子篇第十八', '子张篇第十九', '尧曰篇第二十'
      ],
      'daodejing': Array.from({length: 81}, (_, i) => `第${i + 1}章`),
      'mengzi': [
        '梁惠王章句上', '梁惠王章句下', '公孙丑章句上', '公孙丑章句下',
        '滕文公章句上', '滕文公章句下', '离娄章句上', '离娄章句下',
        '万章章句上', '万章章句下', '告子章句上', '告子章句下',
        '尽心章句上', '尽心章句下'
      ]
    }

    return titles[bookId] ? titles[bookId][chapterNum - 1] : `第${chapterNum}章`
  },

  // 获取章节预览
  getChapterPreview: function(bookId, chapterNum) {
    const previews = {
      'lunyu': {
        1: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？"',
        2: '子曰："为政以德，譬如北辰，居其所而众星共之。"'
      },
      'daodejing': {
        1: '道可道，非常道。名可名，非常名。无名天地之始；有名万物之母。'
      },
      'mengzi': {
        1: '孟子见梁惠王。王曰："叟！不远千里而来，亦将有以利吾国乎？"'
      }
    }

    return previews[bookId] && previews[bookId][chapterNum] || '章节内容预览...'
  },

  // 获取章节状态
  getChapterStatus: function(bookId, chapterNum) {
    try {
      const chapterProgress = wx.getStorageSync(`chapter_progress_${bookId}`) || {}
      const progress = chapterProgress[chapterNum] || 0

      if (progress === 0) return 'unread'
      if (progress >= 100) return 'completed'
      return 'reading'
    } catch (error) {
      return 'unread'
    }
  },

  // 获取章节进度
  getChapterProgress: function(bookId, chapterNum) {
    try {
      const chapterProgress = wx.getStorageSync(`chapter_progress_${bookId}`) || {}
      return chapterProgress[chapterNum] || 0
    } catch (error) {
      return 0
    }
  },

  // 生成推荐数据
  generateRecommendations: function(book) {
    const allBooks = this.getBooksData()
    return allBooks.filter(b =>
      b.id !== book.id &&
      b.tags.some(tag => book.tags.includes(tag))
    ).slice(0, 5)
  },

  // 加载用户笔记
  loadUserNotes: function(bookId) {
    try {
      const notes = wx.getStorageSync(`user_notes_${bookId}`) || []
      return notes.slice(0, 3) // 只显示最近3条
    } catch (error) {
      return []
    }
  },

  // 事件处理方法
  onStartReading: function() {
    // 跳转到阅读页面
    wx.navigateTo({
      url: `/pages/classics/reader/reader?bookId=${this.data.bookId}&chapter=${this.data.chapterId}`,
      fail: (error) => {
        console.error('跳转阅读页面失败:', error)
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      }
    })
  },

  onToggleFavorite: function() {
    const book = this.data.book
    const newFavoriteStatus = !book.isFavorite

    try {
      let favorites = wx.getStorageSync('favorite_books') || []

      if (newFavoriteStatus) {
        if (!favorites.includes(book.id)) {
          favorites.push(book.id)
        }
      } else {
        favorites = favorites.filter(id => id !== book.id)
      }

      wx.setStorageSync('favorite_books', favorites)

      this.setData({
        'book.isFavorite': newFavoriteStatus
      })

      wx.showToast({
        title: newFavoriteStatus ? '已收藏' : '已取消收藏',
        icon: 'success'
      })
    } catch (error) {
      console.error('收藏操作失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  onShare: function() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  onViewModeChange: function(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ viewMode: mode })
  },

  onChapterClick: function(e) {
    const chapter = e.currentTarget.dataset.chapter

    // 记录阅读历史
    this.recordChapterAccess(chapter)

    // 跳转到阅读页面
    wx.navigateTo({
      url: `/pages/classics/reader/reader?bookId=${this.data.bookId}&chapter=${chapter.id}`,
      fail: (error) => {
        console.error('跳转阅读页面失败:', error)
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      }
    })
  },

  onRecommendationClick: function(e) {
    const book = e.currentTarget.dataset.book

    // 跳转到推荐书籍的详情页
    wx.redirectTo({
      url: `/pages/classics/detail/detail?id=${book.id}`
    })
  },

  onViewAllNotes: function() {
    // 跳转到笔记页面
    wx.navigateTo({
      url: `/pages/classics/notes/notes?bookId=${this.data.bookId}`,
      fail: (error) => {
        console.error('跳转笔记页面失败:', error)
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
      }
    })
  },

  // 记录章节访问
  recordChapterAccess: function(chapter) {
    try {
      let accessHistory = wx.getStorageSync('chapter_access_history') || []

      const record = {
        bookId: this.data.bookId,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        timestamp: new Date().toISOString()
      }

      // 移除重复记录
      accessHistory = accessHistory.filter(item =>
        !(item.bookId === record.bookId && item.chapterId === record.chapterId)
      )

      // 添加到开头
      accessHistory.unshift(record)

      // 限制记录数量
      accessHistory = accessHistory.slice(0, 100)

      wx.setStorageSync('chapter_access_history', accessHistory)
    } catch (error) {
      console.error('记录章节访问失败:', error)
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    const book = this.data.book
    return {
      title: `${book.title} - ${book.author}`,
      desc: book.description,
      path: `/pages/classics/detail/detail?id=${book.id}`,
      imageUrl: book.cover
    }
  }
})