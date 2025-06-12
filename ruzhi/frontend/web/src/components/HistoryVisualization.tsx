import React, { useState } from 'react';
import { Card, Row, Col, Progress, Tag, Table, Statistic } from 'antd';

interface VisualizationData {
  weeklyProgress: Array<{
    week: string;
    study: number;
    conversation: number;
  }>;
  topicDistribution: Array<{
    topic: string;
    percentage: number;
    sessions: number;
  }>;
}

interface Props {
  data: VisualizationData | null;
}

const HistoryVisualization: React.FC<Props> = ({ data }) => {
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');

  const renderProgressChart = () => {
    if (!data) return null;

    const maxValue = Math.max(...data.weeklyProgress.map(d => Math.max(d.study, d.conversation)));

    return (
      <div>
        <h4 style={{ marginBottom: 16 }}>学习进度趋势</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#1890ff' }}>● 学习时间</span>
          <span style={{ color: '#52c41a' }}>● 对话次数</span>
        </div>
        {data.weeklyProgress.map((week, index) => (
          <div key={week.week} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>{week.week}</div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>学习时间:</span>
              <Progress
                percent={Math.round((week.study / maxValue) * 100)}
                size="small"
                strokeColor="#1890ff"
                format={() => `${week.study}分钟`}
              />
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#666', marginRight: 8 }}>对话次数:</span>
              <Progress
                percent={Math.round((week.conversation / maxValue) * 100)}
                size="small"
                strokeColor="#52c41a"
                format={() => `${week.conversation}次`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTopicDistribution = () => {
    if (!data) return null;

    return (
      <div>
        <h4 style={{ marginBottom: 16 }}>学习主题分布</h4>
        <Row gutter={[16, 16]}>
          {data.topicDistribution.map((topic, index) => {
            const colors = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'];
            return (
              <Col span={12} key={topic.topic}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Statistic
                    title={topic.topic}
                    value={topic.percentage}
                    suffix="%"
                    valueStyle={{ color: colors[index % colors.length] }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={colors[index % colors.length]}>
                      {topic.sessions} 次会话
                    </Tag>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  const renderDataTable = () => {
    if (!data) return null;

    const columns = [
      {
        title: '时间周期',
        dataIndex: 'week',
        key: 'week',
      },
      {
        title: '学习时间(分钟)',
        dataIndex: 'study',
        key: 'study',
        render: (value: number) => <span style={{ color: '#1890ff' }}>{value}</span>
      },
      {
        title: '对话次数',
        dataIndex: 'conversation',
        key: 'conversation',
        render: (value: number) => <span style={{ color: '#52c41a' }}>{value}</span>
      }
    ];

    return (
      <Table
        dataSource={data.weeklyProgress}
        columns={columns}
        pagination={false}
        size="small"
      />
    );
  };

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无数据</div>;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          {renderProgressChart()}
        </Col>
        <Col xs={24} lg={12}>
          {renderTopicDistribution()}
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <h4 style={{ marginBottom: 16 }}>详细数据</h4>
          {renderDataTable()}
        </Col>
      </Row>
    </div>
  );
};

export default HistoryVisualization;
