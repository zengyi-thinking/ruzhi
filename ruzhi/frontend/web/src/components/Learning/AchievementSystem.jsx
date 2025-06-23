/**
 * 成就系统组件
 * 游戏化学习体验，包含徽章、等级、积分等激励机制
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Badge,
  Fade,
  Zoom,
  Confetti,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Chat as ChatIcon,
  MenuBook as BookIcon,
  Timeline as TimelineIcon,
  Favorite as HeartIcon
} from '@mui/icons-material';

const AchievementSystem = ({ userId, onAchievementUnlocked }) => {
  const [achievements, setAchievements] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [newAchievement, setNewAchievement] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // 成就定义
  const achievementDefinitions = [
    {
      id: 'first_chat',
      name: '初次对话',
      description: '与古代圣贤进行第一次对话',
      icon: '💬',
      category: 'interaction',
      points: 100,
      rarity: 'common',
      condition: { type: 'chat_count', value: 1 }
    },
    {
      id: 'chat_master',
      name: '对话达人',
      description: '与5个不同的历史人物对话',
      icon: '🗣️',
      category: 'interaction',
      points: 300,
      rarity: 'uncommon',
      condition: { type: 'unique_characters', value: 5 }
    },
    {
      id: 'knowledge_seeker',
      name: '求知者',
      description: '学习10个传统文化概念',
      icon: '🔍',
      category: 'learning',
      points: 200,
      rarity: 'common',
      condition: { type: 'concepts_learned', value: 10 }
    },
    {
      id: 'scholar',
      name: '学者',
      description: '学习50个传统文化概念',
      icon: '📚',
      category: 'learning',
      points: 500,
      rarity: 'rare',
      condition: { type: 'concepts_learned', value: 50 }
    },
    {
      id: 'wisdom_master',
      name: '智慧大师',
      description: '掌握所有核心概念',
      icon: '🧠',
      category: 'mastery',
      points: 1000,
      rarity: 'legendary',
      condition: { type: 'concepts_mastered', value: 100 }
    },
    {
      id: 'daily_learner',
      name: '每日学习',
      description: '连续学习7天',
      icon: '📅',
      category: 'consistency',
      points: 250,
      rarity: 'uncommon',
      condition: { type: 'streak_days', value: 7 }
    },
    {
      id: 'dedicated_student',
      name: '专注学者',
      description: '连续学习30天',
      icon: '🎯',
      category: 'consistency',
      points: 750,
      rarity: 'epic',
      condition: { type: 'streak_days', value: 30 }
    },
    {
      id: 'confucius_friend',
      name: '孔子之友',
      description: '与孔子对话超过20次',
      icon: '👨‍🏫',
      category: 'character',
      points: 400,
      rarity: 'rare',
      condition: { type: 'character_chats', character: 'confucius', value: 20 }
    },
    {
      id: 'quiz_champion',
      name: '测试冠军',
      description: '在测试中获得满分',
      icon: '🏆',
      category: 'performance',
      points: 300,
      rarity: 'uncommon',
      condition: { type: 'perfect_quiz', value: 1 }
    },
    {
      id: 'social_learner',
      name: '社交学习者',
      description: '分享5个学习成果',
      icon: '🤝',
      category: 'social',
      points: 200,
      rarity: 'common',
      condition: { type: 'shares', value: 5 }
    }
  ];

  // 稀有度配置
  const rarityConfig = {
    common: { color: '#9e9e9e', label: '普通', glow: false },
    uncommon: { color: '#4caf50', label: '不常见', glow: false },
    rare: { color: '#2196f3', label: '稀有', glow: true },
    epic: { color: '#9c27b0', label: '史诗', glow: true },
    legendary: { color: '#ff9800', label: '传说', glow: true }
  };

  // 加载用户成就数据
  useEffect(() => {
    loadUserAchievements();
  }, [userId]);

  const loadUserAchievements = async () => {
    try {
      // 模拟API调用
      const mockUserProgress = {
        chat_count: 15,
        unique_characters: 3,
        concepts_learned: 25,
        concepts_mastered: 8,
        streak_days: 12,
        character_chats: { confucius: 8, laozi: 5, mencius: 2 },
        perfect_quiz: 0,
        shares: 2
      };

      const mockAchievements = [
        { id: 'first_chat', unlocked: true, unlockedAt: '2024-12-01' },
        { id: 'knowledge_seeker', unlocked: true, unlockedAt: '2024-12-05' },
        { id: 'daily_learner', unlocked: true, unlockedAt: '2024-12-10' }
      ];

      setUserProgress(mockUserProgress);
      setAchievements(mockAchievements);

      // 检查新成就
      checkForNewAchievements(mockUserProgress, mockAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  // 检查新成就
  const checkForNewAchievements = (progress, currentAchievements) => {
    const unlockedIds = new Set(currentAchievements.map(a => a.id));

    achievementDefinitions.forEach(achievement => {
      if (unlockedIds.has(achievement.id)) return;

      if (isAchievementUnlocked(achievement, progress)) {
        unlockAchievement(achievement);
      }
    });
  };

  // 判断成就是否解锁
  const isAchievementUnlocked = (achievement, progress) => {
    const { condition } = achievement;

    switch (condition.type) {
      case 'chat_count':
        return progress.chat_count >= condition.value;
      case 'unique_characters':
        return progress.unique_characters >= condition.value;
      case 'concepts_learned':
        return progress.concepts_learned >= condition.value;
      case 'concepts_mastered':
        return progress.concepts_mastered >= condition.value;
      case 'streak_days':
        return progress.streak_days >= condition.value;
      case 'character_chats':
        return (progress.character_chats[condition.character] || 0) >= condition.value;
      case 'perfect_quiz':
        return progress.perfect_quiz >= condition.value;
      case 'shares':
        return progress.shares >= condition.value;
      default:
        return false;
    }
  };

  // 解锁成就
  const unlockAchievement = (achievement) => {
    const newAchievementData = {
      id: achievement.id,
      unlocked: true,
      unlockedAt: new Date().toISOString()
    };

    setAchievements(prev => [...prev, newAchievementData]);
    setNewAchievement(achievement);
    setShowCelebration(true);
    
    onAchievementUnlocked?.(achievement);

    // 3秒后隐藏庆祝动画
    setTimeout(() => {
      setShowCelebration(false);
      setNewAchievement(null);
    }, 3000);
  };

  // 获取成就进度
  const getAchievementProgress = (achievement) => {
    const { condition } = achievement;
    let current = 0;

    switch (condition.type) {
      case 'chat_count':
        current = userProgress.chat_count || 0;
        break;
      case 'unique_characters':
        current = userProgress.unique_characters || 0;
        break;
      case 'concepts_learned':
        current = userProgress.concepts_learned || 0;
        break;
      case 'concepts_mastered':
        current = userProgress.concepts_mastered || 0;
        break;
      case 'streak_days':
        current = userProgress.streak_days || 0;
        break;
      case 'character_chats':
        current = (userProgress.character_chats?.[condition.character] || 0);
        break;
      case 'perfect_quiz':
        current = userProgress.perfect_quiz || 0;
        break;
      case 'shares':
        current = userProgress.shares || 0;
        break;
    }

    return Math.min(current / condition.value, 1) * 100;
  };

  // 分享成就
  const shareAchievement = (achievement) => {
    if (navigator.share) {
      navigator.share({
        title: `我获得了"${achievement.name}"成就！`,
        text: achievement.description,
        url: window.location.href
      });
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(
        `我在儒智平台获得了"${achievement.name}"成就！${achievement.description}`
      );
    }
  };

  // 按类别分组成就
  const achievementsByCategory = achievementDefinitions.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {});

  const categoryNames = {
    interaction: '互动成就',
    learning: '学习成就',
    mastery: '精通成就',
    consistency: '坚持成就',
    character: '人物成就',
    performance: '表现成就',
    social: '社交成就'
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => {
    const def = achievementDefinitions.find(d => d.id === a.id);
    return sum + (def?.points || 0);
  }, 0);

  return (
    <Box>
      {/* 成就概览 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                  <TrophyIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6">{unlockedAchievements.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  已获得成就
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                  <StarIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Typography variant="h6">{totalPoints}</Typography>
                <Typography variant="body2" color="text.secondary">
                  成就积分
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  完成度
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(unlockedAchievements.length / achievementDefinitions.length) * 100}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {unlockedAchievements.length} / {achievementDefinitions.length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 成就列表 */}
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
        <Card key={category} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {categoryNames[category]}
            </Typography>
            <Grid container spacing={2}>
              {categoryAchievements.map((achievement) => {
                const isUnlocked = achievements.some(a => a.id === achievement.id && a.unlocked);
                const progress = getAchievementProgress(achievement);
                const rarity = rarityConfig[achievement.rarity];

                return (
                  <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        opacity: isUnlocked ? 1 : 0.7,
                        border: isUnlocked ? `2px solid ${rarity.color}` : '1px solid',
                        borderColor: isUnlocked ? rarity.color : 'divider',
                        boxShadow: isUnlocked && rarity.glow ? `0 0 20px ${rarity.color}40` : 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => setSelectedAchievement(achievement)}
                    >
                      <CardContent>
                        <Box textAlign="center">
                          <Badge
                            badgeContent={isUnlocked ? '✓' : ''}
                            color="success"
                            overlap="circular"
                          >
                            <Typography variant="h3" sx={{ mb: 1, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                              {achievement.icon}
                            </Typography>
                          </Badge>
                          
                          <Typography variant="h6" gutterBottom>
                            {achievement.name}
                          </Typography>
                          
                          <Chip
                            label={rarity.label}
                            size="small"
                            sx={{ 
                              bgcolor: rarity.color, 
                              color: 'white',
                              mb: 1
                            }}
                          />
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {achievement.description}
                          </Typography>
                          
                          {!isUnlocked && (
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ mb: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {progress.toFixed(0)}% 完成
                              </Typography>
                            </Box>
                          )}
                          
                          {isUnlocked && (
                            <Box display="flex" justifyContent="center" gap={1}>
                              <Tooltip title="分享成就">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    shareAchievement(achievement);
                                  }}
                                >
                                  <ShareIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      ))}

      {/* 成就详情对话框 */}
      <Dialog
        open={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAchievement && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h4">{selectedAchievement.icon}</Typography>
                  <Box>
                    <Typography variant="h6">{selectedAchievement.name}</Typography>
                    <Chip
                      label={rarityConfig[selectedAchievement.rarity].label}
                      size="small"
                      sx={{ 
                        bgcolor: rarityConfig[selectedAchievement.rarity].color, 
                        color: 'white'
                      }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setSelectedAchievement(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedAchievement.description}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <StarIcon color="warning" />
                <Typography variant="body2">
                  奖励积分: {selectedAchievement.points}
                </Typography>
              </Box>
              
              {achievements.some(a => a.id === selectedAchievement.id && a.unlocked) ? (
                <Chip label="已获得" color="success" />
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    完成进度:
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getAchievementProgress(selectedAchievement)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* 新成就庆祝动画 */}
      <Dialog
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            color: 'white',
            textAlign: 'center',
            p: 3
          }
        }}
      >
        {newAchievement && (
          <Zoom in={showCelebration}>
            <DialogContent>
              <Typography variant="h4" gutterBottom>
                🎉 恭喜！
              </Typography>
              <Typography variant="h3" sx={{ mb: 2 }}>
                {newAchievement.icon}
              </Typography>
              <Typography variant="h5" gutterBottom>
                获得新成就
              </Typography>
              <Typography variant="h6" gutterBottom>
                {newAchievement.name}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {newAchievement.description}
              </Typography>
              <Chip
                label={`+${newAchievement.points} 积分`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </DialogContent>
          </Zoom>
        )}
      </Dialog>
    </Box>
  );
};

export default AchievementSystem;
