// 古文今译与解析页面
const { classicInterpretService } = require('../../../services/index')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户输入
    inputText: '',
    
    // 结果数据
    result: null,
    
    // 分析层级
    currentLevel: 'all',
    levels: [
      { id: 'all', name: '全部分析' },
      { id: 'word', name: '字词义' },
      { id: 'sentence', name: '句义' },
      { id: 'paragraph', name: '篇章义' },
      { id: 'thought', name: '思想价值' }
    ],
    
    // 预设文本
    presetTexts: [
      {
        title: '《论语·学而》',
        text: '学而时习之，不亦说乎？'
      },
      {
        title: '《大学》开篇',
        text: '大学之道，在明明德，在亲民，在止于至善。'
      },
      {
        title: '《中庸》开篇',
        text: '天命之谓性，率性之谓道，修道之谓教。'
      },
      {
        title: '《孟子·告子上》',
        text: '仁，人心也；义，人路也。'
      }
    ],
    
    // 交互状态
    loading: false,
    errorMessage: '',
    dataSource: '',
    
    // 显示控制
    showAllusions: false,
    selectedWord: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '古文今译'
    })
    
    // 初始化服务
    classicInterpretService.init()
    
    // 如果传入了文本参数，则直接解析
    if (options && options.text) {
      this.setData({ inputText: decodeURIComponent(options.text) })
      this.interpretText()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // 可以在这里处理页面初次渲染完成后的逻辑
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时可以刷新数据
  },

  /**
   * 输入框内容变化处理
   */
  onInputChange: function (e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  /**
   * 清空输入框
   */
  clearInput: function () {
    this.setData({
      inputText: '',
      result: null,
      errorMessage: '',
      dataSource: ''
    })
  },

  /**
   * 使用预设文本
   */
  usePresetText: function (e) {
    const index = e.currentTarget.dataset.index
    const presetText = this.data.presetTexts[index]
    
    this.setData({
      inputText: presetText.text,
      result: null
    })
    
    // 自动解析
    this.interpretText()
  },

  /**
   * 解析文本
   */
  interpretText: async function () {
    const text = this.data.inputText.trim()
    
    if (!text) {
      wx.showToast({
        title: '请输入或选择文本',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      loading: true,
      errorMessage: '',
      result: null
    })
    
    try {
      // 调用服务进行解析
      const result = await classicInterpretService.getLayeredAnalysis(text, this.data.currentLevel)
      
      if (result.success) {
        this.setData({
          result: result.data,
          dataSource: result.source || 'unknown'
        })
        
        // 如果是离线数据且有警告
        if (result.warning) {
          wx.showToast({
            title: result.warning,
            icon: 'none'
          })
        }
      } else {
        this.setData({
          errorMessage: result.error || '解析失败'
        })
      }
    } catch (error) {
      console.error('解析出错:', error)
      this.setData({
        errorMessage: '服务出错，请稍后再试'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  /**
   * 切换分析层级
   */
  changeLevel: function (e) {
    const level = e.currentTarget.dataset.level
    
    this.setData({
      currentLevel: level,
      result: null
    })
    
    // 如果有输入文本，自动重新解析
    if (this.data.inputText) {
      this.interpretText()
    }
  },

  /**
   * 查看词汇详细解释
   */
  viewWordDetail: function (e) {
    const wordIndex = e.currentTarget.dataset.index
    const wordLevel = this.data.result.wordLevel
    
    if (wordLevel && wordLevel[wordIndex]) {
      this.setData({
        selectedWord: wordLevel[wordIndex]
      })
    }
  },

  /**
   * 关闭词汇详情
   */
  closeWordDetail: function () {
    this.setData({
      selectedWord: null
    })
  },

  /**
   * 查看相关典故
   */
  toggleAllusions: async function () {
    if (this.data.showAllusions) {
      // 关闭典故面板
      this.setData({
        showAllusions: false
      })
      return
    }
    
    // 获取典故信息
    this.setData({
      loading: true
    })
    
    try {
      const text = this.data.inputText.trim()
      const result = await classicInterpretService.getRelatedAllusions(text)
      
      if (result.success && result.data.allusions) {
        this.setData({
          allusions: result.data.allusions,
          showAllusions: true
        })
      } else {
        wx.showToast({
          title: '无法获取相关典故',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取典故出错:', error)
      wx.showToast({
        title: '获取典故失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  /**
   * 分享功能
   */
  onShareAppMessage: function () {
    const text = this.data.inputText
    
    return {
      title: `古文今译：${text.substring(0, 10)}${text.length > 10 ? '...' : ''}`,
      path: `/pages/classics/interpret/interpret?text=${encodeURIComponent(text)}`,
      imageUrl: '/images/share/interpret.png'
    }
  }
}) 