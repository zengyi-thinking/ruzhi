import { useState, useEffect } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Menu, 
  Tabs,
  Input,
  Button,
  Avatar,
  List,
  Space,
  Tag,
  Breadcrumb,
  Divider,
  Row,
  Col,
  Modal,
  notification
} from 'antd';
import { 
  BookOutlined, 
  ReadOutlined,
  HomeOutlined,
  ScanOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  SendOutlined,
  RobotOutlined,
  ShareAltOutlined,
  NodeIndexOutlined,
  FireOutlined,
  TrophyOutlined,
  SettingOutlined,
  ApiOutlined
} from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import ApiSettingsModal from '../components/ApiSettingsModal';

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { Search } = Input;

// 模拟AI对话历史
const initialDialogues = [
  { 
    id: 1, 
    user: '孔子对学习有什么看法？', 
    ai: '孔子非常重视学习，他在《论语·学而》中说："学而时习之，不亦说乎？"意思是学习并经常温习所学的知识，不是很愉快的事情吗？他认为学习应当是一个持续的、快乐的过程。此外，孔子还提倡"学思结合"，在《论语·为政》中说："学而不思则罔，思而不学则殆"，强调学习需要与思考相结合。',
    scholar: '孔子'
  },
  { 
    id: 2, 
    user: '儒家的"仁"指的是什么？', 
    ai: '在儒家思想中，"仁"是核心概念，可以理解为"仁爱"、"仁德"或"仁心"。孔子将"仁"视为最高的道德境界和人格理想。"仁"的基本含义是"爱人"，体现为对他人的关爱与同情。孟子进一步发展了"仁"的理念，提出"仁，人心也"，认为仁爱之心是人与生俱来的天性。在实践层面，"仁"要求人们推己及人，通过自我修养达到与他人和谐共处的境界。',
    scholar: '孔子'
  }
];

// 模拟知识图谱数据
const knowledgeGraphData = {
  nodes: [
    { id: '1', name: '仁', category: 'concept' },
    { id: '2', name: '义', category: 'concept' },
    { id: '3', name: '礼', category: 'concept' },
    { id: '4', name: '智', category: 'concept' },
    { id: '5', name: '信', category: 'concept' },
    { id: '6', name: '孔子', category: 'person' },
    { id: '7', name: '孟子', category: 'person' },
    { id: '8', name: '荀子', category: 'person' },
    { id: '9', name: '论语', category: 'book' },
    { id: '10', name: '五常', category: 'concept' },
  ],
  relationships: [
    { source: '6', target: '1', label: '提出' },
    { source: '10', target: '1', label: '包含' },
    { source: '10', target: '2', label: '包含' },
    { source: '10', target: '3', label: '包含' },
    { source: '10', target: '4', label: '包含' },
    { source: '10', target: '5', label: '包含' },
    { source: '6', target: '9', label: '著作' },
    { source: '7', target: '1', label: '发展' },
    { source: '8', target: '3', label: '重视' }
  ]
};

// 模拟学者数据
const scholars = [
  { id: 'confucius', name: '孔子', avatar: '/images/confucius.png', title: '儒家创始人', description: '春秋时期思想家、教育家，儒家学派创始人' },
  { id: 'mencius', name: '孟子', avatar: '/images/mencius.png', title: '亚圣', description: '战国时期思想家，儒家学派代表人物' },
  { id: 'xunzi', name: '荀子', avatar: '/images/xunzi.png', title: '儒家大师', description: '战国末期思想家，儒家学派代表人物' }
];

// 学者ID到名称的映射
const scholarMap = {
  'confucius': '孔子',
  'mengzi': '孟子',
  'xunzi': '荀子'
};

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
}

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
    <>
      <Head>
        <title>学习中心 - 儒智</title>
        <meta name="description" content="儒智APP - AI辅助学习儒家经典" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="logo" onClick={() => router.push('/')}>
            <BookOutlined className="logo-icon" />
            <Title level={3} className="logo-text">儒智</Title>
          </div>
          <Menu
            theme="light"
            mode="horizontal"
            selectedKeys={['learning']}
            className="main-menu"
            items={[
              {
                key: 'home',
                icon: <HomeOutlined />,
                label: '首页',
                onClick: () => handleMenuClick('home'),
              },
              {
                key: 'classics',
                icon: <ReadOutlined />,
                label: '经典库',
                onClick: () => handleMenuClick('classics'),
              },
              {
                key: 'ocr',
                icon: <ScanOutlined />,
                label: '古籍识别',
                onClick: () => handleMenuClick('ocr'),
              },
              {
                key: 'learning',
                icon: <QuestionCircleOutlined />,
                label: '学习中心',
                onClick: () => handleMenuClick('learning'),
              },
              {
                key: 'tools',
                icon: <HistoryOutlined />,
                label: '文化活化',
                onClick: () => handleMenuClick('tools'),
              },
              {
                key: 'user',
                icon: <UserOutlined />,
                label: '个人中心',
                onClick: () => handleMenuClick('user'),
              },
            ]}
          />
        </Header>
        
        <Content className="app-content">
          <div className="container">
            <Breadcrumb style={{ marginBottom: 16 }}>
              <Breadcrumb.Item>
                <a onClick={() => router.push('/')}>首页</a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>学习中心</Breadcrumb.Item>
            </Breadcrumb>
            
            <Tabs 
              defaultActiveKey="ai-tutor" 
              className="learning-tabs"
              type="card"
              items={[
                {
                  key: 'ai-tutor',
                  label: <span><RobotOutlined /> AI经典问答</span>,
                  children: (
                    <div className="ai-chat-container">
                      <Row gutter={24}>
                        <Col xs={24} md={6}>
                          <Card title="选择虚拟学者" className="scholars-card">
                            <div className="scholars-list">
                              {scholars.map(scholar => (
                                <div 
                                  key={scholar.id} 
                                  className={`scholar-item ${activeScholar === scholar.id ? 'active' : ''}`}
                                  onClick={() => handleScholarChange(scholar.id)}
                                >
                                  <Avatar size={64} icon={<UserOutlined />} className="scholar-avatar" />
                                  <div className="scholar-info">
                                    <Text strong>{scholar.name}</Text>
                                    <Text type="secondary">{scholar.title}</Text>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                          
                          <Card 
                            title="AI服务状态" 
                            className="api-status-card" 
                            style={{ marginTop: 16 }}
                            extra={
                              <Button 
                                type="primary" 
                                size="small" 
                                icon={<SettingOutlined />}
                                onClick={showApiSettings}
                              >
                                设置
                              </Button>
                            }
                          >
                            <div className="api-status">
                              {apiStatus ? (
                                <>
                                  <Paragraph>
                                    <Space>
                                      <Text strong>提供商:</Text>
                                      <Text>{apiStatus.name}</Text>
                                    </Space>
                                  </Paragraph>
                                  <Paragraph>
                                    <Space>
                                      <Text strong>模型:</Text>
                                      <Text>{apiStatus.model}</Text>
                                    </Space>
                                  </Paragraph>
                                  <Paragraph>
                                    <Space>
                                      <Text strong>状态:</Text>
                                      <Tag color={apiStatus.status === 'active' ? 'success' : 'warning'}>
                                        {apiStatus.status === 'active' ? '正常' : '备用模式'}
                                      </Tag>
                                    </Space>
                                  </Paragraph>
                                </>
                              ) : (
                                <div style={{ textAlign: 'center' }}>
                                  <Text type="secondary">正在获取API状态...</Text>
                                </div>
                              )}
                            </div>
                          </Card>
                          
                          <Card title="热门问题" className="hot-questions-card" style={{ marginTop: 16 }}>
                            <List
                              size="small"
                              dataSource={[
                                '孔子的主要思想是什么？',
                                '仁义礼智信的含义是什么？',
                                '什么是"五常"？',
                                '孟子性善论的核心观点？',
                                '儒家思想对现代社会有何启示？'
                              ]}
                              renderItem={item => (
                                <List.Item>
                                  <a onClick={() => setUserInput(item)}>{item}</a>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={24} md={18}>
                          <Card className="chat-card">
                            <div className="chat-header">
                              <div className="chat-title">
                                <Avatar size={40} icon={<UserOutlined />} />
                                <div>
                                  <Text strong>{scholars.find(s => s.id === activeScholar)?.name} AI</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>基于儒家经典的AI问答系统</Text>
                                </div>
                              </div>
                              {!apiStatus || apiStatus.status !== 'active' ? (
                                <Button 
                                  type="primary" 
                                  icon={<ApiOutlined />}
                                  onClick={showApiSettings}
                                >
                                  配置AI服务
                                </Button>
                              ) : null}
                            </div>
                            
                            <div className="chat-messages">
                              {dialogues.length === 0 ? (
                                <div className="empty-chat">
                                  <div className="empty-chat-content">
                                    <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                    <Title level={4}>开始与{scholars.find(s => s.id === activeScholar)?.name}对话</Title>
                                    <Paragraph>
                                      请在下方输入您的问题，{scholars.find(s => s.id === activeScholar)?.name}AI将为您解答关于儒家经典的疑问。
                                    </Paragraph>
                                  </div>
                                </div>
                              ) : (
                                dialogues.map((message, index) => (
                                  <div key={index}>
                                    {message.role === 'user' ? (
                                      <div className="user-message">
                                        <div className="message-content">
                                          <Text>{message.content}</Text>
                                        </div>
                                        <Avatar icon={<UserOutlined />} />
                                      </div>
                                    ) : (
                                      <div className="ai-message">
                                        <Avatar icon={<RobotOutlined />} />
                                        <div className="message-content">
                                          <div className="message-header">
                                            <Text strong>{scholarMap[activeScholar as keyof typeof scholarMap] || '现代导师'} AI</Text>
                                          </div>
                                          <Text>{message.content}</Text>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                              
                              {loading && (
                                <div className="ai-message">
                                  <Avatar icon={<RobotOutlined />} />
                                  <div className="message-content">
                                    <div className="message-header">
                                      <Text strong>{scholars.find(s => s.id === activeScholar)?.name} AI</Text>
                                    </div>
                                    <Text>思考中...</Text>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="chat-input">
                              <Search
                                placeholder="输入您的问题..."
                                enterButton={
                                  <Button 
                                    type="primary" 
                                    icon={<SendOutlined />}
                                    disabled={!apiStatus || apiStatus.status !== 'active'}
                                  >
                                    发送
                                  </Button>
                                }
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onSearch={handleSendMessage}
                                loading={loading}
                                disabled={!apiStatus || apiStatus.status !== 'active'}
                              />
                              {!apiStatus || apiStatus.status !== 'active' ? (
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                  <Text type="secondary">
                                    请先 <a onClick={showApiSettings}>配置AI服务</a> 以启用对话功能
                                  </Text>
                                </div>
                              ) : null}
                            </div>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'knowledge-graph',
                  label: <span><NodeIndexOutlined /> 知识图谱</span>,
                  children: (
                    <Card className="knowledge-graph-card">
                      <div className="graph-controls">
                        <Title level={4}>儒家知识图谱浏览</Title>
                        <Search placeholder="搜索概念或人物..." style={{ maxWidth: 300 }} />
                      </div>
                      
                      <div className="graph-container" style={{ height: 500, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
                        <div style={{ textAlign: 'center', paddingTop: 200 }}>
                          <Text>知识图谱可视化</Text>
                          <br />
                          <Text type="secondary">（在实际应用中，这里将使用D3.js或ECharts等可视化库渲染儒家知识图谱）</Text>
                        </div>
                      </div>
                      
                      <div className="graph-info" style={{ marginTop: 20 }}>
                        <Divider>图谱信息</Divider>
                        <Row gutter={24}>
                          <Col span={8}>
                            <Card title="概念" size="small">
                              <List
                                size="small"
                                dataSource={knowledgeGraphData.nodes.filter(node => node.category === 'concept')}
                                renderItem={item => (
                                  <List.Item>
                                    <Tag color="blue">{item.name}</Tag>
                                  </List.Item>
                                )}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card title="人物" size="small">
                              <List
                                size="small"
                                dataSource={knowledgeGraphData.nodes.filter(node => node.category === 'person')}
                                renderItem={item => (
                                  <List.Item>
                                    <Tag color="green">{item.name}</Tag>
                                  </List.Item>
                                )}
                              />
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card title="著作" size="small">
                              <List
                                size="small"
                                dataSource={knowledgeGraphData.nodes.filter(node => node.category === 'book')}
                                renderItem={item => (
                                  <List.Item>
                                    <Tag color="orange">{item.name}</Tag>
                                  </List.Item>
                                )}
                              />
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Card>
                  ),
                },
                {
                  key: 'challenges',
                  label: <span><FireOutlined /> 学习挑战</span>,
                  children: (
                    <div className="challenges-container">
                      <Row gutter={24}>
                        <Col xs={24} md={16}>
                          <Card title="每日学习挑战" className="challenges-card">
                            <List
                              itemLayout="horizontal"
                              dataSource={[
                                {
                                  title: '论语章句背诵',
                                  description: '背诵《论语》中的10句经典名言',
                                  difficulty: '初级',
                                  progress: 30,
                                },
                                {
                                  title: '古文断句练习',
                                  description: '为无标点的古文正确添加标点',
                                  difficulty: '中级',
                                  progress: 0,
                                },
                                {
                                  title: '四书五经知识问答',
                                  description: '回答关于四书五经的20个问题',
                                  difficulty: '高级',
                                  progress: 65,
                                },
                                {
                                  title: '儒家思想应用案例分析',
                                  description: '分析现代社会中的儒家思想应用',
                                  difficulty: '高级',
                                  progress: 0,
                                }
                              ]}
                              renderItem={(item) => (
                                <List.Item
                                  actions={[
                                    <Button key="start" type="primary">
                                      {item.progress > 0 ? '继续' : '开始'}
                                    </Button>
                                  ]}
                                >
                                  <List.Item.Meta
                                    avatar={<Avatar icon={<TrophyOutlined />} />}
                                    title={<Space>{item.title} <Tag color={
                                      item.difficulty === '初级' ? 'green' : 
                                      item.difficulty === '中级' ? 'orange' : 'red'
                                    }>{item.difficulty}</Tag></Space>}
                                    description={item.description}
                                  />
                                  <div>
                                    {item.progress > 0 ? `${item.progress}%` : '未开始'}
                                  </div>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                        
                        <Col xs={24} md={8}>
                          <Card title="学习成就" className="achievements-card">
                            <List
                              itemLayout="horizontal"
                              dataSource={[
                                { name: '初学儒家', description: '完成5个学习任务', achieved: true },
                                { name: '小有所成', description: '连续学习7天', achieved: true },
                                { name: '勤学不辍', description: '完成所有《论语》章节学习', achieved: false },
                                { name: '学贯中西', description: '探索儒家思想与西方哲学的关联', achieved: false },
                              ]}
                              renderItem={(item) => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={
                                      <Avatar 
                                        style={{ 
                                          backgroundColor: item.achieved ? '#52c41a' : '#f0f0f0',
                                          color: item.achieved ? 'white' : '#999'
                                        }}
                                        icon={<TrophyOutlined />} 
                                      />
                                    }
                                    title={item.name}
                                    description={item.description}
                                  />
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Content>
        
        <Footer className="app-footer">
          儒智 ©{new Date().getFullYear()} - 让古代智慧在现代社会焕发新生
        </Footer>
      </Layout>
      
      <ApiSettingsModal 
        visible={isApiSettingsVisible} 
        onCancel={() => setIsApiSettingsVisible(false)}
        onSuccess={handleApiSettingsSuccess}
      />

      {/* 添加必要的CSS样式 */}
      <style jsx global>{`
        .empty-chat {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
        }
        .empty-chat-content {
          text-align: center;
          max-width: 400px;
        }
        .chat-card .ant-card-body {
          padding: 0;
        }
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        .chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chat-messages {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .user-message {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .ai-message {
          display: flex;
          gap: 12px;
        }
        .message-content {
          max-width: 70%;
          padding: 12px;
          border-radius: 8px;
          background-color: #f5f5f5;
        }
        .user-message .message-content {
          background-color: #e6f7ff;
        }
        .message-header {
          margin-bottom: 4px;
        }
        .chat-input {
          padding: 16px;
          border-top: 1px solid #f0f0f0;
        }
        .scholar-item {
          display: flex;
          align-items: center;
          padding: 12px;
          gap: 12px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s;
        }
        .scholar-item:hover {
          background-color: #f5f5f5;
        }
        .scholar-item.active {
          background-color: #e6f7ff;
        }
        .scholar-info {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </>
  );
} 