import React, { Component, ReactNode } from 'react';
import { Result, Button, Typography, Card, Space, Collapse } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  BugOutlined,
  HomeOutlined 
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 在实际项目中，这里可以将错误信息发送到错误监控服务
    this.reportError(error, errorInfo);
  }

  // 错误报告（模拟）
  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 实际项目中应该发送到错误监控服务
    console.log('Error Report:', errorReport);
    
    // 可以发送到后端API
    // fetch('/api/error-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error);
  };

  // 重试操作
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  // 返回首页
  handleGoHome = () => {
    window.location.href = '/';
  };

  // 复制错误信息
  copyErrorInfo = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorText = `
错误ID: ${errorId}
错误信息: ${error?.message}
错误堆栈: ${error?.stack}
组件堆栈: ${errorInfo?.componentStack}
时间: ${new Date().toLocaleString()}
页面: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      // 这里不能使用 notification，因为可能在错误状态下
      alert('错误信息已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制错误信息');
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的错误 UI
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f5f5f5'
        }}>
          <Card style={{ maxWidth: 600, width: '100%' }}>
            <Result
              status="error"
              title="页面出现错误"
              subTitle={`错误ID: ${this.state.errorId}`}
              icon={<ExclamationCircleOutlined />}
              extra={[
                <Button 
                  type="primary" 
                  key="retry" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleRetry}
                >
                  重新加载
                </Button>,
                <Button 
                  key="home" 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  返回首页
                </Button>
              ]}
            >
              <div style={{ textAlign: 'left' }}>
                <Paragraph>
                  <Text strong>很抱歉，页面遇到了意外错误。</Text>
                </Paragraph>
                <Paragraph>
                  您可以尝试重新加载页面，或者返回首页继续使用其他功能。
                  如果问题持续存在，请联系技术支持并提供错误ID。
                </Paragraph>
                
                <Collapse ghost>
                  <Panel 
                    header={
                      <Space>
                        <BugOutlined />
                        <Text type="secondary">查看错误详情</Text>
                      </Space>
                    } 
                    key="error-details"
                  >
                    <div style={{ 
                      backgroundColor: '#f6f6f6', 
                      padding: '12px', 
                      borderRadius: '4px',
                      marginBottom: '12px'
                    }}>
                      <Text code style={{ fontSize: '12px' }}>
                        {this.state.error?.message}
                      </Text>
                    </div>
                    
                    <Space>
                      <Button size="small" onClick={this.copyErrorInfo}>
                        复制错误信息
                      </Button>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        复制后可发送给技术支持
                      </Text>
                    </Space>
                  </Panel>
                </Collapse>
              </div>
            </Result>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// 高阶组件版本
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook版本（用于函数组件）
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('Handled error:', error, errorInfo);
    
    // 可以在这里添加错误报告逻辑
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      additionalInfo: errorInfo
    };
    
    console.log('Error Report:', errorReport);
  };

  return { handleError };
};
