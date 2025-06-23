// 网络请求封装
const { config, logger } = require('../config/env');
const errorHandler = require('./errorHandler');

class Request {
  constructor() {
    this.baseURL = config.API_BASE_URL;
    this.timeout = config.TIMEOUT.DEFAULT;
    this.requestQueue = new Map(); // 防重复请求
    this.interceptors = {
      request: [],
      response: []
    }

    // 添加默认拦截器
    this.addDefaultInterceptors()
  }

  // 添加默认拦截器
  addDefaultInterceptors() {
    // 请求拦截器
    this.interceptors.request.push((config) => {
      // 显示加载提示
      if (config.showLoading !== false) {
        wx.showLoading({
          title: config.loadingText || '加载中...',
          mask: true
        })
      }
      
      // 添加通用请求头
      config.header = {
        'Content-Type': 'application/json',
        ...config.header
      }
      
      // 添加用户token（如果有）
      const userToken = wx.getStorageSync('userToken')
      if (userToken) {
        config.header.Authorization = `Bearer ${userToken}`
      }
      
      logger.debug('请求发送:', config)
      return config
    })

    // 响应拦截器
    this.interceptors.response.push((response, config) => {
      // 隐藏加载提示
      if (config.showLoading !== false) {
        wx.hideLoading()
      }

      logger.debug('响应接收:', response)

      // 处理HTTP状态码
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data
      } else {
        const error = new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`);
        error.code = response.statusCode;
        error.url = config.url;
        error.method = config.method;
        throw error;
      }
    })
  }

  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor)
  }

  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor)
  }

  // 执行请求拦截器
  executeRequestInterceptors(config) {
    let result = config
    for (const interceptor of this.interceptors.request) {
      result = interceptor(result) || result
    }
    return result
  }

  // 执行响应拦截器
  executeResponseInterceptors(response, config) {
    let result = response
    for (const interceptor of this.interceptors.response) {
      result = interceptor(result, config) || result
    }
    return result
  }

  // 基础请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      // 构建完整配置
      const config = {
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: options.header || {},
        timeout: options.timeout || this.timeout,
        showLoading: options.showLoading,
        loadingText: options.loadingText,
        ...options
      }

      // 防重复请求
      const requestKey = this.getRequestKey(config);
      if (config.preventDuplicate !== false && this.requestQueue.has(requestKey)) {
        logger.warn('重复请求被阻止:', requestKey);
        return this.requestQueue.get(requestKey);
      }

      const requestPromise = this.executeRequest(config);

      // 添加到请求队列
      if (config.preventDuplicate !== false) {
        this.requestQueue.set(requestKey, requestPromise);

        // 请求完成后从队列中移除
        requestPromise.finally(() => {
          this.requestQueue.delete(requestKey);
        });
      }

      return requestPromise;
    })
  }

  // 生成请求唯一标识
  getRequestKey(config) {
    const { method, url, data } = config;
    return `${method}:${url}:${JSON.stringify(data)}`;
  }

  // 执行实际请求
  executeRequest(config) {
    return new Promise((resolve, reject) => {
      try {
        // 执行请求拦截器
        const finalConfig = this.executeRequestInterceptors(config)

        // 发送请求
        wx.request({
          ...finalConfig,
          success: (response) => {
            try {
              // 执行响应拦截器
              const result = this.executeResponseInterceptors(response, finalConfig)
              resolve(result)
            } catch (error) {
              this.handleError(error, finalConfig)
              reject(error)
            }
          },
          fail: (error) => {
            this.handleError(error, finalConfig)
            reject(error)
          }
        })
      } catch (error) {
        this.handleError(error, config)
        reject(error)
      }
    })
  }

  // 错误处理
  handleError(error, config) {
    // 隐藏加载提示
    if (config.showLoading !== false) {
      wx.hideLoading()
    }

    // 使用统一错误处理器
    const errorInfo = errorHandler.handleApiError(error, {
      url: config.url,
      method: config.method,
      data: config.data,
      showError: config.showError
    });

    return errorInfo;
  }

  // GET请求
  get(url, params = {}, options = {}) {
    // 将参数拼接到URL
    if (Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
      url += (url.includes('?') ? '&' : '?') + queryString
    }

    return this.request({
      url,
      method: 'GET',
      ...options
    })
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      ...options
    })
  }

  // 文件上传
  upload(url, filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const config = {
        url: this.baseURL + url,
        filePath,
        name: options.name || 'file',
        formData: options.formData || {},
        header: options.header || {},
        showLoading: options.showLoading,
        loadingText: options.loadingText || '上传中...',
        ...options
      }

      // 执行请求拦截器
      const finalConfig = this.executeRequestInterceptors(config)

      wx.uploadFile({
        ...finalConfig,
        success: (response) => {
          try {
            // 解析响应数据
            const data = JSON.parse(response.data)
            response.data = data
            
            // 执行响应拦截器
            const result = this.executeResponseInterceptors(response, finalConfig)
            resolve(result)
          } catch (error) {
            this.handleError(error, finalConfig)
            reject(error)
          }
        },
        fail: (error) => {
          this.handleError(error, finalConfig)
          reject(error)
        }
      })
    })
  }

  // 文件下载
  download(url, options = {}) {
    return new Promise((resolve, reject) => {
      const config = {
        url: this.baseURL + url,
        header: options.header || {},
        showLoading: options.showLoading,
        loadingText: options.loadingText || '下载中...',
        ...options
      }

      // 执行请求拦截器
      const finalConfig = this.executeRequestInterceptors(config)

      wx.downloadFile({
        ...finalConfig,
        success: (response) => {
          try {
            // 执行响应拦截器
            const result = this.executeResponseInterceptors(response, finalConfig)
            resolve(result)
          } catch (error) {
            this.handleError(error, finalConfig)
            reject(error)
          }
        },
        fail: (error) => {
          this.handleError(error, finalConfig)
          reject(error)
        }
      })
    })
  }
}

// 创建请求实例
const request = new Request()

// 导出请求实例和类
module.exports = {
  request,
  Request
}
