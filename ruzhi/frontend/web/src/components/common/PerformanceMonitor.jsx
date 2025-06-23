/**
 * 性能监控组件
 * 实时监控和显示应用性能指标
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { usePerformanceMonitor, useNetworkStatus, useMemoryMonitor } from '../../hooks/usePerformance';

const PerformanceMonitor = ({ 
  showInProduction = false, 
  position = 'bottom-right',
  minimized = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(!minimized);
  const [showWarnings, setShowWarnings] = useState(true);
  const { metrics, isSupported } = usePerformanceMonitor();
  const { isOnline, connectionType } = useNetworkStatus();
  const memoryInfo = useMemoryMonitor();

  // 在生产环境中默认隐藏
  const shouldShow = process.env.NODE_ENV === 'development' || showWarnings;

  if (!shouldShow || !isSupported) {
    return null;
  }

  // 性能评分
  const getPerformanceScore = () => {
    const { FCP, LCP, FID } = metrics;
    let score = 100;

    if (FCP > 1800) score -= 20;
    else if (FCP > 1000) score -= 10;

    if (LCP > 2500) score -= 30;
    else if (LCP > 1500) score -= 15;

    if (FID > 100) score -= 25;
    else if (FID > 50) score -= 10;

    return Math.max(0, score);
  };

  // 获取性能等级
  const getPerformanceGrade = (score) => {
    if (score >= 90) return { grade: 'A', color: 'success' };
    if (score >= 75) return { grade: 'B', color: 'warning' };
    if (score >= 60) return { grade: 'C', color: 'warning' };
    return { grade: 'D', color: 'error' };
  };

  // 格式化时间
  const formatTime = (time) => {
    if (!time) return 'N/A';
    return `${time.toFixed(0)}ms`;
  };

  // 格式化内存
  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  // 获取连接类型颜色
  const getConnectionColor = (type) => {
    switch (type) {
      case '4g': return 'success';
      case '3g': return 'warning';
      case '2g': return 'error';
      case 'slow-2g': return 'error';
      default: return 'default';
    }
  };

  // 性能警告
  const getPerformanceWarnings = () => {
    const warnings = [];
    const { FCP, LCP, FID } = metrics;

    if (FCP > 1800) {
      warnings.push('首屏内容绘制时间过长');
    }
    if (LCP > 2500) {
      warnings.push('最大内容绘制时间过长');
    }
    if (FID > 100) {
      warnings.push('首次输入延迟过长');
    }
    if (memoryInfo && memoryInfo.usagePercentage > 80) {
      warnings.push('内存使用率过高');
    }

    return warnings;
  };

  const performanceScore = getPerformanceScore();
  const { grade, color } = getPerformanceGrade(performanceScore);
  const warnings = getPerformanceWarnings();

  const positionStyles = {
    'bottom-right': { bottom: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'top-left': { top: 16, left: 16 }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        zIndex: 9999,
        maxWidth: isExpanded ? 400 : 200,
        ...positionStyles[position]
      }}
    >
      {/* 警告提示 */}
      {warnings.length > 0 && showWarnings && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 1, fontSize: '12px' }}
          onClose={() => setShowWarnings(false)}
        >
          检测到 {warnings.length} 个性能问题
        </Alert>
      )}

      <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* 头部 */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <SpeedIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" fontWeight="bold">
                性能监控
              </Typography>
              <Chip
                label={grade}
                size="small"
                color={color}
                sx={{ minWidth: 24, height: 20, fontSize: '10px' }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'white', p: 0.5 }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* 性能评分 */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption">性能评分</Typography>
              <Typography variant="caption" fontWeight="bold">
                {performanceScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={performanceScore}
              color={color}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>

          <Collapse in={isExpanded}>
            <Grid container spacing={1}>
              {/* Web Vitals */}
              <Grid item xs={12}>
                <Typography variant="caption" fontWeight="bold" gutterBottom>
                  Web Vitals
                </Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" display="block">
                    FCP
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(metrics.FCP)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" display="block">
                    LCP
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(metrics.LCP)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="caption" display="block">
                    FID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatTime(metrics.FID)}
                  </Typography>
                </Box>
              </Grid>

              {/* 内存信息 */}
              {memoryInfo && (
                <>
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <MemoryIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" fontWeight="bold">
                        内存使用
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block">
                      已用: {formatMemory(memoryInfo.usedJSHeapSize)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="caption" display="block">
                      限制: {formatMemory(memoryInfo.jsHeapSizeLimit)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <LinearProgress
                      variant="determinate"
                      value={memoryInfo.usagePercentage}
                      color={memoryInfo.usagePercentage > 80 ? 'error' : 'primary'}
                      sx={{ height: 3, borderRadius: 2 }}
                    />
                  </Grid>
                </>
              )}

              {/* 网络状态 */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <NetworkIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption" fontWeight="bold">
                    网络状态
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Chip
                  label={isOnline ? '在线' : '离线'}
                  size="small"
                  color={isOnline ? 'success' : 'error'}
                  sx={{ fontSize: '10px', height: 20 }}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Chip
                  label={connectionType.toUpperCase()}
                  size="small"
                  color={getConnectionColor(connectionType)}
                  sx={{ fontSize: '10px', height: 20 }}
                />
              </Grid>

              {/* 性能建议 */}
              {warnings.length > 0 && (
                <>
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="caption" fontWeight="bold" color="warning.main">
                      性能建议
                    </Typography>
                  </Grid>
                  {warnings.slice(0, 2).map((warning, index) => (
                    <Grid item xs={12} key={index}>
                      <Typography variant="caption" sx={{ fontSize: '10px' }}>
                        • {warning}
                      </Typography>
                    </Grid>
                  ))}
                </>
              )}
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

// 性能监控提供者组件
export const PerformanceProvider = ({ children, ...props }) => {
  return (
    <>
      {children}
      <PerformanceMonitor {...props} />
    </>
  );
};

export default PerformanceMonitor;
