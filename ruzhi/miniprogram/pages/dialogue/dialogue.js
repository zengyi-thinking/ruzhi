// AI对话页面逻辑
const app = getApp()
const CommonUtils = require('../../utils/common.js')
const ApiUtils = require('../../utils/api.js')

Page({
  data: {
    selectedCharacter: '',
    characters: [
      {
        id: 'confucius',
        name: '孔子',
        title: '至圣先师',
        period: '春秋时期 (551-479 BC)',
        avatar: '/images/characters/confucius.png',
        specialties: ['教育', '仁学', '礼制'],
        description: '中国古代思想家、教育家，儒家学派创始人。提出"仁"的思想核心，强调"有教无类"的教育理念，对中华文化产生了深远影响。',
        achievements: [
          '创立儒家学派，奠定中华文化基础',
          '编订《诗》《书》《礼》《易》《春秋》',
          '提出"仁者爱人"的核心思想',
          '倡导"有教无类"的教育理念'
        ]
      },
      {
        id: 'laozi',
        name: '老子',
        title: '道德天尊',
        period: '春秋时期 (约571-471 BC)',
        avatar: '/images/characters/laozi.png',
        specialties: ['道学', '自然', '无为'],
        description: '中国古代哲学家，道家学派创始人。著有《道德经》，提出"道法自然"的哲学思想，强调无为而治的治理理念。',
        achievements: [
          '创立道家哲学体系',
          '著述《道德经》传世经典',
          '提出"道法自然"的核心理念',
          '倡导"无为而治"的政治思想'
        ]
      },
      {
        id: 'mencius',
        name: '孟子',
        title: '亚圣',
        period: '战国时期 (约372-289 BC)',
        avatar: '/images/characters/mencius.png',
        specialties: ['性善论', '王道', '民本'],
        description: '战国时期思想家，儒家学派重要代表。发展了孔子的思想，提出"性善论"和"民为贵"的政治理念。',
        achievements: [
          '发展儒家思想，被尊为"亚圣"',
          '提出"性善论"的人性观',
          '倡导"民为贵，社稷次之，君为轻"',
          '著述《孟子》一书传世'
        ]
      },
      {
        id: 'zhuxi',
        name: '朱熹',
        title: '理学大师',
        period: '南宋时期 (1130-1200)',
        avatar: '/images/characters/zhuxi.png',
        specialties: ['理学', '格物', '致知'],
        description: '南宋理学家，程朱理学的集大成者。融合儒、释、道三家思想，建立了完整的理学体系。',
        achievements: [
          '集理学之大成，创立程朱理学',
          '注释《四书》，影响后世教育',
          '提出"格物致知"的认识论',
          '建立完整的哲学体系'
        ]
      },
      {
        id: 'wangyangming',
        name: '王阳明',
        title: '心学宗师',
        period: '明代时期 (1472-1529)',
        avatar: '/images/characters/wangyangming.png',
        specialties: ['心学', '知行合一', '致良知'],
        description: '明代思想家、军事家，心学集大成者。提出"心即理"、"知行合一"等重要思想，对后世影响深远。',
        achievements: [
          '创立阳明心学，与程朱理学并立',
          '提出"知行合一"的实践哲学',
          '倡导"致良知"的修养方法',
          '文武双全，平定多次叛乱'
        ]
      }
    ],
    conversations: [],
    topics: {
      confucius: [
        { id: 1, icon: '📚', title: '教育理念', description: '探讨"有教无类"的教育思想' },
        { id: 2, icon: '❤️', title: '仁爱思想', description: '理解"仁者爱人"的深刻含义' },
        { id: 3, icon: '🎭', title: '礼制文化', description: '学习古代礼仪与现代意义' },
        { id: 4, icon: '👥', title: '人际关系', description: '如何处理人与人之间的关系' }
      ],
      laozi: [
        { id: 1, icon: '🌿', title: '道法自然', description: '领悟自然之道的智慧' },
        { id: 2, icon: '🕯️', title: '无为而治', description: '理解无为而治的治理智慧' },
        { id: 3, icon: '☯️', title: '阴阳平衡', description: '探索宇宙万物的平衡之道' },
        { id: 4, icon: '🧘', title: '修身养性', description: '学习道家的修炼方法' }
      ],
      mencius: [
        { id: 1, icon: '💝', title: '性善论', description: '探讨人性本善的观点' },
        { id: 2, icon: '👑', title: '王道政治', description: '理解仁政与王道的理念' },
        { id: 3, icon: '🏛️', title: '民本思想', description: '学习"民为贵"的政治智慧' },
        { id: 4, icon: '💪', title: '浩然正气', description: '培养内在的正气与品格' }
      ],
      zhuxi: [
        { id: 1, icon: '🔍', title: '格物致知', description: '探索认识世界的方法' },
        { id: 2, icon: '📖', title: '四书五经', description: '深入理解经典的智慧' },
        { id: 3, icon: '⚖️', title: '理气关系', description: '理解理学的核心概念' },
        { id: 4, icon: '🎯', title: '修身方法', description: '学习理学的修养功夫' }
      ],
      wangyangming: [
        { id: 1, icon: '❤️', title: '心即理', description: '理解心学的核心观点' },
        { id: 2, icon: '🤝', title: '知行合一', description: '探讨知识与实践的统一' },
        { id: 3, icon: '✨', title: '致良知', description: '学习发现内在良知的方法' },
        { id: 4, icon: '⚔️', title: '文武之道', description: '了解文武双全的人生智慧' }
      ]
    }
  },

  onLoad: function(options) {
    console.log('AI对话页面加载')
    this.loadConversations()

    // 如果从其他页面传入了人物ID，直接选择
    if (options.character) {
      this.setData({ selectedCharacter: options.character })
    }
  },

  onShow: function() {
    console.log('AI对话页面显示')
    this.loadConversations()
  },

  onPullDownRefresh: function() {
    const self = this
    this.loadConversations().finally(function() {
      wx.stopPullDownRefresh()
    })
  },

  // 选择人物
  selectCharacter: function(e) {
    const characterId = e.currentTarget.dataset.character
    this.setData({ selectedCharacter: characterId })
    console.log('选择人物:', characterId)
  },

  // 根据ID获取人物信息
  getCharacterById: function(id) {
    return this.data.characters.find(function(char) {
      return char.id === id
    }) || {}
  },

  // 根据人物获取话题
  getTopicsByCharacter: function(characterId) {
    return this.data.topics[characterId] || []
  },

  // 开始新对话
  startNewChat: function() {
    if (!this.data.selectedCharacter) {
      app.showError('请先选择对话人物')
      return
    }

    const conversationId = CommonUtils.generateConversationId()
    wx.navigateTo({
      url: '/pages/dialogue/chat/chat?character=' + this.data.selectedCharacter + '&conversationId=' + conversationId
    })
  },

  // 开始话题对话
  startTopicChat: function(e) {
    const topic = e.currentTarget.dataset.topic
    if (!this.data.selectedCharacter) {
      app.showError('请先选择对话人物')
      return
    }

    const conversationId = CommonUtils.generateConversationId()
    const initialMessage = this.generateTopicMessage(topic)

    wx.navigateTo({
      url: '/pages/dialogue/chat/chat?character=' + this.data.selectedCharacter + '&conversationId=' + conversationId + '&topic=' + encodeURIComponent(initialMessage)
    })
  },

  // 继续对话
  continueConversation: function(e) {
    const conversation = e.currentTarget.dataset.conversation
    wx.navigateTo({
      url: '/pages/dialogue/chat/chat?character=' + conversation.characterId + '&conversationId=' + conversation.id
    })
  },

  // 加载对话历史
  loadConversations: function() {
    const self = this

    return ApiUtils.dialogue.getConversations(app.globalData.currentUser.id, 10).then(function(result) {
      if (result.success) {
        const conversations = result.data.map(function(conv) {
          return Object.assign({}, conv, {
            lastTime: CommonUtils.formatTime(new Date(conv.lastTime))
          })
        })
        self.setData({ conversations: conversations })
      }
    }).catch(function(error) {
      console.error('加载对话历史失败:', error)
      // 使用模拟数据
      self.setData({
        conversations: [
          {
            id: 'conv_1',
            characterId: 'confucius',
            lastMessage: '学而时习之，不亦说乎？',
            lastTime: '2小时前',
            messageCount: 15
          },
          {
            id: 'conv_2',
            characterId: 'laozi',
            lastMessage: '道可道，非常道...',
            lastTime: '昨天',
            messageCount: 8
          }
        ]
      })
    })
  },

  // 生成话题消息
  generateTopicMessage: function(topic) {
    const templates = {
      '教育理念': '请您谈谈关于教育的看法，特别是"有教无类"的理念在现代的意义。',
      '仁爱思想': '能否为我解释一下"仁者爱人"的深刻含义？',
      '礼制文化': '古代的礼制在现代社会还有什么价值吗？',
      '人际关系': '在处理人际关系方面，您有什么智慧可以分享？',
      '道法自然': '请您解释一下"道法自然"的含义，以及如何在生活中实践？',
      '无为而治': '"无为而治"的治理智慧在现代管理中有什么启发？',
      '阴阳平衡': '如何理解和运用阴阳平衡的智慧？',
      '修身养性': '道家的修身养性方法有哪些？',
      '性善论': '您认为人性本善，这个观点的依据是什么？',
      '王道政治': '什么是王道政治？与现代民主有什么关系？',
      '民本思想': '"民为贵"的思想在现代有什么意义？',
      '浩然正气': '如何培养内在的浩然正气？',
      '格物致知': '请解释"格物致知"的认识方法。',
      '四书五经': '学习经典对现代人有什么价值？',
      '理气关系': '理学中的"理"和"气"是什么关系？',
      '修身方法': '理学的修身方法有哪些要点？',
      '心即理': '"心即理"这个观点如何理解？',
      '知行合一': '请详细解释"知行合一"的含义。',
      '致良知': '如何"致良知"？有什么具体的方法？',
      '文武之道': '您是如何做到文武双全的？'
    }

    return templates[topic.title] || '请您谈谈关于"' + topic.title + '"的看法。'
  },

  // 分享功能
  onShareAppMessage: function() {
    const character = this.getCharacterById(this.data.selectedCharacter)
    return {
      title: '儒智AI对话 - 与' + (character.name || '古代先贤') + '对话',
      desc: '体验与历史智者的深度交流，探索传统文化的智慧',
      path: '/pages/dialogue/dialogue?character=' + this.data.selectedCharacter
    }
  }
})
