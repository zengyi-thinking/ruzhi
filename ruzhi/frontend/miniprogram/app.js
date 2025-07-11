// 儒智微信小程序 - 主应用文件
const { config, logger } = require('./config/env');
const errorHandler = require('./utils/errorHandler');

App({
  onLaunch: function () {
    logger.info('儒智小程序启动', { version: config.VERSION, env: config.ENV })

    // 初始化全局配置
    this.initGlobalConfig()

    // 检查更新
    this.checkForUpdate()

    // 初始化全局数据
    this.initGlobalData()

    // 检查网络状态
    this.checkNetworkStatus()
  },

  // 初始化全局配置
  initGlobalConfig: function() {
    // 将环境配置合并到全局数据
    this.globalData = {
      ...this.globalData,
      config: config,
      logger: logger
    };

    logger.info('全局配置初始化完成', config);
  },

  onShow: function (options) {
    console.log('小程序显示', options)
  },

  onHide: function () {
    console.log('小程序隐藏')
  },

  onError: function (msg) {
    logger.error('小程序错误:', msg)
    // 使用统一错误处理器
    errorHandler.handleSystemError(new Error(msg), {
      source: 'app_on_error'
    });
  },

  // 检查小程序更新
  checkForUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate(function (res) {
        console.log('检查更新结果:', res.hasUpdate)
      })

      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function (res) {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(function () {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        })
      })
    }
  },

  // 初始化全局数据
  initGlobalData: function() {
    const self = this

    // 获取系统信息 - 使用新的异步API
    wx.getSystemInfo({
      success: function(systemInfo) {
        self.globalData.systemInfo = systemInfo

        // 设置状态栏高度
        self.globalData.statusBarHeight = systemInfo.statusBarHeight

        // 获取胶囊按钮位置信息
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
        self.globalData.menuButtonInfo = menuButtonInfo

        // 计算导航栏高度
        self.globalData.navBarHeight = menuButtonInfo.bottom + menuButtonInfo.top - systemInfo.statusBarHeight

        console.log('全局数据初始化完成:', self.globalData)
      },
      fail: function(error) {
        console.error('获取系统信息失败:', error)
        // 设置默认值
        self.globalData.statusBarHeight = 20
        self.globalData.navBarHeight = 44
      }
    })
  },

  // 检查网络状态
  checkNetworkStatus: function() {
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkType = res.networkType
        console.log('网络类型:', res.networkType)
        
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接异常',
            icon: 'none'
          })
        }
      }
    })

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.globalData.networkType = res.networkType
      console.log('网络状态变化:', res)
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接断开',
          icon: 'none'
        })
      }
    })
  },

  // 错误上报
  reportError: function(error) {
    // 这里可以集成错误监控服务
    console.error('错误上报:', error)
    
    // 可以发送到后端API进行错误收集
    // wx.request({
    //   url: this.globalData.apiBase + '/api/error-report',
    //   method: 'POST',
    //   data: {
    //     error: error,
    //     timestamp: new Date().toISOString(),
    //     userInfo: this.globalData.userInfo,
    //     systemInfo: this.globalData.systemInfo
    //   }
    // })
  },

  // 显示加载提示
  showLoading: function(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading: function() {
    wx.hideLoading()
  },

  // 显示成功提示
  showSuccess: function(title) {
    wx.showToast({
      title: title,
      icon: 'success',
      duration: 2000
    })
  },

  // 显示错误提示
  showError: function(title) {
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 3000
    })
  },

  // 显示确认对话框
  showConfirm: function(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '提示',
        content: options.content || '',
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  // 获取用户信息
  getUserInfo: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo)
        return
      }

      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          this.globalData.userInfo = res.userInfo
          resolve(res.userInfo)
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
          reject(err)
        }
      })
    })
  },

  // 全局数据
  globalData: {
    // 用户信息
    userInfo: null,
    
    // 系统信息
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonInfo: null,
    
    // 网络状态
    networkType: 'unknown',

    // 应用配置
    appName: '儒智',
    version: '1.0.0',
    
    // 缓存键名
    cacheKeys: {
      userInfo: 'ruzhi_user_info',
      ocrHistory: 'ruzhi_ocr_history',
      chatHistory: 'ruzhi_chat_history',
      readingProgress: 'ruzhi_reading_progress',
      favorites: 'ruzhi_favorites'
    },
    
    // 页面路径
    pages: {
      home: '/pages/home/home',
      ocr: '/pages/ocr/ocr',
      chat: '/pages/chat/chat',
      classics: '/pages/classics/classics',
      knowledge: '/pages/knowledge/knowledge',
      profile: '/pages/profile/profile'
    }
  }
})
