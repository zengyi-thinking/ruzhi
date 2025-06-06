import { useState } from 'react';
import { 
  Typography, 
  Upload, 
  Button, 
  Card, 
  Spin, 
  message, 
  Divider,
  Space,
  Tabs,
  Breadcrumb,
  Image,
  Row,
  Col
} from 'antd';
import { 
  InboxOutlined, 
  ScanOutlined, 
  FileSearchOutlined,
  FileTextOutlined,
  SwapOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/router';
import AppLayout from '@/components/AppLayout';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;

interface OCRResult {
  text: string;
  layout?: any;
  variants?: Array<{
    original: string;
    modern: string;
    position: number[];
  }>;
  processing_time: number;
}

export default function OCRPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const router = useRouter();

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setOcrResult(null);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  const handleOCR = async () => {
    if (fileList.length === 0) {
      message.warning('请先上传图片');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj as Blob);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ocr/analyze`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setOcrResult(response.data);
      message.success('识别成功');
      setActiveTab('result');
    } catch (error) {
      console.error('OCR处理失败:', error);
      message.error('OCR处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadTab = () => {
    return (
      <Card className="ocr-card">
        <Title level={4}>古籍智能识别</Title>
        <Paragraph>
          上传古籍图片，智能识别文字内容，支持繁体字、异体字识别。
        </Paragraph>
        
        <Dragger {...uploadProps} className="upload-area">
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个图片文件上传，推荐使用清晰的古籍图片
          </p>
        </Dragger>
        
        <div className="action-bar">
          <Button 
            type="primary" 
            onClick={handleOCR}
            loading={loading}
            disabled={fileList.length === 0}
            icon={<ScanOutlined />}
            size="large"
          >
            开始识别
          </Button>
        </div>
      </Card>
    );
  };

  const renderResultTab = () => {
    if (!ocrResult) {
      return (
        <Card className="ocr-card">
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <Title level={4}>暂无识别结果</Title>
            <Paragraph>请先上传图片并进行识别</Paragraph>
            <Button type="primary" onClick={() => setActiveTab('upload')}>返回上传</Button>
          </Space>
        </Card>
      );
    }

    return (
      <Card className="ocr-card">
        <div className="result-header">
          <Title level={4}>识别结果</Title>
          <Text type="secondary">处理时间: {ocrResult.processing_time.toFixed(2)}秒</Text>
        </div>

        <Divider />
        
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card className="text-card" title="识别文本">
              <div className="text-content">
                <Paragraph className="ancient-text">
                  {ocrResult.text}
                </Paragraph>
              </div>
              <div className="card-actions">
                <Button type="primary" icon={<FileTextOutlined />}>复制文本</Button>
                <Button icon={<SwapOutlined />}>版本对比</Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="variants-card" title="异体字映射">
              {ocrResult.variants && ocrResult.variants.length > 0 ? (
                <ul className="variant-list">
                  {ocrResult.variants.map((variant, index) => (
                    <li key={index} className="variant-item">
                      <Space>
                        <Text className="ancient-text original-char">{variant.original}</Text>
                        <Text>→</Text>
                        <Text className="modern-char">{variant.modern}</Text>
                      </Space>
                    </li>
                  ))}
                </ul>
              ) : (
                <Paragraph>未检测到异体字</Paragraph>
              )}
            </Card>
          </Col>
        </Row>

        <div className="action-bar">
          <Button onClick={() => setActiveTab('upload')}>继续上传</Button>
          <Button type="primary">保存结果</Button>
        </div>
      </Card>
    );
  };

  const renderPreprocessingTab = () => {
    return (
      <Card className="ocr-card">
        <Title level={4}>图像预处理</Title>
        <Paragraph>使用高级图像处理方法提高识别精度。</Paragraph>
        
        {fileList.length > 0 && (
          <div className="preview-container">
            <Card title="原始图像">
              <Image
                width="100%"
                src={URL.createObjectURL(fileList[0].originFileObj as Blob)}
                alt="原始图像"
              />
            </Card>
            
            <Divider>预处理选项</Divider>
            
            <div className="processing-options">
              <Button.Group>
                <Button icon={<FileSearchOutlined />}>二值化</Button>
                <Button icon={<FileSearchOutlined />}>去噪</Button>
                <Button icon={<FileSearchOutlined />}>倾斜校正</Button>
                <Button icon={<FileSearchOutlined />}>对比度增强</Button>
              </Button.Group>
            </div>
            
            <div className="action-bar">
              <Button onClick={() => setActiveTab('upload')}>返回</Button>
              <Button type="primary" onClick={handleOCR}>
                应用处理并识别
              </Button>
            </div>
          </div>
        )}
        
        {fileList.length === 0 && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <Paragraph>请先上传图片</Paragraph>
            <Button type="primary" onClick={() => setActiveTab('upload')}>
              返回上传图片
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <AppLayout
      title="古籍识别"
      description="儒智APP - 古籍OCR识别与处理"
      selectedKey="ocr"
      breadcrumbs={[{ title: '古籍识别' }]}
    >
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="ocr-tabs"
        tabPosition="top"
        centered
        items={[
          {
            key: 'upload',
            label: <span><InboxOutlined /> 上传图片</span>,
            children: renderUploadTab(),
          },
          {
            key: 'preprocessing',
            label: <span><FileSearchOutlined /> 图像预处理</span>,
            children: renderPreprocessingTab(),
          },
          {
            key: 'result',
            label: <span><FileTextOutlined /> 识别结果</span>,
            children: renderResultTab(),
          },
        ]}
      />
    </AppLayout>
  );
} 