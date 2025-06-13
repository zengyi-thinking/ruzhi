// 聊天相关工具函数
const CommonUtils = require('./common.js')

const ChatUtils = {
  // 获取人物建议话题
  getCharacterSuggestions: function(characterId) {
    const suggestions = {
      confucius: ['请教您关于教育的看法', '什么是仁？', '如何修身养性？', '君子与小人的区别'],
      laozi: ['什么是道？', '如何理解无为而治？', '道法自然的含义', '如何修炼内心？'],
      mencius: ['人性本善吗？', '什么是王道政治？', '如何培养浩然正气？', '民为贵的思想'],
      zhuxi: ['什么是格物致知？', '理与气的关系', '如何读书学习？', '修身的方法'],
      wangyangming: ['心即理如何理解？', '知行合一的含义', '如何致良知？', '心学与理学的区别']
    }
    return suggestions[characterId] || suggestions.confucius
  },

  // 获取快捷回复
  getQuickReplies: function(characterId) {
    return ['请继续', '我明白了', '能举个例子吗？', '谢谢您的指导', '还有其他看法吗？']
  },

  // 创建用户消息对象
  createUserMessage: function(text) {
    return {
      id: CommonUtils.generateMessageId(),
      role: 'user',
      content: text,
      time: CommonUtils.formatSimpleTime(new Date()),
      status: 'sending'
    }
  },

  // 创建AI消息对象
  createAIMessage: function(content) {
    return {
      id: CommonUtils.generateMessageId(),
      role: 'assistant',
      content: content,
      time: CommonUtils.formatSimpleTime(new Date()),
      liked: false
    }
  },

  // 创建错误消息对象
  createErrorMessage: function() {
    return {
      id: CommonUtils.generateMessageId(),
      role: 'assistant',
      content: '抱歉，我暂时无法回应。请稍后再试。',
      time: CommonUtils.formatSimpleTime(new Date()),
      isError: true
    }
  },

  // 更新消息状态
  updateMessageStatus: function(messages, messageId, status) {
    return messages.map(function(msg) {
      if (msg.id === messageId) {
        return Object.assign({}, msg, { status: status })
      }
      return msg
    })
  },

  // 切换消息点赞状态
  toggleMessageLike: function(messages, messageId) {
    return messages.map(function(msg) {
      if (msg.id === messageId) {
        return Object.assign({}, msg, { liked: !msg.liked })
      }
      return msg
    })
  },

  // 验证输入文本
  validateInput: function(text) {
    const trimmedText = text.trim()
    if (!trimmedText) {
      return {
        valid: false,
        error: '请输入消息内容'
      }
    }
    if (trimmedText.length > 500) {
      return {
        valid: false,
        error: '消息内容过长，请控制在500字以内'
      }
    }
    return {
      valid: true,
      text: trimmedText
    }
  },

  // 生成滚动目标ID
  generateScrollTarget: function(isTyping, messages) {
    if (isTyping) {
      return 'typing-indicator'
    }
    if (messages.length > 0) {
      return 'message-' + messages[messages.length - 1].id
    }
    return ''
  },

  // 保存对话到本地存储
  saveToLocal: function(conversationId, data) {
    try {
      const key = 'chat_' + conversationId
      wx.setStorageSync(key, data)
    } catch (error) {
      console.error('保存对话到本地失败:', error)
    }
  },

  // 从本地存储加载对话
  loadFromLocal: function(conversationId) {
    try {
      const key = 'chat_' + conversationId
      return wx.getStorageSync(key) || null
    } catch (error) {
      console.error('从本地加载对话失败:', error)
      return null
    }
  },

  // 清理本地存储
  clearLocal: function(conversationId) {
    try {
      const key = 'chat_' + conversationId
      wx.removeStorageSync(key)
    } catch (error) {
      console.error('清理本地存储失败:', error)
    }
  },

  // 导出对话记录
  exportConversation: function(messages, character) {
    const content = messages.map(function(msg) {
      const role = msg.role === 'user' ? '我' : character.name
      return role + '：' + msg.content
    }).join('\n\n')
    
    return '与' + character.name + '的对话记录\n' + 
           '时间：' + new Date().toLocaleString() + '\n\n' + 
           content
  }
}

module.exports = ChatUtils
