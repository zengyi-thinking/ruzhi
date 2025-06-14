// 网络连接测试页面
const app = getApp()
const { request } = require('../../utils/request.js')

Page({
  data: {
    // 基础配置
    apiBase: app.globalData.apiBase,
    testing: false,
    
    // 整体状态
    overallStatus: 'unknown', // success, warning, error, unknown
    statusTitle: '等待测试',
    statusDesc: '点击开始测试按钮进行网络连接检测',
    successRate: 0,
    
    // 测试结果
    testResults: {
      basic: {
        status: 'unknown',
        expanded: false,
        responseTime: null,
        statusCode: null,
        error: null
      },
      ai: {
        status: 'unknown',
        expanded: false,
        apiStatus: null,
        model: null,
        testResponse: null,
        error: null
      },
      ocr: {
        status: 'unknown',
        expanded: false,
        serviceStatus: null,
        supportedFormats: null,
        error: null
      },
      database: {
        status: 'unknown',
        expanded: false,
        connectionStatus: null,
        dbType: null,
        error: null
      }
    },
    
    // 网络信息
    networkInfo: {
      networkType: '检测中...',
      signalStrength: '检测中...',
      latency: '--',
      bandwidth: '检测中...'
    },
    
    // 测试历史
    testHistory: []
  },

  onLoad: function(options) {
    console.log('网络测试页面加载')
    this.loadNetworkInfo()
    this.loadTestHistory()
    
    // 自动开始测试
    setTimeout(() => {
      this.onRunAllTests()
    }, 1000)
  },

  // 加载网络信息
  loadNetworkInfo: function() {
    wx.getNetworkType({
      success: (res) => {
        this.setData({
          'networkInfo.networkType': res.networkType
        })
        
        // 根据网络类型设置其他信息
        this.updateNetworkDetails(res.networkType)
      },
      fail: (error) => {
        console.error('获取网络类型失败:', error)
        this.setData({
          'networkInfo.networkType': '未知'
        })
      }
    })
  },

  // 更新网络详细信息
  updateNetworkDetails: function(networkType) {
    let signalStrength = '良好'
    let bandwidth = '正常'
    
    switch (networkType) {
      case 'wifi':
        signalStrength = '优秀'
        bandwidth = '高速'
        break
      case '4g':
        signalStrength = '良好'
        bandwidth = '快速'
        break
      case '3g':
        signalStrength = '一般'
        bandwidth = '中等'
        break
      case '2g':
        signalStrength = '较弱'
        bandwidth = '较慢'
        break
      case 'none':
        signalStrength = '无信号'
        bandwidth = '无连接'
        break
    }
    
    this.setData({
      'networkInfo.signalStrength': signalStrength,
      'networkInfo.bandwidth': bandwidth
    })
  },

  // 加载测试历史
  loadTestHistory: function() {
    try {
      const history = wx.getStorageSync('network_test_history') || []
      this.setData({ testHistory: history.slice(0, 5) }) // 只显示最近5次
    } catch (error) {
      console.error('加载测试历史失败:', error)
    }
  },

  // 保存测试历史
  saveTestHistory: function(result) {
    try {
      let history = wx.getStorageSync('network_test_history') || []
      
      const newRecord = {
        timestamp: Date.now(),
        time: new Date().toLocaleString(),
        success: result.overallStatus === 'success',
        successRate: result.successRate,
        details: result.testResults
      }
      
      history.unshift(newRecord)
      history = history.slice(0, 10) // 保留最近10次记录
      
      wx.setStorageSync('network_test_history', history)
      this.setData({ testHistory: history.slice(0, 5) })
    } catch (error) {
      console.error('保存测试历史失败:', error)
    }
  },

  // 运行所有测试
  onRunAllTests: async function() {
    if (this.data.testing) return
    
    this.setData({
      testing: true,
      overallStatus: 'unknown',
      statusTitle: '测试进行中',
      statusDesc: '正在检测各项网络连接...'
    })
    
    // 重置所有测试状态
    this.resetTestResults()
    
    try {
      // 并行执行所有测试
      const tests = [
        this.testBasicConnection(),
        this.testAIService(),
        this.testOCRService(),
        this.testDatabaseConnection()
      ]
      
      await Promise.allSettled(tests)
      
      // 计算整体结果
      this.calculateOverallResult()
      
    } catch (error) {
      console.error('测试执行失败:', error)
      this.setData({
        overallStatus: 'error',
        statusTitle: '测试失败',
        statusDesc: '测试过程中发生错误'
      })
    } finally {
      this.setData({ testing: false })
    }
  },

  // 重置测试结果
  resetTestResults: function() {
    const resetResults = {}
    Object.keys(this.data.testResults).forEach(key => {
      resetResults[`testResults.${key}.status`] = 'loading'
      resetResults[`testResults.${key}.error`] = null
    })
    this.setData(resetResults)
  },

  // 测试基础连接
  testBasicConnection: async function() {
    const startTime = Date.now()
    
    try {
      const response = await request.get('/api/v1/health', {}, {
        timeout: 10000,
        showLoading: false,
        showError: false
      })
      
      const responseTime = Date.now() - startTime
      
      this.setData({
        'testResults.basic.status': 'success',
        'testResults.basic.responseTime': responseTime,
        'testResults.basic.statusCode': 200,
        'networkInfo.latency': responseTime
      })
      
    } catch (error) {
      console.error('基础连接测试失败:', error)
      this.setData({
        'testResults.basic.status': 'error',
        'testResults.basic.error': error.message || '连接失败',
        'testResults.basic.statusCode': error.statusCode || 'N/A'
      })
    }
  },

  // 测试AI服务
  testAIService: async function() {
    try {
      const response = await request.post('/api/v1/ai/test', {
        message: '你好，这是一个测试'
      }, {
        timeout: 30000,
        showLoading: false,
        showError: false
      })
      
      this.setData({
        'testResults.ai.status': 'success',
        'testResults.ai.apiStatus': '正常',
        'testResults.ai.model': response.model || 'deepseek-chat',
        'testResults.ai.testResponse': response.reply ? response.reply.substring(0, 50) + '...' : '测试成功'
      })
      
    } catch (error) {
      console.error('AI服务测试失败:', error)
      this.setData({
        'testResults.ai.status': 'error',
        'testResults.ai.error': error.message || 'AI服务连接失败',
        'testResults.ai.apiStatus': '异常'
      })
    }
  },

  // 测试OCR服务
  testOCRService: async function() {
    try {
      const response = await request.get('/api/v1/ocr/status', {}, {
        timeout: 10000,
        showLoading: false,
        showError: false
      })
      
      this.setData({
        'testResults.ocr.status': 'success',
        'testResults.ocr.serviceStatus': '正常',
        'testResults.ocr.supportedFormats': response.supportedFormats ? response.supportedFormats.join(', ') : 'jpg, png, bmp'
      })
      
    } catch (error) {
      console.error('OCR服务测试失败:', error)
      this.setData({
        'testResults.ocr.status': 'error',
        'testResults.ocr.error': error.message || 'OCR服务连接失败',
        'testResults.ocr.serviceStatus': '异常'
      })
    }
  },

  // 测试数据库连接
  testDatabaseConnection: async function() {
    try {
      const response = await request.get('/api/v1/database/status', {}, {
        timeout: 10000,
        showLoading: false,
        showError: false
      })
      
      this.setData({
        'testResults.database.status': 'success',
        'testResults.database.connectionStatus': '正常',
        'testResults.database.dbType': response.dbType || 'SQLite'
      })
      
    } catch (error) {
      console.error('数据库连接测试失败:', error)
      this.setData({
        'testResults.database.status': 'error',
        'testResults.database.error': error.message || '数据库连接失败',
        'testResults.database.connectionStatus': '异常'
      })
    }
  },

  // 计算整体结果
  calculateOverallResult: function() {
    const results = this.data.testResults
    const testKeys = Object.keys(results)
    
    let successCount = 0
    let totalCount = testKeys.length
    
    testKeys.forEach(key => {
      if (results[key].status === 'success') {
        successCount++
      }
    })
    
    const successRate = Math.round((successCount / totalCount) * 100)
    let overallStatus = 'error'
    let statusTitle = '连接异常'
    let statusDesc = '多项测试失败，请检查网络和服务配置'
    
    if (successRate === 100) {
      overallStatus = 'success'
      statusTitle = '连接正常'
      statusDesc = '所有服务连接正常，功能可用'
    } else if (successRate >= 50) {
      overallStatus = 'warning'
      statusTitle = '部分异常'
      statusDesc = '部分服务连接异常，可能影响功能使用'
    }
    
    this.setData({
      overallStatus,
      statusTitle,
      statusDesc,
      successRate
    })
    
    // 保存测试历史
    this.saveTestHistory({
      overallStatus,
      successRate,
      testResults: results
    })
  },

  // 切换详情显示
  onToggleDetails: function(e) {
    const testType = e.currentTarget.dataset.test
    const currentExpanded = this.data.testResults[testType].expanded
    
    this.setData({
      [`testResults.${testType}.expanded`]: !currentExpanded
    })
  },

  // 导出测试报告
  onExportReport: function() {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.data.overallStatus,
      successRate: this.data.successRate,
      testResults: this.data.testResults,
      networkInfo: this.data.networkInfo,
      apiBase: this.data.apiBase
    }
    
    // 将报告保存到本地存储
    try {
      wx.setStorageSync('latest_network_report', report)
      wx.showToast({
        title: '报告已保存',
        icon: 'success'
      })
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: `儒智小程序网络测试报告 - 成功率${this.data.successRate}%`,
      desc: '网络连接状态检测结果',
      path: '/pages/network-test/network-test'
    }
  }
})
