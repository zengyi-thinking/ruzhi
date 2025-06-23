/**
 * 学习进度可视化组件
 * 使用Chart.js和D3.js实现多种图表展示学习进度
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  AutoGraph as GraphIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

const ProgressVisualization = ({ userId, timeRange = '30d' }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    const loadProgressData = async () => {
      setLoading(true);
      try {
        // 这里应该调用真实的API
        const mockData = generateMockProgressData();
        setProgressData(mockData);
      } catch (error) {
        console.error('Failed to load progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [userId, timeRange]);

  // 生成模拟数据
  const generateMockProgressData = () => {
    const days = 30;
    const dailyProgress = [];
    const knowledgeAreas = [
      { name: '儒家思想', progress: 75, color: '#8884d8' },
      { name: '道家哲学', progress: 60, color: '#82ca9d' },
      { name: '法家理论', progress: 45, color: '#ffc658' },
      { name: '墨家学说', progress: 30, color: '#ff7300' },
      { name: '兵家战略', progress: 20, color: '#00ff88' }
    ];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        studyTime: Math.floor(Math.random() * 120) + 30, // 30-150分钟
        conceptsLearned: Math.floor(Math.random() * 8) + 2, // 2-10个概念
        charactersInteracted: Math.floor(Math.random() * 3) + 1, // 1-4个人物
        quizScore: Math.floor(Math.random() * 40) + 60, // 60-100分
        engagement: Math.floor(Math.random() * 30) + 70 // 70-100%
      });
    }

    const achievements = [
      { id: 1, name: '初学者', description: '完成第一次学习', icon: '🎓', unlocked: true, date: '2024-12-01' },
      { id: 2, name: '对话达人', description: '与5个不同人物对话', icon: '💬', unlocked: true, date: '2024-12-05' },
      { id: 3, name: '知识探索者', description: '学习50个概念', icon: '🔍', unlocked: true, date: '2024-12-10' },
      { id: 4, name: '思想家', description: '深度学习儒家思想', icon: '🧠', unlocked: false, progress: 75 },
      { id: 5, name: '智慧大师', description: '掌握所有核心概念', icon: '🏆', unlocked: false, progress: 45 }
    ];

    const weeklyStats = [
      { week: '第1周', studyTime: 420, concepts: 25, score: 85 },
      { week: '第2周', studyTime: 380, concepts: 22, score: 88 },
      { week: '第3周', studyTime: 450, concepts: 28, score: 92 },
      { week: '第4周', studyTime: 520, concepts: 35, score: 95 }
    ];

    return {
      dailyProgress,
      knowledgeAreas,
      achievements,
      weeklyStats,
      totalStats: {
        totalStudyTime: 1770, // 分钟
        totalConcepts: 110,
        averageScore: 90,
        streakDays: 15,
        level: 8,
        experiencePoints: 2450,
        nextLevelXP: 3000
      }
    };
  };

  // 计算学习趋势
  const learningTrend = useMemo(() => {
    if (!progressData) return null;
    
    const recent7Days = progressData.dailyProgress.slice(-7);
    const previous7Days = progressData.dailyProgress.slice(-14, -7);
    
    const recentAvg = recent7Days.reduce((sum, day) => sum + day.studyTime, 0) / 7;
    const previousAvg = previous7Days.reduce((sum, day) => sum + day.studyTime, 0) / 7;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.abs(change).toFixed(1)
    };
  }, [progressData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (!progressData) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">暂无学习数据</Typography>
      </Box>
    );
  }

  const { dailyProgress, knowledgeAreas, achievements, weeklyStats, totalStats } = progressData;

  return (
    <Box>
      {/* 总体统计卡片 */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{Math.floor(totalStats.totalStudyTime / 60)}h</Typography>
                  <Typography variant="body2" color="text.secondary">
                    总学习时间
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <PsychologyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{totalStats.totalConcepts}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    学习概念
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrophyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{totalStats.averageScore}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均分数
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{totalStats.streakDays}天</Typography>
                  <Typography variant="body2" color="text.secondary">
                    连续学习
                  </Typography>
                  {learningTrend && (
                    <Chip
                      size="small"
                      label={`${learningTrend.trend === 'up' ? '+' : '-'}${learningTrend.percentage}%`}
                      color={learningTrend.trend === 'up' ? 'success' : 'error'}
                      sx={{ mt: 0.5, fontSize: '10px' }}
                    />
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 等级进度 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">学习等级</Typography>
            <Chip label={`等级 ${totalStats.level}`} color="primary" />
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {totalStats.experiencePoints} / {totalStats.nextLevelXP} XP
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(totalStats.experiencePoints / totalStats.nextLevelXP) * 100}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {totalStats.nextLevelXP - totalStats.experiencePoints} XP 升级
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 图表选项卡 */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
            <Tab icon={<TimelineIcon />} label="学习趋势" />
            <Tab icon={<GraphIcon />} label="知识领域" />
            <Tab icon={<TrophyIcon />} label="成就系统" />
          </Tabs>

          {/* 学习趋势图表 */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                每日学习进度
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `日期: ${label}`}
                    formatter={(value, name) => [
                      name === 'studyTime' ? `${value}分钟` : 
                      name === 'conceptsLearned' ? `${value}个概念` :
                      name === 'quizScore' ? `${value}分` : value,
                      name === 'studyTime' ? '学习时间' :
                      name === 'conceptsLearned' ? '学习概念' :
                      name === 'quizScore' ? '测试分数' : name
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="studyTime"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="conceptsLearned"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  周度统计
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="studyTime" fill="#8884d8" name="学习时间(分钟)" />
                    <Bar dataKey="concepts" fill="#82ca9d" name="学习概念" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {/* 知识领域图表 */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                知识领域掌握度
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={knowledgeAreas}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="progress"
                        label={({ name, progress }) => `${name}: ${progress}%`}
                      >
                        {knowledgeAreas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List>
                    {knowledgeAreas.map((area, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: area.color, width: 24, height: 24 }}>
                            {area.name[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={area.name}
                          secondary={
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={area.progress}
                                sx={{ mt: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {area.progress}% 完成
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 成就系统 */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                学习成就
              </Typography>
              <Grid container spacing={2}>
                {achievements.map((achievement) => (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        opacity: achievement.unlocked ? 1 : 0.6,
                        border: achievement.unlocked ? '2px solid' : '1px solid',
                        borderColor: achievement.unlocked ? 'success.main' : 'divider'
                      }}
                    >
                      <CardContent>
                        <Box textAlign="center">
                          <Typography variant="h4" sx={{ mb: 1 }}>
                            {achievement.icon}
                          </Typography>
                          <Typography variant="h6" gutterBottom>
                            {achievement.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {achievement.description}
                          </Typography>
                          
                          {achievement.unlocked ? (
                            <Chip
                              label={`已获得 ${achievement.date}`}
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={achievement.progress}
                                sx={{ mb: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {achievement.progress}% 完成
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgressVisualization;
