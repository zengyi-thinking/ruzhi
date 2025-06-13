// 儒智小程序 - 主应用文件
App({
  onLaunch() {
    console.log('儒智小程序启动')
    
    // 检查更新
    this.checkForUpdate()
    
    // 初始化全局数据
    this.initGlobalData()
    
    // 获取系统信息
    this.getSystemInfo()
  },

  onShow() {
    console.log('儒智小程序显示')
  },

  onHide() {
    console.log('儒智小程序隐藏')
  },

  onError(msg) {
    console.error('儒智小程序错误:', msg)
  },

  // 检查小程序更新
  checkForUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate(function(res) {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })

      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(function() {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    }
  },

  // 初始化全局数据
  initGlobalData() {
    this.globalData = {
      userInfo: null,
      hasUserInfo: false,
      canIUseGetUserProfile: false,
      baseUrl: 'http://localhost:8000', // 后端API地址
      systemInfo: null,
      currentUser: {
        id: 'miniprogram_user',
        name: '小程序用户',
        avatar: '/images/default-avatar.png'
      },
      // 学习数据
      learningData: {
        totalDays: 0,
        totalHours: 0,
        totalPoints: 0,
        currentStreak: 0
      },
      // 当前对话
      currentConversation: null,
      // 缓存数据
      cache: new Map()
    }
  },

  // 获取系统信息
  getSystemInfo: function() {
    const self = this
    wx.getSystemInfo({
      success: function(res) {
        self.globalData.systemInfo = res
        console.log('系统信息:', res)
      },
      fail: function(err) {
        console.error('获取系统信息失败:', err)
      }
    })
  },

  // 全局API请求方法
  request: function(options) {
    const url = options.url
    const method = options.method || 'GET'
    const data = options.data || {}
    const header = options.header || {}
    const self = this

    return new Promise(function(resolve, reject) {
      wx.request({
        url: self.globalData.baseUrl + url,
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

  // 显示加载提示
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  },

  // 显示成功提示
  showSuccess(title) {
    wx.showToast({
      title,
      icon: 'success',
      duration: 2000
    })
  },

  // 显示错误提示
  showError(title) {
    wx.showToast({
      title,
      icon: 'none',
      duration: 3000
    })
  },

  // 缓存管理
  setCache(key, value, expire = 3600000) { // 默认1小时过期
    this.globalData.cache.set(key, {
      value,
      expire: Date.now() + expire
    })
  },

  getCache(key) {
    const cached = this.globalData.cache.get(key)
    if (cached && cached.expire > Date.now()) {
      return cached.value
    }
    this.globalData.cache.delete(key)
    return null
  },

  // 用户登录
  login: function() {
    return new Promise(function(resolve, reject) {
      wx.login({
        success: function(res) {
          if (res.code) {
            console.log('登录成功，code:', res.code)
            // 这里可以发送code到后端换取session_key
            resolve(res.code)
          } else {
            reject(new Error('登录失败'))
          }
        },
        fail: reject
      })
    })
  },

  // 获取用户信息
  getUserProfile: function() {
    const self = this
    return new Promise(function(resolve, reject) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: function(res) {
          self.globalData.userInfo = res.userInfo
          self.globalData.hasUserInfo = true
          resolve(res.userInfo)
        },
        fail: reject
      })
    })
  },

  globalData: {}
})
