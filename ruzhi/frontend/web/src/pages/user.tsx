import { useState } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Menu, 
  Tabs,
  Avatar,
  Button,
  List,
  Tag,
  Breadcrumb,
  Progress,
  Row,
  Col,
  Statistic,
  Divider,
  Space
} from 'antd';
import { 
  BookOutlined, 
  ReadOutlined,
  HomeOutlined,
  ScanOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HistoryOutlined as HistoryIcon,
  SettingOutlined,
  HeartOutlined,
  TrophyOutlined,
  FileTextOutlined,
  BookFilled
} from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;
const { TabPane } = Tabs;

// 模拟用户数据
const userData = {
  name: '学者游客',
  avatar: '/images/avatar.png',
  level: 3,
  experience: 750,
  nextLevelExp: 1000,
  joinDate: '2023-09-01',
  studyDays: 45,
  favorites: [
    { id: 1, title: '论语·学而第一', type: 'classics', date: '2023-10-15' },
    { id: 2, title: '孟子·离娄章句上', type: 'classics', date: '2023-10-10' },
    { id: 3, title: '古籍识别结果：《大学》', type: 'ocr', date: '2023-10-05' },
  ],
  history: [
    { id: 1, title: '学习《论语·学而》', type: 'study', date: '2023-10-20 14:30' },
    { id: 2, title: '识别《大学》片段', type: 'ocr', date: '2023-10-19 09:15' },
    { id: 3, title: '完成"文言断句"练习', type: 'challenge', date: '2023-10-18 16:45' },
    { id: 4, title: '与孔子AI对话', type: 'ai', date: '2023-10-17 19:20' },
  ],
  achievements: [
    { id: 1, title: '初学儒家', description: '完成5个学习任务', date: '2023-09-10', unlocked: true },
    { id: 2, title: '坚持不懈', description: '连续学习7天', date: '2023-09-15', unlocked: true },
    { id: 3, title: '经典通读', description: '完成《论语》全篇阅读', date: '2023-10-05', unlocked: true },
    { id: 4, title: '学贯中西', description: '探索儒家思想与西方哲学的关联', date: null, unlocked: false },
  ],
  studyStats: {
    totalHours: 32.5,
    readClassics: 3,
    completedChallenges: 12,
    aiConversations: 24
  }
};

export default function UserCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
    } else {
      router.push(`/${key}`);
    }
  };

  const renderProfileTab = () => {
    return (
      <div className="profile-container">
        <Card className="profile-card">
          <div className="profile-header">
            <Avatar size={80} icon={<UserOutlined />} className="profile-avatar" />
            <div className="profile-info">
              <Title level={4}>{userData.name}</Title>
              <div className="profile-meta">
                <Tag color="blue">学习者 Lv.{userData.level}</Tag>
                <Text type="secondary"><ClockCircleOutlined /> 加入于 {userData.joinDate}</Text>
              </div>
            </div>
          </div>

          <div className="profile-level">
            <div className="level-info">
              <Text>当前等级: Lv.{userData.level}</Text>
              <Text>{userData.experience}/{userData.nextLevelExp} 经验</Text>
            </div>
            <Progress 
              percent={Math.round((userData.experience / userData.nextLevelExp) * 100)} 
              showInfo={false} 
              strokeColor="#3a5485"
            />
          </div>

          <Divider />

          <Row gutter={24} className="stats-row">
            <Col span={6}>
              <Statistic title="学习天数" value={userData.studyDays} prefix={<ClockCircleOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic title="学习时长" value={userData.studyStats.totalHours} suffix="小时" />
            </Col>
            <Col span={6}>
              <Statistic title="阅读经典" value={userData.studyStats.readClassics} suffix="部" />
            </Col>
            <Col span={6}>
              <Statistic title="完成挑战" value={userData.studyStats.completedChallenges} suffix="次" />
            </Col>
          </Row>
        </Card>

        <Card title="学习成就" className="achievements-card">
          <List
            itemLayout="horizontal"
            dataSource={userData.achievements}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: item.unlocked ? '#3a5485' : '#f0f0f0',
                        color: item.unlocked ? 'white' : '#999'
                      }}
                      icon={<TrophyOutlined />} 
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{item.title}</Text>
                      {item.unlocked && <Tag color="green">已获得</Tag>}
                      {!item.unlocked && <Tag color="default">未解锁</Tag>}
                    </Space>
                  }
                  description={
                    <div>
                      <div>{item.description}</div>
                      {item.date && <Text type="secondary">获得于: {item.date}</Text>}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="学习路径建议" className="learning-path-card">
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                title: '入门经典导读',
                description: '从《大学》与《论语》精选篇章开始，打下儒家思想基础',
                progress: 60,
                status: 'active'
              },
              {
                title: '四书精读',
                description: '系统学习《论语》、《孟子》、《大学》、《中庸》',
                progress: 25,
                status: 'active'
              },
              {
                title: '五经概览',
                description: '了解《诗经》、《尚书》、《礼记》、《易经》、《春秋》',
                progress: 0,
                status: 'waiting'
              }
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<BookFilled />} />}
                  title={item.title}
                  description={
                    <div>
                      <div>{item.description}</div>
                      <Progress 
                        percent={item.progress} 
                        size="small" 
                        status={item.status as "success" | "active" | "exception" | "normal" | undefined} 
                      />
                    </div>
                  }
                />
                <Button type="primary" size="small">继续学习</Button>
              </List.Item>
            )}
          />
        </Card>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <Card title="学习历史" className="history-card">
        <List
          itemLayout="horizontal"
          dataSource={userData.history}
          renderItem={item => (
            <List.Item 
              actions={[
                <Button type="link" key="view">查看</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={
                      item.type === 'study' ? <BookOutlined /> : 
                      item.type === 'ocr' ? <ScanOutlined /> :
                      item.type === 'challenge' ? <TrophyOutlined /> : 
                      <QuestionCircleOutlined />
                    } 
                  />
                }
                title={item.title}
                description={item.date}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderFavoritesTab = () => {
    return (
      <Card title="我的收藏" className="favorites-card">
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: '全部',
              children: (
                <List
                  itemLayout="horizontal"
                  dataSource={userData.favorites}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" key="view" icon={<FileTextOutlined />}>查看</Button>,
                        <Button type="text" danger key="remove" icon={<HeartOutlined />}>取消收藏</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={item.type === 'classics' ? <BookOutlined /> : <ScanOutlined />} />}
                        title={item.title}
                        description={`收藏于 ${item.date}`}
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'classics',
              label: '经典',
              children: (
                <List
                  itemLayout="horizontal"
                  dataSource={userData.favorites.filter(item => item.type === 'classics')}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" key="view" icon={<FileTextOutlined />}>查看</Button>,
                        <Button type="text" danger key="remove" icon={<HeartOutlined />}>取消收藏</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<BookOutlined />} />}
                        title={item.title}
                        description={`收藏于 ${item.date}`}
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'ocr',
              label: 'OCR识别结果',
              children: (
                <List
                  itemLayout="horizontal"
                  dataSource={userData.favorites.filter(item => item.type === 'ocr')}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" key="view" icon={<FileTextOutlined />}>查看</Button>,
                        <Button type="text" danger key="remove" icon={<HeartOutlined />}>取消收藏</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<ScanOutlined />} />}
                        title={item.title}
                        description={`收藏于 ${item.date}`}
                      />
                    </List.Item>
                  )}
                />
              )
            }
          ]}
        />
      </Card>
    );
  };

  const renderSettingsTab = () => {
    return (
      <Card title="账户设置" className="settings-card">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Space direction="vertical" align="center">
            <Avatar size={64} icon={<UserOutlined />} />
            <Title level={4}>{userData.name}</Title>
            <Paragraph type="secondary">
              更多账户设置功能即将上线，敬请期待！
            </Paragraph>
            <Button type="primary" icon={<SettingOutlined />}>
              编辑个人信息
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <>
      <Head>
        <title>个人中心 - 儒智</title>
        <meta name="description" content="儒智APP - 个人学习中心" />
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
            selectedKeys={['user']}
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
              <Breadcrumb.Item>个人中心</Breadcrumb.Item>
            </Breadcrumb>
            
            <div className="user-center-container">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="user-tabs"
                type="card"
                tabPosition="left"
                items={[
                  {
                    key: 'profile',
                    label: <span><UserOutlined /> 个人资料</span>,
                    children: renderProfileTab(),
                  },
                  {
                    key: 'history',
                    label: <span><HistoryIcon /> 学习历史</span>,
                    children: renderHistoryTab(),
                  },
                  {
                    key: 'favorites',
                    label: <span><HeartOutlined /> 我的收藏</span>,
                    children: renderFavoritesTab(),
                  },
                  {
                    key: 'settings',
                    label: <span><SettingOutlined /> 账户设置</span>,
                    children: renderSettingsTab(),
                  },
                ]}
              />
            </div>
          </div>
        </Content>
        
        <Footer className="app-footer">
          儒智 ©{new Date().getFullYear()} - 让古代智慧在现代社会焕发新生
        </Footer>
      </Layout>
    </>
  );
} 