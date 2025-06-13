// 学习相关工具函数
const CommonUtils = require('./common.js')

const LearningUtils = {
  // 生成模拟学习统计数据
  generateMockStats: function() {
    return {
      totalDays: CommonUtils.getRandomNumber(30, 130),
      totalHours: CommonUtils.getRandomNumber(50, 250),
      totalPoints: CommonUtils.getRandomNumber(1000, 6000),
      currentStreak: CommonUtils.getRandomNumber(5, 35)
    }
  },

  // 生成模拟学习进度数据
  generateMockProgress: function() {
    return [
      {
        id: 1,
        icon: '📚',
        name: '儒家思想学习',
        description: '深入学习儒家核心理念',
        progress: 0.75,
        current: 15,
        total: 20,
        category: '概念学习'
      },
      {
        id: 2,
        icon: '💬',
        name: 'AI对话交流',
        description: '与古代先贤深度对话',
        progress: 0.60,
        current: 12,
        total: 20,
        category: 'AI对话'
      },
      {
        id: 3,
        icon: '📖',
        name: '经典文献阅读',
        description: '阅读传统文化经典',
        progress: 0.40,
        current: 8,
        total: 20,
        category: '经典阅读'
      }
    ]
  },

  // 生成模拟成就数据
  generateMockAchievements: function() {
    return [
      {
        id: 1,
        icon: '🎓',
        name: '初学者',
        description: '完成首次学习',
        unlocked: true,
        unlockedDate: '2024-01-15'
      },
      {
        id: 2,
        icon: '📚',
        name: '博览群书',
        description: '阅读10本经典',
        unlocked: true,
        unlockedDate: '2024-02-20'
      },
      {
        id: 3,
        icon: '💬',
        name: '对话达人',
        description: '与AI对话100次',
        unlocked: false,
        current: 65,
        required: 100
      },
      {
        id: 4,
        icon: '🏆',
        name: '文化专家',
        description: '掌握50个核心概念',
        unlocked: false,
        current: 32,
        required: 50
      }
    ]
  },

  // 生成概念推荐数据
  generateConceptRecommendations: function() {
    return [
      {
        id: 1,
        concept: '中庸',
        reason: '基于您的学习历史推荐',
        difficulty: '中级',
        estimated_time: '2小时'
      },
      {
        id: 2,
        concept: '格物致知',
        reason: '与您已学概念相关',
        difficulty: '高级',
        estimated_time: '3小时'
      }
    ]
  },

  // 生成经典推荐数据
  generateClassicsRecommendations: function() {
    return [
      {
        id: 1,
        classic: '大学',
        description: '儒家经典，修身治国之道',
        difficulty: '中级',
        estimated_time: '4小时'
      },
      {
        id: 2,
        classic: '中庸',
        description: '中庸之道的深刻阐述',
        difficulty: '高级',
        estimated_time: '5小时'
      }
    ]
  },

  // 生成对话推荐数据
  generateDialogueRecommendations: function() {
    return [
      {
        id: 1,
        character: '孔子',
        topic: '教育理念探讨',
        difficulty: '初级',
        estimated_time: '30分钟'
      },
      {
        id: 2,
        character: '老子',
        topic: '道法自然的智慧',
        difficulty: '中级',
        estimated_time: '45分钟'
      }
    ]
  },

  // 生成今日计划数据
  generateTodayPlan: function() {
    return [
      {
        id: 1,
        title: '学习"仁"的概念',
        description: '深入理解儒家核心思想',
        estimatedTime: '30分钟',
        completed: false
      },
      {
        id: 2,
        title: '与孔子对话',
        description: '探讨教育理念',
        estimatedTime: '20分钟',
        completed: true
      },
      {
        id: 3,
        title: '阅读《论语》片段',
        description: '学而篇第一章',
        estimatedTime: '25分钟',
        completed: false
      }
    ]
  },

  // 生成历史记录数据
  generateRecentHistory: function() {
    return [
      {
        id: 1,
        icon: '📷',
        title: 'OCR识别古籍',
        description: '识别了《论语》文本',
        time: '2小时前',
        points: 10
      },
      {
        id: 2,
        icon: '💬',
        title: '与孔子对话',
        description: '讨论了教育理念',
        time: '昨天 15:30',
        points: 15
      },
      {
        id: 3,
        icon: '🧠',
        title: '学习概念"仁"',
        description: '完成了概念分析',
        time: '昨天 10:20',
        points: 20
      }
    ]
  },

  // 切换计划项目状态
  togglePlanItemStatus: function(todayPlan, itemId) {
    return todayPlan.map(function(item) {
      if (item.id === itemId) {
        return Object.assign({}, item, { completed: !item.completed })
      }
      return item
    })
  },

  // 格式化成就描述
  formatAchievementDescription: function(achievement) {
    let description = achievement.description
    if (achievement.unlocked) {
      description += '\n解锁时间: ' + achievement.unlockedDate
    } else {
      description += '\n进度: ' + achievement.current + '/' + achievement.required
    }
    return description
  },

  // 计算学习进度百分比
  calculateProgressPercentage: function(current, total) {
    if (total === 0) return 0
    return Math.round((current / total) * 100)
  },

  // 获取难度颜色
  getDifficultyColor: function(difficulty) {
    const colors = {
      '初级': '#52c41a',
      '中级': '#faad14',
      '高级': '#f5222d'
    }
    return colors[difficulty] || '#1890ff'
  },

  // 格式化学习时间
  formatStudyTime: function(minutes) {
    if (minutes < 60) {
      return minutes + '分钟'
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return hours + '小时'
    }
    return hours + '小时' + remainingMinutes + '分钟'
  },

  // 计算学习效率
  calculateEfficiency: function(totalHours, totalDays) {
    if (totalDays === 0) return 0
    return Math.round((totalHours / totalDays) * 10) / 10
  },

  // 获取学习建议
  getLearningAdvice: function(stats) {
    const efficiency = this.calculateEfficiency(stats.totalHours, stats.totalDays)
    
    if (efficiency < 0.5) {
      return '建议增加每日学习时间，保持学习连续性'
    } else if (efficiency < 1.0) {
      return '学习进度良好，可以尝试更有挑战性的内容'
    } else {
      return '学习效率很高，继续保持这种节奏'
    }
  }
}

module.exports = LearningUtils
