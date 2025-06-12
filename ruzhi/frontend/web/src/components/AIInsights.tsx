import React, { useState } from 'react';
import { Card, List, Tag, Progress, Button, Modal, Typography, Space, Alert } from 'antd';
import { 
  BulbOutlined, 
  TrophyOutlined, 
  ExclamationCircleOutlined, 
  RocketOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface LearningInsight {
  type: 'strength' | 'improvement' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

interface Props {
  insights: LearningInsight[];
}

const AIInsights: React.FC<Props> = ({ insights }) => {
  const [selectedInsight, setSelectedInsight] = useState<LearningInsight | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return <TrophyOutlined style={{ color: '#52c41a' }} />;
      case 'improvement':
        return <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />;
      case 'recommendation':
        return <RocketOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BulbOutlined />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'success';
      case 'improvement':
        return 'warning';
      case 'recommendation':
        return 'processing';
      default:
        return 'default';
    }
  };

  const getInsightLabel = (type: string) => {
    switch (type) {
      case 'strength':
        return '优势';
      case 'improvement':
        return '改进';
      case 'recommendation':
        return '推荐';
      default:
        return '洞察';
    }
  };

  const handleInsightClick = (insight: LearningInsight) => {
    setSelectedInsight(insight);
    setModalVisible(true);
  };

  const generateActionPlan = (insight: LearningInsight) => {
    const actionPlans = {
      strength: [
        '继续保持当前的学习节奏',
        '可以尝试更深入的相关主题',
        '考虑分享经验帮助其他学习者'
      ],
      improvement: [
        '制定针对性的学习计划',
        '增加相关主题的学习时间',
        '寻找更多学习资源和材料',
        '考虑与AI导师进行专项对话'
      ],
      recommendation: [
        '探索推荐的新学习内容',
        '设定学习目标和时间表',
        '准备相关的背景知识',
        '开始循序渐进的学习'
      ]
    };

    return actionPlans[insight.type] || [];
  };

  const renderDetailModal = () => (
    <Modal
      title={
        <Space>
          {selectedInsight && getInsightIcon(selectedInsight.type)}
          <span>AI洞察详情</span>
        </Space>
      }
      open={modalVisible}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button key="close" onClick={() => setModalVisible(false)}>
          关闭
        </Button>,
        selectedInsight?.actionable && (
          <Button key="action" type="primary" onClick={() => setModalVisible(false)}>
            制定行动计划
          </Button>
        )
      ]}
      width={600}
    >
      {selectedInsight && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color={getInsightColor(selectedInsight.type)} style={{ marginBottom: 8 }}>
              {getInsightLabel(selectedInsight.type)}
            </Tag>
            <h3 style={{ margin: 0 }}>{selectedInsight.title}</h3>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>置信度：</Text>
            <Progress 
              percent={Math.round(selectedInsight.confidence * 100)} 
              size="small" 
              style={{ width: 200, marginLeft: 8 }}
              strokeColor={selectedInsight.confidence > 0.8 ? '#52c41a' : '#fa8c16'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Paragraph>{selectedInsight.description}</Paragraph>
          </div>

          {selectedInsight.actionable && (
            <div>
              <Alert
                message="建议行动计划"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {generateActionPlan(selectedInsight).map((action, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                }
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  if (!insights || insights.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
        <BulbOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <p>AI正在分析您的学习数据...</p>
      </div>
    );
  }

  return (
    <div>
      <List
        dataSource={insights}
        renderItem={(insight, index) => (
          <List.Item
            key={index}
            style={{ 
              cursor: 'pointer',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 8,
              border: '1px solid #f0f0f0',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleInsightClick(insight)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fafafa';
              e.currentTarget.style.borderColor = '#d9d9d9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#f0f0f0';
            }}
          >
            <List.Item.Meta
              avatar={getInsightIcon(insight.type)}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{insight.title}</span>
                  <div>
                    <Tag color={getInsightColor(insight.type)} size="small">
                      {getInsightLabel(insight.type)}
                    </Tag>
                    {insight.actionable && (
                      <Tag color="blue" size="small">
                        可执行
                      </Tag>
                    )}
                  </div>
                </div>
              }
              description={
                <div>
                  <Paragraph 
                    ellipsis={{ rows: 2 }} 
                    style={{ marginBottom: 8, color: '#666' }}
                  >
                    {insight.description}
                  </Paragraph>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        置信度：
                      </Text>
                      <Progress 
                        percent={Math.round(insight.confidence * 100)} 
                        size="small" 
                        style={{ width: 80, marginLeft: 4 }}
                        strokeColor={insight.confidence > 0.8 ? '#52c41a' : '#fa8c16'}
                        showInfo={false}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                        {Math.round(insight.confidence * 100)}%
                      </Text>
                    </div>
                    <Button type="link" size="small" style={{ padding: 0 }}>
                      查看详情 →
                    </Button>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {renderDetailModal()}

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          <Text strong style={{ color: '#52c41a' }}>AI分析完成</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          基于您的学习历史，AI已生成 {insights.length} 条个性化洞察。点击查看详情并获取行动建议。
        </Text>
      </div>
    </div>
  );
};

export default AIInsights;
