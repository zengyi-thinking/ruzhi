import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Tag, Progress, Timeline, Row, Col, Typography, Space, Modal, Alert } from 'antd';
import { 
  RocketOutlined, 
  BookOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StarOutlined,
  BulbOutlined,
  FireOutlined
} from '@ant-design/icons';

const { Step } = Steps;
const { Text, Title, Paragraph } = Typography;

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedWeeks: number;
  modules: LearningModule[];
  prerequisites: string[];
  outcomes: string[];
  popularity: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'conversation' | 'practice' | 'assessment';
  estimatedHours: number;
  completed: boolean;
  locked: boolean;
  resources: string[];
}

interface Props {
  currentLevel: number;
  completedTopics: string[];
  onPathSelect: (path: LearningPath) => void;
}

const LearningPathPlanner: React.FC<Props> = ({ 
  currentLevel, 
  completedTopics, 
  onPathSelect 
}) => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateLearningPaths();
  }, [currentLevel, completedTopics]);

  const generateLearningPaths = async () => {
    setLoading(true);
    
    // 模拟AI生成学习路径
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const paths: LearningPath[] = [
      {
        id: 'confucian-classics',
        title: '儒家经典深度学习路径',
        description: '系统学习儒家核心经典，从论语到四书五经的完整学习体系',
        difficulty: 'intermediate',
        estimatedWeeks: 12,
        prerequisites: ['基础古文阅读', '中国历史概况'],
        outcomes: ['深入理解儒家思想', '掌握经典原文', '培养人文素养'],
        popularity: 95,
        modules: [
          {
            id: 'module-1',
            title: '论语精读',
            description: '深入学习孔子言行录，理解儒家核心思想',
            type: 'reading',
            estimatedHours: 20,
            completed: completedTopics.includes('论语'),
            locked: false,
            resources: ['论语原文', '注释解读', 'AI导师对话']
          },
          {
            id: 'module-2',
            title: '孟子思想探讨',
            description: '学习孟子的仁政思想和性善论',
            type: 'conversation',
            estimatedHours: 15,
            completed: completedTopics.includes('孟子'),
            locked: !completedTopics.includes('论语'),
            resources: ['孟子选读', '思想对比', '历史人物对话']
          },
          {
            id: 'module-3',
            title: '中庸之道',
            description: '理解中庸的哲学内涵和实践意义',
            type: 'reading',
            estimatedHours: 12,
            completed: false,
            locked: !completedTopics.includes('孟子'),
            resources: ['中庸原文', '哲学解析', '现代应用']
          },
          {
            id: 'module-4',
            title: '综合实践',
            description: '运用所学知识进行综合分析和实践',
            type: 'practice',
            estimatedHours: 8,
            completed: false,
            locked: true,
            resources: ['案例分析', '写作练习', '思辨讨论']
          }
        ]
      },
      {
        id: 'taoist-philosophy',
        title: '道家哲学入门路径',
        description: '从道德经开始，探索道家思想的深邃智慧',
        difficulty: 'beginner',
        estimatedWeeks: 8,
        prerequisites: ['基础哲学概念'],
        outcomes: ['理解道家核心思想', '掌握辩证思维', '提升人生智慧'],
        popularity: 78,
        modules: [
          {
            id: 'tao-1',
            title: '道德经导读',
            description: '学习老子的道家思想精髓',
            type: 'reading',
            estimatedHours: 16,
            completed: completedTopics.includes('道德经'),
            locked: false,
            resources: ['道德经原文', '现代解读', '哲学思辨']
          },
          {
            id: 'tao-2',
            title: '庄子逍遥游',
            description: '体验庄子的自由哲学和人生态度',
            type: 'conversation',
            estimatedHours: 12,
            completed: false,
            locked: !completedTopics.includes('道德经'),
            resources: ['庄子选读', '寓言故事', '人生哲理']
          }
        ]
      },
      {
        id: 'comprehensive-culture',
        title: '中华文化综合学习路径',
        description: '跨越儒道佛三家，全面了解中华传统文化',
        difficulty: 'advanced',
        estimatedWeeks: 20,
        prerequisites: ['儒家基础', '道家基础', '佛学概念'],
        outcomes: ['融会贯通三家思想', '形成文化认知体系', '提升文化自信'],
        popularity: 88,
        modules: [
          {
            id: 'comp-1',
            title: '三家思想比较',
            description: '比较分析儒道佛三家的异同',
            type: 'conversation',
            estimatedHours: 25,
            completed: false,
            locked: completedTopics.length < 3,
            resources: ['比较哲学', '思想对话', '文化融合']
          }
        ]
      }
    ];

    setLearningPaths(paths);
    setLoading(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#52c41a';
      case 'intermediate': return '#1890ff';
      case 'advanced': return '#f5222d';
      default: return '#666';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '入门';
      case 'intermediate': return '进阶';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOutlined />;
      case 'conversation': return <PlayCircleOutlined />;
      case 'practice': return <StarOutlined />;
      case 'assessment': return <TrophyOutlined />;
      default: return <BookOutlined />;
    }
  };

  const calculateProgress = (modules: LearningModule[]) => {
    const completed = modules.filter(m => m.completed).length;
    return Math.round((completed / modules.length) * 100);
  };

  const handlePathSelect = (path: LearningPath) => {
    setSelectedPath(path);
    setModalVisible(true);
  };

  const renderPathDetail = () => (
    <Modal
      title={
        <Space>
          <RocketOutlined style={{ color: '#1890ff' }} />
          <span>学习路径详情</span>
        </Space>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setModalVisible(false)}>
          取消
        </Button>,
        <Button 
          key="select" 
          type="primary" 
          onClick={() => {
            if (selectedPath) {
              onPathSelect(selectedPath);
              setModalVisible(false);
            }
          }}
        >
          选择此路径
        </Button>
      ]}
      width={800}
    >
      {selectedPath && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>{selectedPath.title}</Title>
            <Paragraph>{selectedPath.description}</Paragraph>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Text strong>难度等级：</Text>
                <Tag color={getDifficultyColor(selectedPath.difficulty)}>
                  {getDifficultyLabel(selectedPath.difficulty)}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>预计时长：</Text>
                <Text>{selectedPath.estimatedWeeks} 周</Text>
              </Col>
              <Col span={8}>
                <Text strong>受欢迎度：</Text>
                <Text>{selectedPath.popularity}%</Text>
              </Col>
            </Row>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>学习模块</Title>
            <Steps direction="vertical" size="small">
              {selectedPath.modules.map((module, index) => (
                <Step
                  key={module.id}
                  title={module.title}
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 8 }}>{module.description}</Paragraph>
                      <Space>
                        <Tag icon={getModuleIcon(module.type)}>
                          {module.type === 'reading' ? '阅读' : 
                           module.type === 'conversation' ? '对话' :
                           module.type === 'practice' ? '实践' : '评估'}
                        </Tag>
                        <Tag icon={<ClockCircleOutlined />}>
                          {module.estimatedHours}小时
                        </Tag>
                        {module.completed && <Tag color="success">已完成</Tag>}
                        {module.locked && <Tag color="default">未解锁</Tag>}
                      </Space>
                    </div>
                  }
                  status={module.completed ? 'finish' : module.locked ? 'wait' : 'process'}
                  icon={module.completed ? <CheckCircleOutlined /> : getModuleIcon(module.type)}
                />
              ))}
            </Steps>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>前置要求</Title>
                <Space wrap>
                  {selectedPath.prerequisites.map(req => (
                    <Tag key={req} color="blue">{req}</Tag>
                  ))}
                </Space>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>学习成果</Title>
                <ul style={{ marginBottom: 0 }}>
                  {selectedPath.outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );

  return (
    <div>
      <Alert
        message="AI智能路径规划"
        description="基于您的学习历史和能力水平，AI为您推荐最适合的学习路径"
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {learningPaths.map(path => (
          <Col xs={24} lg={8} key={path.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Button 
                  type="primary" 
                  icon={<RocketOutlined />}
                  onClick={() => handlePathSelect(path)}
                >
                  查看详情
                </Button>
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {path.title}
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FireOutlined style={{ color: '#fa8c16', marginRight: 4 }} />
                    <Text type="secondary">{path.popularity}%</Text>
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color={getDifficultyColor(path.difficulty)}>
                      {getDifficultyLabel(path.difficulty)}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />}>
                      {path.estimatedWeeks} 周
                    </Tag>
                  </Space>
                </div>
              </div>

              <Paragraph style={{ marginBottom: 16, color: '#666' }}>
                {path.description}
              </Paragraph>

              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>学习进度</Text>
                <Progress 
                  percent={calculateProgress(path.modules)} 
                  size="small"
                  strokeColor="#52c41a"
                />
              </div>

              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>包含模块</Text>
                <div style={{ maxHeight: 100, overflowY: 'auto' }}>
                  {path.modules.map(module => (
                    <div key={module.id} style={{ marginBottom: 4 }}>
                      <Space size="small">
                        {getModuleIcon(module.type)}
                        <Text 
                          style={{ 
                            fontSize: 12,
                            color: module.completed ? '#52c41a' : module.locked ? '#ccc' : '#666'
                          }}
                        >
                          {module.title}
                        </Text>
                        {module.completed && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />}
                      </Space>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {renderPathDetail()}
    </div>
  );
};

export default LearningPathPlanner;
