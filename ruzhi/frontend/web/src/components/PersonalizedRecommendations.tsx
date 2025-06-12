import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Rate, Progress, Avatar, Typography, Space, Divider } from 'antd';
import { 
  BookOutlined, 
  MessageOutlined, 
  BulbOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  RightOutlined,
  HeartOutlined
} from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

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

interface Recommendation {
  id: string;
  type: 'classic' | 'conversation' | 'concept' | 'practice';
  title: string;
  description: string;
  difficulty: number;
  estimatedTime: number;
  relevanceScore: number;
  tags: string[];
  reason: string;
  character?: string;
  preview?: string;
}

interface Props {
  userStats: UserStats | null;
  insights: LearningInsight[];
  onRecommendationClick: (recommendation: Recommendation) => void;
}

const PersonalizedRecommendations: React.FC<Props> = ({ 
  userStats, 
  insights, 
  onRecommendationClick 
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    generateRecommendations();
  }, [userStats, insights]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    // 模拟AI推荐算法
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        type: 'classic',
        title: '《中庸》深度解读',
        description: '基于您对论语和孟子的深入理解，《中庸》将是您儒家思想学习的完美进阶',
        difficulty: 4,
        estimatedTime: 45,
        relevanceScore: 0.95,
        tags: ['儒家', '经典', '进阶'],
        reason: '与您已掌握的儒家核心思想高度相关',
        preview: '中庸者，不偏不倚，无过不及，而平常之理，不易之道也...'
      },
      {
        id: '2',
        type: 'conversation',
        title: '与朱熹对话：理学思想',
        description: '探讨宋代理学的核心观点，深化对儒家哲学的理解',
        difficulty: 5,
        estimatedTime: 30,
        relevanceScore: 0.88,
        tags: ['理学', '哲学', '对话'],
        reason: '您在儒家思想方面表现出色，可以挑战更高层次的哲学对话',
        character: '朱熹',
        preview: '理者，天下之公理；气者，天下之公器...'
      },
      {
        id: '3',
        type: 'concept',
        title: '道德经核心概念梳理',
        description: '系统学习道家思想的核心概念，弥补您在道家学习上的不足',
        difficulty: 3,
        estimatedTime: 25,
        relevanceScore: 0.82,
        tags: ['道家', '概念', '基础'],
        reason: 'AI分析显示您需要加强道家思想的学习',
        preview: '道可道，非常道；名可名，非常名...'
      },
      {
        id: '4',
        type: 'practice',
        title: '古文阅读理解练习',
        description: '通过实际练习提升古文阅读能力，巩固已学知识',
        difficulty: 3,
        estimatedTime: 20,
        relevanceScore: 0.75,
        tags: ['练习', '古文', '巩固'],
        reason: '实践练习有助于巩固您的学习成果',
        preview: '精选经典古文片段，配合详细解析...'
      }
    ];

    setRecommendations(mockRecommendations);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'classic':
        return <BookOutlined />;
      case 'conversation':
        return <MessageOutlined />;
      case 'concept':
        return <BulbOutlined />;
      case 'practice':
        return <StarOutlined />;
      default:
        return <BookOutlined />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'classic':
        return '经典学习';
      case 'conversation':
        return 'AI对话';
      case 'concept':
        return '概念学习';
      case 'practice':
        return '实践练习';
      default:
        return '推荐内容';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'classic':
        return '#722ed1';
      case 'conversation':
        return '#52c41a';
      case 'concept':
        return '#1890ff';
      case 'practice':
        return '#fa8c16';
      default:
        return '#666';
    }
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return '入门';
    if (difficulty <= 3) return '基础';
    if (difficulty <= 4) return '进阶';
    return '高级';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return '#52c41a';
    if (difficulty <= 3) return '#1890ff';
    if (difficulty <= 4) return '#fa8c16';
    return '#f5222d';
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === selectedCategory);

  const categories = [
    { key: 'all', label: '全部推荐', icon: <HeartOutlined /> },
    { key: 'classic', label: '经典学习', icon: <BookOutlined /> },
    { key: 'conversation', label: 'AI对话', icon: <MessageOutlined /> },
    { key: 'concept', label: '概念学习', icon: <BulbOutlined /> },
    { key: 'practice', label: '实践练习', icon: <StarOutlined /> }
  ];

  return (
    <div>
      {/* 推荐统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                {recommendations.length}
              </Title>
              <Text type="secondary">个性化推荐</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {Math.round((recommendations.reduce((sum, rec) => sum + rec.relevanceScore, 0) / recommendations.length) * 100)}%
              </Title>
              <Text type="secondary">平均匹配度</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>
                {Math.round(recommendations.reduce((sum, rec) => sum + rec.estimatedTime, 0) / recommendations.length)}
              </Title>
              <Text type="secondary">平均时长(分钟)</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分类筛选 */}
      <div style={{ marginBottom: 24 }}>
        <Space wrap>
          {categories.map(category => (
            <Button
              key={category.key}
              type={selectedCategory === category.key ? 'primary' : 'default'}
              icon={category.icon}
              onClick={() => setSelectedCategory(category.key)}
              style={{ marginBottom: 8 }}
            >
              {category.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* 推荐列表 */}
      <Row gutter={[16, 16]}>
        {filteredRecommendations.map(recommendation => (
          <Col xs={24} lg={12} key={recommendation.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button 
                  type="primary" 
                  icon={<RightOutlined />}
                  onClick={() => onRecommendationClick(recommendation)}
                >
                  开始学习
                </Button>
              ]}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Space>
                    {getTypeIcon(recommendation.type)}
                    <Text strong style={{ fontSize: 16 }}>
                      {recommendation.title}
                    </Text>
                  </Space>
                  <Tag color={getTypeColor(recommendation.type)}>
                    {getTypeLabel(recommendation.type)}
                  </Tag>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Text type="secondary" style={{ marginRight: 16 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {recommendation.estimatedTime}分钟
                  </Text>
                  <Tag color={getDifficultyColor(recommendation.difficulty)}>
                    {getDifficultyLabel(recommendation.difficulty)}
                  </Tag>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>匹配度：</Text>
                  <Progress 
                    percent={Math.round(recommendation.relevanceScore * 100)} 
                    size="small" 
                    style={{ width: 100, marginLeft: 8 }}
                    strokeColor="#52c41a"
                  />
                </div>
              </div>

              <Paragraph style={{ marginBottom: 12, color: '#666' }}>
                {recommendation.description}
              </Paragraph>

              {recommendation.preview && (
                <div style={{ marginBottom: 12, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                    "{recommendation.preview}"
                  </Text>
                </div>
              )}

              {recommendation.character && (
                <div style={{ marginBottom: 12 }}>
                  <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
                  <Text type="secondary">与 {recommendation.character} 对话</Text>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <Space wrap>
                  {recommendation.tags.map(tag => (
                    <Tag key={tag} size="small">{tag}</Tag>
                  ))}
                </Space>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {recommendation.reason}
                </Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {filteredRecommendations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <HeartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>暂无该类型的推荐内容</p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
