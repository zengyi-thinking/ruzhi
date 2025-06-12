import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Typography, 
  Menu, 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  List, 
  Avatar, 
  Space, 
  Divider, 
  Tabs, 
  Tag, 
  Progress,
  Statistic,
  notification
} from 'antd';
import { 
  BookOutlined, 
  HomeOutlined, 
  ReadOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  SendOutlined,
  RobotOutlined,
  TrophyOutlined,
  SettingOutlined,
  ApiOutlined,
  MessageOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import ApiSettingsModal from '../components/ApiSettingsModal';

const { Title, Text, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 学者映射表
const scholarMap = {
  'confucius': '孔子',
  'mengzi': '孟子',
  'xunzi': '荀子'
};

// 学习路径数据
const learningPaths = [
  {
    id: 1,
    title: '儒家经典入门',
    description: '从《论语》开始，逐步了解儒家思想的核心概念和发展历程',
    progress: 25,
    image: '/images/learning/path1.jpg'
  },
  {
    id: 2,
    title: '四书精读',
    description: '深入学习《大学》《中庸》《论语》《孟子》四部经典著作',
    progress: 10,
    image: '/images/learning/path2.jpg'
  },
  {
    id: 3,
    title: '儒家思想与现代社会',
    description: '探讨儒家思想在当代社会的应用与价值',
    progress: 0,
    image: '/images/learning/path3.jpg'
  }
];

// 知识点数据
const knowledgePoints = [
  {
    id: 1,
    title: '仁',
    description: '仁者爱人，是儒家思想的核心价值观念',
    tags: ['核心概念', '论语']
  },
  {
    id: 2,
    title: '礼',
    description: '社会规范与行为准则，维持社会秩序的重要基础',
    tags: ['核心概念', '礼记']
  },
  {
    id: 3,
    title: '义',
    description: '道德判断的标准，指行为的正当性与合理性',
    tags: ['核心概念', '孟子']
  },
  {
    id: 4,
    title: '智',
    description: '明辨是非的能力，做出正确判断的智慧',
    tags: ['核心概念', '荀子']
  }
];

// 学者数据
const scholars = [
  {
    id: 'confucius',
    name: '孔子',
    avatar: '/images/scholars/confucius.png',
    title: '儒家创始人',
    description: '春秋末期思想家、教育家，儒家学派创始人。以"仁"为核心，著有《论语》。',
    color: '#91caff',
  },
  {
    id: 'mengzi',
    name: '孟子',
    avatar: '/images/scholars/mengzi.png',
    title: '亚圣',
    description: '战国时期思想家，儒家代表人物。提出"性善论"，著有《孟子》。',
    color: '#b7eb8f',
  },
  {
    id: 'xunzi',
    name: '荀子',
    avatar: '/images/scholars/xunzi.png',
    title: '性恶论代表',
    description: '战国末期思想家，儒家学派代表人物。提出"性恶论"，著有《荀子》。',
    color: '#ffd6e7',
  }
];

// 消息接口
interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
}

// 对话接口
interface Conversation {
  id?: number;
  user_id?: string;
  persona: string;
  title?: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
}

export default function LearningCenter() {
  const [activeScholar, setActiveScholar] = useState('confucius');
  const [dialogues, setDialogues] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isApiSettingsVisible, setIsApiSettingsVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const router = useRouter();

  // 获取API状态
  useEffect(() => {
    fetchApiStatus();
  }, []);

  const fetchApiStatus = async () => {
    try {
      // Check if our AI dialogue service is running
      const response = await axios.get('http://localhost:8003/api/v1/dialogue/health');
      if (response.data.status === 'healthy') {
        setApiStatus({ status: 'active' });
      } else {
        setApiStatus({ status: 'inactive' });
      }
    } catch (err) {
      console.error('Error fetching API status:', err);
      setApiStatus({ status: 'inactive' });
      notification.error({
        message: 'API状态获取失败',
        description: '无法连接到AI对话服务，请确保服务已启动。',
      });
    }
  };

  // 创建新对话
  const createNewConversation = async (scholarId: string, firstMessage: string) => {
    setLoading(true);
    try {
      // Use our new dialogue API
      const response = await axios.post('http://localhost:8003/api/v1/dialogue/chat', {
        user_id: 'guest',
        message: firstMessage,
        character: scholarId
      });
      
      const responseData = response.data;
      
      // Create conversation object from response
      const conversation: Conversation = {
        id: 1, // Simulated ID
        user_id: 'guest',
        persona: scholarId,
        title: `与${scholarMap[scholarId as keyof typeof scholarMap]}的对话`,
        messages: [
          { role: 'user', content: firstMessage },
          { role: 'assistant', content: responseData.content }
        ]
      };
      
      setCurrentConversation(conversation);
      setDialogues(conversation.messages);
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      // 错误时仍然显示用户消息
      const newMessages = [
        { role: 'user' as 'user', content: firstMessage },
        { role: 'assistant' as 'assistant', content: '抱歉，创建对话时发生错误，请检查API设置并重试。' }
      ];
      setDialogues(newMessages);
      
      notification.error({
        message: '创建对话失败',
        description: '无法创建新对话，请检查网络连接或API配置。',
      });
    } finally {
      setLoading(false);
    }
  };

  // 发送消息到现有对话
  const sendMessageToConversation = async (conversationId: number, message: string) => {
    setLoading(true);
    try {
      // Use our new dialogue API
      const response = await axios.post('http://localhost:8003/api/v1/dialogue/chat', {
        user_id: 'guest',
        message: message,
        character: activeScholar
      });
      
      const responseData = response.data;
      
      // Add the new messages to the conversation
      const newMessages = [
        ...dialogues,
        { role: 'user', content: message },
        { role: 'assistant', content: responseData.content }
      ];
      
      // Update the conversation with new messages
      const updatedConversation = {
        ...currentConversation!,
        messages: newMessages
      };
      
      setCurrentConversation(updatedConversation);
      setDialogues(newMessages);
      
    } catch (err) {
      console.error('Error sending message:', err);
      // 错误时仍然显示用户消息，但添加错误提示
      const newMessages = [...dialogues, 
        { role: 'user' as 'user', content: message },
        { role: 'assistant' as 'assistant', content: '抱歉，发送消息时发生错误，请检查API设置并重试。' }
      ];
      setDialogues(newMessages);
      
      notification.error({
        message: '发送消息失败',
        description: '无法发送消息，请检查网络连接或API配置。',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
    } else {
      router.push(`/${key}`);
    }
  };

  const handleScholarChange = (scholarId: string) => {
    setActiveScholar(scholarId);
    // 切换学者时清空对话，准备创建新对话
    setCurrentConversation(null);
    setDialogues([]);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    if (!currentConversation) {
      // 首次发送，创建新对话
      createNewConversation(activeScholar, userInput);
    } else {
      // 向现有对话发送消息
      sendMessageToConversation(currentConversation.id!, userInput);
    }

    setUserInput('');
  };

  const showApiSettings = () => {
    setIsApiSettingsVisible(true);
  };

  const handleApiSettingsSuccess = () => {
    fetchApiStatus();
    notification.success({
      message: 'AI服务设置成功',
      description: '已更新AI服务设置，您可以开始新的对话了。',
    });
  };

  return (
    <AppLayout
      title="学习中心"
      selectedKey="learning"
      breadcrumbs={[{ title: '学习中心' }]}
    >
      <div className="learning-center">
        <Title level={2}>学习中心</Title>
        <Paragraph>探索儒家经典，与大师对话，提升学习效果</Paragraph>

        {/* AI导师部分 */}
        <div className="section">
          <div className="section-header">
            <Title level={4}>AI导师</Title>
            <Button type="link">查看全部</Button>
          </div>
          
          <Row gutter={[16, 16]}>
            {scholars.map(scholar => (
              <Col xs={24} sm={12} md={8} key={scholar.id}>
                <Card 
                  hoverable
                  style={{ marginBottom: 16 }}
                  onClick={() => router.push('/dialogue')}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      size={64} 
                      src={scholar.avatar}
                      style={{ backgroundColor: scholar.color }}
                    >
                      {scholar.name.charAt(0)}
                    </Avatar>
                    <div style={{ marginLeft: 16 }}>
                      <Text strong>{scholar.name}</Text>
                      <div><Text type="secondary">{scholar.title}</Text></div>
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          size="small" 
                          type="primary"
                          icon={<MessageOutlined />}
                        >
                          开始对话
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 历史人物对话部分 */}
        <div className="section">
          <div className="section-header">
            <Title level={4}>历史人物对话</Title>
            <Button type="link" onClick={() => router.push('/dialogue')}>进入对话</Button>
          </div>
          
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Space direction="vertical" align="center">
                    <Avatar 
                      size={80}
                      icon={<MessageOutlined />}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <Text strong>与历史人物对话</Text>
                  </Space>
                </div>
              </Col>
              <Col xs={24} sm={16}>
                <Paragraph>
                  通过AI技术，与孔子、孟子、荀子等历史人物进行对话，探索儒家智慧，获得思想启发。
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<ArrowRightOutlined />}
                  onClick={() => router.push('/dialogue')}
                >
                  开始对话
                </Button>
              </Col>
            </Row>
          </Card>
        </div>

        {/* 知识图谱部分 */}
        <div className="section">
          <div className="section-header">
            <Title level={4}>知识图谱</Title>
          </div>
          
          <Card
            hoverable
            style={{ marginBottom: 24 }}
            onClick={() => router.push('/knowledge-graph')}
          >
            <div className="knowledge-graph-preview">
              <div className="preview-image">
                <div className="graph-placeholder">
                  <HistoryOutlined style={{ fontSize: 48 }} />
                </div>
              </div>
              <div className="preview-content">
                <Title level={5}>儒家思想知识图谱</Title>
                <Paragraph>
                  探索儒家思想的核心概念、人物关系和历史发展，通过可视化方式理解儒学体系
                </Paragraph>
                <Button type="primary">探索图谱</Button>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 学习路径部分 */}
        <div className="section">
          <div className="section-header">
            <Title level={4}>学习路径</Title>
            <Button type="link">更多</Button>
          </div>
          
          {learningPaths.map(path => (
            <Card 
              key={path.id}
              hoverable
              style={{ marginBottom: 16 }}
              onClick={() => router.push(`/learning-path/${path.id}`)}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>
                  <Title level={5}>{path.title}</Title>
                  <Paragraph>{path.description}</Paragraph>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <Progress percent={path.progress} />
                    <Text type="secondary">{path.progress}%</Text>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* 互动练习部分 */}
        <div className="section">
          <div className="section-header">
            <Title level={4}>互动练习</Title>
            <Button type="link">查看全部</Button>
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card 
                hoverable
                onClick={() => router.push('/exercise/parsing')}
              >
                <Space direction="vertical">
                  <Title level={5}>古文断句练习</Title>
                  <Paragraph>提升古文阅读能力，练习古文断句技巧</Paragraph>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card 
                hoverable
                onClick={() => router.push('/exercise/recitation')}
              >
                <Space direction="vertical">
                  <Title level={5}>经典背诵</Title>
                  <Paragraph>背诵儒家经典名句，提高记忆力与理解力</Paragraph>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
      
      {/* API设置模态框 */}
      <ApiSettingsModal
        visible={isApiSettingsVisible}
        onCancel={() => setIsApiSettingsVisible(false)}
        onSuccess={handleApiSettingsSuccess}
      />
      
      <style jsx global>{`
        .learning-center {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 32px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .knowledge-graph-preview {
          display: flex;
          align-items: center;
        }
        
        .preview-image {
          flex: 0 0 120px;
          margin-right: 24px;
        }
        
        .graph-placeholder {
          width: 120px;
          height: 120px;
          background-color: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        
        .preview-content {
          flex: 1;
        }
        
        .ant-card {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </AppLayout>
  );
} 