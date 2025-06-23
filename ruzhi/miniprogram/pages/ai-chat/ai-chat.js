// AI对话页面逻辑
const app = getApp();
const { aiChatAPI } = require('../../utils/api');
const { formatTime, formatDistanceToNow } = require('../../utils/time');

Page({
  data: {
    // 人物相关
    characters: [],
    selectedCharacter: null,
    selectedCharacterId: '',
    
    // 消息相关
    messages: [],
    inputMessage: '',
    isLoading: false,
    isTyping: false,
    scrollTop: 0,
    scrollIntoView: '',
    
    // UI状态
    showThinking: false,
    errorMessage: '',
    recommendations: [],
    
    // 用户设置
    userLevel: 'beginner',
    userInterests: [],
    useStreaming: true
  },

  onLoad(options) {
    // 从参数获取初始人物ID
    if (options.characterId) {
      this.setData({ selectedCharacterId: options.characterId });
    }
    
    this.loadCharacters();
    this.initUserSettings();
  },

  onShow() {
    // 页面显示时刷新消息时间
    this.updateMessageTimes();
  },

  // 初始化用户设置
  initUserSettings() {
    const userInfo = app.globalData.userInfo;
    if (userInfo && userInfo.profile) {
      this.setData({
        userLevel: userInfo.profile.learningLevel || 'beginner',
        userInterests: userInfo.profile.interests || []
      });
    }
  },

  // 加载可用人物
  async loadCharacters() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const response = await aiChatAPI.getCharacters();
      const characters = response.data.characters;
      
      this.setData({ characters });
      
      // 如果有预选人物，自动选择
      if (this.data.selectedCharacterId) {
        const character = characters.find(c => c.id === this.data.selectedCharacterId);
        if (character) {
          this.selectCharacter({ currentTarget: { dataset: { character } } });
        }
      }
      
    } catch (error) {
      console.error('加载人物失败:', error);
      this.showError('加载人物列表失败');
    } finally {
      wx.hideLoading();
    }
  },

  // 选择对话人物
  selectCharacter(e) {
    const character = e.currentTarget.dataset.character;
    
    this.setData({
      selectedCharacter: character,
      messages: [{
        id: Date.now(),
        type: 'system',
        content: `您现在正在与${character.name}（${character.title}）对话。${character.description}`,
        timestamp: new Date(),
        timeStr: '刚刚'
      }]
    });

    // 记录选择人物的行为
    this.trackUserAction('select_character', { characterId: character.id });
  },

  // 输入变化
  onInputChange(e) {
    this.setData({ inputMessage: e.detail.value });
  },

  // 发送消息
  async sendMessage() {
    const message = this.data.inputMessage.trim();
    if (!message || !this.data.selectedCharacter || this.data.isLoading) {
      return;
    }

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      timeStr: '刚刚'
    };

    this.setData({
      messages: [...this.data.messages, userMessage],
      inputMessage: '',
      isLoading: true,
      isTyping: true,
      errorMessage: ''
    });

    this.scrollToBottom();

    try {
      if (this.data.useStreaming) {
        await this.handleStreamingChat(message);
      } else {
        await this.handleRegularChat(message);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      this.showError('发送消息失败，请重试');
      
      // 添加错误消息
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: '抱歉，我暂时无法回复。请稍后再试。',
        timestamp: new Date(),
        timeStr: '刚刚'
      };
      
      this.setData({
        messages: [...this.data.messages, errorMessage]
      });
    } finally {
      this.setData({
        isLoading: false,
        isTyping: false
      });
    }
  },

  // 处理流式对话
  async handleStreamingChat(message) {
    const requestData = {
      message,
      character_id: this.data.selectedCharacter.id,
      user_level: this.data.userLevel,
      user_interests: this.data.userInterests,
      conversation_mode: 'learning'
    };

    // 创建助手消息占位符
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: '',
      character: this.data.selectedCharacter,
      timestamp: new Date(),
      timeStr: '刚刚',
      isStreaming: true
    };

    this.setData({
      messages: [...this.data.messages, assistantMessage]
    });

    try {
      // 小程序不支持EventSource，使用轮询或WebSocket替代
      // 这里使用模拟的流式效果
      const response = await aiChatAPI.chat(requestData);
      
      // 模拟打字效果
      await this.simulateTypingEffect(assistantMessage.id, response.data.response);
      
      // 更新消息详情
      this.updateMessageDetails(assistantMessage.id, response.data);
      
    } catch (error) {
      // 移除失败的消息
      this.removeMessage(assistantMessage.id);
      throw error;
    }
  },

  // 处理普通对话
  async handleRegularChat(message) {
    const requestData = {
      message,
      character_id: this.data.selectedCharacter.id,
      user_level: this.data.userLevel,
      user_interests: this.data.userInterests,
      conversation_mode: 'learning'
    };

    const response = await aiChatAPI.chat(requestData);
    
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: response.data.response,
      character: this.data.selectedCharacter,
      timestamp: new Date(),
      timeStr: '刚刚',
      thinkingProcess: response.data.thinking_process,
      qualityAssessment: response.data.quality_assessment,
      ragEnhancement: response.data.rag_enhancement,
      processingTime: response.data.processing_time,
      qualityScore: Math.round(response.data.quality_assessment?.quality_score * 100),
      processingTimeStr: this.formatProcessingTime(response.data.processing_time)
    };

    this.setData({
      messages: [...this.data.messages, assistantMessage],
      recommendations: response.data.related_recommendations || []
    });

    this.scrollToBottom();
  },

  // 模拟打字效果
  async simulateTypingEffect(messageId, fullContent) {
    const words = fullContent.split('');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += words[i];
      
      this.setData({
        messages: this.data.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentContent }
            : msg
        )
      });
      
      // 控制打字速度
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.scrollToBottom();
      }
    }
    
    // 完成打字效果
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: false }
          : msg
      )
    });
  },

  // 更新消息详情
  updateMessageDetails(messageId, responseData) {
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              thinkingProcess: responseData.thinking_process,
              qualityAssessment: responseData.quality_assessment,
              ragEnhancement: responseData.rag_enhancement,
              processingTime: responseData.processing_time,
              qualityScore: Math.round(responseData.quality_assessment?.quality_score * 100),
              processingTimeStr: this.formatProcessingTime(responseData.processing_time)
            }
          : msg
      ),
      recommendations: responseData.related_recommendations || []
    });
  },

  // 移除消息
  removeMessage(messageId) {
    this.setData({
      messages: this.data.messages.filter(msg => msg.id !== messageId)
    });
  },

  // 切换消息详情显示
  toggleMessageDetails(e) {
    const messageId = e.currentTarget.dataset.id;
    this.setData({
      messages: this.data.messages.map(msg => 
        msg.id == messageId 
          ? { ...msg, showDetails: !msg.showDetails }
          : msg
      )
    });
  },

  // 切换思考过程显示
  toggleThinking() {
    this.setData({ showThinking: !this.data.showThinking });
  },

  // 清除对话
  async clearConversation() {
    try {
      const result = await wx.showModal({
        title: '确认清除',
        content: '确定要清除与当前人物的对话记录吗？',
        confirmText: '清除',
        cancelText: '取消'
      });

      if (!result.confirm) return;

      await aiChatAPI.clearConversation({ 
        character_id: this.data.selectedCharacter.id 
      });

      this.setData({
        messages: [{
          id: Date.now(),
          type: 'system',
          content: `对话已清除。您可以重新开始与${this.data.selectedCharacter.name}的对话。`,
          timestamp: new Date(),
          timeStr: '刚刚'
        }],
        recommendations: []
      });

      wx.showToast({ title: '对话已清除', icon: 'success' });

    } catch (error) {
      console.error('清除对话失败:', error);
      this.showError('清除对话失败');
    }
  },

  // 复制消息
  copyMessage(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  // 提交反馈
  async submitFeedback(e) {
    const { id, type } = e.currentTarget.dataset;
    
    try {
      await aiChatAPI.submitFeedback({
        character_id: this.data.selectedCharacter.id,
        rating: type === 'helpful' ? 5 : 2,
        feedback_type: type,
        conversation_context: { messageId: id }
      });

      // 更新消息反馈状态
      this.setData({
        messages: this.data.messages.map(msg => 
          msg.id == id 
            ? { ...msg, feedback: type }
            : msg
        )
      });

      wx.showToast({ 
        title: type === 'helpful' ? '感谢反馈' : '已记录反馈', 
        icon: 'success' 
      });

    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  },

  // 选择推荐
  selectRecommendation(e) {
    const recommendation = e.currentTarget.dataset.recommendation;
    this.setData({ inputMessage: recommendation.title });
  },

  // 选择快捷输入
  selectQuickInput(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ inputMessage: text });
  },

  // 滚动到底部
  scrollToBottom() {
    const lastMessage = this.data.messages[this.data.messages.length - 1];
    if (lastMessage) {
      this.setData({ scrollIntoView: `msg-${lastMessage.id}` });
    }
  },

  // 更新消息时间
  updateMessageTimes() {
    const now = new Date();
    this.setData({
      messages: this.data.messages.map(msg => ({
        ...msg,
        timeStr: formatDistanceToNow(msg.timestamp, now)
      }))
    });
  },

  // 格式化处理时间
  formatProcessingTime(time) {
    if (!time) return '';
    if (time < 1) return `${(time * 1000).toFixed(0)}ms`;
    return `${time.toFixed(2)}s`;
  },

  // 显示错误
  showError(message) {
    this.setData({ errorMessage: message });
    setTimeout(() => {
      this.setData({ errorMessage: '' });
    }, 3000);
  },

  // 清除错误
  clearError() {
    this.setData({ errorMessage: '' });
  },

  // 跟踪用户行为
  trackUserAction(action, data = {}) {
    // 记录用户行为用于分析
    console.log('User Action:', action, data);
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `与${this.data.selectedCharacter?.name || '古代智者'}对话`,
      path: `/pages/ai-chat/ai-chat?characterId=${this.data.selectedCharacter?.id || ''}`,
      imageUrl: this.data.selectedCharacter?.avatar || '/images/share-default.png'
    };
  }
});
