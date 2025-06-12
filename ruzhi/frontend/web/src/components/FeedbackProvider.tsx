import React, { createContext, useContext, useState, ReactNode } from 'react';
import { notification, message, Modal, Spin } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';

// 反馈类型定义
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface FeedbackOptions {
  title?: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  showProgress?: boolean;
}

export interface ConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
}

export interface LoadingOptions {
  tip?: string;
  delay?: number;
}

// 反馈上下文接口
interface FeedbackContextType {
  // 通知相关
  showNotification: (type: FeedbackType, options: FeedbackOptions) => void;
  showMessage: (type: FeedbackType, content: string, duration?: number) => void;
  
  // 确认对话框
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  
  // 加载状态
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;
  
  // 错误处理
  handleError: (error: any, customMessage?: string) => void;
  
  // 成功反馈
  handleSuccess: (message: string, description?: string) => void;
}

// 创建上下文
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// 反馈提供者组件
export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [loadingTip, setLoadingTip] = useState('加载中...');

  // 显示通知
  const showNotification = (type: FeedbackType, options: FeedbackOptions) => {
    const { title, description, duration = 4.5, placement = 'topRight' } = options;
    
    const iconMap = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      loading: <LoadingOutlined style={{ color: '#1890ff' }} />
    };

    notification.open({
      message: title,
      description,
      icon: iconMap[type],
      duration,
      placement,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }
    });
  };

  // 显示消息
  const showMessage = (type: FeedbackType, content: string, duration = 3) => {
    switch (type) {
      case 'success':
        message.success(content, duration);
        break;
      case 'error':
        message.error(content, duration);
        break;
      case 'warning':
        message.warning(content, duration);
        break;
      case 'info':
        message.info(content, duration);
        break;
      case 'loading':
        message.loading(content, duration);
        break;
    }
  };

  // 显示确认对话框
  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const { title, content, okText = '确定', cancelText = '取消', type = 'confirm' } = options;
      
      Modal.confirm({
        title,
        content,
        okText,
        cancelText,
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        icon: type === 'error' ? <CloseCircleOutlined /> : 
              type === 'warning' ? <ExclamationCircleOutlined /> :
              type === 'success' ? <CheckCircleOutlined /> :
              type === 'info' ? <InfoCircleOutlined /> : undefined
      });
    });
  };

  // 显示加载状态
  const showLoading = (options: LoadingOptions = {}) => {
    const { tip = '加载中...', delay = 0 } = options;
    setLoadingTip(tip);
    
    if (delay > 0) {
      setTimeout(() => setLoading(true), delay);
    } else {
      setLoading(true);
    }
  };

  // 隐藏加载状态
  const hideLoading = () => {
    setLoading(false);
  };

  // 错误处理
  const handleError = (error: any, customMessage?: string) => {
    console.error('Error occurred:', error);
    
    let errorMessage = customMessage || '操作失败';
    let errorDescription = '';

    if (error?.response?.data?.message) {
      errorDescription = error.response.data.message;
    } else if (error?.message) {
      errorDescription = error.message;
    } else if (typeof error === 'string') {
      errorDescription = error;
    } else {
      errorDescription = '发生未知错误，请重试';
    }

    showNotification('error', {
      title: errorMessage,
      description: errorDescription,
      duration: 6
    });
  };

  // 成功反馈
  const handleSuccess = (title: string, description?: string) => {
    showNotification('success', {
      title,
      description,
      duration: 3
    });
  };

  const contextValue: FeedbackContextType = {
    showNotification,
    showMessage,
    showConfirm,
    showLoading,
    hideLoading,
    handleError,
    handleSuccess
  };

  return (
    <FeedbackContext.Provider value={contextValue}>
      <Spin spinning={loading} tip={loadingTip} size="large">
        {children}
      </Spin>
    </FeedbackContext.Provider>
  );
};

// 使用反馈的Hook
export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

// 便捷的Hook函数
export const useNotification = () => {
  const { showNotification } = useFeedback();
  return {
    success: (options: FeedbackOptions) => showNotification('success', options),
    error: (options: FeedbackOptions) => showNotification('error', options),
    warning: (options: FeedbackOptions) => showNotification('warning', options),
    info: (options: FeedbackOptions) => showNotification('info', options),
  };
};

export const useMessage = () => {
  const { showMessage } = useFeedback();
  return {
    success: (content: string, duration?: number) => showMessage('success', content, duration),
    error: (content: string, duration?: number) => showMessage('error', content, duration),
    warning: (content: string, duration?: number) => showMessage('warning', content, duration),
    info: (content: string, duration?: number) => showMessage('info', content, duration),
    loading: (content: string, duration?: number) => showMessage('loading', content, duration),
  };
};

export const useConfirm = () => {
  const { showConfirm } = useFeedback();
  return showConfirm;
};

export const useLoading = () => {
  const { showLoading, hideLoading } = useFeedback();
  return { showLoading, hideLoading };
};
