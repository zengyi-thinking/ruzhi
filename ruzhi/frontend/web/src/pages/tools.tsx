import { useState } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Menu, 
  Tabs,
  Input,
  Button,
  Radio,
  Select,
  Divider,
  Breadcrumb,
  Space,
  Row,
  Col,
  Switch,
  Tag,
  List
} from 'antd';
import { 
  BookOutlined, 
  ReadOutlined,
  HomeOutlined,
  ScanOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  TranslationOutlined,
  ToolOutlined,
  BookFilled,
  FileTextOutlined,
  ApartmentOutlined,
  SoundOutlined
} from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

export default function CultureTools() {
  const [translationMode, setTranslationMode] = useState<'modern-to-ancient' | 'ancient-to-modern'>('ancient-to-modern');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [translationLevel, setTranslationLevel] = useState<string>('intermediate');
  const [loading, setLoading] = useState<boolean>(false);
  
  const router = useRouter();

  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
    } else {
      router.push(`/${key}`);
    }
  };

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    
    // 模拟API调用处理文本
    setTimeout(() => {
      if (translationMode === 'ancient-to-modern') {
        // 古文转现代文
        const samples = {
          'basic': '孔子说："学习并且经常温习它，不也是很愉快的吗？有志同道合的朋友从远方来，不也是很快乐的吗？别人不了解自己却不气恼，不也是君子的品格吗？"',
          'intermediate': '孔子认为，学习知识并经常复习实践，是一件令人愉悦的事。志同道合的朋友来访，更是让人快乐。即使别人不理解自己，也能心平气和，这才是真正有修养的人。',
          'advanced': '孔子在这里强调了三个现代人也很受用的道理：持续学习会带来内心的满足感；与志同道合者交流能获得情感共鸣；面对误解保持平常心是一种成熟的心态。这三点对现代人的职场发展、人际关系和心理健康都有重要启示。'
        };
        setOutputText(samples[translationLevel as keyof typeof samples] || samples['intermediate']);
      } else {
        // 现代文转古文
        setOutputText('吾尝闻之：学而时习之，不亦悦乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？');
      }
      setLoading(false);
    }, 1500);
  };

  const renderTranslationTool = () => {
    return (
      <Card className="translation-card">
        <div className="tool-header">
          <Title level={4}>文言文转换工具</Title>
          <Radio.Group 
            value={translationMode} 
            onChange={e => setTranslationMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="ancient-to-modern">古文→现代文</Radio.Button>
            <Radio.Button value="modern-to-ancient">现代文→古文</Radio.Button>
          </Radio.Group>
        </div>
        
        <Row gutter={24} className="translation-container">
          <Col xs={24} md={12}>
            <div className="input-section">
              <div className="section-header">
                <Text strong>{translationMode === 'ancient-to-modern' ? '古文输入' : '现代文输入'}</Text>
              </div>
              <TextArea
                rows={10}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={translationMode === 'ancient-to-modern' 
                  ? '请输入需要翻译的古文...' 
                  : '请输入需要转换为文言文的现代汉语...'}
                className="text-input"
              />
              
              {inputText && (
                <div className="character-count">
                  <Text type="secondary">字数：{inputText.length}</Text>
                </div>
              )}
            </div>
          </Col>
          
          <Col xs={24} md={12}>
            <div className="output-section">
              <div className="section-header">
                <Text strong>{translationMode === 'ancient-to-modern' ? '现代文输出' : '古文输出'}</Text>
                
                {translationMode === 'ancient-to-modern' && (
                  <Select 
                    value={translationLevel} 
                    onChange={value => setTranslationLevel(value)}
                    style={{ width: 120 }}
                  >
                    <Option value="basic">直译</Option>
                    <Option value="intermediate">意译</Option>
                    <Option value="advanced">应用解读</Option>
                  </Select>
                )}
                
                {translationMode === 'modern-to-ancient' && (
                  <Select 
                    defaultValue="literary" 
                    style={{ width: 120 }}
                  >
                    <Option value="literary">文言文</Option>
                    <Option value="classical">典雅体</Option>
                    <Option value="official">公文体</Option>
                  </Select>
                )}
              </div>
              
              <TextArea
                rows={10}
                value={outputText}
                readOnly
                placeholder="翻译结果将在这里显示..."
                className={`text-output ${translationMode === 'ancient-to-modern' ? 'modern-text' : 'ancient-text'}`}
              />
              
              <div className="action-buttons">
                <Button.Group>
                  <Button icon={<FileTextOutlined />}>复制</Button>
                  <Button icon={<SoundOutlined />}>朗读</Button>
                  <Button icon={<BookFilled />}>保存</Button>
                </Button.Group>
              </div>
            </div>
          </Col>
        </Row>
        
        <div className="action-bar">
          <Button
            type="primary"
            onClick={handleTranslate}
            loading={loading}
            disabled={!inputText.trim()}
            icon={<TranslationOutlined />}
            size="large"
          >
            开始转换
          </Button>
        </div>
        
        {translationMode === 'ancient-to-modern' && outputText && (
          <Card className="annotations-card" style={{ marginTop: 20 }}>
            <Title level={5}>字词注释</Title>
            <List
              size="small"
              bordered
              dataSource={[
                { term: '学而时习之', explanation: '学：学习；而：连词，表并列；时：适时，经常；习：温习，复习；之：代词，指代所学内容。' },
                { term: '说(悦)', explanation: '高兴，愉快。' },
                { term: '不亦乎', explanation: '不：岂不；亦：也；乎：语气词。表示反问语气。' }
              ]}
              renderItem={item => (
                <List.Item>
                  <Space direction="vertical">
                    <Text strong className="ancient-text">{item.term}</Text>
                    <Text>{item.explanation}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Card>
    );
  };

  const renderClassicalTools = () => {
    return (
      <div>
        <Card className="tools-overview">
          <Title level={4}>传统文化工具集</Title>
          <Paragraph>
            探索中国传统文化的多样工具，将古代智慧应用于现代生活。
          </Paragraph>
          
          <Row gutter={[16, 16]} className="tools-grid">
            <Col xs={24} sm={12} md={8}>
              <Card 
                className="tool-card" 
                hoverable
                onClick={() => {}}
              >
                <div className="tool-icon">
                  <TranslationOutlined />
                </div>
                <div className="tool-info">
                  <Text strong>文言文转换</Text>
                  <Text type="secondary">古今文互译工具</Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                className="tool-card coming-soon" 
                hoverable
              >
                <div className="tool-icon">
                  <ApartmentOutlined />
                </div>
                <div className="tool-info">
                  <Text strong>古籍关系图谱</Text>
                  <Text type="secondary">可视化经典间的联系</Text>
                  <Tag color="blue">即将上线</Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                className="tool-card coming-soon" 
                hoverable
              >
                <div className="tool-icon">
                  <SoundOutlined />
                </div>
                <div className="tool-info">
                  <Text strong>礼乐复原</Text>
                  <Text type="secondary">传统礼乐文化AR复原</Text>
                  <Tag color="blue">即将上线</Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                className="tool-card coming-soon" 
                hoverable
              >
                <div className="tool-icon">
                  <ToolOutlined />
                </div>
                <div className="tool-info">
                  <Text strong>诗词创作助手</Text>
                  <Text type="secondary">辅助创作古典诗词</Text>
                  <Tag color="blue">即将上线</Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Card 
                className="tool-card coming-soon" 
                hoverable
              >
                <div className="tool-icon">
                  <BookFilled />
                </div>
                <div className="tool-info">
                  <Text strong>经典智能注解</Text>
                  <Text type="secondary">智能解析古籍内容</Text>
                  <Tag color="blue">即将上线</Tag>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>文化活化 - 儒智</title>
        <meta name="description" content="儒智APP - 传统文化活化工具" />
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
            selectedKeys={['tools']}
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
              <Breadcrumb.Item>文化活化</Breadcrumb.Item>
            </Breadcrumb>
            
            <Tabs 
              defaultActiveKey="overview" 
              className="tools-tabs"
              type="card"
              items={[
                {
                  key: 'overview',
                  label: <span><ToolOutlined /> 工具概览</span>,
                  children: renderClassicalTools(),
                },
                {
                  key: 'translation',
                  label: <span><TranslationOutlined /> 文言文转换</span>,
                  children: renderTranslationTool(),
                },
              ]}
            />
          </div>
        </Content>
        
        <Footer className="app-footer">
          儒智 ©{new Date().getFullYear()} - 让古代智慧在现代社会焕发新生
        </Footer>
      </Layout>
    </>
  );
} 