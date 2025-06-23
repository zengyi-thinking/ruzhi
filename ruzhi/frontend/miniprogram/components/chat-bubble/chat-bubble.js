/**
 * 聊天气泡组件
 * 用于显示对话消息
 */
Component({
  properties: {
    // 消息数据
    message: {
      type: Object,
      value: {},
      observer: function(newVal) {
        this.processMessage(newVal);
      }
    },
    
    // 消息类型：user | assistant
    type: {
      type: String,
      value: 'user'
    },
    
    // 是否显示头像
    showAvatar: {
      type: Boolean,
      value: true
    },
    
    // 是否显示时间
    showTime: {
      type: Boolean,
      value: true
    },
    
    // 是否启用打字机效果
    typewriterEffect: {
      type: Boolean,
      value: false
    }
  },

  data: {
    // 处理后的消息内容
    processedContent: '',
    
    // 打字机效果相关
    displayContent: '',
    typewriterTimer: null,
    typewriterIndex: 0,
    
    // 消息状态
    isLoading: false,
    isError: false,
    
    // 时间显示
    timeDisplay: ''
  },

  lifetimes: {
    attached() {
      this.processMessage(this.data.message);
    },
    
    detached() {
      this.clearTypewriterTimer();
    }
  },

  methods: {
    /**
     * 处理消息数据
     */
    processMessage(message) {
      if (!message || !message.content) {
        return;
      }

      // 处理消息内容
      const processedContent = this.formatMessageContent(message.content);
      
      // 格式化时间
      const timeDisplay = this.formatTime(message.timestamp);
      
      this.setData({
        processedContent,
        timeDisplay,
        isLoading: message.isLoading || false,
        isError: message.isError || false
      });

      // 如果启用打字机效果且是助手消息
      if (this.data.typewriterEffect && this.data.type === 'assistant' && !message.isLoading) {
        this.startTypewriterEffect(processedContent);
      } else {
        this.setData({
          displayContent: processedContent
        });
      }
    },

    /**
     * 格式化消息内容
     */
    formatMessageContent(content) {
      if (!content) return '';
      
      // 处理换行
      content = content.replace(/\n/g, '\n');
      
      // 处理古文引用（用特殊标记包围）
      content = content.replace(/「([^」]+)」/g, '<span class="quote">「$1」</span>');
      
      return content;
    },

    /**
     * 格式化时间显示
     */
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      // 1分钟内显示"刚刚"
      if (diff < 60000) {
        return '刚刚';
      }
      
      // 1小时内显示分钟
      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      }
      
      // 今天显示时分
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      // 其他显示月日时分
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    /**
     * 开始打字机效果
     */
    startTypewriterEffect(content) {
      this.clearTypewriterTimer();
      
      this.setData({
        displayContent: '',
        typewriterIndex: 0
      });

      const chars = content.split('');
      
      this.data.typewriterTimer = setInterval(() => {
        if (this.data.typewriterIndex < chars.length) {
          const currentContent = chars.slice(0, this.data.typewriterIndex + 1).join('');
          this.setData({
            displayContent: currentContent,
            typewriterIndex: this.data.typewriterIndex + 1
          });
        } else {
          this.clearTypewriterTimer();
        }
      }, 50); // 每50ms显示一个字符
    },

    /**
     * 清理打字机定时器
     */
    clearTypewriterTimer() {
      if (this.data.typewriterTimer) {
        clearInterval(this.data.typewriterTimer);
        this.setData({
          typewriterTimer: null
        });
      }
    },

    /**
     * 点击消息气泡
     */
    onBubbleClick() {
      this.triggerEvent('bubbleclick', {
        message: this.data.message,
        type: this.data.type
      });
    },

    /**
     * 长按消息气泡
     */
    onBubbleLongPress() {
      const message = this.data.message;
      
      wx.showActionSheet({
        itemList: ['复制', '收藏', '删除'],
        success: (res) => {
          switch (res.tapIndex) {
            case 0: // 复制
              this.copyMessage();
              break;
            case 1: // 收藏
              this.favoriteMessage();
              break;
            case 2: // 删除
              this.deleteMessage();
              break;
          }
        }
      });
    },

    /**
     * 复制消息
     */
    copyMessage() {
      wx.setClipboardData({
        data: this.data.message.content,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    },

    /**
     * 收藏消息
     */
    favoriteMessage() {
      this.triggerEvent('favorite', {
        message: this.data.message
      });
    },

    /**
     * 删除消息
     */
    deleteMessage() {
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条消息吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              message: this.data.message
            });
          }
        }
      });
    },

    /**
     * 点击头像
     */
    onAvatarClick() {
      this.triggerEvent('avatarclick', {
        message: this.data.message,
        type: this.data.type
      });
    }
  }
});
