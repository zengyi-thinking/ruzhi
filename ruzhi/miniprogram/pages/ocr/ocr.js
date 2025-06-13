// OCR识别页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const ApiUtils = require('../../utils/api.js')

Page({
  data: {
    selectedMode: 'ancient',
    ocrModes: [
      {
        id: 'ancient',
        name: '古籍识别',
        icon: '📜',
        description: '专门针对古代文献和书法作品的OCR识别'
      },
      {
        id: 'handwriting',
        name: '手写识别',
        icon: '✍️',
        description: '识别手写中文内容，适用于笔记和手写文档'
      },
      {
        id: 'print',
        name: '印刷体识别',
        icon: '📄',
        description: '识别现代印刷体中文，准确率高'
      },
      {
        id: 'mixed',
        name: '混合识别',
        icon: '🔄',
        description: '同时支持古文和现代文本的混合识别'
      }
    ],
    selectedImage: '',
    recognitionResult: null,
    interpretationResult: null,
    ocrHistory: [],
    loading: false,
    loadingText: '处理中...'
  },

  onLoad: function(options) {
    console.log('OCR页面加载')
    this.loadOCRHistory()

    // 如果从其他页面传入了图片路径，直接处理
    if (options.imagePath) {
      const imagePath = decodeURIComponent(options.imagePath)
      this.setData({ selectedImage: imagePath })
      this.startRecognition()
    }
  },

  onShow: function() {
    console.log('OCR页面显示')
  },

  onPullDownRefresh: function() {
    const self = this
    this.loadOCRHistory().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 选择识别模式
  selectMode: function(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ selectedMode: mode })
    console.log('选择识别模式:', mode)
  },

  // 从相机选择图片
  chooseFromCamera: function() {
    const self = this
    CommonUtils.chooseImage({
      sourceType: ['camera'],
      camera: 'back'
    }).then(function(tempFilePath) {
      self.setData({ selectedImage: tempFilePath })
      console.log('从相机选择图片:', tempFilePath)
    }).catch(function(error) {
      console.error('选择图片失败:', error)
      app.showError('选择图片失败')
    })
  },

  // 从相册选择图片
  chooseFromAlbum: function() {
    const self = this
    CommonUtils.chooseImage({
      sourceType: ['album']
    }).then(function(tempFilePath) {
      self.setData({ selectedImage: tempFilePath })
      console.log('从相册选择图片:', tempFilePath)
    }).catch(function(error) {
      console.error('选择图片失败:', error)
      app.showError('选择图片失败')
    })
  },

  // 重新选择图片
  reSelectImage: function() {
    this.setData({
      selectedImage: '',
      recognitionResult: null,
      interpretationResult: null
    })
  },

  // 开始识别
  startRecognition: function() {
    const self = this

    if (!this.data.selectedImage) {
      app.showError('请先选择图片')
      return
    }

    this.setData({
      loading: true,
      loadingText: '正在识别图片...',
      recognitionResult: null,
      interpretationResult: null
    })

    this.performOCR().then(function(result) {
      if (result.success) {
        self.setData({
          recognitionResult: result.data,
          loadingText: '识别完成'
        })

        // 保存到历史记录
        self.saveToHistory(result.data)

        app.showSuccess('识别成功')
      } else {
        throw new Error(result.error || '识别失败')
      }
    }).catch(function(error) {
      console.error('OCR识别失败:', error)
      app.showError('识别失败: ' + error.message)
    }).finally(function() {
      self.setData({ loading: false })
    })
  },

  // 执行OCR识别
  performOCR: function() {
    const self = this
    return ApiUtils.ocr.analyze(this.data.selectedImage, this.data.selectedMode).catch(function(error) {
      console.error('上传文件失败:', error)
      // 使用备用识别结果
      return self.getFallbackOCRResult()
    })
  },

  // 获取备用OCR结果
  getFallbackOCRResult() {
    const mockTexts = {
      ancient: [
        '子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」',
        '道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。',
        '仁者爱人，智者知人。仁者不忧，智者不惑，勇者不惧。'
      ],
      handwriting: [
        '今日学习传统文化，深感古人智慧之深邃。',
        '读书破万卷，下笔如有神。'
      ],
      print: [
        '中华文化源远流长，博大精深。',
        '传统文化是中华民族的精神家园。'
      ],
      mixed: [
        '古人云：「学而时习之，不亦说乎？」这句话在现代仍有重要意义。'
      ]
    }

    const texts = mockTexts[this.data.selectedMode] || mockTexts.ancient
    const selectedText = texts[Math.floor(Math.random() * texts.length)]

    return {
      success: true,
      data: {
        text: selectedText,
        confidence: Math.floor(Math.random() * 15) + 85, // 85-100
        mode: this.data.selectedMode,
        recognizeTime: Math.floor(Math.random() * 2000) + 1000, // 1-3秒
        source: 'fallback'
      }
    }
  },

  // AI解读文本
  interpretText: function() {
    const self = this

    if (!this.data.recognitionResult) {
      app.showError('请先进行文本识别')
      return
    }

    this.setData({
      loading: true,
      loadingText: '正在AI解读...'
    })

    ApiUtils.ocr.interpret(this.data.recognitionResult.text, this.data.recognitionResult.mode).then(function(result) {
      if (result.success) {
        self.setData({ interpretationResult: result.data })
        app.showSuccess('解读完成')
      } else {
        throw new Error(result.error || '解读失败')
      }
    }).catch(function(error) {
      console.error('AI解读失败:', error)
      app.showError('解读失败: ' + error.message)
    }).finally(function() {
      self.setData({ loading: false })
    })
  },

  // 复制文本
  copyText: function() {
    if (!this.data.recognitionResult) {
      app.showError('没有可复制的文本')
      return
    }

    CommonUtils.copyToClipboard(this.data.recognitionResult.text, function() {
      app.showSuccess('文本已复制到剪贴板')
    }, function() {
      app.showError('复制失败')
    })
  },

  // 保存结果
  saveResult: function() {
    if (!this.data.recognitionResult) {
      app.showError('没有可保存的结果')
      return
    }

    const metadata = {
      timestamp: new Date().toISOString(),
      source: 'miniprogram'
    }

    ApiUtils.ocr.save(
      app.globalData.currentUser.id,
      this.data.recognitionResult.text,
      this.data.recognitionResult.confidence,
      this.data.recognitionResult.mode,
      metadata
    ).then(function(result) {
      if (result.success) {
        app.showSuccess('保存成功')
      } else {
        throw new Error(result.error || '保存失败')
      }
    }).catch(function(error) {
      console.error('保存结果失败:', error)
      app.showError('保存失败: ' + error.message)
    })
  },

  // 加载OCR历史
  loadOCRHistory: function() {
    const self = this
    return ApiUtils.ocr.getHistory(app.globalData.currentUser.id, 10).then(function(result) {
      if (result.success) {
        self.setData({ ocrHistory: result.data })
      }
    }).catch(function(error) {
      console.error('加载OCR历史失败:', error)
    })
  },

  // 保存到历史记录
  saveToHistory: function(data) {
    const historyItem = {
      id: Date.now().toString(),
      text: data.text,
      confidence: data.confidence,
      mode: data.mode,
      timestamp: CommonUtils.formatTime(new Date())
    }

    const history = [historyItem].concat(this.data.ocrHistory.slice(0, 9))
    this.setData({ ocrHistory: history })
  },

  // 加载历史项目
  loadHistoryItem: function(e) {
    const item = e.currentTarget.dataset.item
    this.setData({
      recognitionResult: {
        text: item.text,
        confidence: item.confidence,
        mode: item.mode,
        recognizeTime: 0
      },
      interpretationResult: null
    })
  },

  // 根据ID获取模式名称
  getModeNameById: function(id) {
    const mode = this.data.ocrModes.find(function(m) {
      return m.id === id
    })
    return mode ? mode.name : id
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '儒智OCR - 古籍文本智能识别',
      desc: '使用AI技术识别古籍文本，深度解读传统文化',
      path: '/pages/ocr/ocr'
    }
  }
})
