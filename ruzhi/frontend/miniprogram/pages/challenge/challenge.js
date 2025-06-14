// AI典籍问答挑战页面
const app = getApp()
const { aiService } = require('../../utils/ai.js')

Page({
  data: {
    // 当前视图状态
    currentView: 'modes', // modes, topics, challenge, result, leaderboard
    
    // 用户统计
    userStats: {
      totalScore: 0,
      level: 1,
      streak: 0,
      totalChallenges: 0,
      bestScore: 0
    },
    
    // 挑战模式
    challengeModes: [
      {
        id: 'quick',
        title: '快速挑战',
        description: '10题快速问答',
        icon: '⚡',
        difficulty: 'easy',
        difficultyText: '简单',
        baseReward: 10,
        timeLimit: 30,
        questionCount: 10,
        locked: false
      },
      {
        id: 'classic',
        title: '经典模式',
        description: '20题深度挑战',
        icon: '📚',
        difficulty: 'medium',
        difficultyText: '中等',
        baseReward: 25,
        timeLimit: 60,
        questionCount: 20,
        locked: false
      },
      {
        id: 'master',
        title: '大师挑战',
        description: '30题终极考验',
        icon: '👑',
        difficulty: 'hard',
        difficultyText: '困难',
        baseReward: 50,
        timeLimit: 90,
        questionCount: 30,
        locked: true,
        unlockCondition: '需要等级5'
      },
      {
        id: 'daily',
        title: '每日挑战',
        description: '每日限定题目',
        icon: '📅',
        difficulty: 'medium',
        difficultyText: '中等',
        baseReward: 30,
        timeLimit: 45,
        questionCount: 15,
        locked: false,
        isDaily: true
      }
    ],
    
    // 题目类型
    topicCategories: [
      {
        id: 'lunyu',
        title: '论语',
        subtitle: '儒家经典',
        image: '/images/classics/lunyu.jpg',
        questionCount: 100,
        bestScore: 0,
        isNew: false
      },
      {
        id: 'daodejing',
        title: '道德经',
        subtitle: '道家智慧',
        image: '/images/classics/daodejing.jpg',
        questionCount: 81,
        bestScore: 0,
        isNew: false
      },
      {
        id: 'mengzi',
        title: '孟子',
        subtitle: '性善论',
        image: '/images/classics/mengzi.jpg',
        questionCount: 80,
        bestScore: 0,
        isNew: true
      },
      {
        id: 'zhuangzi',
        title: '庄子',
        subtitle: '逍遥游',
        image: '/images/classics/zhuangzi.jpg',
        questionCount: 60,
        bestScore: 0,
        isNew: false
      }
    ],
    
    // 当前挑战状态
    selectedMode: null,
    selectedTopic: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    currentQuestion: null,
    selectedOption: null,
    showResult: false,
    currentScore: 0,
    timeLimit: 0,
    remainingTime: 0,
    timer: null,
    canSkip: true,
    skipCount: 0,
    maxSkips: 3,
    
    // 挑战结果
    finalScore: 0,
    accuracy: 0,
    usedTime: 0,
    ranking: 0,
    unlockedAchievements: [],
    wrongQuestions: [],
    
    // 排行榜
    leaderboardType: 'weekly',
    leaderboardTabs: [
      { type: 'daily', name: '今日' },
      { type: 'weekly', name: '本周' },
      { type: 'monthly', name: '本月' },
      { type: 'all', name: '总榜' }
    ],
    leaderboardData: [],
    
    // 状态
    loading: false,
    loadingText: '加载中...'
  },

  onLoad: function(options) {
    console.log('AI典籍问答挑战页面加载')
    this.loadUserStats()
    this.checkDailyChallenge()
  },

  onShow: function() {
    this.refreshUserStats()
  },

  // 加载用户统计数据
  loadUserStats: function() {
    try {
      const stats = wx.getStorageSync('challenge_stats') || {
        totalScore: 0,
        level: 1,
        streak: 0,
        totalChallenges: 0,
        bestScore: 0
      }
      
      // 计算等级
      stats.level = Math.floor(stats.totalScore / 1000) + 1
      
      this.setData({ userStats: stats })
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  },

  // 刷新用户统计
  refreshUserStats: function() {
    this.loadUserStats()
    this.updateTopicBestScores()
  },

  // 更新题目类型最佳成绩
  updateTopicBestScores: function() {
    try {
      const bestScores = wx.getStorageSync('topic_best_scores') || {}
      const topics = this.data.topicCategories.map(topic => ({
        ...topic,
        bestScore: bestScores[topic.id] || 0
      }))
      
      this.setData({ topicCategories: topics })
    } catch (error) {
      console.error('更新最佳成绩失败:', error)
    }
  },

  // 检查每日挑战状态
  checkDailyChallenge: function() {
    try {
      const today = new Date().toDateString()
      const dailyStatus = wx.getStorageSync('daily_challenge_status') || {}
      
      const modes = this.data.challengeModes.map(mode => {
        if (mode.isDaily) {
          mode.completed = dailyStatus[today] || false
          mode.description = mode.completed ? '今日已完成' : '每日限定题目'
        }
        return mode
      })
      
      this.setData({ challengeModes: modes })
    } catch (error) {
      console.error('检查每日挑战失败:', error)
    }
  },

  // 选择挑战模式
  onModeSelect: function(e) {
    const mode = e.currentTarget.dataset.mode
    
    if (mode.locked) {
      wx.showToast({
        title: mode.unlockCondition,
        icon: 'none'
      })
      return
    }
    
    if (mode.isDaily && mode.completed) {
      wx.showToast({
        title: '今日挑战已完成',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      selectedMode: mode,
      currentView: 'topics'
    })
  },

  // 选择题目类型
  onTopicSelect: function(e) {
    const topic = e.currentTarget.dataset.topic
    
    this.setData({
      selectedTopic: topic,
      loading: true,
      loadingText: 'AI正在生成题目...'
    })
    
    this.startChallenge()
  },

  // 开始挑战
  startChallenge: async function() {
    try {
      const { selectedMode, selectedTopic } = this.data
      
      // 生成题目
      const questions = await this.generateQuestions(selectedMode, selectedTopic)
      
      this.setData({
        currentView: 'challenge',
        totalQuestions: questions.length,
        currentQuestionIndex: 0,
        currentQuestion: questions[0],
        currentScore: 0,
        selectedOption: null,
        showResult: false,
        timeLimit: selectedMode.timeLimit,
        remainingTime: selectedMode.timeLimit,
        skipCount: 0,
        loading: false,
        questions: questions
      })
      
      // 开始计时
      this.startTimer()
      
    } catch (error) {
      console.error('开始挑战失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '生成题目失败',
        icon: 'none'
      })
    }
  },

  // 生成题目
  generateQuestions: async function(mode, topic) {
    try {
      // 尝试使用AI生成题目
      const result = await aiService.generateQuizQuestions({
        topic: topic.id,
        difficulty: mode.difficulty,
        count: mode.questionCount,
        timeLimit: mode.timeLimit
      })
      
      if (result.success) {
        return result.questions
      } else {
        throw new Error('AI生成失败')
      }
    } catch (error) {
      console.error('AI生成题目失败，使用模拟数据:', error)
      return this.generateMockQuestions(mode, topic)
    }
  },

  // 生成模拟题目
  generateMockQuestions: function(mode, topic) {
    const mockQuestions = {
      lunyu: [
        {
          id: 1,
          type: '理解题',
          source: '论语·学而',
          question: '孔子说"学而时习之，不亦说乎"中的"说"字应该读作什么？',
          quote: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？"',
          author: '孔子',
          options: [
            { text: 'shuō（说话）', correct: false },
            { text: 'yuè（喜悦）', correct: true },
            { text: 'tuō（脱落）', correct: false },
            { text: 'shuì（劝说）', correct: false }
          ],
          explanation: '"说"在这里通"悦"，表示喜悦、高兴的意思。整句话的意思是：学习知识并时常温习，不是很快乐的事情吗？',
          difficulty: 'easy',
          points: 10
        },
        {
          id: 2,
          type: '应用题',
          source: '论语·为政',
          question: '孔子提出的"温故而知新"体现了什么学习方法？',
          quote: '子曰："温故而知新，可以为师矣。"',
          author: '孔子',
          options: [
            { text: '死记硬背', correct: false },
            { text: '温习旧知识，获得新理解', correct: true },
            { text: '只学新知识', correct: false },
            { text: '机械重复', correct: false }
          ],
          explanation: '"温故而知新"强调在复习已学知识的过程中获得新的理解和感悟，这是一种深度学习的方法。',
          difficulty: 'medium',
          points: 15
        }
      ],
      daodejing: [
        {
          id: 1,
          type: '理解题',
          source: '道德经·第一章',
          question: '"道可道，非常道"中第一个"道"字的含义是什么？',
          quote: '道可道，非常道。名可名，非常名。',
          author: '老子',
          options: [
            { text: '道路', correct: false },
            { text: '说出、表达', correct: true },
            { text: '道理', correct: false },
            { text: '方法', correct: false }
          ],
          explanation: '第一个"道"是动词，意思是"说出"、"表达"。整句意思是：可以说出来的道，就不是永恒不变的道。',
          difficulty: 'medium',
          points: 15
        }
      ]
    }
    
    const topicQuestions = mockQuestions[topic.id] || mockQuestions.lunyu
    return topicQuestions.slice(0, mode.questionCount)
  },

  // 开始计时
  startTimer: function() {
    if (this.data.timeLimit <= 0) return
    
    const timer = setInterval(() => {
      const remainingTime = this.data.remainingTime - 1
      
      if (remainingTime <= 0) {
        clearInterval(timer)
        this.onTimeUp()
      } else {
        this.setData({ remainingTime })
      }
    }, 1000)
    
    this.setData({ timer })
  },

  // 时间到
  onTimeUp: function() {
    wx.showToast({
      title: '时间到！',
      icon: 'none'
    })
    
    // 自动提交当前答案
    this.onSubmitAnswer()
  },

  // 选择选项
  onOptionSelect: function(e) {
    if (this.data.showResult) return
    
    const index = e.currentTarget.dataset.index
    this.setData({ selectedOption: index })
  },

  // 提交答案
  onSubmitAnswer: function() {
    if (this.data.selectedOption === null) {
      wx.showToast({
        title: '请选择答案',
        icon: 'none'
      })
      return
    }
    
    const { currentQuestion, selectedOption } = this.data
    const isCorrect = currentQuestion.options[selectedOption].correct
    
    // 计算得分
    let points = 0
    if (isCorrect) {
      points = currentQuestion.points || 10
      // 时间奖励
      if (this.data.remainingTime > this.data.timeLimit * 0.5) {
        points += 5
      }
    }
    
    this.setData({
      showResult: true,
      currentScore: this.data.currentScore + points
    })
    
    // 记录答题结果
    this.recordAnswer(isCorrect, points)
  },

  // 记录答题结果
  recordAnswer: function(isCorrect, points) {
    // 这里可以记录详细的答题数据用于分析
    console.log('答题记录:', {
      questionId: this.data.currentQuestion.id,
      isCorrect,
      points,
      timeUsed: this.data.timeLimit - this.data.remainingTime
    })
  },

  // 下一题
  onNextQuestion: function() {
    const nextIndex = this.data.currentQuestionIndex + 1
    
    if (nextIndex >= this.data.totalQuestions) {
      this.finishChallenge()
      return
    }
    
    this.setData({
      currentQuestionIndex: nextIndex,
      currentQuestion: this.data.questions[nextIndex],
      selectedOption: null,
      showResult: false,
      remainingTime: this.data.timeLimit
    })
  },

  // 跳过题目
  onSkipQuestion: function() {
    if (this.data.skipCount >= this.data.maxSkips) {
      wx.showToast({
        title: '跳过次数已用完',
        icon: 'none'
      })
      return
    }
    
    this.setData({
      skipCount: this.data.skipCount + 1
    })
    
    this.onNextQuestion()
  },

  // 完成挑战
  finishChallenge: function() {
    // 清除计时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    
    const finalScore = this.data.currentScore
    const accuracy = Math.round((finalScore / (this.data.totalQuestions * 15)) * 100)
    const usedTime = (this.data.totalQuestions * this.data.timeLimit) - this.data.remainingTime
    
    // 更新用户统计
    this.updateUserStats(finalScore)
    
    // 检查成就
    const achievements = this.checkAchievements(finalScore, accuracy)
    
    this.setData({
      currentView: 'result',
      finalScore,
      accuracy,
      usedTime,
      ranking: Math.floor(Math.random() * 50) + 10, // 模拟排名
      unlockedAchievements: achievements
    })
  },

  // 更新用户统计
  updateUserStats: function(score) {
    try {
      let stats = wx.getStorageSync('challenge_stats') || {
        totalScore: 0,
        level: 1,
        streak: 0,
        totalChallenges: 0,
        bestScore: 0
      }
      
      stats.totalScore += score
      stats.totalChallenges += 1
      stats.bestScore = Math.max(stats.bestScore, score)
      stats.level = Math.floor(stats.totalScore / 1000) + 1
      
      wx.setStorageSync('challenge_stats', stats)
      this.setData({ userStats: stats })
      
      // 更新题目类型最佳成绩
      const topicScores = wx.getStorageSync('topic_best_scores') || {}
      const topicId = this.data.selectedTopic.id
      topicScores[topicId] = Math.max(topicScores[topicId] || 0, score)
      wx.setStorageSync('topic_best_scores', topicScores)
      
    } catch (error) {
      console.error('更新用户统计失败:', error)
    }
  },

  // 检查成就
  checkAchievements: function(score, accuracy) {
    const achievements = []
    
    if (score >= 100) {
      achievements.push({ id: 'score_100', name: '百分达人', icon: '💯' })
    }
    
    if (accuracy >= 90) {
      achievements.push({ id: 'accuracy_90', name: '精准射手', icon: '🎯' })
    }
    
    if (this.data.userStats.totalChallenges >= 10) {
      achievements.push({ id: 'challenge_10', name: '挑战者', icon: '⚔️' })
    }
    
    return achievements
  },

  // 返回模式选择
  onBackToModes: function() {
    // 清除计时器
    if (this.data.timer) {
      clearInterval(this.data.timer)
    }
    
    this.setData({
      currentView: 'modes',
      selectedMode: null,
      selectedTopic: null
    })
  },

  // 重新开始挑战
  onRestartChallenge: function() {
    this.setData({
      currentView: 'topics'
    })
  },

  // 分享结果
  onShareResult: function() {
    // 触发分享
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 查看排行榜
  onViewLeaderboard: function() {
    this.setData({
      currentView: 'leaderboard'
    })
    this.loadLeaderboard()
  },

  // 加载排行榜
  loadLeaderboard: function() {
    // 模拟排行榜数据
    const mockData = [
      { rank: 1, userId: '1', nickname: '文化达人', avatar: '/images/avatar1.png', level: 8, score: 2580, isCurrentUser: false },
      { rank: 2, userId: '2', nickname: '古籍专家', avatar: '/images/avatar2.png', level: 7, score: 2340, isCurrentUser: false },
      { rank: 3, userId: '3', nickname: '国学爱好者', avatar: '/images/avatar3.png', level: 6, score: 2100, isCurrentUser: true }
    ]
    
    this.setData({ leaderboardData: mockData })
  },

  // 切换排行榜类型
  onLeaderboardTabChange: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ leaderboardType: type })
    this.loadLeaderboard()
  },

  // 查看历史记录
  onViewHistory: function() {
    wx.navigateTo({
      url: '/pages/challenge/history/history'
    })
  },

  // 查看成就
  onViewAchievements: function() {
    wx.navigateTo({
      url: '/pages/achievements/achievements'
    })
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: `我在儒智挑战中获得了${this.data.finalScore}分！`,
      desc: '一起来挑战AI典籍问答，学习传统文化吧！',
      path: '/pages/challenge/challenge',
      imageUrl: '/images/share/challenge.png'
    }
  }
})
