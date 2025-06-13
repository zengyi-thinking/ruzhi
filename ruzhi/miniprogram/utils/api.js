// API请求工具函数
const app = getApp()

const ApiUtils = {
  // 基础请求方法
  request: function(options) {
    const url = options.url
    const method = options.method || 'GET'
    const data = options.data || {}
    const header = options.header || {}
    
    return new Promise(function(resolve, reject) {
      wx.request({
        url: app.globalData.baseUrl + url,
        method: method,
        data: data,
        header: Object.assign({
          'Content-Type': 'application/json'
        }, header),
        success: function(res) {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error('请求失败: ' + res.statusCode))
          }
        },
        fail: function(err) {
          reject(err)
        }
      })
    })
  },

  // GET请求
  get: function(url, data) {
    return this.request({
      url: url,
      method: 'GET',
      data: data
    })
  },

  // POST请求
  post: function(url, data) {
    return this.request({
      url: url,
      method: 'POST',
      data: data
    })
  },

  // PUT请求
  put: function(url, data) {
    return this.request({
      url: url,
      method: 'PUT',
      data: data
    })
  },

  // DELETE请求
  delete: function(url, data) {
    return this.request({
      url: url,
      method: 'DELETE',
      data: data
    })
  },

  // 对话相关API
  dialogue: {
    // 获取人物列表
    getCharacters: function() {
      return ApiUtils.get('/api/v1/dialogue/characters')
    },

    // 发送消息
    sendMessage: function(message, character, conversationId) {
      return ApiUtils.post('/api/v1/dialogue/chat', {
        message: message,
        character: character,
        conversationId: conversationId
      })
    },

    // 获取对话历史
    getHistory: function(conversationId) {
      return ApiUtils.get('/api/v1/dialogue/history/' + conversationId)
    },

    // 获取对话列表
    getConversations: function(userId, limit) {
      return ApiUtils.get('/api/v1/dialogue/conversations', {
        userId: userId,
        limit: limit || 10
      })
    },

    // 保存对话
    saveConversation: function(conversationId, characterId, messages, userId) {
      return ApiUtils.post('/api/v1/dialogue/save', {
        conversationId: conversationId,
        characterId: characterId,
        messages: messages,
        userId: userId
      })
    }
  },

  // 知识图谱相关API
  knowledge: {
    // 搜索概念
    search: function(query) {
      return ApiUtils.get('/api/v1/knowledge/search', {
        q: query
      })
    },

    // 获取概念详情
    getConcept: function(concept) {
      return ApiUtils.get('/api/v1/knowledge/concept/' + encodeURIComponent(concept))
    },

    // 获取概念故事
    getConceptStories: function(concept) {
      return ApiUtils.get('/api/v1/knowledge/concept/' + encodeURIComponent(concept) + '/stories')
    },

    // 扩展概念
    expandConcept: function(concept, type) {
      return ApiUtils.post('/api/v1/knowledge/concept/' + encodeURIComponent(concept) + '/expand', {
        type: type || 'related'
      })
    },

    // 生成学习路径
    generateLearningPath: function(interests, level) {
      return ApiUtils.post('/api/v1/knowledge/learning-path', {
        interests: interests,
        level: level || 'beginner'
      })
    },

    // 获取推荐
    getRecommendations: function(currentConcepts, type) {
      return ApiUtils.post('/api/v1/knowledge/recommend', {
        current_concepts: currentConcepts || [],
        type: type || 'related'
      })
    }
  },

  // OCR相关API
  ocr: {
    // 上传并分析图片
    analyze: function(filePath, mode) {
      const app = getApp()
      return new Promise(function(resolve, reject) {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/api/v1/ocr/analyze',
          filePath: filePath,
          name: 'file',
          formData: {
            mode: mode
          },
          success: function(res) {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (error) {
              reject(new Error('解析响应失败'))
            }
          },
          fail: function(error) {
            reject(error)
          }
        })
      })
    },

    // 解读文本
    interpret: function(text, mode) {
      return ApiUtils.post('/api/v1/ocr/interpret', {
        text: text,
        mode: mode
      })
    },

    // 保存结果
    save: function(userId, text, confidence, mode, metadata) {
      return ApiUtils.post('/api/v1/ocr/save', {
        userId: userId,
        text: text,
        confidence: confidence,
        mode: mode,
        metadata: metadata
      })
    },

    // 获取历史记录
    getHistory: function(userId, limit) {
      return ApiUtils.get('/api/v1/ocr/history', {
        userId: userId,
        limit: limit || 10
      })
    }
  },

  // 学习相关API
  learning: {
    // 获取学习统计
    getStats: function(userId) {
      return ApiUtils.get('/api/v1/learning/stats/' + userId)
    },

    // 获取学习进度
    getProgress: function(userId) {
      return ApiUtils.get('/api/v1/learning/progress/' + userId)
    },

    // 获取成就
    getAchievements: function(userId) {
      return ApiUtils.get('/api/v1/learning/achievements/' + userId)
    },

    // 更新学习记录
    updateRecord: function(userId, activity, points) {
      return ApiUtils.post('/api/v1/learning/record', {
        userId: userId,
        activity: activity,
        points: points
      })
    }
  }
}

module.exports = ApiUtils
