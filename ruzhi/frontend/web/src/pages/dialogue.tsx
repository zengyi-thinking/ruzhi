import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Avatar,
  Input,
  Button,
  Space,
  Tabs,
  Spin,
  List,
  Select,
  notification,
  Divider,
  Modal,
  Empty
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
  ApiOutlined,
  MessageOutlined,
  HistoryOutlined,
  ClearOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import ApiSettingsModal from '../components/ApiSettingsModal';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// 历史人物配置
const historicalFigures = [
  {
    id: 'confucius',
    name: '孔子',
    avatar: '/images/scholars/confucius.png',
    title: '儒家创始人',
    description: '春秋末期思想家、教育家，儒家学派创始人。以"仁"为核心，著有《论语》。',
    color: '#91caff',
  },
  {
    id: 'mengzi',
    name: '孟子',
    avatar: '/images/scholars/mengzi.png',
    title: '亚圣',
    description: '战国时期思想家，儒家学派重要代表。提出"性善论"，主张王道政治。',
    color: '#b7eb8f',
  },
  {
    id: 'xunzi',
    name: '荀子',
    avatar: '/images/scholars/xunzi.png',
    title: '儒家大师',
    description: '战国末期思想家，儒家学派重要代表。提出"性恶论"，重视礼法教化。',
    color: '#ffd6e7',
  }
];

// 消息类型
interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// 对话类型
interface Conversation {
  id?: string;
  characterId: string;
  messages: Message[];
  title?: string;
  createdAt?: Date;
}

const fallbackAvatar = (figure: string) => {
  const figureName = historicalFigures.find(f => f.id === figure)?.name || '未知';
  return (
    <Avatar 
      style={{ 
        backgroundColor: historicalFigures.find(f => f.id === figure)?.color || '#1890ff',
        verticalAlign: 'middle'
      }}
    >
      {figureName.slice(0, 1)}
    </Avatar>
  );
};

export default function DialoguePage() {
  const [activeCharacter, setActiveCharacter] = useState('confucius');
  const [userInput, setUserInput] = useState('');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiSettingsVisible, setApiSettingsVisible] = useState(false);
  const [apiStatus, setApiStatus] = useState<'active'|'inactive'|'checking'>('checking');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 检查API状态
  useEffect(() => {
    checkApiStatus();
  }, []);

  // 创建初始对话
  useEffect(() => {
    if (!currentConversation) {
      createNewConversation();
    }
  }, [activeCharacter]);

  // 消息自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages]);

  // 检查API状态
  const checkApiStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8003/api/v1/dialogue/health');
      if (response.data.status === 'healthy') {
        setApiStatus('active');
      } else {
        setApiStatus('inactive');
      }
    } catch (error) {
      console.error('API连接错误:', error);
      setApiStatus('inactive');
      notification.error({
        message: '连接失败',
        description: '无法连接到AI对话服务，请检查服务是否运行。',
      });
    }
  };

  // 创建新对话
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      characterId: activeCharacter,
      messages: [],
      createdAt: new Date()
    };
    
    setCurrentConversation(newConversation);
    
    // 添加到对话列表
    setConversations(prev => [newConversation, ...prev]);
  };

  // 发送消息
  const sendMessage = async () => {
    if (!userInput.trim() || loading || apiStatus !== 'active') return;
    
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    
    // 更新对话
    setCurrentConversation(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        messages: [...prev.messages, userMessage]
      };
    });
    
    setLoading(true);
    setUserInput('');
    
    try {
      // 调用API获取回复
      const response = await axios.post('http://localhost:8003/api/v1/dialogue/chat', {
        user_id: 'web_user',
        message: userInput,
        character: activeCharacter
      });
      
      // 创建助手消息
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.content,
        timestamp: new Date()
      };
      
      // 更新对话
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        };
      });
      
    } catch (error) {
      console.error('发送消息错误:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，发送消息时出现错误。请检查连接或尝试重新发送。',
        timestamp: new Date()
      };
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, errorMessage]
        };
      });
      
      notification.error({
        message: '发送失败',
        description: '无法发送消息，请检查网络连接或API状态。',
      });
    } finally {
      setLoading(false);
    }
  };

  // 切换历史人物
  const handleCharacterChange = (value: string) => {
    setActiveCharacter(value);
  };

  // 清空当前对话
  const clearCurrentConversation = () => {
    Modal.confirm({
      title: '确认清空对话',
      content: '确定要清空当前对话记录吗？此操作不可撤销。',
      onOk: () => {
        setCurrentConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: []
          };
        });
        notification.success({
          message: '对话已清空',
          description: '当前对话记录已清空，可以开始新的对话。'
        });
      }
    });
  };

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      notification.success({
        message: '复制成功',
        description: '消息内容已复制到剪贴板。'
      });
    }).catch(() => {
      notification.error({
        message: '复制失败',
        description: '无法复制到剪贴板，请手动复制。'
      });
    });
  };

  // 导出对话记录
  const exportConversation = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      notification.warning({
        message: '无内容可导出',
        description: '当前对话为空，无法导出。'
      });
      return;
    }

    const characterName = historicalFigures.find(f => f.id === activeCharacter)?.name || '历史人物';
    const exportData = {
      title: `与${characterName}的对话`,
      character: characterName,
      exportTime: new Date().toLocaleString(),
      messages: currentConversation.messages.map(msg => ({
        speaker: msg.role === 'user' ? '我' : characterName,
        content: msg.content,
        timestamp: msg.timestamp?.toLocaleString()
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `对话记录_${characterName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    notification.success({
      message: '导出成功',
      description: '对话记录已导出为JSON文件。'
    });
  };

  // 保存对话到历史
  const saveConversationToHistory = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      notification.warning({
        message: '无内容可保存',
        description: '当前对话为空，无法保存。'
      });
      return;
    }

    const characterName = historicalFigures.find(f => f.id === activeCharacter)?.name || '历史人物';
    const title = `与${characterName}的对话 - ${new Date().toLocaleString()}`;

    setCurrentConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        title
      };
    });

    notification.success({
      message: '保存成功',
      description: '对话已保存到历史记录。'
    });
  };

  // 渲染消息
  const renderMessages = () => {
    if (!currentConversation) return null;
    
    return (
      <div className="message-list">
        {currentConversation.messages.length === 0 ? (
          <div className="empty-chat">
            <Space direction="vertical" align="center" style={{ padding: '40px 0' }}>
              <Avatar 
                size={64}
                src={historicalFigures.find(f => f.id === activeCharacter)?.avatar}
                icon={<UserOutlined />}
              />
              <Title level={4}>开始与{historicalFigures.find(f => f.id === activeCharacter)?.name || '历史人物'}对话</Title>
              <Text type="secondary">发送问题，探索古代智慧</Text>
            </Space>
          </div>
        ) : (
          <>
            {currentConversation.messages.map((message, index) => (
              <div 
                key={index}
                className={`message-item ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
              >
                <Space align="start">
                  {message.role === 'user' ? (
                    <Avatar icon={<UserOutlined />} />
                  ) : (
                    <Avatar 
                      src={historicalFigures.find(f => f.id === activeCharacter)?.avatar}
                      icon={<RobotOutlined />}
                    >
                      {historicalFigures.find(f => f.id === activeCharacter)?.name?.[0] || '未'}
                    </Avatar>
                  )}
                  <div className="message-content">
                    <div className="message-header">
                      <Text strong>
                        {message.role === 'user' ? '我' : historicalFigures.find(f => f.id === activeCharacter)?.name || '历史人物'}
                      </Text>
                      <div className="message-actions">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyMessage(message.content)}
                          title="复制消息"
                        />
                      </div>
                    </div>
                    <Paragraph className="message-text">
                      {message.content}
                    </Paragraph>
                    {message.timestamp && (
                      <Text type="secondary" className="message-time">
                        {message.timestamp.toLocaleTimeString()}
                      </Text>
                    )}
                  </div>
                </Space>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    );
  };

  return (
    <AppLayout 
      title="历史人物对话"
      selectedKey="dialogue"
      breadcrumbs={[{ title: '历史人物对话' }]}
    >
      <Card 
        title={
          <Space>
            <MessageOutlined />
            <span>历史人物对话</span>
            {apiStatus === 'checking' && <Spin size="small" />}
            {apiStatus === 'inactive' && (
              <Button 
                type="primary" 
                danger 
                size="small" 
                icon={<ApiOutlined />}
                onClick={() => setApiSettingsVisible(true)}
              >
                API连接错误
              </Button>
            )}
          </Space>
        }
        className="dialogue-card"
      >
        <div className="dialogue-container">
          <div className="character-select">
            <Space align="center">
              <Text strong>选择对话人物:</Text>
              <Select 
                value={activeCharacter} 
                onChange={handleCharacterChange}
                style={{ width: 200 }}
              >
                {historicalFigures.map(figure => (
                  <Option key={figure.id} value={figure.id}>
                    <Space>
                      {figure.avatar ? (
                        <Avatar size="small" src={figure.avatar} />
                      ) : (
                        fallbackAvatar(figure.id)
                      )}
                      {figure.name}
                    </Space>
                  </Option>
                ))}
              </Select>
              <Button
                icon={<SettingOutlined />}
                size="small"
                onClick={() => setApiSettingsVisible(true)}
              >
                API设置
              </Button>
              <Button
                icon={<HistoryOutlined />}
                size="small"
                onClick={() => setHistoryVisible(true)}
              >
                历史记录
              </Button>
              <Button
                icon={<ClearOutlined />}
                size="small"
                onClick={clearCurrentConversation}
                disabled={!currentConversation || currentConversation.messages.length === 0}
              >
                清空对话
              </Button>
              <Button
                icon={<SaveOutlined />}
                size="small"
                onClick={saveConversationToHistory}
                disabled={!currentConversation || currentConversation.messages.length === 0}
              >
                保存对话
              </Button>
              <Button
                icon={<ExportOutlined />}
                size="small"
                onClick={exportConversation}
                disabled={!currentConversation || currentConversation.messages.length === 0}
              >
                导出记录
              </Button>
            </Space>
          </div>
          
          <Divider />
          
          <div className="dialogue-messages">
            {renderMessages()}
          </div>
          
          <div className="dialogue-input">
            <Space.Compact style={{ width: '100%' }}>
              <Input 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onPressEnter={sendMessage}
                placeholder="输入问题..."
                disabled={loading || apiStatus !== 'active'}
                size="large"
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={sendMessage}
                loading={loading}
                disabled={loading || apiStatus !== 'active'}
                size="large"
              />
            </Space.Compact>
          </div>
        </div>
      </Card>
      
      <ApiSettingsModal
        visible={apiSettingsVisible}
        onCancel={() => setApiSettingsVisible(false)}
        onSuccess={() => {
          setApiSettingsVisible(false);
          checkApiStatus();
        }}
      />

      {/* 历史记录模态框 */}
      <Modal
        title="对话历史记录"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={800}
      >
        <div className="history-content">
          {conversations.length === 0 ? (
            <Empty
              description="暂无历史对话记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={conversations}
              renderItem={(conversation) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setCurrentConversation(conversation);
                        setHistoryVisible(false);
                      }}
                    >
                      加载
                    </Button>,
                    <Button
                      type="link"
                      size="small"
                      danger
                      onClick={() => {
                        Modal.confirm({
                          title: '确认删除',
                          content: '确定要删除这条对话记录吗？',
                          onOk: () => {
                            setConversations(prev =>
                              prev.filter(c => c.id !== conversation.id)
                            );
                          }
                        });
                      }}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<MessageOutlined />} />}
                    title={conversation.title || `与${historicalFigures.find(f => f.id === conversation.character)?.name}的对话`}
                    description={
                      <div>
                        <Text type="secondary">
                          {conversation.messages.length} 条消息
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {conversation.createdAt?.toLocaleString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .dialogue-card {
          margin-bottom: 24px;
        }
        .dialogue-container {
          display: flex;
          flex-direction: column;
          height: 75vh;
        }
        .dialogue-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px;
          margin-bottom: 16px;
        }
        .dialogue-input {
          padding: 16px 0;
          background: #fff;
        }
        .message-item {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          max-width: 90%;
        }
        .user-message {
          background-color: #e6f7ff;
          align-self: flex-end;
          margin-left: auto;
        }
        .ai-message {
          background-color: #f5f5f5;
          align-self: flex-start;
          margin-right: auto;
        }
        .message-content {
          margin-left: 8px;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .message-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .message-item:hover .message-actions {
          opacity: 1;
        }
        .message-text {
          margin-bottom: 8px;
          white-space: pre-wrap;
          line-height: 1.6;
        }
        .message-time {
          font-size: 11px;
          opacity: 0.7;
        }
        .empty-chat {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
      `}</style>
    </AppLayout>
  );
} 