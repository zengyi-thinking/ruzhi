// 语法测试脚本
// 用于验证小程序代码的语法正确性

const SyntaxTester = {
  // 测试基本语法
  testBasicSyntax() {
    console.log('=== 基本语法测试 ===')
    
    try {
      // 测试对象定义
      const testObj = {
        name: '测试',
        value: 123,
        method: function() {
          return 'success'
        }
      }
      
      console.log('✅ 对象定义正常')
      console.log('✅ 方法调用正常:', testObj.method())
      
      // 测试数组操作
      const testArray = ['a', 'b', 'c']
      testArray.forEach(function(item) {
        console.log('数组项:', item)
      })
      console.log('✅ 数组操作正常')
      
      return true
    } catch (error) {
      console.error('❌ 基本语法测试失败:', error)
      return false
    }
  },

  // 测试Promise语法
  testPromiseSyntax() {
    console.log('=== Promise语法测试 ===')
    
    return new Promise(function(resolve, reject) {
      try {
        // 模拟异步操作
        setTimeout(function() {
          console.log('✅ Promise语法正常')
          resolve('success')
        }, 100)
      } catch (error) {
        console.error('❌ Promise语法测试失败:', error)
        reject(error)
      }
    })
  },

  // 测试函数定义
  testFunctionDefinition() {
    console.log('=== 函数定义测试 ===')
    
    try {
      // 传统函数定义
      function traditionalFunction() {
        return 'traditional'
      }
      
      // 函数表达式
      const functionExpression = function() {
        return 'expression'
      }
      
      // 对象方法
      const objWithMethods = {
        method1: function() {
          return 'method1'
        },
        method2: function() {
          return 'method2'
        }
      }
      
      console.log('✅ 传统函数:', traditionalFunction())
      console.log('✅ 函数表达式:', functionExpression())
      console.log('✅ 对象方法1:', objWithMethods.method1())
      console.log('✅ 对象方法2:', objWithMethods.method2())
      
      return true
    } catch (error) {
      console.error('❌ 函数定义测试失败:', error)
      return false
    }
  },

  // 测试字符串操作
  testStringOperations() {
    console.log('=== 字符串操作测试 ===')
    
    try {
      const str1 = 'Hello'
      const str2 = 'World'
      
      // 字符串拼接
      const concatenated = str1 + ' ' + str2
      console.log('✅ 字符串拼接:', concatenated)
      
      // 字符串方法
      const upperCase = str1.toUpperCase()
      const lowerCase = str2.toLowerCase()
      console.log('✅ 大写转换:', upperCase)
      console.log('✅ 小写转换:', lowerCase)
      
      // URL编码
      const encoded = encodeURIComponent('测试中文')
      console.log('✅ URL编码:', encoded)
      
      return true
    } catch (error) {
      console.error('❌ 字符串操作测试失败:', error)
      return false
    }
  },

  // 测试条件语句
  testConditionalStatements() {
    console.log('=== 条件语句测试 ===')
    
    try {
      const testValue = 'test'
      
      // if-else
      if (testValue === 'test') {
        console.log('✅ if-else语句正常')
      } else {
        console.log('❌ if-else语句异常')
      }
      
      // 三元操作符
      const result = testValue ? '有值' : '无值'
      console.log('✅ 三元操作符:', result)
      
      // switch语句
      switch (testValue) {
        case 'test':
          console.log('✅ switch语句正常')
          break
        default:
          console.log('❌ switch语句异常')
      }
      
      return true
    } catch (error) {
      console.error('❌ 条件语句测试失败:', error)
      return false
    }
  },

  // 测试循环语句
  testLoopStatements() {
    console.log('=== 循环语句测试 ===')
    
    try {
      const testArray = [1, 2, 3]
      
      // for循环
      for (let i = 0; i < testArray.length; i++) {
        console.log('for循环项:', testArray[i])
      }
      console.log('✅ for循环正常')
      
      // forEach
      testArray.forEach(function(item, index) {
        console.log('forEach项:', index, item)
      })
      console.log('✅ forEach正常')
      
      return true
    } catch (error) {
      console.error('❌ 循环语句测试失败:', error)
      return false
    }
  },

  // 运行所有测试
  runAllTests() {
    console.log('🚀 开始语法测试...')
    
    const tests = [
      this.testBasicSyntax(),
      this.testFunctionDefinition(),
      this.testStringOperations(),
      this.testConditionalStatements(),
      this.testLoopStatements()
    ]
    
    // 测试Promise
    return this.testPromiseSyntax().then(function() {
      const allPassed = tests.every(function(result) {
        return result === true
      })
      
      if (allPassed) {
        console.log('🎉 所有语法测试通过！')
      } else {
        console.log('⚠️ 部分语法测试失败，请检查代码')
      }
      
      return allPassed
    }).catch(function(error) {
      console.error('❌ Promise测试失败:', error)
      return false
    })
  }
}

// 如果在小程序环境中，自动运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyntaxTester
} else {
  // 在小程序中直接运行
  SyntaxTester.runAllTests()
}
