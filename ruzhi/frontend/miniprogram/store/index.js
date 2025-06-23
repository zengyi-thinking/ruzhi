/**
 * 简单的状态管理器
 * 用于管理全局状态和数据同步
 */

const { logger } = require('../config/env');

class Store {
  constructor() {
    this.state = {
      // 用户状态
      user: {
        info: null,
        isLoggedIn: false,
        preferences: {}
      },
      
      // 聊天状态
      chat: {
        currentCharacter: null,
        messages: [],
        isTyping: false,
        history: []
      },
      
      // 学习状态
      learning: {
        progress: {},
        stats: {},
        currentPlan: null,
        achievements: []
      },
      
      // 应用状态
      app: {
        loading: false,
        networkStatus: 'unknown',
        theme: 'light'
      }
    };
    
    this.listeners = new Map();
    this.middlewares = [];
    
    // 初始化
    this.init();
  }

  /**
   * 初始化状态管理器
   */
  init() {
    // 从本地存储恢复状态
    this.restoreState();
    
    // 添加默认中间件
    this.addMiddleware(this.loggerMiddleware);
    this.addMiddleware(this.persistenceMiddleware);
    
    logger.info('状态管理器初始化完成');
  }

  /**
   * 获取状态
   */
  getState(path) {
    if (!path) {
      return this.state;
    }
    
    const keys = path.split('.');
    let result = this.state;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }
    
    return result;
  }

  /**
   * 设置状态
   */
  setState(path, value) {
    const oldState = JSON.parse(JSON.stringify(this.state));
    
    if (typeof path === 'object') {
      // 批量更新
      this.state = { ...this.state, ...path };
    } else {
      // 单个更新
      const keys = path.split('.');
      let target = this.state;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }
      
      target[keys[keys.length - 1]] = value;
    }
    
    // 执行中间件
    this.executeMiddlewares('setState', { path, value, oldState, newState: this.state });
    
    // 通知监听器
    this.notifyListeners(path, value, oldState);
  }

  /**
   * 订阅状态变化
   */
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path).add(callback);
    
    // 返回取消订阅函数
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(callback);
        if (pathListeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * 通知监听器
   */
  notifyListeners(path, value, oldState) {
    // 通知精确路径的监听器
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      pathListeners.forEach(callback => {
        try {
          callback(value, oldState);
        } catch (error) {
          logger.error('监听器执行错误:', error);
        }
      });
    }
    
    // 通知父路径的监听器
    if (path && path.includes('.')) {
      const parentPath = path.substring(0, path.lastIndexOf('.'));
      const parentListeners = this.listeners.get(parentPath);
      if (parentListeners) {
        const parentValue = this.getState(parentPath);
        parentListeners.forEach(callback => {
          try {
            callback(parentValue, oldState);
          } catch (error) {
            logger.error('父路径监听器执行错误:', error);
          }
        });
      }
    }
    
    // 通知全局监听器
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(this.state, oldState);
        } catch (error) {
          logger.error('全局监听器执行错误:', error);
        }
      });
    }
  }

  /**
   * 添加中间件
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 执行中间件
   */
  executeMiddlewares(action, data) {
    this.middlewares.forEach(middleware => {
      try {
        middleware(action, data, this);
      } catch (error) {
        logger.error('中间件执行错误:', error);
      }
    });
  }

  /**
   * 日志中间件
   */
  loggerMiddleware(action, data, store) {
    logger.debug(`Store ${action}:`, {
      path: data.path,
      value: data.value,
      timestamp: Date.now()
    });
  }

  /**
   * 持久化中间件
   */
  persistenceMiddleware(action, data, store) {
    if (action === 'setState') {
      // 只持久化特定的状态
      const persistentPaths = [
        'user.info',
        'user.preferences',
        'learning.progress',
        'learning.stats',
        'app.theme'
      ];
      
      if (data.path && persistentPaths.some(path => data.path.startsWith(path))) {
        store.saveState();
      }
    }
  }

  /**
   * 保存状态到本地存储
   */
  saveState() {
    try {
      const persistentState = {
        user: this.state.user,
        learning: {
          progress: this.state.learning.progress,
          stats: this.state.learning.stats
        },
        app: {
          theme: this.state.app.theme
        }
      };
      
      wx.setStorageSync('app_state', persistentState);
      logger.debug('状态已保存到本地存储');
    } catch (error) {
      logger.error('保存状态失败:', error);
    }
  }

  /**
   * 从本地存储恢复状态
   */
  restoreState() {
    try {
      const savedState = wx.getStorageSync('app_state');
      if (savedState) {
        this.state = {
          ...this.state,
          ...savedState
        };
        logger.debug('状态已从本地存储恢复');
      }
    } catch (error) {
      logger.error('恢复状态失败:', error);
    }
  }

  /**
   * 清除状态
   */
  clearState() {
    this.state = {
      user: { info: null, isLoggedIn: false, preferences: {} },
      chat: { currentCharacter: null, messages: [], isTyping: false, history: [] },
      learning: { progress: {}, stats: {}, currentPlan: null, achievements: [] },
      app: { loading: false, networkStatus: 'unknown', theme: 'light' }
    };
    
    try {
      wx.removeStorageSync('app_state');
      logger.info('状态已清除');
    } catch (error) {
      logger.error('清除状态失败:', error);
    }
  }

  /**
   * 获取状态快照
   */
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

// 创建全局状态管理器实例
const store = new Store();

module.exports = store;
