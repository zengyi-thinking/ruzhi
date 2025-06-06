import React, { ReactNode } from 'react';
import { 
  Layout, 
  Typography, 
  Menu,
  Breadcrumb
} from 'antd';
import { 
  BookOutlined, 
  ReadOutlined,
  HomeOutlined,
  ScanOutlined,
  QuestionCircleOutlined,
  HistoryOutlined,
  UserOutlined
} from '@ant-design/icons';
import Head from 'next/head';
import { useRouter } from 'next/router';

const { Title } = Typography;
const { Header, Content, Footer } = Layout;

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  selectedKey: string;
  breadcrumbs?: BreadcrumbItem[];
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title, 
  description = '儒智APP - 融合传统儒家经典与现代科技',
  selectedKey,
  breadcrumbs = []
}) => {
  const router = useRouter();

  const handleMenuClick = (key: string) => {
    if (key === 'home') {
      router.push('/');
    } else {
      router.push(`/${key}`);
    }
  };

  return (
    <>
      <Head>
        <title>{title} - 儒智</title>
        <meta name="description" content={description} />
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
            selectedKeys={[selectedKey]}
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
            {breadcrumbs.length > 0 && (
              <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                  <a onClick={() => router.push('/')}>首页</a>
                </Breadcrumb.Item>
                {breadcrumbs.map((item, index) => (
                  <Breadcrumb.Item key={index}>
                    {item.href ? (
                      <a onClick={() => router.push(item.href!)}>{item.title}</a>
                    ) : (
                      item.title
                    )}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            )}
            
            {children}
          </div>
        </Content>
        
        <Footer className="app-footer">
          儒智 ©{new Date().getFullYear()} - 让古代智慧在现代社会焕发新生
        </Footer>
      </Layout>
    </>
  );
};

export default AppLayout; 