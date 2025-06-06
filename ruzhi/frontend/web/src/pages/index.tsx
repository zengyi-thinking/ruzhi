import { useState } from 'react';
import { 
  Typography, 
  Upload, 
  Button, 
  Card, 
  Spin, 
  message, 
  Tabs,
  Divider,
  Space,
  Menu
} from 'antd';
import { 
  InboxOutlined, 
  BookOutlined, 
  ScanOutlined, 
  QuestionCircleOutlined, 
  HistoryOutlined,
  ReadOutlined,
  UserOutlined,
  HomeOutlined
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

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('home');
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
    } catch (error) {
      console.error('OCR处理失败:', error);
      message.error('OCR处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
    if (key !== 'home') {
      router.push(`/${key}`);
    } else {
      router.push('/');
    }
  };

  const renderHomeContent = () => {
    return (
      <div className="home-container">
        <div className="hero-section">
          <Title level={2} className="text-center">儒智 - 古典智慧与现代科技的融合</Title>
          <Paragraph className="text-center">
            探索中国传统文化经典，感受古代智慧在现代社会的焕发新生
          </Paragraph>
        </div>
        
        <div className="feature-section">
          <Title level={3} className="section-title">核心功能</Title>
          <div className="feature-grid">
            <Card 
              hoverable 
              className="feature-card"
              onClick={() => handleMenuClick('classics')}
              cover={<div className="feature-icon"><ReadOutlined /></div>}
            >
              <Card.Meta 
                title="经典库" 
                description="浏览儒家经典著作，包括《论语》、《孟子》等" 
              />
            </Card>
            
            <Card 
              hoverable 
              className="feature-card"
              onClick={() => handleMenuClick('ocr')}
              cover={<div className="feature-icon"><ScanOutlined /></div>}
            >
              <Card.Meta 
                title="古籍识别" 
                description="OCR识别古籍文字，支持繁体字与异体字" 
              />
            </Card>
            
            <Card 
              hoverable 
              className="feature-card"
              onClick={() => handleMenuClick('learning')}
              cover={<div className="feature-icon"><QuestionCircleOutlined /></div>}
            >
              <Card.Meta 
                title="学习中心" 
                description="AI辅助学习与问答，知识图谱探索" 
              />
            </Card>
            
            <Card 
              hoverable 
              className="feature-card"
              onClick={() => handleMenuClick('tools')}
              cover={<div className="feature-icon"><HistoryOutlined /></div>}
            >
              <Card.Meta 
                title="文化活化" 
                description="文言文转换工具，传统文化现代应用" 
              />
            </Card>
          </div>
        </div>
        
        <div className="recent-section">
          <Title level={3} className="section-title">近期热门</Title>
          <div className="recent-list">
            <Card className="recent-item">
              <Title level={4}>论语·学而篇</Title>
              <Paragraph className="ancient-text">
                子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」
              </Paragraph>
              <Button type="link" onClick={() => handleMenuClick('classics')}>查看全文</Button>
            </Card>
            
            <Card className="recent-item">
              <Title level={4}>孟子·离娄章句</Title>
              <Paragraph className="ancient-text">
                孟子曰：「仁之实，事亲是也；义之实，从兄是也。」
              </Paragraph>
              <Button type="link" onClick={() => handleMenuClick('classics')}>查看全文</Button>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout 
      title="古籍智能识别与文化传承"
      selectedKey="home"
    >
      {renderHomeContent()}
    </AppLayout>
  );
} 