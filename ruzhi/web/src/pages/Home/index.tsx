import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography, 
  Space, 
  Statistic, 
  Calendar,
  Badge,
  Avatar,
  Divider,
  message
} from 'antd'
import { 
  ScanOutlined, 
  MessageOutlined, 
  BookOutlined, 
  ShareAltOutlined,
  TrophyOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  RightOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import dayjs from 'dayjs'

import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { getRecommendations, getDailyQuote } from '@/services/content'
import DailyQuote from './components/DailyQuote'
import CheckinCard from './components/CheckinCard'
import RecommendationCard from './components/RecommendationCard'
import FeatureCard from './components/FeatureCard'
import StatsOverview from './components/StatsOverview'
import './index.css'

const { Title, Text } = Typography

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate()
  const { userInfo, learningStats, updateStreak } = useUserStore()
  const { isMobile } = useAppStore()
  
  const [checkedIn, setCheckedIn] = useState(false)

  // 获取今日推荐
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery(
    'recommendations',
    () => getRecommendations(userInfo?.id),
    {
      enabled: !!userInfo,
      staleTime: 30 * 60 * 1000 // 30分钟
    }
  )

  // 获取每日一句
  const { data: dailyQuote, isLoading: quoteLoading } = useQuery(
    ['dailyQuote', dayjs().format('YYYY-MM-DD')],
    getDailyQuote,
    {
      staleTime: 24 * 60 * 60 * 1000 // 24小时
    }
  )

  // 功能模块配置
  const features = [
    {
      key: 'ocr',
      title: '古籍识别',
      description: '拍照识别古籍文字',
      icon: <ScanOutlined />,
      color: '#52c41a',
      path: '/ocr'
    },
    {
      key: 'chat',
      title: 'AI对话',
      description: '与历史人物对话',
      icon: <MessageOutlined />,
      color: '#1890ff',
      path: '/chat'
    },
    {
      key: 'classics',
      title: '经典库',
      description: '阅读传统经典',
      icon: <BookOutlined />,
      color: '#722ed1',
      path: '/classics'
    },
    {
      key: 'knowledge',
      title: '知识图谱',
      description: '探索文化脉络',
      icon: <ShareAltOutlined />,
      color: '#fa8c16',
      path: '/knowledge'
    }
  ]

  // 检查今日是否已打卡
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const lastCheckin = learningStats.lastCheckinDate
    setCheckedIn(lastCheckin === today)
  }, [learningStats.lastCheckinDate])

  // 处理打卡
  const handleCheckin = () => {
    if (checkedIn) return
    
    updateStreak()
    setCheckedIn(true)
    message.success(`打卡成功！连续学习 ${learningStats.streak + 1} 天`)
  }

  // 处理功能点击
  const handleFeatureClick = (feature: any) => {
    navigate(feature.path)
  }

  // 处理推荐内容点击
  const handleRecommendationClick = (item: any) => {
    if (item.type === 'classic') {
      navigate(`/classics/${item.bookId}`)
    } else if (item.type === 'chat') {
      navigate('/chat', { state: { character: item.character } })
    }
  }

  return (
    <div className="home-container">
      {/* 欢迎区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="welcome-card">
          <Row align="middle" justify="space-between">
            <Col>
              <Space direction="vertical" size={4}>
                <Title level={3} style={{ margin: 0 }}>
                  {userInfo ? `欢迎回来，${userInfo.nickname}` : '欢迎来到儒智'}
                </Title>
                <Text type="secondary">
                  {dayjs().format('YYYY年MM月DD日 dddd')} · 探索传统文化的智慧
                </Text>
              </Space>
            </Col>
            {userInfo && (
              <Col>
                <Avatar size={64} src={userInfo.avatar}>
                  {userInfo.nickname?.charAt(0)}
                </Avatar>
              </Col>
            )}
          </Row>
        </Card>
      </motion.div>

      {/* 学习统计概览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <StatsOverview stats={learningStats} />
      </motion.div>

      {/* 每日一句 */}
      {dailyQuote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <DailyQuote quote={dailyQuote} loading={quoteLoading} />
        </motion.div>
      )}

      {/* 学习打卡 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <CheckinCard
          streak={learningStats.streak}
          checkedIn={checkedIn}
          onCheckin={handleCheckin}
        />
      </motion.div>

      {/* 功能模块 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card title="功能导航" className="features-card">
          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col 
                key={feature.key} 
                xs={12} 
                sm={12} 
                md={6} 
                lg={6}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <FeatureCard
                    feature={feature}
                    onClick={() => handleFeatureClick(feature)}
                  />
                </motion.div>
              </Col>
            ))}
          </Row>
        </Card>
      </motion.div>

      {/* 今日推荐 */}
      {recommendations && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card 
            title="今日推荐" 
            extra={
              <Button 
                type="link" 
                icon={<RightOutlined />}
                onClick={() => navigate('/classics')}
              >
                更多
              </Button>
            }
            className="recommendations-card"
          >
            <Row gutter={[16, 16]}>
              {recommendations.slice(0, isMobile ? 2 : 4).map((item: any, index: number) => (
                <Col key={item.id} xs={24} sm={12} md={12} lg={6}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <RecommendationCard
                      item={item}
                      onClick={() => handleRecommendationClick(item)}
                    />
                  </motion.div>
                </Col>
              ))}
            </Row>
          </Card>
        </motion.div>
      )}

      {/* 最近活动 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card title="最近活动" className="recent-activity-card">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {learningStats.achievements.length > 0 && (
              <div className="activity-item">
                <TrophyOutlined style={{ color: '#faad14' }} />
                <Text>获得了新成就：{learningStats.achievements[learningStats.achievements.length - 1]}</Text>
                <Text type="secondary">{dayjs().format('MM-DD HH:mm')}</Text>
              </div>
            )}
            
            {learningStats.favoriteBooks.length > 0 && (
              <div className="activity-item">
                <BookOutlined style={{ color: '#722ed1' }} />
                <Text>收藏了经典著作</Text>
                <Text type="secondary">{dayjs().subtract(1, 'day').format('MM-DD HH:mm')}</Text>
              </div>
            )}
            
            {learningStats.streak > 0 && (
              <div className="activity-item">
                <FireOutlined style={{ color: '#f5222d' }} />
                <Text>连续学习 {learningStats.streak} 天</Text>
                <Text type="secondary">保持良好习惯</Text>
              </div>
            )}
            
            {(!learningStats.achievements.length && !learningStats.favoriteBooks.length && !learningStats.streak) && (
              <div className="empty-activity">
                <Text type="secondary">开始您的学习之旅，记录美好时光</Text>
              </div>
            )}
          </Space>
        </Card>
      </motion.div>
    </div>
  )
}

export default Home
