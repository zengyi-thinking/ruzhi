import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Avatar, 
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Send as SendIcon, 
  Clear as ClearIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { aiChatAPI } from '../../services/api';
import MessageBubble from './MessageBubble';
import CharacterSelector from './CharacterSelector';
import ThinkingProcess from './ThinkingProcess';
import RelatedRecommendations from './RelatedRecommendations';

const ChatContainer = styled(Paper)(({ theme }) => ({
  height: '600px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: theme.shadows[3]
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[300],
    borderRadius: '3px',
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-end'
}));

const CharacterHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2)
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  color: theme.palette.text.secondary,
  fontStyle: 'italic'
}));

const ChatInterface = ({ initialCharacterId = null }) => {
  const { user } = useAuth();
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showThinking, setShowThinking] = useState(false);
  const [currentThinking, setCurrentThinking] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);
  
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (initialCharacterId) {
      loadCharacter(initialCharacterId);
    }
  }, [initialCharacterId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCharacter = async (characterId) => {
    try {
      const response = await aiChatAPI.getCharacters();
      const character = response.data.characters.find(c => c.id === characterId);
      if (character) {
        setSelectedCharacter(character);
        setMessages([{
          id: Date.now(),
          type: 'system',
          content: `您现在正在与${character.name}（${character.title}）对话。${character.description}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('加载人物失败:', error);
      setError('加载人物信息失败');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCharacter || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setError(null);
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (useStreaming) {
        await handleStreamingChat(userMessage.content);
      } else {
        await handleRegularChat(userMessage.content);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setError('发送消息失败，请重试');
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: '抱歉，我暂时无法回复。请稍后再试。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleStreamingChat = async (message) => {
    const requestData = {
      message,
      character_id: selectedCharacter.id,
      user_level: user?.profile?.learning_level || 'beginner',
      user_interests: user?.profile?.interests || [],
      conversation_mode: 'learning'
    };

    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const response = await fetch('/api/ai-chat/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('流式请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '',
        character: selectedCharacter,
        timestamp: new Date(),
        isStreaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                setShowThinking(true);
                setCurrentThinking('正在思考...');
              } else if (data.type === 'content') {
                setStreamingMessage(prev => prev + data.data.chunk);
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + data.data.chunk }
                    : msg
                ));
              } else if (data.type === 'complete') {
                setShowThinking(false);
                setCurrentThinking(data.data.thinking_process || '');
                setRecommendations(data.data.related_recommendations || []);
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        isStreaming: false,
                        thinking_process: data.data.thinking_process,
                        quality_assessment: data.data.quality_assessment,
                        processing_time: data.data.processing_time
                      }
                    : msg
                ));
              } else if (data.type === 'error') {
                throw new Error(data.data.error);
              }
            } catch (parseError) {
              console.error('解析流式数据失败:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式对话失败:', error);
      throw error;
    }
  };

  const handleRegularChat = async (message) => {
    const requestData = {
      message,
      character_id: selectedCharacter.id,
      user_level: user?.profile?.learning_level || 'beginner',
      user_interests: user?.profile?.interests || [],
      conversation_mode: 'learning'
    };

    const response = await aiChatAPI.chat(requestData);
    
    const assistantMessage = {
      id: Date.now() + 1,
      type: 'assistant',
      content: response.data.response,
      character: selectedCharacter,
      timestamp: new Date(),
      thinking_process: response.data.thinking_process,
      quality_assessment: response.data.quality_assessment,
      rag_enhancement: response.data.rag_enhancement,
      processing_time: response.data.processing_time
    };

    setMessages(prev => [...prev, assistantMessage]);
    setCurrentThinking(response.data.thinking_process || '');
    setRecommendations(response.data.related_recommendations || []);
  };

  const handleClearConversation = async () => {
    if (!selectedCharacter) return;

    try {
      await aiChatAPI.clearConversation({ character_id: selectedCharacter.id });
      setMessages([{
        id: Date.now(),
        type: 'system',
        content: `对话已清除。您可以重新开始与${selectedCharacter.name}的对话。`,
        timestamp: new Date()
      }]);
      setRecommendations([]);
      setCurrentThinking('');
    } catch (error) {
      console.error('清除对话失败:', error);
      setError('清除对话失败');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedCharacter) {
    return (
      <CharacterSelector 
        onCharacterSelect={setSelectedCharacter}
        onError={setError}
      />
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ChatContainer>
        {/* 人物头部信息 */}
        <CharacterHeader>
          <Avatar 
            src={selectedCharacter.avatar} 
            sx={{ width: 48, height: 48 }}
          >
            {selectedCharacter.name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {selectedCharacter.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedCharacter.title} · {selectedCharacter.dynasty}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="查看思考过程">
              <IconButton 
                color="inherit" 
                onClick={() => setShowThinking(!showThinking)}
              >
                <PsychologyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="清除对话">
              <IconButton color="inherit" onClick={handleClearConversation}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CharacterHeader>

        {/* 消息区域 */}
        <MessagesContainer>
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
              showDetails={true}
            />
          ))}
          
          {isTyping && (
            <TypingIndicator>
              <CircularProgress size={16} />
              <Typography variant="body2">
                {selectedCharacter.name}正在思考...
              </Typography>
            </TypingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* 输入区域 */}
        <InputContainer>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={`与${selectedCharacter.name}对话...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </InputContainer>
      </ChatContainer>

      {/* 思考过程展示 */}
      {showThinking && currentThinking && (
        <ThinkingProcess 
          thinking={currentThinking}
          onClose={() => setShowThinking(false)}
        />
      )}

      {/* 相关推荐 */}
      {recommendations.length > 0 && (
        <RelatedRecommendations 
          recommendations={recommendations}
          onRecommendationClick={(rec) => {
            setInputMessage(rec.title);
          }}
        />
      )}

      {/* 功能说明 */}
      <Paper sx={{ mt: 2, p: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          💡 对话技巧：
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            size="small" 
            label="询问思想观点" 
            variant="outlined"
            onClick={() => setInputMessage('请谈谈您的核心思想')}
          />
          <Chip 
            size="small" 
            label="寻求人生建议" 
            variant="outlined"
            onClick={() => setInputMessage('在人生迷茫时，您有什么建议？')}
          />
          <Chip 
            size="small" 
            label="探讨现代应用" 
            variant="outlined"
            onClick={() => setInputMessage('您的思想在现代社会如何应用？')}
          />
          <Chip 
            size="small" 
            label="学习方法指导" 
            variant="outlined"
            onClick={() => setInputMessage('如何更好地学习传统文化？')}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
