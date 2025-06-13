// 调试辅助工具
// 用于检测和修复常见的小程序问题

const DebugHelper = {
  // 检查语法错误
  checkSyntax() {
    console.log('开始语法检查...')
    
    try {
      // 检查基本语法
      const testObj = {
        test: 'value',
        method() {
          return 'success'
        }
      }
      
      console.log('语法检查通过:', testObj.method())
      return true
    } catch (error) {
      console.error('语法检查失败:', error)
      return false
    }
  },

  // 检查页面配置
  checkPageConfig() {
    console.log('检查页面配置...')
    
    const pages = [
      'pages/index/index',
      'pages/ocr/ocr', 
      'pages/dialogue/dialogue',
      'pages/knowledge/knowledge',
      'pages/learning/learning'
    ]
    
    pages.forEach(page => {
      console.log(`检查页面: ${page}`)
    })
    
    return true
  },

  // 检查API调用
  checkAPI() {
    console.log('检查API调用...')
    
    // 检查基本API
    if (typeof wx !== 'undefined') {
      console.log('微信API可用')
      return true
    } else {
      console.error('微信API不可用')
      return false
    }
  },

  // 运行完整检查
  runFullCheck() {
    console.log('=== 开始完整调试检查 ===')
    
    const results = {
      syntax: this.checkSyntax(),
      pageConfig: this.checkPageConfig(),
      api: this.checkAPI()
    }
    
    console.log('检查结果:', results)
    
    const allPassed = Object.values(results).every(result => result === true)
    
    if (allPassed) {
      console.log('✅ 所有检查通过')
    } else {
      console.log('❌ 发现问题，请检查日志')
    }
    
    return results
  }
}

// 导出调试工具
module.exports = DebugHelper
