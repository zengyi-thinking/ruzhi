import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Modal, Typography, Space, Timeline, Collapse, Row, Col, Statistic } from 'antd';
import { 
  MessageOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  BulbOutlined,
  BookOutlined,
  StarOutlined,
  EyeOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface ConversationSummary {
  id: string;
  character: string;
  topic: string;
  date: string;
  duration: number;
  messageCount: number;
  keyInsights: string[];
  knowledgePoints: string[];
  emotionalTone: 'positive' | 'neutral' | 'thoughtful';
  learningOutcomes: string[];
  difficulty: number;
  satisfaction: number;
}

interface Props {
  conversationCount: number;
  onViewDetails: (summary: ConversationSummary) => void;
}

const ConversationSummaryComponent: React.FC<Props> = ({ 
  conversationCount, 
  onViewDetails 
}) => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<ConversationSummary | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversationSummaries();
  }, [conversationCount]);

  const loadConversationSummaries = async () => {
    setLoading(true);
    
    // 模拟AI生成对话总结
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockSummaries: ConversationSummary[] = [
      {
        id: '1',
        character: '孔子',
        topic: '仁爱思想的现代意义',
        date: '2024-01-15',
        duration: 25,
        messageCount: 18,
        keyInsights: [
          '仁爱是儒家思想的核心，强调人与人之间的关爱',
          '现代社会中仁爱思想体现在社会责任和公民意识',
          '个人修养与社会和谐的关系密不可分'
        ],
        knowledgePoints: ['仁', '爱人', '社会责任', '个人修养'],
        emotionalTone: 'thoughtful',
        learningOutcomes: [
          '深入理解仁爱思想的内涵',
          '掌握儒家核心价值观',
          '学会将古代智慧应用于现代生活'
        ],
        difficulty: 4,
        satisfaction: 9
      },
      {
        id: '2',
        character: '老子',
        topic: '道法自然的生活哲学',
        date: '2024-01-12',
        duration: 30,
        messageCount: 22,
        keyInsights: [
          '道法自然强调顺应自然规律',
          '无为而治是一种智慧的管理方式',
          '简朴生活有助于内心平静'
        ],
        knowledgePoints: ['道', '自然', '无为', '简朴'],
        emotionalTone: 'positive',
        learningOutcomes: [
          '理解道家的自然观',
          '学习无为而治的智慧',
          '培养简朴的生活态度'
        ],
        difficulty: 3,
        satisfaction: 8
      },
      {
        id: '3',
        character: '孟子',
        topic: '性善论与道德教育',
        date: '2024-01-10',
        duration: 20,
        messageCount: 15,
        keyInsights: [
          '人性本善是孟子思想的基础',
          '教育的目的是唤醒人的善性',
          '环境对人性发展有重要影响'
        ],
        knowledgePoints: ['性善论', '道德教育', '环境影响'],
        emotionalTone: 'thoughtful',
        learningOutcomes: [
          '理解性善论的哲学基础',
          '认识教育的本质意义',
          '思考环境与人性的关系'
        ],
        difficulty: 4,
        satisfaction: 9
      }
    ];

    setSummaries(mockSummaries);
    setLoading(false);
  };

  const getEmotionalToneColor = (tone: string) => {
    switch (tone) {
      case 'positive': return '#52c41a';
      case 'thoughtful': return '#1890ff';
      case 'neutral': return '#666';
      default: return '#666';
    }
  };

  const getEmotionalToneLabel = (tone: string) => {
    switch (tone) {
      case 'positive': return '积极';
      case 'thoughtful': return '深思';
      case 'neutral': return '中性';
      default: return '未知';
    }
  };

  const handleViewDetails = (summary: ConversationSummary) => {
    setSelectedSummary(summary);
    setModalVisible(true);
    onViewDetails(summary);
  };

  const renderDetailModal = () => (
    <Modal
      title={
        <Space>
          <MessageOutlined style={{ color: '#1890ff' }} />
          <span>对话详细总结</span>
        </Space>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="download" icon={<DownloadOutlined />}>
          导出总结
        </Button>,
        <Button key="share" icon={<ShareAltOutlined />}>
          分享
        </Button>,
        <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
          关闭
        </Button>
      ]}
      width={800}
    >
      {selectedSummary && (
        <div>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic 
                title="对话时长" 
                value={selectedSummary.duration} 
                suffix="分钟"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="消息数量" 
                value={selectedSummary.messageCount} 
                prefix={<MessageOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="难度等级" 
                value={selectedSummary.difficulty} 
                suffix="/ 5"
                prefix={<StarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="满意度" 
                value={selectedSummary.satisfaction} 
                suffix="/ 10"
                prefix={<StarOutlined />}
              />
            </Col>
          </Row>

          <Collapse defaultActiveKey={['insights', 'knowledge', 'outcomes']}>
            <Panel 
              header={
                <Space>
                  <BulbOutlined />
                  <span>核心洞察</span>
                </Space>
              } 
              key="insights"
            >
              <Timeline>
                {selectedSummary.keyInsights.map((insight, index) => (
                  <Timeline.Item key={index} color="blue">
                    <Text>{insight}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Panel>

            <Panel 
              header={
                <Space>
                  <BookOutlined />
                  <span>知识要点</span>
                </Space>
              } 
              key="knowledge"
            >
              <Space wrap>
                {selectedSummary.knowledgePoints.map(point => (
                  <Tag key={point} color="blue" style={{ marginBottom: 8 }}>
                    {point}
                  </Tag>
                ))}
              </Space>
            </Panel>

            <Panel 
              header={
                <Space>
                  <StarOutlined />
                  <span>学习成果</span>
                </Space>
              } 
              key="outcomes"
            >
              <ul style={{ marginBottom: 0 }}>
                {selectedSummary.learningOutcomes.map((outcome, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    <Text>{outcome}</Text>
                  </li>
                ))}
              </ul>
            </Panel>
          </Collapse>

          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
            <Text strong style={{ color: '#52c41a' }}>AI总结：</Text>
            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
              本次与{selectedSummary.character}的对话围绕"{selectedSummary.topic}"展开，
              对话氛围{getEmotionalToneLabel(selectedSummary.emotionalTone)}，
              您在{selectedSummary.knowledgePoints.length}个核心概念上有了深入理解。
              建议继续深入学习相关主题，巩固学习成果。
            </Paragraph>
          </div>
        </div>
      )}
    </Modal>
  );

  const calculateAverageStats = () => {
    if (summaries.length === 0) return { avgDuration: 0, avgSatisfaction: 0, totalMessages: 0 };
    
    const avgDuration = Math.round(summaries.reduce((sum, s) => sum + s.duration, 0) / summaries.length);
    const avgSatisfaction = Math.round(summaries.reduce((sum, s) => sum + s.satisfaction, 0) / summaries.length * 10) / 10;
    const totalMessages = summaries.reduce((sum, s) => sum + s.messageCount, 0);
    
    return { avgDuration, avgSatisfaction, totalMessages };
  };

  const stats = calculateAverageStats();

  return (
    <div>
      {/* 统计概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总对话次数"
              value={summaries.length}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="平均时长"
              value={stats.avgDuration}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="总消息数"
              value={stats.totalMessages}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic
              title="平均满意度"
              value={stats.avgSatisfaction}
              suffix="/ 10"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 对话列表 */}
      <List
        dataSource={summaries}
        renderItem={(summary) => (
          <List.Item
            key={summary.id}
            actions={[
              <Button 
                type="link" 
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(summary)}
              >
                查看详情
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>与 {summary.character} 对话：{summary.topic}</span>
                  <div>
                    <Tag color={getEmotionalToneColor(summary.emotionalTone)}>
                      {getEmotionalToneLabel(summary.emotionalTone)}
                    </Tag>
                    <Tag color="blue">
                      {summary.satisfaction}/10
                    </Tag>
                  </div>
                </div>
              }
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Space>
                      <Text type="secondary">
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {summary.date}
                      </Text>
                      <Text type="secondary">
                        {summary.duration}分钟
                      </Text>
                      <Text type="secondary">
                        {summary.messageCount}条消息
                      </Text>
                    </Space>
                  </div>
                  
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ marginRight: 8 }}>核心洞察：</Text>
                    <Text type="secondary">
                      {summary.keyInsights[0]}
                      {summary.keyInsights.length > 1 && ` 等${summary.keyInsights.length}条`}
                    </Text>
                  </div>

                  <div>
                    <Text strong style={{ marginRight: 8 }}>知识要点：</Text>
                    <Space wrap>
                      {summary.knowledgePoints.slice(0, 3).map(point => (
                        <Tag key={point} size="small">{point}</Tag>
                      ))}
                      {summary.knowledgePoints.length > 3 && (
                        <Tag size="small">+{summary.knowledgePoints.length - 3}</Tag>
                      )}
                    </Space>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {summaries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <MessageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <p>暂无对话记录</p>
        </div>
      )}

      {renderDetailModal()}
    </div>
  );
};

export default ConversationSummaryComponent;
