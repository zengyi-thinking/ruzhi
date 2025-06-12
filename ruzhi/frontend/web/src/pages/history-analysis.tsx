import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Spin, Button, Timeline, Tag, Progress, Statistic, Empty } from 'antd';
import { 
  BarChartOutlined, 
  BulbOutlined, 
  ClockCircleOutlined, 
  BookOutlined,
  MessageOutlined,
  TrophyOutlined,
  RocketOutlined,
  HeartOutlined
} from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import LearningPathPlanner from '../components/LearningPathPlanner';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import HistoryVisualization from '../components/HistoryVisualization';
import AIInsights from '../components/AIInsights';
import ConversationSummary from '../components/ConversationSummary';

const { TabPane } = Tabs;

interface UserStats {
  totalStudyTime: number;
  completedSessions: number;
  favoriteTopics: string[];
  learningStreak: number;
  knowledgePoints: number;
  conversationCount: number;
}

interface LearningInsight {
  type: 'strength' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

const HistoryAnalysisPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟数据
      setUserStats({
        totalStudyTime: 1250, // 分钟
        completedSessions: 45,
        favoriteTopics: ['论语', '孟子', '道德经', '易经'],
        learningStreak: 12,
        knowledgePoints: 2340,
        conversationCount: 28
      });

      setInsights([
        {
          type: 'strength',
          title: '儒家经典理解深入',
          description: '您在论语和孟子的学习中表现出色，理解深度超过85%的用户',
          confidence: 0.92,
          actionable: false
        },
        {
          type: 'improvement',
          title: '道家思想需要加强',
          description: '建议增加道德经的学习时间，当前理解程度有待提升',
          confidence: 0.78,
          actionable: true
        },
        {
          type: 'recommendation',
          title: '推荐学习《中庸》',
          description: '基于您的学习轨迹，《中庸》将是您下一个理想的学习目标',
          confidence: 0.85,
          actionable: true
        }
      ]);

      setAnalysisData({
        weeklyProgress: [
          { week: '第1周', study: 120, conversation: 8 },
          { week: '第2周', study: 150, conversation: 12 },
          { week: '第3周', study: 180, conversation: 15 },
          { week: '第4周', study: 200, conversation: 18 }
        ],
        topicDistribution: [
          { topic: '论语', percentage: 35, sessions: 16 },
          { topic: '孟子', percentage: 25, sessions: 11 },
          { topic: '道德经', percentage: 20, sessions: 9 },
          { topic: '易经', percentage: 15, sessions: 7 },
          { topic: '其他', percentage: 5, sessions: 2 }
        ]
      });
    } catch (error) {
      console.error('加载历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总学习时长"
              value={userStats?.totalStudyTime || 0}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="完成会话"
              value={userStats?.completedSessions || 0}
              suffix="次"
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="学习连续天数"
              value={userStats?.learningStreak || 0}
              suffix="天"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="知识积分"
              value={userStats?.knowledgePoints || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="学习轨迹可视化" extra={<BarChartOutlined />}>
            <HistoryVisualization data={analysisData} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="AI智能洞察" extra={<BulbOutlined />}>
            <AIInsights insights={insights} />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderRecommendationsTab = () => (
    <PersonalizedRecommendations 
      userStats={userStats}
      insights={insights}
      onRecommendationClick={(recommendation) => {
        console.log('点击推荐:', recommendation);
      }}
    />
  );

  const renderLearningPathTab = () => (
    <LearningPathPlanner 
      currentLevel={userStats?.knowledgePoints || 0}
      completedTopics={userStats?.favoriteTopics || []}
      onPathSelect={(path) => {
        console.log('选择学习路径:', path);
      }}
    />
  );

  const renderConversationSummaryTab = () => (
    <ConversationSummary 
      conversationCount={userStats?.conversationCount || 0}
      onViewDetails={(summary) => {
        console.log('查看对话详情:', summary);
      }}
    />
  );

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: '#666' }}>正在分析您的学习历史...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            <RocketOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            智能学习分析
          </h1>
          <p style={{ fontSize: 16, color: '#666', marginBottom: 0 }}>
            基于AI的个性化学习洞察与路径规划
          </p>
        </div>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                学习概览
              </span>
            } 
            key="overview"
          >
            {renderOverviewTab()}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <HeartOutlined />
                个性化推荐
              </span>
            } 
            key="recommendations"
          >
            {renderRecommendationsTab()}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <RocketOutlined />
                学习路径
              </span>
            } 
            key="learning-path"
          >
            {renderLearningPathTab()}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <MessageOutlined />
                对话总结
              </span>
            } 
            key="conversation-summary"
          >
            {renderConversationSummaryTab()}
          </TabPane>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default HistoryAnalysisPage;
