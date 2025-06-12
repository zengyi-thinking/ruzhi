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
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
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
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('系统信息:', res)
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err)
      }
    })
  },

  // 全局API请求方法
  request(options) {
    const { url, method = 'GET', data = {}, header = {} } = options
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...header
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
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
  login() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
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
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          this.globalData.hasUserInfo = true
          resolve(res.userInfo)
        },
        fail: reject
      })
    })
  },

  globalData: {}
})
