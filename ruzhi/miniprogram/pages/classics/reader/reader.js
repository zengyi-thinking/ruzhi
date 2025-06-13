// 经典阅读器页面逻辑
const app = getApp()
const CommonUtils = require('../../../utils/common.js')

Page({
  data: {
    classic: {},
    currentChapter: 1,
    content: '',
    chapters: [],
    fontSize: 16,
    lineHeight: 1.8,
    theme: 'light',
    showSettings: false,
    bookmarks: [],
    notes: [],
    progress: 0
  },

  onLoad: function(options) {
    console.log('经典阅读器页面加载', options)
    const classicId = options.classic
    if (classicId) {
      this.loadClassic(classicId)
    }
  },

  onShow: function() {
    console.log('经典阅读器页面显示')
  },

  onUnload: function() {
    // 保存阅读进度
    this.saveProgress()
  },

  // 加载经典内容
  loadClassic: function(classicId) {
    const self = this
    
    // 模拟加载经典数据
    const classicData = this.getClassicData(classicId)
    this.setData({
      classic: classicData,
      chapters: classicData.chapters,
      currentChapter: 1
    })
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: classicData.title
    })
    
    // 加载第一章内容
    this.loadChapterContent(1)
  },

  // 获取经典数据
  getClassicData: function(classicId) {
    const classics = {
      lunyu: {
        id: 'lunyu',
        title: '论语',
        author: '孔子及其弟子',
        chapters: [
          { id: 1, title: '学而篇第一' },
          { id: 2, title: '为政篇第二' },
          { id: 3, title: '八佾篇第三' }
        ]
      },
      daodejing: {
        id: 'daodejing',
        title: '道德经',
        author: '老子',
        chapters: [
          { id: 1, title: '第一章' },
          { id: 2, title: '第二章' },
          { id: 3, title: '第三章' }
        ]
      }
    }
    
    return classics[classicId] || classics.lunyu
  },

  // 加载章节内容
  loadChapterContent: function(chapterNum) {
    const self = this
    
    // 模拟章节内容
    const content = this.getChapterContent(this.data.classic.id, chapterNum)
    this.setData({
      currentChapter: chapterNum,
      content: content
    })
    
    // 计算阅读进度
    const progress = (chapterNum / this.data.chapters.length) * 100
    this.setData({ progress: progress })
  },

  // 获取章节内容
  getChapterContent: function(classicId, chapterNum) {
    const contents = {
      lunyu: {
        1: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"\n\n有子曰："其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！"',
        2: '子曰："为政以德，譬如北辰，居其所而众星共之。"\n\n子曰："《诗》三百，一言以蔽之，曰：'思无邪'。"',
        3: '孔子谓季氏："八佾舞于庭，是可忍也，孰不可忍也？"\n\n三家者以《雍》彻。子曰："'相维辟公，天子穆穆'，奚取于三家之堂？"'
      },
      daodejing: {
        1: '道可道，非常道。名可名，非常名。\n无名天地之始；有名万物之母。\n故常无，欲以观其妙；常有，欲以观其徼。\n此两者，同出而异名，同谓之玄。玄之又玄，众妙之门。',
        2: '天下皆知美之为美，斯恶已。皆知善之为善，斯不善已。\n故有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。\n是以圣人处无为之事，行不言之教；万物作焉而不辞，生而不有，为而不恃，功成而弗居。夫唯弗居，是以不去。',
        3: '不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。\n是以圣人之治，虚其心，实其腹，弱其志，强其骨。常使民无知无欲。使夫智者不敢为也。为无为，则无不治。'
      }
    }
    
    return contents[classicId] && contents[classicId][chapterNum] || '内容加载中...'
  },

  // 上一章
  prevChapter: function() {
    if (this.data.currentChapter > 1) {
      this.loadChapterContent(this.data.currentChapter - 1)
    }
  },

  // 下一章
  nextChapter: function() {
    if (this.data.currentChapter < this.data.chapters.length) {
      this.loadChapterContent(this.data.currentChapter + 1)
    }
  },

  // 跳转到指定章节
  goToChapter: function(e) {
    const chapterNum = e.currentTarget.dataset.chapter
    this.loadChapterContent(parseInt(chapterNum))
  },

  // 显示/隐藏设置
  toggleSettings: function() {
    this.setData({ showSettings: !this.data.showSettings })
  },

  // 调整字体大小
  adjustFontSize: function(e) {
    const action = e.currentTarget.dataset.action
    let fontSize = this.data.fontSize
    
    if (action === 'increase' && fontSize < 24) {
      fontSize += 2
    } else if (action === 'decrease' && fontSize > 12) {
      fontSize -= 2
    }
    
    this.setData({ fontSize: fontSize })
  },

  // 调整行高
  adjustLineHeight: function(e) {
    const action = e.currentTarget.dataset.action
    let lineHeight = this.data.lineHeight
    
    if (action === 'increase' && lineHeight < 2.5) {
      lineHeight += 0.2
    } else if (action === 'decrease' && lineHeight > 1.2) {
      lineHeight -= 0.2
    }
    
    this.setData({ lineHeight: Math.round(lineHeight * 10) / 10 })
  },

  // 切换主题
  toggleTheme: function() {
    const theme = this.data.theme === 'light' ? 'dark' : 'light'
    this.setData({ theme: theme })
  },

  // 添加书签
  addBookmark: function() {
    const bookmark = {
      id: CommonUtils.generateId('bookmark'),
      chapter: this.data.currentChapter,
      time: new Date().toLocaleString(),
      note: ''
    }
    
    const bookmarks = this.data.bookmarks.concat([bookmark])
    this.setData({ bookmarks: bookmarks })
    app.showSuccess('书签已添加')
  },

  // 保存阅读进度
  saveProgress: function() {
    const progressData = {
      classicId: this.data.classic.id,
      currentChapter: this.data.currentChapter,
      progress: this.data.progress,
      lastReadTime: new Date().toISOString()
    }
    
    try {
      wx.setStorageSync('reading_progress_' + this.data.classic.id, progressData)
    } catch (error) {
      console.error('保存阅读进度失败:', error)
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '我正在阅读《' + this.data.classic.title + '》',
      desc: '与我一起感受传统文化经典的魅力',
      path: '/pages/classics/reader/reader?classic=' + this.data.classic.id
    }
  }
})
