import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntdLayout, Menu, Drawer, Button, Avatar, Dropdown } from 'antd'
import { 
  HomeOutlined, 
  ScanOutlined, 
  MessageOutlined, 
  BookOutlined, 
  ShareAltOutlined,
  UserOutlined,
  MenuOutlined,
  SettingOutlined,
  TrophyOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import classNames from 'classnames'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import './index.css'

const { Header, Content, Footer } = AntdLayout
const { SubMenu } = Menu

interface LayoutProps {}

const Layout: React.FC<LayoutProps> = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  
  const { isMobile } = useAppStore()
  const { userInfo, isLoggedIn, logout } = useUserStore()

  // 导航菜单配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      path: '/'
    },
    {
      key: '/ocr',
      icon: <ScanOutlined />,
      label: '古籍识别',
      path: '/ocr'
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'AI对话',
      path: '/chat'
    },
    {
      key: '/classics',
      icon: <BookOutlined />,
      label: '经典库',
      path: '/classics'
    },
    {
      key: '/knowledge',
      icon: <ShareAltOutlined />,
      label: '知识图谱',
      path: '/knowledge'
    }
  ]

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'achievements',
      icon: <TrophyOutlined />,
      label: '我的成就',
      onClick: () => navigate('/achievements')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/profile?tab=settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout
    }
  ]

  const handleMenuClick = (item: any) => {
    navigate(item.path)
    setMobileMenuVisible(false)
  }

  const handleUserMenuClick = (item: any) => {
    if (item.onClick) {
      item.onClick()
    }
  }

  return (
    <AntdLayout className="ruzhi-layout">
      {/* 头部导航 */}
      <Header className="ruzhi-header">
        <div className="header-content">
          {/* Logo */}
          <motion.div 
            className="logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
          >
            <span className="logo-icon">🏛️</span>
            <span className="logo-text">儒智</span>
          </motion.div>

          {/* 桌面端导航菜单 */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              className="header-menu"
              items={menuItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => handleMenuClick(item)
              }))}
            />
          )}

          {/* 用户信息和操作 */}
          <div className="header-actions">
            {isLoggedIn ? (
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    const item = userMenuItems.find(i => i.key === key)
                    if (item) handleUserMenuClick(item)
                  }
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="user-info">
                  <Avatar 
                    src={userInfo?.avatar} 
                    icon={<UserOutlined />}
                    size="small"
                  />
                  <span className="username">{userInfo?.nickname || '用户'}</span>
                </div>
              </Dropdown>
            ) : (
              <Button 
                type="primary" 
                onClick={() => navigate('/profile')}
              >
                登录
              </Button>
            )}

            {/* 移动端菜单按钮 */}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuVisible(true)}
                className="mobile-menu-btn"
              />
            )}
          </div>
        </div>
      </Header>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="导航菜单"
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        className="mobile-drawer"
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item)
          }))}
        />
      </Drawer>

      {/* 主要内容区域 */}
      <Content className="ruzhi-content">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="content-wrapper"
        >
          <Outlet />
        </motion.div>
      </Content>

      {/* 底部 */}
      <Footer className="ruzhi-footer">
        <div className="footer-content">
          <div className="footer-info">
            <span className="footer-title">儒智 - 传统文化学习平台</span>
            <span className="footer-desc">探索中华文化的智慧宝库，与古代圣贤对话</span>
          </div>
          <div className="footer-links">
            <a href="/about" className="footer-link">关于我们</a>
            <a href="/privacy" className="footer-link">隐私政策</a>
            <a href="/terms" className="footer-link">使用条款</a>
            <a href="/contact" className="footer-link">联系我们</a>
          </div>
          <div className="footer-copyright">
            © 2024 儒智团队. All rights reserved.
          </div>
        </div>
      </Footer>
    </AntdLayout>
  )
}

export default Layout
