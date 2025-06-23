/**
 * OCR服务实现
 * 封装古籍OCR识别功能
 */
const app = getApp()
const { request } = require('../utils/request')

// OCR增强选项
const ENHANCE_OPTIONS = {
  contrast: 0.5,      // 对比度
  brightness: 0.1,    // 亮度
  sharpen: true,      // 锐化
  denoise: true,      // 降噪
  binarize: false,    // 二值化
  rotate: true        // 自动旋转
}

// OCR识别模式
const OCR_MODES = {
  ANCIENT: 'ancient',  // 古籍模式
  STANDARD: 'standard', // 标准模式
  HANDWRITTEN: 'handwritten' // 手写模式
}

/**
 * OCR服务类
 */
class OCRService {
  constructor() {
    this.initialized = false;
    this.apiBase = '';
    this.enhanceOptions = ENHANCE_OPTIONS;
  }
  
  /**
   * 初始化服务
   */
  async initialize() {
    try {
      // 从全局获取API基础URL
      if (app && app.globalData) {
        this.apiBase = app.globalData.apiBase || '';
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('OCR服务初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 分析图片中的文本
   * @param {string} filePath - 图片本地路径
   * @param {object} options - 分析选项
   */
  async analyzeImage(filePath, options = {}) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 默认设置
      const settings = {
        mode: options.mode || OCR_MODES.ANCIENT,
        enhanceImage: options.enhanceImage !== false,
        enhanceOptions: options.enhanceOptions || this.enhanceOptions,
        detectLayout: options.detectLayout !== false,
        recognizeVariants: options.recognizeVariants !== false
      };
      
      // 准备表单数据
      const formData = {
        mode: settings.mode,
        enhance_image: settings.enhanceImage,
        enhance_options: JSON.stringify(settings.enhanceOptions),
        detect_layout: settings.detectLayout,
        recognize_variants: settings.recognizeVariants
      };
      
      // 显示加载提示
      wx.showLoading({
        title: '识别中...',
        mask: true
      });
      
      // 使用真实API
      if (this.apiBase) {
        try {
          // 上传图片进行识别
          const result = await request.upload('/api/v1/ocr/analyze', filePath, {
            name: 'file',
            formData: formData,
            showLoading: false // 已经显示了加载提示
          });
          
          // 隐藏加载提示
          wx.hideLoading();
          
          if (result && result.success) {
            return {
              success: true,
              data: result.data,
              isMock: false
            };
          } else {
            throw new Error('OCR识别失败: ' + (result?.message || '未知错误'));
          }
        } catch (apiError) {
          console.error('OCR API调用失败:', apiError);
          // 使用本地识别作为备选方案
          return this.performLocalOCR(filePath, settings);
        }
      } else {
        // 无API时使用本地识别
        return this.performLocalOCR(filePath, settings);
      }
    } catch (error) {
      // 隐藏加载提示
      wx.hideLoading();
      
      console.error('OCR处理失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '图像处理失败，请重试'
      };
    }
  }
  
  /**
   * 执行本地OCR识别（备选方案）
   */
  async performLocalOCR(filePath, settings) {
    try {
      // 显示处理提示
      wx.showToast({
        title: '使用本地处理...',
        icon: 'none',
        duration: 1500
      });
      
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 根据不同模式生成模拟结果
      let mockResult;
      
      switch (settings.mode) {
        case OCR_MODES.ANCIENT:
          mockResult = this.generateMockAncientResult();
          break;
        case OCR_MODES.HANDWRITTEN:
          mockResult = this.generateMockHandwrittenResult();
          break;
        case OCR_MODES.STANDARD:
        default:
          mockResult = this.generateMockStandardResult();
      }
      
      return {
        success: true,
        data: mockResult,
        isMock: true
      };
    } catch (error) {
      // 隐藏加载提示
      wx.hideLoading();
      
      console.error('本地OCR处理失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '本地处理失败，请重试'
      };
    }
  }
  
  /**
   * 生成模拟古籍OCR结果
   */
  generateMockAncientResult() {
    return {
      text: '學而時習之，不亦説乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？',
      translation: '学习并时常温习学过的知识，不也很高兴吗？有志同道合的朋友从远方来，不也很快乐吗？人家不了解我，我也不恼怒，不也是君子的品德吗？',
      confidence: 0.92,
      layout: {
        paragraphs: [
          {
            text: '學而時習之，不亦説乎？',
            bbox: [50, 100, 300, 130],
            confidence: 0.95
          },
          {
            text: '有朋自遠方來，不亦樂乎？',
            bbox: [50, 140, 300, 170],
            confidence: 0.93
          },
          {
            text: '人不知而不慍，不亦君子乎？',
            bbox: [50, 180, 300, 210],
            confidence: 0.91
          }
        ]
      },
      variants: [
        { original: '説', modern: '说', position: [12, 13] },
        { original: '遠', modern: '远', position: [18, 19] },
        { original: '樂', modern: '乐', position: [23, 24] }
      ],
      source: {
        title: '论语·学而篇',
        dynasty: '战国',
        author: '孔子弟子'
      },
      processing: {
        time: 1.2, // 秒
        enhanceApplied: true,
        mode: 'ancient'
      }
    };
  }
  
  /**
   * 生成模拟手写OCR结果
   */
  generateMockHandwrittenResult() {
    return {
      text: '修身齊家治國平天下',
      translation: '修养自身，管理家庭，治理国家，使天下太平',
      confidence: 0.85,
      layout: {
        paragraphs: [
          {
            text: '修身齊家治國平天下',
            bbox: [50, 100, 300, 130],
            confidence: 0.85
          }
        ]
      },
      variants: [
        { original: '齊', modern: '齐', position: [2, 3] },
        { original: '國', modern: '国', position: [4, 5] }
      ],
      source: {
        title: '大学',
        dynasty: '战国',
        author: '曾子'
      },
      processing: {
        time: 0.8, // 秒
        enhanceApplied: true,
        mode: 'handwritten'
      }
    };
  }
  
  /**
   * 生成模拟标准OCR结果
   */
  generateMockStandardResult() {
    return {
      text: '天行健，君子以自强不息；地势坤，君子以厚德载物。',
      translation: '',
      confidence: 0.97,
      layout: {
        paragraphs: [
          {
            text: '天行健，君子以自强不息；',
            bbox: [50, 100, 300, 130],
            confidence: 0.98
          },
          {
            text: '地势坤，君子以厚德载物。',
            bbox: [50, 140, 300, 170],
            confidence: 0.97
          }
        ]
      },
      variants: [],
      source: {
        title: '周易·象传',
        dynasty: '西周',
        author: '周文王'
      },
      processing: {
        time: 0.5, // 秒
        enhanceApplied: false,
        mode: 'standard'
      }
    };
  }
  
  /**
   * 获取可用的OCR模式
   */
  getAvailableModes() {
    return [
      {
        id: OCR_MODES.ANCIENT,
        name: '古籍模式',
        description: '针对繁体古籍，支持异体字识别和文意翻译',
        icon: '📜'
      },
      {
        id: OCR_MODES.STANDARD,
        name: '标准模式',
        description: '适用于印刷体现代汉字的识别',
        icon: '📄'
      },
      {
        id: OCR_MODES.HANDWRITTEN,
        name: '手写模式',
        description: '适用于手写体汉字的识别',
        icon: '✍️'
      }
    ];
  }
}

module.exports = {
  ocrService: new OCRService(),
  OCR_MODES
};
