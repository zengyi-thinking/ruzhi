// 公共工具函数
const CommonUtils = {
  // 格式化时间
  formatTime: function(date) {
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 86400000 * 7) { // 1周内
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return date.toLocaleDateString()
    }
  },

  // 格式化简单时间（时:分）
  formatSimpleTime: function(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return hours + ':' + minutes
  },

  // 生成唯一ID
  generateId: function(prefix) {
    prefix = prefix || 'id'
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },

  // 生成对话ID
  generateConversationId: function() {
    return this.generateId('conv')
  },

  // 生成消息ID
  generateMessageId: function() {
    return this.generateId('msg')
  },

  // 复制文本到剪贴板
  copyToClipboard: function(text, successCallback, failCallback) {
    wx.setClipboardData({
      data: text,
      success: function() {
        if (typeof successCallback === 'function') {
          successCallback()
        }
      },
      fail: function() {
        if (typeof failCallback === 'function') {
          failCallback()
        }
      }
    })
  },

  // 显示确认对话框
  showConfirm: function(title, content, confirmCallback, cancelCallback) {
    wx.showModal({
      title: title,
      content: content,
      success: function(res) {
        if (res.confirm && typeof confirmCallback === 'function') {
          confirmCallback()
        } else if (res.cancel && typeof cancelCallback === 'function') {
          cancelCallback()
        }
      }
    })
  },

  // 显示操作菜单
  showActionSheet: function(itemList, successCallback) {
    wx.showActionSheet({
      itemList: itemList,
      success: function(res) {
        if (typeof successCallback === 'function') {
          successCallback(res.tapIndex)
        }
      }
    })
  },

  // 选择图片
  chooseImage: function(options) {
    const defaultOptions = {
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera']
    }
    
    const finalOptions = Object.assign({}, defaultOptions, options)
    
    return new Promise(function(resolve, reject) {
      wx.chooseMedia({
        count: finalOptions.count,
        mediaType: finalOptions.mediaType,
        sourceType: finalOptions.sourceType,
        success: function(res) {
          resolve(res.tempFiles[0].tempFilePath)
        },
        fail: function(error) {
          reject(error)
        }
      })
    })
  },

  // 上传文件
  uploadFile: function(url, filePath, formData) {
    return new Promise(function(resolve, reject) {
      wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        formData: formData || {},
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

  // 防抖函数
  debounce: function(func, wait) {
    let timeout
    return function() {
      const context = this
      const args = arguments
      clearTimeout(timeout)
      timeout = setTimeout(function() {
        func.apply(context, args)
      }, wait)
    }
  },

  // 节流函数
  throttle: function(func, wait) {
    let timeout
    return function() {
      const context = this
      const args = arguments
      if (!timeout) {
        timeout = setTimeout(function() {
          timeout = null
          func.apply(context, args)
        }, wait)
      }
    }
  },

  // 深拷贝对象
  deepClone: function(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }
    
    if (obj instanceof Array) {
      return obj.map(function(item) {
        return CommonUtils.deepClone(item)
      })
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = CommonUtils.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },

  // 数组去重
  uniqueArray: function(arr) {
    const result = []
    for (let i = 0; i < arr.length; i++) {
      if (result.indexOf(arr[i]) === -1) {
        result.push(arr[i])
      }
    }
    return result
  },

  // 格式化数字
  formatNumber: function(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 截取字符串
  truncateString: function(str, length) {
    if (str.length <= length) {
      return str
    }
    return str.substring(0, length) + '...'
  },

  // 验证是否为空
  isEmpty: function(value) {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0)
  },

  // 获取随机数
  getRandomNumber: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  // 获取随机数组元素
  getRandomArrayItem: function(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }
}

module.exports = CommonUtils
