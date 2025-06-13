// AI对话聊天页面逻辑
const app = getApp()
const CommonUtils = require('../../../utils/common.js')
const ApiUtils = require('../../../utils/api.js')
const ChatUtils = require('../../../utils/chat.js')

Page({
  data: {
    character: {},
    conversationId: '',
    messages: [],
    inputText: '',
    inputPlaceholder: '请输入您想说的话...',
    isTyping: false,
    loading: false,
    loadingText: '加载中...',
    scrollTop: 0,
    scrollIntoView: '',
    userInfo: {},
    suggestions: [],
    quickReplies: [],
    showInput: true
  },

  onLoad: function(options) {
    console.log('聊天页面加载', options)

    // 获取参数
    const characterId = options.character || 'confucius'
    const conversationId = options.conversationId || CommonUtils.generateConversationId()
    const initialTopic = options.topic ? decodeURIComponent(options.topic) : ''

    this.setData({ conversationId: conversationId })

    // 初始化页面
    this.initPage(characterId, conversationId, initialTopic)
  },

  onShow: function() {
    console.log('聊天页面显示')
  },

  onUnload: function() {
    // 保存对话历史
    this.saveConversation()
  },

  // 初始化页面
  initPage: function(characterId, conversationId, initialTopic) {
    const self = this
    this.setData({ loading: true, loadingText: '初始化对话...' })

    // 加载人物信息
    this.loadCharacterInfo(characterId).then(function() {
      // 加载对话历史
      return self.loadConversationHistory(conversationId)
    }).then(function() {
      // 获取用户信息
      self.setData({ userInfo: app.globalData.userInfo || {} })

      // 如果有初始话题，自动发送
      if (initialTopic && self.data.messages.length === 0) {
        setTimeout(function() {
          self.setData({ inputText: initialTopic })
          self.sendMessage()
        }, 1000)
      }
    }).catch(function(error) {
      console.error('初始化聊天页面失败:', error)
      app.showError('初始化失败')
    }).finally(function() {
      self.setData({ loading: false })
    })
  },

  // 加载人物信息
  loadCharacterInfo: function(characterId) {
    const self = this

    return ApiUtils.dialogue.getCharacters().then(function(result) {
      if (result.success) {
        const character = result.data.find(function(char) {
          return char.id === characterId
        })
        if (character) {
          self.setData({
            character: character,
            suggestions: self.getCharacterSuggestions(characterId),
            quickReplies: self.getQuickReplies(characterId)
          })

          // 设置页面标题
          wx.setNavigationBarTitle({
            title: '与' + character.name + '对话'
          })
        }
      } else {
        // 使用默认人物信息
        self.setData({
          character: {
            id: characterId,
            name: '孔子',
            title: '至圣先师',
            avatar: '/images/characters/confucius.png'
          },
          suggestions: ['请教您关于教育的看法', '什么是仁？', '如何修身养性？'],
          quickReplies: ['请继续', '我明白了', '能举个例子吗？', '谢谢您的指导']
        })
      }
    }).catch(function(error) {
      console.error('加载人物信息失败:', error)
    })
  },

  // 加载对话历史
  loadConversationHistory: function(conversationId) {
    const self = this

    return ApiUtils.dialogue.getHistory(conversationId).then(function(result) {
      if (result.success && result.data.length > 0) {
        const messages = result.data.map(function(msg) {
          return Object.assign({}, msg, {
            time: CommonUtils.formatSimpleTime(new Date(msg.timestamp))
          })
        })
        self.setData({ messages: messages })
        self.scrollToBottom()
      }
    }).catch(function(error) {
      console.error('加载对话历史失败:', error)
    })
  },

  // 获取人物建议话题
  getCharacterSuggestions: function(characterId) {
    return ChatUtils.getCharacterSuggestions(characterId)
  },

  // 获取快捷回复
  getQuickReplies: function(characterId) {
    return ChatUtils.getQuickReplies(characterId)
  },

  // 输入变化
  onInputChange: function(e) {
    this.setData({ inputText: e.detail.value })
  },

  // 发送消息
  sendMessage: function() {
    const self = this
    const text = this.data.inputText.trim()

    ChatUtils.handleMessageSend({
      text: text,
      character: this.data.character,
      conversationId: this.data.conversationId,
      messages: this.data.messages,
      onProgress: function(data) {
        self.setData({
          messages: data.messages,
          inputText: data.inputText,
          isTyping: data.isTyping,
          quickReplies: []
        })
        self.scrollToBottom()
      },
      onSuccess: function(data) {
        self.setData({
          messages: data.messages,
          isTyping: data.isTyping,
          quickReplies: self.getQuickReplies(self.data.character.id)
        })
        self.scrollToBottom()
      },
      onError: function(errorMsg, data) {
        app.showError('发送失败: ' + errorMsg)
        if (data) {
          self.setData({
            messages: data.messages,
            isTyping: data.isTyping
          })
          self.scrollToBottom()
        }
      }
    })
  },

  // 发送建议话题
  sendSuggestion: function(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputText: text })
    this.sendMessage()
  },

  // 发送快捷回复
  sendQuickReply: function(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputText: text })
    this.sendMessage()
  },

  // 复制消息
  copyMessage: function(e) {
    const text = e.currentTarget.dataset.text
    CommonUtils.copyToClipboard(text, function() {
      app.showSuccess('已复制到剪贴板')
    }, function() {
      app.showError('复制失败')
    })
  },

  // 点赞消息
  likeMessage: function(e) {
    const messageId = e.currentTarget.dataset.id
    const messages = ChatUtils.toggleMessageLike(this.data.messages, messageId)
    this.setData({ messages: messages })
  },

  // 清空聊天
  clearChat: function() {
    const self = this
    CommonUtils.showConfirm('确认清空', '确定要清空当前对话吗？此操作不可恢复。', function() {
      self.setData({
        messages: [],
        quickReplies: self.getQuickReplies(self.data.character.id)
      })
      app.showSuccess('对话已清空')
    })
  },

  // 分享聊天
  shareChat: function() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 保存对话
  saveConversation: function() {
    if (this.data.messages.length === 0) return

    return ApiUtils.dialogue.saveConversation(
      this.data.conversationId,
      this.data.character.id,
      this.data.messages,
      app.globalData.currentUser.id
    ).catch(function(error) {
      console.error('保存对话失败:', error)
    })
  },

  // 滚动到底部
  scrollToBottom: function() {
    const self = this
    setTimeout(function() {
      const scrollTarget = ChatUtils.generateScrollTarget(self.data.isTyping, self.data.messages)
      self.setData({
        scrollIntoView: scrollTarget
      })
    }, 100)
  },

  // 功能按钮事件
  toggleVoice: function() {
    app.showError('语音功能开发中')
  },

  insertEmoji: function() {
    app.showError('表情功能开发中')
  },

  showMoreOptions: function() {
    const self = this
    const itemList = ['保存对话', '导出记录', '举报问题']

    CommonUtils.showActionSheet(itemList, function(tapIndex) {
      switch (tapIndex) {
        case 0:
          self.saveConversation().then(function() {
            app.showSuccess('对话已保存')
          })
          break
        case 1:
          app.showError('导出功能开发中')
          break
        case 2:
          app.showError('举报功能开发中')
          break
      }
    })
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '我正在与' + this.data.character.name + '对话',
      desc: '儒智AI对话 - 与古代先贤探讨传统文化智慧',
      path: '/pages/dialogue/chat/chat?character=' + this.data.character.id
    }
  }
})
