/**
 * 前端性能优化工具集
 * 包含代码分割、懒加载、性能监控等功能
 */

import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// 性能监控配置
export const performanceConfig = {
  // 首屏加载时间目标（毫秒）
  targetFCP: 1000,
  targetLCP: 1500,
  targetFID: 100,
  
  // 代码分割配置
  chunkSizeLimit: 244 * 1024, // 244KB
  
  // 缓存配置
  cacheVersion: 'v1.0.0',
  staticCacheTime: 24 * 60 * 60 * 1000, // 24小时
  apiCacheTime: 5 * 60 * 1000, // 5分钟
};

// 通用加载组件
export const LoadingFallback = ({ message = '加载中...' }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={40} />
    <Box color="text.secondary" fontSize="14px">
      {message}
    </Box>
  </Box>
);

// 页面级加载组件
export const PageLoadingFallback = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="60vh"
    gap={3}
  >
    <CircularProgress size={60} />
    <Box color="text.secondary" fontSize="16px">
      正在加载页面...
    </Box>
  </Box>
);

// 懒加载高阶组件
export const withLazyLoading = (importFunc, fallback = <LoadingFallback />) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// 路由级懒加载
export const createLazyRoute = (importFunc, fallback = <PageLoadingFallback />) => {
  return withLazyLoading(importFunc, fallback);
};

// 组件级懒加载
export const createLazyComponent = (importFunc, fallback = <LoadingFallback />) => {
  return withLazyLoading(importFunc, fallback);
};

// 预加载功能
export const preloadComponent = (importFunc) => {
  const componentImport = importFunc();
  return componentImport;
};

// 性能监控类
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = {};
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      this.observeWebVitals();
      this.observeResourceTiming();
      this.observeUserTiming();
    }
  }

  // 监控Web Vitals
  observeWebVitals() {
    // First Contentful Paint
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    });

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.LCP = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.lcp = lcpObserver;
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            this.metrics.FID = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.FID);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.fid = fidObserver;
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  // 监控资源加载时间
  observeResourceTiming() {
    this.observePerformanceEntry('resource', (entries) => {
      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const loadTime = entry.responseEnd - entry.startTime;
          this.reportResourceTiming(entry.name, loadTime);
        }
      });
    });
  }

  // 监控用户自定义时间
  observeUserTiming() {
    this.observePerformanceEntry('measure', (entries) => {
      entries.forEach((entry) => {
        this.reportMetric(entry.name, entry.duration);
      });
    });
  }

  // 通用性能条目观察器
  observePerformanceEntry(entryType, callback) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((entryList) => {
          callback(entryList.getEntries());
        });
        observer.observe({ entryTypes: [entryType] });
        this.observers[entryType] = observer;
      } catch (e) {
        console.warn(`${entryType} observer not supported`);
      }
    }
  }

  // 报告性能指标
  reportMetric(name, value) {
    console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);
    
    // 发送到分析服务
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: name,
        value: Math.round(value)
      });
    }

    // 检查是否超过目标值
    this.checkPerformanceTarget(name, value);
  }

  // 报告资源加载时间
  reportResourceTiming(resourceName, loadTime) {
    const fileName = resourceName.split('/').pop();
    console.log(`Resource Load Time - ${fileName}: ${loadTime.toFixed(2)}ms`);
  }

  // 检查性能目标
  checkPerformanceTarget(metricName, value) {
    const targets = {
      FCP: performanceConfig.targetFCP,
      LCP: performanceConfig.targetLCP,
      FID: performanceConfig.targetFID
    };

    const target = targets[metricName];
    if (target && value > target) {
      console.warn(`Performance Warning: ${metricName} (${value.toFixed(2)}ms) exceeds target (${target}ms)`);
    }
  }

  // 手动标记时间点
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  // 手动测量时间段
  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
  }

  // 获取所有性能指标
  getMetrics() {
    return { ...this.metrics };
  }

  // 清理观察器
  disconnect() {
    Object.values(this.observers).forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
  }
}

// 图片懒加载Hook
export const useImageLazyLoading = () => {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const loadImage = useCallback((src) => {
    if (loadedImages.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]));
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, [loadedImages]);

  const isImageLoaded = useCallback((src) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  return { loadImage, isImageLoaded };
};

// 组件可见性Hook（用于懒加载）
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
};

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 性能优化建议
export const getPerformanceRecommendations = (metrics) => {
  const recommendations = [];

  if (metrics.FCP > performanceConfig.targetFCP) {
    recommendations.push({
      type: 'FCP',
      message: '首屏内容绘制时间过长，建议优化关键资源加载',
      suggestions: [
        '减少关键路径上的JavaScript和CSS',
        '使用资源预加载',
        '优化字体加载策略'
      ]
    });
  }

  if (metrics.LCP > performanceConfig.targetLCP) {
    recommendations.push({
      type: 'LCP',
      message: '最大内容绘制时间过长，建议优化主要内容加载',
      suggestions: [
        '优化图片大小和格式',
        '使用CDN加速',
        '实现图片懒加载'
      ]
    });
  }

  if (metrics.FID > performanceConfig.targetFID) {
    recommendations.push({
      type: 'FID',
      message: '首次输入延迟过长，建议优化JavaScript执行',
      suggestions: [
        '减少主线程阻塞',
        '使用Web Workers处理复杂计算',
        '优化事件处理器'
      ]
    });
  }

  return recommendations;
};

export default {
  performanceConfig,
  LoadingFallback,
  PageLoadingFallback,
  withLazyLoading,
  createLazyRoute,
  createLazyComponent,
  preloadComponent,
  PerformanceMonitor,
  performanceMonitor,
  useImageLazyLoading,
  useIntersectionObserver,
  getPerformanceRecommendations
};
