// AI人物对话页面
const app = getApp()
const { chatAPI, userAPI } = require('../../api/index')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 人物选择相关
    selectedCharacter: null,
    characters: [
      {
        id: 'confucius',
        name: '孔子',
        title: '至圣先师',
        dynasty: '春秋',
        description: '儒家学派创始人，以仁爱、礼制、教育思想闻名于世',
        avatar: '/images/characters/confucius.png',
        tags: ['仁爱', '礼制', '教育', '修身'],
        chatCount: 156,
        satisfaction: 98,
        welcomeMessage: '有朋自远方来，不亦乐乎？我是孔子，很高兴与你交流儒家思想。',
        suggestions: [
          '什么是仁？',
          '如何修身养性？',
          '教育的本质是什么？',
          '礼制在现代社会的意义'
        ]
      },
      {
        id: 'laozi',
        name: '老子',
        title: '道德天尊',
        dynasty: '春秋',
        description: '道家学派创始人，主张无为而治，追求自然和谐',
        avatar: '/images/characters/laozi.png',
        tags: ['道法自然', '无为', '和谐', '智慧'],
        chatCount: 89,
        satisfaction: 96,
        welcomeMessage: '道可道，非常道。我是老子，愿与你探讨道家的智慧。',
        suggestions: [
          '什么是道？',
          '无为而治的含义',
          '如何达到内心平静？',
          '道家的人生哲学'
        ]
      },
      {
        id: 'mencius',
        name: '孟子',
        title: '亚圣',
        dynasty: '战国',
        description: '儒家重要代表，提出性善论，主张仁政思想',
        avatar: '/images/characters/mencius.png',
        tags: ['性善论', '仁政', '民本', '浩然之气'],
        chatCount: 67,
        satisfaction: 94,
        welcomeMessage: '人之初，性本善。我是孟子，让我们一起探讨人性的善良本质。',
        suggestions: [
          '人性本善的依据',
          '什么是仁政？',
          '如何培养浩然之气？',
          '民本思想的现代意义'
        ]
      },
      {
        id: 'zhuxi',
        name: '朱熹',
        title: '理学大师',
        dynasty: '南宋',
        description: '宋代理学集大成者，融合儒道佛三家思想',
        avatar: '/images/characters/zhuxi.png',
        tags: ['理学', '格物致知', '存天理', '去人欲'],
        chatCount: 43,
        satisfaction: 92,
        welcomeMessage: '格物致知，诚意正心。我是朱熹，愿与你探讨理学的精深奥义。',
        suggestions: [
          '什么是理？',
          '格物致知的方法',
          '如何存天理去人欲？',
          '理学的修养功夫'
        ]
      },
      {
        id: 'wangyangming',
        name: '王阳明',
        title: '心学宗师',
        dynasty: '明代',
        description: '明代心学集大成者，提出知行合一理论',
        avatar: '/images/characters/wangyangming.png',
        tags: ['心学', '知行合一', '致良知', '心即理'],
        chatCount: 38,
        satisfaction: 95,
        welcomeMessage: '心即理也，知行合一。我是王阳明，让我们探讨心学的智慧。',
        suggestions: [
          '什么是良知？',
          '知行合一的含义',
          '心即理的道理',
          '如何致良知？'
        ]
      }
    ],

    // 对话相关
    messages: [],
    inputText: '',
    isTyping: false,
    isSending: false,
    chatStatus: '在线',
    scrollTop: 0,
    scrollIntoView: '',

    // 历史记录相关
    showHistory: false,
    showSearch: false,
    searchKeyword: '',
    recentConversations: [],
    filteredConversations: [],
    totalConversations: 0,

    // 菜单和设置
    showChatMenu: false,
    showSettings: false,
    chatSettings: {
      replyStyle: 'classical',
      showThinking: true,
      typewriterEffect: true,
      soundEnabled: true
    },
    replyStyles: [
      {
        id: 'classical',
        name: '古典风格',
        description: '使用古文表达，富有文言韵味'
      },
      {
        id: 'modern',
        name: '现代风格',
        description: '使用现代汉语，通俗易懂'
      },
      {
        id: 'mixed',
        name: '混合风格',
        description: '古今结合，既有韵味又易理解'
      }
    ],

    // 加载状态
    loading: false,
    loadingText: '加载中...'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: 'AI对话'
    })

    // 检查是否有指定的人物
    if (options.character) {
      const character = this.data.characters.find(c => c.id === options.character)
      if (character) {
        this.setData({ selectedCharacter: character })
        this.initChat()
      }
    }

    // 加载历史对话
    this.loadConversationHistory()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新对话历史
    this.loadConversationHistory()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 保存当前对话状态
    this.saveCurrentConversation()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清理资源
    this.saveCurrentConversation()
  },

  // 人物选择相关方法
  onCharacterSelect: function(e) {
    const character = e.currentTarget.dataset.character
    this.setData({
      selectedCharacter: character,
      messages: [],
      inputText: '',
      chatStatus: '在线'
    })
    this.initChat()
  },

  onBackToSelection: function() {
    // 保存当前对话
    this.saveCurrentConversation()

    this.setData({
      selectedCharacter: null,
      messages: [],
      inputText: '',
      isTyping: false,
      isSending: false
    })
  },

  // 初始化对话
  initChat: function() {
    // 加载该人物的历史对话
    this.loadCharacterHistory()

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: `与${this.data.selectedCharacter.name}对话`
    })
  },

  // 加载人物对话历史
  loadCharacterHistory: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const characterId = this.data.selectedCharacter.id

      const result = await chatAPI.getCharacterHistory(userId, characterId)

      if (result.success && result.data.messages) {
        this.setData({
          messages: result.data.messages
        })
        this.scrollToBottom()
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
    }
  },

  // 加载对话历史列表
  loadConversationHistory: async function() {
    try {
      const userId = app.globalData.userId || 'anonymous'
      const result = await chatAPI.getConversationHistory(userId)

      if (result.success) {
        this.setData({
          recentConversations: result.data.conversations || [],
          totalConversations: result.data.total || 0,
          filteredConversations: result.data.conversations || []
        })
      }
    } catch (error) {
      console.error('加载对话历史失败:', error)
    }
  },

  // 保存当前对话
  saveCurrentConversation: async function() {
    if (!this.data.selectedCharacter || this.data.messages.length === 0) {
      return
    }

    try {
      const conversationData = {
        userId: app.globalData.userId || 'anonymous',
        characterId: this.data.selectedCharacter.id,
        character: this.data.selectedCharacter.name,
        messages: this.data.messages,
        timestamp: new Date().toISOString(),
        settings: this.data.chatSettings
      }

      await chatAPI.saveConversation(conversationData)
    } catch (error) {
      console.error('保存对话失败:', error)
    }
  },

  // 消息输入和发送
  onInputChange: function(e) {
    this.setData({
      inputText: e.detail.value
    })
  },

  onSendMessage: async function() {
    const message = this.data.inputText.trim()
    if (!message || this.data.isSending) {
      return
    }

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: this.formatTime(new Date())
    }

    const messages = [...this.data.messages, userMessage]

    this.setData({
      messages: messages,
      inputText: '',
      isSending: true,
      isTyping: true
    })

    this.scrollToBottom()

    try {
      // 调用AI对话API
      const response = await chatAPI.sendMessage({
        userId: app.globalData.userId || 'anonymous',
        characterId: this.data.selectedCharacter.id,
        message: message,
        conversationHistory: messages.slice(-10), // 只发送最近10条消息作为上下文
        settings: this.data.chatSettings
      })

      if (response.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.reply,
          thinking: response.data.thinking,
          timestamp: this.formatTime(new Date()),
          liked: false
        }

        // 模拟打字机效果
        if (this.data.chatSettings.typewriterEffect) {
          await this.typewriterEffect(assistantMessage)
        } else {
          this.setData({
            messages: [...messages, assistantMessage],
            isTyping: false,
            isSending: false
          })
        }

        this.scrollToBottom()

        // 播放提示音
        if (this.data.chatSettings.soundEnabled) {
          wx.playBackgroundAudio({
            dataUrl: '/audio/message.mp3'
          })
        }

      } else {
        throw new Error(response.message || '发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)

      this.setData({
        isTyping: false,
        isSending: false
      })

      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none',
        duration: 3000
      })
    }
  },

  // 打字机效果
  typewriterEffect: function(message) {
    return new Promise((resolve) => {
      const fullText = message.content
      let currentText = ''
      let index = 0

      const messages = [...this.data.messages]
      const typingMessage = { ...message, content: '' }
      messages.push(typingMessage)

      this.setData({
        messages: messages,
        isTyping: false
      })

      const timer = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index]
          messages[messages.length - 1].content = currentText

          this.setData({ messages: messages })
          this.scrollToBottom()

          index++
        } else {
          clearInterval(timer)
          this.setData({ isSending: false })
          resolve()
        }
      }, 50) // 每50ms显示一个字符
    })
  },

  // 建议点击
  onSuggestionClick: function(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputText: text })
    this.onSendMessage()
  },

  // 快速操作
  onQuickAction: function(e) {
    const action = e.currentTarget.dataset.action
    let quickText = ''

    switch (action) {
      case 'inspire':
        quickText = '请您指点迷津'
        break
      case 'discuss':
        quickText = '我想与您讨论一个问题'
        break
      case 'question':
        quickText = '我有一个疑问想请教'
        break
      case 'share':
        quickText = '我想分享一些想法'
        break
    }

    if (quickText) {
      this.setData({ inputText: quickText })
    }
  },

  // 消息操作
  onCopyMessage: function(e) {
    const content = e.currentTarget.dataset.content

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success',
          duration: 1500
        })
      }
    })
  },

  onLikeMessage: function(e) {
    const message = e.currentTarget.dataset.message
    const messages = this.data.messages.map(msg => {
      if (msg.id === message.id) {
        return { ...msg, liked: !msg.liked }
      }
      return msg
    })

    this.setData({ messages })

    wx.showToast({
      title: message.liked ? '已取消点赞' : '已点赞',
      icon: 'success',
      duration: 1500
    })
  },

  // 滚动到底部
  scrollToBottom: function() {
    this.setData({
      scrollIntoView: `message-${Date.now()}`
    })
  },

  // 格式化时间
  formatTime: function(date) {
    const now = new Date()
    const diff = now - date

    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  },

  // 对话菜单相关
  onShowChatMenu: function() {
    this.setData({ showChatMenu: true })
  },

  onHideChatMenu: function() {
    this.setData({ showChatMenu: false })
  },

  onExportChat: function() {
    this.setData({ showChatMenu: false })

    if (this.data.messages.length === 0) {
      wx.showToast({
        title: '暂无对话内容',
        icon: 'none'
      })
      return
    }

    // 生成对话文本
    let chatText = `与${this.data.selectedCharacter.name}的对话\n`
    chatText += `时间：${new Date().toLocaleString()}\n\n`

    this.data.messages.forEach(msg => {
      const speaker = msg.role === 'user' ? '我' : this.data.selectedCharacter.name
      chatText += `${speaker}：${msg.content}\n\n`
    })

    // 保存到剪贴板
    wx.setClipboardData({
      data: chatText,
      success: () => {
        wx.showToast({
          title: '对话已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  onShareChat: function() {
    this.setData({ showChatMenu: false })

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onClearChat: function() {
    this.setData({ showChatMenu: false })

    wx.showModal({
      title: '确认清空',
      content: '确定要清空当前对话吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] })
          wx.showToast({
            title: '对话已清空',
            icon: 'success'
          })
        }
      }
    })
  },

  onChatSettings: function() {
    this.setData({
      showChatMenu: false,
      showSettings: true
    })
  },

  // 历史记录相关
  onShowHistory: function() {
    this.setData({ showHistory: true })
    this.loadConversationHistory()
  },

  onHideHistory: function() {
    this.setData({
      showHistory: false,
      showSearch: false,
      searchKeyword: ''
    })
  },

  onToggleSearch: function() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: ''
    })

    if (!this.data.showSearch) {
      this.setData({ filteredConversations: this.data.recentConversations })
    }
  },

  onSearchInput: function(e) {
    const keyword = e.detail.value.toLowerCase()
    this.setData({ searchKeyword: keyword })

    if (!keyword) {
      this.setData({ filteredConversations: this.data.recentConversations })
      return
    }

    const filtered = this.data.recentConversations.filter(conv =>
      conv.character.toLowerCase().includes(keyword) ||
      conv.preview.toLowerCase().includes(keyword)
    )

    this.setData({ filteredConversations: filtered })
  },

  onConversationClick: function(e) {
    const conversation = e.currentTarget.dataset.conversation

    // 找到对应的人物
    const character = this.data.characters.find(c => c.name === conversation.character)
    if (character) {
      this.setData({
        selectedCharacter: character,
        showHistory: false,
        messages: conversation.messages || []
      })
      this.initChat()
    }
  },

  onHistoryItemClick: function(e) {
    this.onConversationClick(e)
  },

  onDeleteHistory: async function(e) {
    const conversationId = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条对话记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await chatAPI.deleteConversation(conversationId)

            // 更新本地数据
            const filtered = this.data.recentConversations.filter(conv => conv.id !== conversationId)
            this.setData({
              recentConversations: filtered,
              filteredConversations: filtered,
              totalConversations: filtered.length
            })

            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (error) {
            console.error('删除对话失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 设置相关
  onHideSettings: function() {
    this.setData({ showSettings: false })
  },

  onReplyStyleChange: function(e) {
    const style = e.currentTarget.dataset.style
    this.setData({
      'chatSettings.replyStyle': style
    })

    // 保存设置到本地
    wx.setStorageSync('chatSettings', this.data.chatSettings)
  },

  onSettingChange: function(e) {
    const setting = e.currentTarget.dataset.setting
    const value = e.detail.value

    this.setData({
      [`chatSettings.${setting}`]: value
    })

    // 保存设置到本地
    wx.setStorageSync('chatSettings', this.data.chatSettings)
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadConversationHistory()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里加载更多历史记录
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    if (this.data.selectedCharacter) {
      return {
        title: `我正在与${this.data.selectedCharacter.name}对话`,
        path: `/pages/chat/chat?character=${this.data.selectedCharacter.id}`,
        imageUrl: this.data.selectedCharacter.avatar
      }
    } else {
      return {
        title: '儒智AI对话 - 与古代圣贤智者交流',
        path: '/pages/chat/chat',
        imageUrl: '/images/share-chat.png'
      }
    }
  }
})
