// 知识图谱页面逻辑 - 修复版本
const app = getApp()

Page({
  data: {
    searchQuery: '',
    searchResults: [],
    selectedConcept: '',
    conceptAnalysis: null,
    relatedConcepts: [],
    conceptStories: [],
    learningPath: {},
    recommendations: [],
    coreConcepts: [
      {
        name: '仁',
        icon: '❤️',
        category: '儒家核心',
        importance: 0.95,
        description: '仁爱、人与人之间的关爱和善意'
      },
      {
        name: '义',
        icon: '⚖️',
        category: '儒家核心',
        importance: 0.90,
        description: '道德上的正确行为和原则'
      },
      {
        name: '礼',
        icon: '🎭',
        category: '儒家核心',
        importance: 0.85,
        description: '规范人们行为的准则和仪式'
      },
      {
        name: '智',
        icon: '🧠',
        category: '儒家核心',
        importance: 0.80,
        description: '智慧和知识，明辨是非的能力'
      },
      {
        name: '道',
        icon: '🌟',
        category: '道家核心',
        importance: 0.98,
        description: '宇宙万物的根本规律和本源'
      },
      {
        name: '德',
        icon: '✨',
        category: '道家核心',
        importance: 0.90,
        description: '道德品质和精神修养'
      }
    ],
    loading: false,
    loadingText: '加载中...'
  },

  onLoad: function(options) {
    console.log('知识图谱页面加载')
    this.loadRecommendations()

    // 如果从其他页面传入了概念，直接选择
    if (options.concept) {
      const concept = decodeURIComponent(options.concept)
      this.selectConcept({ currentTarget: { dataset: { concept: concept } } })
    }
  },

  onShow: function() {
    console.log('知识图谱页面显示')
  },

  onPullDownRefresh: function() {
    const self = this
    this.loadRecommendations().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchQuery: e.detail.value
    })
  },

  // 执行搜索
  performSearch: function() {
    const self = this
    const query = this.data.searchQuery.trim()

    if (!query) {
      app.showError('请输入搜索关键词')
      return
    }

    this.setData({
      loading: true,
      loadingText: '智能搜索中...'
    })

    app.request({
      url: '/api/v1/knowledge/search?q=' + encodeURIComponent(query)
    }).then(function(result) {
      if (result.success) {
        self.setData({
          searchResults: result.data.results
        })
        if (result.data.results.length === 0) {
          app.showError('未找到相关概念')
        }
      } else {
        throw new Error(result.error || '搜索失败')
      }
    }).catch(function(error) {
      console.error('搜索失败:', error)
      app.showError('搜索失败: ' + error.message)
    }).finally(function() {
      self.setData({
        loading: false
      })
    })
  },

  // 选择概念
  selectConcept: function(e) {
    const concept = e.currentTarget.dataset.concept
    this.setData({
      selectedConcept: concept,
      conceptAnalysis: null,
      relatedConcepts: [],
      conceptStories: [],
      learningPath: {}
    })

    // 加载概念详情
    this.loadConceptAnalysis(concept)
  },

  // 加载概念分析
  loadConceptAnalysis: function(concept) {
    const self = this

    this.setData({
      loading: true,
      loadingText: '加载概念分析中...'
    })

    app.request({
      url: '/api/v1/knowledge/concept/' + encodeURIComponent(concept)
    }).then(function(result) {
      if (result.success) {
        self.setData({
          conceptAnalysis: result.data
        })
      } else {
        throw new Error(result.error || '加载概念分析失败')
      }
    }).catch(function(error) {
      console.error('加载概念分析失败:', error)
      app.showError('加载失败: ' + error.message)
    }).finally(function() {
      self.setData({
        loading: false
      })
    })
  },

  // 查看相关故事
  viewStories: function() {
    const self = this

    if (!this.data.selectedConcept) {
      app.showError('请先选择概念')
      return
    }

    this.setData({
      loading: true,
      loadingText: '加载相关故事中...'
    })

    app.request({
      url: '/api/v1/knowledge/concept/' + encodeURIComponent(this.data.selectedConcept) + '/stories'
    }).then(function(result) {
      if (result.success) {
        self.setData({
          conceptStories: result.data.stories
        })
        app.showSuccess('故事加载完成')
      } else {
        throw new Error(result.error || '加载故事失败')
      }
    }).catch(function(error) {
      console.error('加载故事失败:', error)
      app.showError('加载失败: ' + error.message)
    }).finally(function() {
      self.setData({
        loading: false
      })
    })
  },

  // 扩展概念
  expandConcept: function() {
    const self = this

    if (!this.data.selectedConcept) {
      app.showError('请先选择概念')
      return
    }

    this.setData({
      loading: true,
      loadingText: '扩展相关概念中...'
    })

    app.request({
      url: '/api/v1/knowledge/concept/' + encodeURIComponent(this.data.selectedConcept) + '/expand',
      method: 'POST',
      data: { type: 'related' }
    }).then(function(result) {
      if (result.success) {
        self.setData({
          relatedConcepts: result.data.expanded_concepts
        })
        app.showSuccess('概念扩展完成')
      } else {
        throw new Error(result.error || '扩展概念失败')
      }
    }).catch(function(error) {
      console.error('扩展概念失败:', error)
      app.showError('扩展失败: ' + error.message)
    }).finally(function() {
      self.setData({
        loading: false
      })
    })
  },

  // 生成学习路径
  generateLearningPath: function() {
    const self = this

    if (!this.data.selectedConcept) {
      app.showError('请先选择概念')
      return
    }

    this.setData({
      loading: true,
      loadingText: '生成学习路径中...'
    })

    app.request({
      url: '/api/v1/knowledge/learning-path',
      method: 'POST',
      data: {
        interests: [this.data.selectedConcept],
        level: 'beginner'
      }
    }).then(function(result) {
      if (result.success) {
        self.setData({
          learningPath: result.data.learning_path
        })
        app.showSuccess('学习路径生成完成')
      } else {
        throw new Error(result.error || '生成学习路径失败')
      }
    }).catch(function(error) {
      console.error('生成学习路径失败:', error)
      app.showError('生成失败: ' + error.message)
    }).finally(function() {
      self.setData({
        loading: false
      })
    })
  },

  // 加载推荐
  loadRecommendations: function() {
    const self = this

    return app.request({
      url: '/api/v1/knowledge/recommend',
      method: 'POST',
      data: {
        current_concepts: this.data.selectedConcept ? [this.data.selectedConcept] : [],
        type: 'related'
      }
    }).then(function(result) {
      if (result.success) {
        self.setData({
          recommendations: result.data.recommendations
        })
      }
    }).catch(function(error) {
      console.error('加载推荐失败:', error)
      // 使用默认推荐
      self.setData({
        recommendations: [
          {
            concept: '中庸',
            reason: '儒家重要思想',
            difficulty: '中级',
            estimated_time: '2小时'
          },
          {
            concept: '无为',
            reason: '道家核心理念',
            difficulty: '初级',
            estimated_time: '1小时'
          },
          {
            concept: '格物致知',
            reason: '理学认识方法',
            difficulty: '高级',
            estimated_time: '3小时'
          }
        ]
      })
    })
  },

  // 分享功能
  onShareAppMessage: function() {
    const concept = this.data.selectedConcept
    return {
      title: concept ? '儒智知识图谱 - 探索"' + concept + '"的智慧' : '儒智知识图谱 - 探索传统文化的智慧网络',
      desc: '使用AI技术深度解析传统文化概念，发现知识间的深层联系',
      path: concept ? '/pages/knowledge/knowledge?concept=' + encodeURIComponent(concept) : '/pages/knowledge/knowledge'
    }
  }
})
