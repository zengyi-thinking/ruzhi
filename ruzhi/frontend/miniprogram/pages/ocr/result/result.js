// OCR识别结果页面
const app = getApp()
const { knowledgeAPI, userAPI } = require('../../../api/index')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    ocrResult: {},
    editMode: false,
    editedText: '',
    showAnalysis: false,
    analysisResult: {},
    recommendations: [],
    isFromHistory: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '识别结果'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 加载推荐内容
    this.loadRecommendations()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时检查是否有新的OCR结果
    if (!this.data.ocrResult.text) {
      // 如果没有结果，返回上一页
      wx.navigateBack()
    }
  },

  // 复制文本
  onCopyText: function () {
    const text = this.data.editMode ? this.data.editedText : this.data.ocrResult.text

    wx.setClipboardData({
      data: text,
      success: () => {
        app.showSuccess('已复制到剪贴板')
      },
      fail: () => {
        app.showError('复制失败')
      }
    })
  },

  // 编辑文本
  onEditText: function () {
    this.setData({
      editMode: true,
      editedText: this.data.ocrResult.text
    })
  },

  // 文本输入
  onTextInput: function (e) {
    this.setData({
      editedText: e.detail.value
    })
  },

  // 保存编辑
  onSaveEdit: function () {
    const editedText = this.data.editedText.trim()

    if (!editedText) {
      app.showError('文本内容不能为空')
      return
    }

    // 更新OCR结果
    const updatedResult = {
      ...this.data.ocrResult,
      text: editedText,
      edited: true
    }

    this.setData({
      ocrResult: updatedResult,
      editMode: false
    })

    app.showSuccess('保存成功')
  },

  // 取消编辑
  onCancelEdit: function () {
    this.setData({
      editMode: false,
      editedText: this.data.ocrResult.text
    })
  },

  // 智能分析文本
  onAnalyzeText: async function () {
    const text = this.data.editMode ? this.data.editedText : this.data.ocrResult.text

    if (!text.trim()) {
      app.showError('文本内容为空')
      return
    }

    wx.showLoading({
      title: '分析中...',
      mask: true
    })

    try {
      // 调用知识图谱API进行文本分析
      const result = await knowledgeAPI.searchConcepts(text)

      if (result.success) {
        this.setData({
          analysisResult: result.data,
          showAnalysis: true
        })
      } else {
        throw new Error(result.message || '分析失败')
      }
    } catch (error) {
      console.error('文本分析失败:', error)
      app.showError('分析失败，请重试')
    } finally {
      wx.hideLoading()
    }
  },

  // 隐藏分析结果
  onHideAnalysis: function () {
    this.setData({
      showAnalysis: false
    })
  },

  // 收藏结果
  onSaveToFavorites: async function () {
    const text = this.data.editMode ? this.data.editedText : this.data.ocrResult.text

    try {
      const favoriteData = {
        type: 'ocr_result',
        title: text.substring(0, 20) + (text.length > 20 ? '...' : ''),
        content: text,
        confidence: this.data.ocrResult.confidence,
        timestamp: new Date().toISOString()
      }

      const result = await userAPI.addFavorite(app.globalData.userId || 'anonymous', favoriteData)

      if (result.success) {
        app.showSuccess('收藏成功')
      } else {
        throw new Error(result.message || '收藏失败')
      }
    } catch (error) {
      console.error('收藏失败:', error)
      app.showError('收藏失败，请重试')
    }
  },

  // 分享结果
  onShareResult: function () {
    const text = this.data.editMode ? this.data.editedText : this.data.ocrResult.text

    wx.showActionSheet({
      itemList: ['分享给朋友', '保存到相册', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 分享给朋友
            this.shareToFriend(text)
            break
          case 1:
            // 保存到相册
            this.saveToAlbum(text)
            break
          case 2:
            // 复制链接
            this.copyShareLink(text)
            break
        }
      }
    })
  },

  // 分享给朋友
  shareToFriend: function (text) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 保存到相册
  saveToAlbum: function (text) {
    // 这里可以生成图片并保存到相册
    app.showToast('功能开发中...')
  },

  // 复制分享链接
  copyShareLink: function (text) {
    const shareLink = `儒智OCR识别结果：${text.substring(0, 50)}...`

    wx.setClipboardData({
      data: shareLink,
      success: () => {
        app.showSuccess('链接已复制')
      }
    })
  },

  // 加载推荐内容
  loadRecommendations: async function () {
    try {
      const text = this.data.ocrResult.text
      if (!text) return

      // 基于识别文本生成推荐
      const result = await knowledgeAPI.searchConcepts(text)

      if (result.success && result.data.recommendations) {
        this.setData({
          recommendations: result.data.recommendations
        })
      }
    } catch (error) {
      console.error('加载推荐失败:', error)
    }
  },

  // 点击推荐项
  onRecommendationClick: function (e) {
    const { item } = e.currentTarget.dataset

    // 根据推荐类型跳转到不同页面
    switch (item.type) {
      case 'classic':
        wx.navigateTo({
          url: `/pages/classics/detail/detail?id=${item.id}`
        })
        break
      case 'concept':
        wx.navigateTo({
          url: `/pages/knowledge/concept/concept?id=${item.id}`
        })
        break
      case 'dialogue':
        wx.navigateTo({
          url: `/pages/dialogue/dialogue?character=${item.character}`
        })
        break
      default:
        app.showToast('功能开发中...')
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadRecommendations()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多推荐内容
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const text = this.data.editMode ? this.data.editedText : this.data.ocrResult.text

    return {
      title: `儒智OCR识别：${text.substring(0, 20)}...`,
      path: '/pages/home/home',
      imageUrl: '/images/share-logo.png'
    }
  }
})
