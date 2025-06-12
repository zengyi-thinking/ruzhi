// OCR识别页面
const app = getApp()
const { ocrAPI } = require('../../api/index')

Page({
  data: {
    // 图片相关
    imageUrl: '',
    hasImage: false,
    
    // OCR设置
    ocrModes: [],
    selectedMode: 'ancient',
    ocrSettings: {
      enhance_image: true,
      detect_layout: true,
      recognize_variants: true,
      enhance_options: {
        denoise: true,
        contrast_enhance: true,
        perspective_correction: true,
        binarization: true
      }
    },
    
    // 识别结果
    ocrResult: null,
    hasResult: false,
    
    // 状态
    loading: false,
    recognizing: false,
    
    // 历史记录
    historyList: [],
    showHistory: false
  },

  onLoad: function (options) {
    console.log('OCR页面加载', options)
    this.initPage()
  },

  onShow: function () {
    console.log('OCR页面显示')
    this.loadHistory()
  },

  onShareAppMessage: function () {
    return {
      title: '儒智古籍识别 - 智能OCR识别古籍文字',
      path: '/pages/ocr/ocr'
    }
  },

  // 初始化页面
  initPage: function () {
    this.loadOCRModes()
    this.loadHistory()
  },

  // 加载OCR模式
  loadOCRModes: function () {
    this.setData({ loading: true })
    
    ocrAPI.getModes().then((res) => {
      console.log('OCR模式加载成功:', res)
      this.setData({
        ocrModes: res.modes || [],
        loading: false
      })
    }).catch((error) => {
      console.error('OCR模式加载失败:', error)
      // 使用默认模式
      this.setData({
        ocrModes: [
          { id: 'ancient', name: '古籍模式', description: '优化识别繁体字与古籍排版' },
          { id: 'standard', name: '标准模式', description: '通用文本识别' },
          { id: 'handwriting', name: '手写体模式', description: '识别中文手写文本' }
        ],
        loading: false
      })
    })
  },

  // 加载历史记录
  loadHistory: function () {
    try {
      const history = wx.getStorageSync(app.globalData.cacheKeys.ocrHistory) || []
      this.setData({ historyList: history.slice(0, 10) })
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  },

  // 选择图片
  onChooseImage: function () {
    const that = this
    
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: function (res) {
        if (res.tapIndex === 0) {
          that.takePhoto()
        } else if (res.tapIndex === 1) {
          that.chooseFromAlbum()
        }
      }
    })
  },

  // 拍照
  takePhoto: function () {
    const that = this
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        that.setImage(tempFilePath)
      },
      fail: function (error) {
        console.error('拍照失败:', error)
        if (error.errMsg.includes('auth')) {
          app.showError('请授权使用摄像头')
        } else {
          app.showError('拍照失败')
        }
      }
    })
  },

  // 从相册选择
  chooseFromAlbum: function () {
    const that = this
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: function (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        that.setImage(tempFilePath)
      },
      fail: function (error) {
        console.error('选择图片失败:', error)
        if (error.errMsg.includes('auth')) {
          app.showError('请授权访问相册')
        } else {
          app.showError('选择图片失败')
        }
      }
    })
  },

  // 设置图片
  setImage: function (imagePath) {
    this.setData({
      imageUrl: imagePath,
      hasImage: true,
      ocrResult: null,
      hasResult: false
    })
  },

  // 重新选择图片
  onReChooseImage: function () {
    this.onChooseImage()
  },

  // 删除图片
  onDeleteImage: function () {
    this.setData({
      imageUrl: '',
      hasImage: false,
      ocrResult: null,
      hasResult: false
    })
  },

  // 开始识别
  onStartRecognition: function () {
    if (!this.data.hasImage) {
      app.showError('请先选择图片')
      return
    }

    this.setData({ recognizing: true })
    
    const options = {
      mode: this.data.selectedMode,
      enhance_image: this.data.ocrSettings.enhance_image,
      detect_layout: this.data.ocrSettings.detect_layout,
      recognize_variants: this.data.ocrSettings.recognize_variants,
      enhance_options: this.data.ocrSettings.enhance_options
    }

    ocrAPI.analyze(this.data.imageUrl, options).then((result) => {
      console.log('OCR识别成功:', result)
      
      this.setData({
        ocrResult: result,
        hasResult: true,
        recognizing: false
      })
      
      // 保存到历史记录
      this.saveToHistory(result)
      
      // 跳转到结果页面
      wx.navigateTo({
        url: '/pages/ocr/result/result',
        success: () => {
          // 将结果传递给结果页面
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          currentPage.setData({ ocrResult: result })
        }
      })
      
    }).catch((error) => {
      console.error('OCR识别失败:', error)
      this.setData({ recognizing: false })
      app.showError('识别失败，请重试')
    })
  },

  // 保存到历史记录
  saveToHistory: function (result) {
    try {
      let history = wx.getStorageSync(app.globalData.cacheKeys.ocrHistory) || []
      
      const historyItem = {
        id: Date.now(),
        text: result.text,
        confidence: result.confidence,
        processing_time: result.processing_time,
        variants: result.variants,
        image: this.data.imageUrl,
        mode: this.data.selectedMode,
        timestamp: new Date().toISOString()
      }
      
      // 添加到开头
      history.unshift(historyItem)
      
      // 限制数量
      history = history.slice(0, 50)
      
      // 保存到本地存储
      wx.setStorageSync(app.globalData.cacheKeys.ocrHistory, history)
      
      // 更新页面数据
      this.setData({ historyList: history.slice(0, 10) })
      
    } catch (error) {
      console.error('保存历史记录失败:', error)
    }
  },

  // 切换OCR模式
  onModeChange: function (e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ selectedMode: mode })
  },

  // 切换设置项
  onSettingChange: function (e) {
    const { setting } = e.currentTarget.dataset
    const value = e.detail
    
    this.setData({
      [`ocrSettings.${setting}`]: value
    })
  },

  // 切换增强选项
  onEnhanceOptionChange: function (e) {
    const { option } = e.currentTarget.dataset
    const value = e.detail
    
    this.setData({
      [`ocrSettings.enhance_options.${option}`]: value
    })
  },

  // 显示历史记录
  onShowHistory: function () {
    this.setData({ showHistory: true })
  },

  // 隐藏历史记录
  onHideHistory: function () {
    this.setData({ showHistory: false })
  },

  // 点击历史记录项
  onHistoryItemClick: function (e) {
    const { item } = e.currentTarget.dataset
    
    // 跳转到结果页面
    wx.navigateTo({
      url: '/pages/ocr/result/result',
      success: () => {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1]
        currentPage.setData({ 
          ocrResult: {
            text: item.text,
            confidence: item.confidence,
            processing_time: item.processing_time,
            variants: item.variants
          },
          isFromHistory: true
        })
      }
    })
  },

  // 删除历史记录项
  onDeleteHistoryItem: function (e) {
    const { index } = e.currentTarget.dataset
    
    app.showConfirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？'
    }).then((confirmed) => {
      if (confirmed) {
        try {
          let history = wx.getStorageSync(app.globalData.cacheKeys.ocrHistory) || []
          history.splice(index, 1)
          wx.setStorageSync(app.globalData.cacheKeys.ocrHistory, history)
          this.setData({ historyList: history.slice(0, 10) })
          app.showSuccess('删除成功')
        } catch (error) {
          console.error('删除历史记录失败:', error)
          app.showError('删除失败')
        }
      }
    })
  },

  // 清空历史记录
  onClearHistory: function () {
    app.showConfirm({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？'
    }).then((confirmed) => {
      if (confirmed) {
        try {
          wx.removeStorageSync(app.globalData.cacheKeys.ocrHistory)
          this.setData({ historyList: [] })
          app.showSuccess('清空成功')
        } catch (error) {
          console.error('清空历史记录失败:', error)
          app.showError('清空失败')
        }
      }
    })
  }
})
