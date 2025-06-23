import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Rating,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  AutoAwesome as AutoAwesomeIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const MessageContainer = styled(Box)(({ theme, isUser }) => ({
  display: 'flex',
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(2),
  alignItems: 'flex-start',
  gap: theme.spacing(1)
}));

const MessageBubble = styled(Paper)(({ theme, isUser, messageType }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  backgroundColor: 
    messageType === 'system' ? theme.palette.info.light :
    messageType === 'error' ? theme.palette.error.light :
    isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: 
    messageType === 'system' ? theme.palette.info.contrastText :
    messageType === 'error' ? theme.palette.error.contrastText :
    isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  position: 'relative',
  '&::before': messageType === 'user' || messageType === 'assistant' ? {
    content: '""',
    position: 'absolute',
    top: theme.spacing(1),
    [isUser ? 'right' : 'left']: -6,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: isUser ? '6px 0 6px 6px' : '6px 6px 6px 0',
    borderColor: isUser 
      ? `transparent transparent transparent ${theme.palette.primary.main}`
      : `transparent ${theme.palette.grey[100]} transparent transparent`
  } : {}
}));

const MessageDetails = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.spacing(1),
  fontSize: '0.875rem'
}));

const QualityIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1)
}));

const StreamingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  '& .dot': {
    width: 4,
    height: 4,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    animation: 'pulse 1.4s ease-in-out infinite both',
    '&:nth-of-type(1)': { animationDelay: '-0.32s' },
    '&:nth-of-type(2)': { animationDelay: '-0.16s' }
  },
  '@keyframes pulse': {
    '0%, 80%, 100%': { transform: 'scale(0)' },
    '40%': { transform: 'scale(1)' }
  }
}));

const MessageBubbleComponent = ({ message, showDetails = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isError = message.type === 'error';
  const isAssistant = message.type === 'assistant';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // 可以添加一个toast提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleFeedback = (type) => {
    setFeedback(type);
    // 这里可以调用API提交反馈
  };

  const formatProcessingTime = (time) => {
    if (time < 1) return `${(time * 1000).toFixed(0)}ms`;
    return `${time.toFixed(2)}s`;
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const renderMessageContent = () => {
    // 处理流式消息的打字效果
    if (message.isStreaming) {
      return (
        <Box>
          <Typography variant="body1" component="div">
            {message.content}
            <StreamingIndicator>
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </StreamingIndicator>
          </Typography>
        </Box>
      );
    }

    // 处理普通消息内容，支持简单的格式化
    const formatContent = (content) => {
      // 简单的换行处理
      return content.split('\n').map((line, index) => (
        <Typography key={index} variant="body1" component="div" gutterBottom={index < content.split('\n').length - 1}>
          {line}
        </Typography>
      ));
    };

    return formatContent(message.content);
  };

  return (
    <MessageContainer isUser={isUser}>
      {/* 助手头像 */}
      {isAssistant && message.character && (
        <Avatar 
          src={message.character.avatar} 
          sx={{ width: 32, height: 32, mt: 0.5 }}
        >
          {message.character.name[0]}
        </Avatar>
      )}

      <Box sx={{ flex: 1, maxWidth: '70%' }}>
        <MessageBubble 
          isUser={isUser} 
          messageType={message.type}
          elevation={1}
        >
          {/* 消息内容 */}
          {renderMessageContent()}

          {/* 时间戳 */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              opacity: 0.7,
              textAlign: isUser ? 'right' : 'left'
            }}
          >
            {formatDistanceToNow(message.timestamp, { 
              addSuffix: true, 
              locale: zhCN 
            })}
          </Typography>

          {/* 助手消息的额外信息 */}
          {isAssistant && showDetails && (
            <Box sx={{ mt: 1 }}>
              {/* 质量指标 */}
              {message.quality_assessment && (
                <QualityIndicator>
                  <Chip
                    size="small"
                    icon={<AutoAwesomeIcon />}
                    label={`质量: ${(message.quality_assessment.quality_score * 100).toFixed(0)}%`}
                    color={getQualityColor(message.quality_assessment.quality_score)}
                    variant="outlined"
                  />
                  {message.processing_time && (
                    <Chip
                      size="small"
                      icon={<SpeedIcon />}
                      label={formatProcessingTime(message.processing_time)}
                      variant="outlined"
                    />
                  )}
                </QualityIndicator>
              )}

              {/* RAG增强信息 */}
              {message.rag_enhancement && message.rag_enhancement.knowledge_used > 0 && (
                <Chip
                  size="small"
                  label={`知识增强: ${message.rag_enhancement.knowledge_used}个知识点`}
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              )}

              {/* 展开/收起详细信息 */}
              {(message.thinking_process || message.quality_assessment?.issues?.length > 0) && (
                <Box sx={{ mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ p: 0.5 }}
                  >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {expanded ? '收起详情' : '查看详情'}
                    </Typography>
                  </IconButton>
                </Box>
              )}

              {/* 详细信息 */}
              <Collapse in={expanded}>
                <MessageDetails>
                  {/* 思考过程 */}
                  {message.thinking_process && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <PsychologyIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        思考过程
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {message.thinking_process}
                      </Typography>
                    </Box>
                  )}

                  {/* 质量问题 */}
                  {message.quality_assessment?.issues?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        质量评估
                      </Typography>
                      {message.quality_assessment.issues.map((issue, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={issue}
                          color="warning"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}

                  {/* 模型信息 */}
                  {message.model_info && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        模型信息
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        提供者: {message.model_info.provider} | 
                        模型: {message.model_info.model}
                        {message.model_info.usage?.total_tokens && 
                          ` | 令牌: ${message.model_info.usage.total_tokens}`
                        }
                      </Typography>
                    </Box>
                  )}
                </MessageDetails>
              </Collapse>

              {/* 反馈按钮 */}
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Tooltip title="复制消息">
                  <IconButton size="small" onClick={handleCopyMessage}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="有帮助">
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback('helpful')}
                    color={feedback === 'helpful' ? 'primary' : 'default'}
                  >
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="需要改进">
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback('unhelpful')}
                    color={feedback === 'unhelpful' ? 'error' : 'default'}
                  >
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </MessageBubble>
      </Box>

      {/* 用户头像 */}
      {isUser && (
        <Avatar sx={{ width: 32, height: 32, mt: 0.5, bgcolor: 'primary.main' }}>
          我
        </Avatar>
      )}
    </MessageContainer>
  );
};

export default MessageBubbleComponent;
