/**
 * 全局错误处理机制
 * 统一处理应用中的各种错误
 */

const { logger } = require('./env');

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isReporting = false;
    this.maxQueueSize = 50;
  }

  /**
   * 处理API错误
   */
  handleApiError(error, context = {}) {
    const errorInfo = {
      type: 'API_ERROR',
      message: error.message || '网络请求失败',
      code: error.code || 'UNKNOWN',
      url: error.url || '',
      method: error.method || '',
      timestamp: Date.now(),
      context
    };

    this.logError(errorInfo);
    this.showUserFriendlyMessage(errorInfo);
    this.reportError(errorInfo);

    return errorInfo;
  }

  /**
   * 处理业务逻辑错误
   */
  handleBusinessError(error, context = {}) {
    const errorInfo = {
      type: 'BUSINESS_ERROR',
      message: error.message || '操作失败',
      code: error.code || 'BUSINESS_ERROR',
      timestamp: Date.now(),
      context
    };

    this.logError(errorInfo);
    this.showUserFriendlyMessage(errorInfo);
    this.reportError(errorInfo);

    return errorInfo;
  }

  /**
   * 处理系统错误
   */
  handleSystemError(error, context = {}) {
    const errorInfo = {
      type: 'SYSTEM_ERROR',
      message: error.message || '系统错误',
      stack: error.stack || '',
      timestamp: Date.now(),
      context
    };

    this.logError(errorInfo);
    this.showUserFriendlyMessage(errorInfo);
    this.reportError(errorInfo);

    return errorInfo;
  }

  /**
   * 记录错误日志
   */
  logError(errorInfo) {
    logger.error('Error occurred:', errorInfo);
    
    // 保存到本地存储（用于离线时上报）
    try {
      const errorLogs = wx.getStorageSync('error_logs') || [];
      errorLogs.push(errorInfo);
      
      // 只保留最近100条错误日志
      if (errorLogs.length > 100) {
        errorLogs.splice(0, errorLogs.length - 100);
      }
      
      wx.setStorageSync('error_logs', errorLogs);
    } catch (e) {
      logger.error('Failed to save error log:', e);
    }
  }

  /**
   * 显示用户友好的错误信息
   */
  showUserFriendlyMessage(errorInfo) {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    
    wx.showToast({
      title: userMessage,
      icon: 'none',
      duration: 3000
    });
  }

  /**
   * 获取用户友好的错误信息
   */
  getUserFriendlyMessage(errorInfo) {
    const errorMessages = {
      'NETWORK_ERROR': '网络连接失败，请检查网络设置',
      'AUTH_FAILED': '登录已过期，请重新登录',
      'API_ERROR': '服务暂时不可用，请稍后重试',
      'PERMISSION_DENIED': '权限不足，无法执行此操作',
      'BUSINESS_ERROR': errorInfo.message || '操作失败，请重试',
      'SYSTEM_ERROR': '系统繁忙，请稍后重试'
    };

    return errorMessages[errorInfo.code] || errorMessages[errorInfo.type] || '操作失败，请重试';
  }

  /**
   * 上报错误到服务器
   */
  async reportError(errorInfo) {
    // 添加到错误队列
    this.errorQueue.push(errorInfo);
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 如果正在上报，则等待
    if (this.isReporting) {
      return;
    }

    this.isReporting = true;

    try {
      // 批量上报错误
      if (this.errorQueue.length > 0) {
        await this.batchReportErrors();
      }
    } catch (e) {
      logger.error('Failed to report errors:', e);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 批量上报错误
   */
  async batchReportErrors() {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // 这里应该调用实际的错误上报API
      // await api.reportErrors(errors);
      logger.info('Errors reported:', errors.length);
    } catch (e) {
      // 上报失败，重新加入队列
      this.errorQueue.unshift(...errors);
      throw e;
    }
  }

  /**
   * 包装异步函数，自动处理错误
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        this.handleSystemError(error, {
          ...context,
          function: fn.name,
          arguments: args
        });
        throw error;
      }
    };
  }

  /**
   * 包装同步函数，自动处理错误
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn.apply(this, args);
      } catch (error) {
        this.handleSystemError(error, {
          ...context,
          function: fn.name,
          arguments: args
        });
        throw error;
      }
    };
  }

  /**
   * 清理错误日志
   */
  clearErrorLogs() {
    try {
      wx.removeStorageSync('error_logs');
      logger.info('Error logs cleared');
    } catch (e) {
      logger.error('Failed to clear error logs:', e);
    }
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    try {
      const errorLogs = wx.getStorageSync('error_logs') || [];
      const stats = {
        total: errorLogs.length,
        byType: {},
        byCode: {},
        recent24h: 0
      };

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      errorLogs.forEach(error => {
        // 按类型统计
        stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        
        // 按错误码统计
        stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
        
        // 最近24小时统计
        if (error.timestamp > oneDayAgo) {
          stats.recent24h++;
        }
      });

      return stats;
    } catch (e) {
      logger.error('Failed to get error stats:', e);
      return null;
    }
  }
}

// 创建全局错误处理器实例
const errorHandler = new ErrorHandler();

// 设置全局错误监听
wx.onError((error) => {
  errorHandler.handleSystemError(new Error(error), {
    source: 'global_error_handler'
  });
});

// 设置未处理的Promise拒绝监听
wx.onUnhandledRejection((res) => {
  errorHandler.handleSystemError(new Error(res.reason), {
    source: 'unhandled_rejection',
    promise: res.promise
  });
});

module.exports = errorHandler;
