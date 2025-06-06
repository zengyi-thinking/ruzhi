import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Alert, Typography, Space, Card, Divider, Spin } from 'antd';
import { ApiOutlined, SaveOutlined, ExclamationCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Text, Paragraph } = Typography;

interface ApiSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface Provider {
  provider: string;
  name: string;
  description: string;
  url: string;
  default_model: string;
  default_api_base: string;
}

interface CurrentProvider {
  provider: string;
  name: string;
  model: string;
  status: string;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<CurrentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiBase, setShowApiBase] = useState<boolean>(false);
  const [showModelName, setShowModelName] = useState<boolean>(false);
  const [loadingProviders, setLoadingProviders] = useState<boolean>(true);
  const [apiConnectStatus, setApiConnectStatus] = useState<'connecting'|'success'|'error'>('connecting');

  // 加载支持的提供商列表
  useEffect(() => {
    if (visible) {
      setLoadingProviders(true);
      setApiConnectStatus('connecting');
      setError(null);
      setSuccess(null);

      // 获取当前提供商
      axios.get('/api/v1/api-settings/current')
        .then(response => {
          setCurrentProvider(response.data);
          setApiConnectStatus('success');
        })
        .catch(err => {
          console.error('Error fetching current provider:', err);
          setApiConnectStatus('error');
        });

      // 获取支持的提供商列表
      axios.get('/api/v1/api-settings/providers')
        .then(response => {
          setProviders(response.data);
          setLoadingProviders(false);
        })
        .catch(err => {
          console.error('Error fetching providers:', err);
          setError('获取API提供商列表失败，请确保后端服务正在运行');
          setLoadingProviders(false);
        });
    }
  }, [visible]);

  // 当提供商改变时，自动填充默认值
  const handleProviderChange = (value: string) => {
    const provider = providers.find(p => p.provider === value);
    if (provider) {
      form.setFieldsValue({
        api_base: provider.default_api_base,
        model_name: provider.default_model
      });
    }
    
    // 显示高级选项
    setShowApiBase(true);
    setShowModelName(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.put('/api/v1/api-settings/update', values);
        setSuccess(`${response.data.message}`);
        setCurrentProvider(response.data.provider);
        onSuccess();
        
        // 3秒后自动关闭成功消息
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (err: any) {
        console.error('Error updating API settings:', err);
        setError(err.response?.data?.detail || '更新API设置失败，请确保输入了正确的API密钥');
      } finally {
        setLoading(false);
      }
    } catch (validationError) {
      console.error('Validation failed:', validationError);
    }
  };

  // 渲染API连接状态
  const renderApiStatus = () => {
    if (apiConnectStatus === 'connecting') {
      return (
        <Alert
          message="正在连接后端服务"
          type="info"
          showIcon
          icon={<Spin size="small" />}
          style={{ marginBottom: 16 }}
        />
      );
    } else if (apiConnectStatus === 'error') {
      return (
        <Alert
          message="无法连接到后端服务"
          description="请确保后端AI服务已启动并且在端口8003上运行"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      );
    }
    return null;
  };

  return (
    <Modal
      title={
        <Space>
          <ApiOutlined />
          <span>AI服务设置</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
          icon={<SaveOutlined />}
          disabled={apiConnectStatus === 'error'}
        >
          保存设置
        </Button>,
      ]}
      width={600}
    >
      {renderApiStatus()}
      
      {loadingProviders && apiConnectStatus !== 'error' ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <Paragraph style={{ marginTop: 10 }}>加载API提供商信息...</Paragraph>
        </div>
      ) : (
        <>
          {currentProvider && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f7f7f7' }}>
              <Space direction="vertical" size="small">
                <Text strong>当前使用的AI提供商:</Text>
                <Space align="center">
                  {currentProvider.status === 'active' ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <WarningOutlined style={{ color: '#faad14' }} />
                  )}
                  <Text>{currentProvider.name}</Text>
                  <Text type="secondary">({currentProvider.model})</Text>
                </Space>
                <Text type="secondary">
                  状态: {currentProvider.status === 'active' ? '已激活' : '备用模式'}
                </Text>
              </Space>
            </Card>
          )}
          
          {error && (
            <Alert 
              message="错误" 
              description={error} 
              type="error" 
              showIcon 
              closable
              onClose={() => setError(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          
          {success && (
            <Alert 
              message="成功" 
              description={success} 
              type="success" 
              showIcon 
              closable
              onClose={() => setSuccess(null)}
              style={{ marginBottom: 16 }}
            />
          )}
          
          {apiConnectStatus !== 'error' && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                provider: 'deepseek',
                api_base: providers.find(p => p.provider === 'deepseek')?.default_api_base,
                model_name: providers.find(p => p.provider === 'deepseek')?.default_model
              }}
            >
              <Form.Item
                label="选择AI提供商"
                name="provider"
                rules={[{ required: true, message: '请选择AI提供商' }]}
              >
                <Select onChange={handleProviderChange}>
                  {providers.map((provider) => (
                    <Option key={provider.provider} value={provider.provider}>
                      {provider.name} - {provider.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                label="API密钥"
                name="api_key"
                rules={[{ required: true, message: '请输入API密钥' }]}
                extra="请输入从AI提供商获取的API密钥，密钥将被安全存储"
              >
                <Input.Password placeholder="请输入API密钥" />
              </Form.Item>
              
              <Divider plain>高级设置 (可选)</Divider>
              
              {showApiBase && (
                <Form.Item
                  label="API基础URL"
                  name="api_base"
                  rules={[{ required: false }]}
                  extra="仅在需要自定义API端点时修改"
                >
                  <Input placeholder="API基础URL" />
                </Form.Item>
              )}
              
              {showModelName && (
                <Form.Item
                  label="模型名称"
                  name="model_name"
                  rules={[{ required: false }]}
                  extra="仅在需要使用其他模型时修改"
                >
                  <Input placeholder="模型名称" />
                </Form.Item>
              )}
            </Form>
          )}
          
          {apiConnectStatus === 'error' ? (
            <Paragraph style={{ marginTop: 16 }}>
              <Text type="danger">
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                无法连接到后端AI服务。请确保服务已启动并在端口8003上运行。
                <ul>
                  <li>进入 ruzhi/backend/ai-service 目录</li>
                  <li>运行命令: python -m uvicorn simple_app:app --host 127.0.0.1 --port 8003</li>
                </ul>
              </Text>
            </Paragraph>
          ) : (
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              <Text type="secondary">
                <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                API密钥将被安全存储，用于与AI服务提供商进行通信。请确保您有足够的API使用额度。
              </Text>
            </Paragraph>
          )}
        </>
      )}
    </Modal>
  );
};

export default ApiSettingsModal; 