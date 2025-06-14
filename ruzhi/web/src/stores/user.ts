import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserInfo {
  id: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  points: number
  joinDate: string
  lastLoginDate: string
}

interface LearningStats {
  totalDays: number
  totalHours: number
  completedChapters: number
  ocrCount: number
  chatCount: number
  favoriteBooks: string[]
  readingProgress: Record<string, number>
  achievements: string[]
  streak: number
  lastCheckinDate: string
}

interface AIConfig {
  apiKey: string
  connected: boolean
  lastTestTime: string
  errorMessage: string
  features: {
    historicalChat: boolean
    ocrExplanation: boolean
    knowledgeQA: boolean
    smartSearch: boolean
    storyGeneration: boolean
    interactiveLearning: boolean
    deepAnalysis: boolean
  }
  usage: {
    todayCalls: number
    monthCalls: number
    totalCalls: number
    lastUpdateDate: string
    lastUpdateMonth: number
  }
}

interface UserState {
  // 用户信息
  userInfo: UserInfo | null
  isLoggedIn: boolean
  
  // 学习数据
  learningStats: LearningStats
  
  // AI配置
  aiConfig: AIConfig
  
  // 用户偏好
  userPreferences: {
    favoriteCategories: string[]
    interests: string[]
    learningGoals: string[]
    studyTime: string
    difficulty: 'easy' | 'medium' | 'hard'
  }
  
  // Actions
  login: (userInfo: UserInfo) => void
  logout: () => void
  updateUserInfo: (info: Partial<UserInfo>) => void
  updateLearningStats: (stats: Partial<LearningStats>) => void
  updateAIConfig: (config: Partial<AIConfig>) => void
  updateUserPreferences: (preferences: Partial<UserState['userPreferences']>) => void
  
  // 学习相关操作
  addReadingProgress: (bookId: string, progress: number) => void
  addFavoriteBook: (bookId: string) => void
  removeFavoriteBook: (bookId: string) => void
  addAchievement: (achievementId: string) => void
  updateStreak: () => void
  recordOCRUsage: () => void
  recordChatUsage: () => void
  recordAIUsage: () => void
}

const initialLearningStats: LearningStats = {
  totalDays: 0,
  totalHours: 0,
  completedChapters: 0,
  ocrCount: 0,
  chatCount: 0,
  favoriteBooks: [],
  readingProgress: {},
  achievements: [],
  streak: 0,
  lastCheckinDate: ''
}

const initialAIConfig: AIConfig = {
  apiKey: '',
  connected: false,
  lastTestTime: '',
  errorMessage: '',
  features: {
    historicalChat: true,
    ocrExplanation: true,
    knowledgeQA: true,
    smartSearch: true,
    storyGeneration: true,
    interactiveLearning: true,
    deepAnalysis: true
  },
  usage: {
    todayCalls: 0,
    monthCalls: 0,
    totalCalls: 0,
    lastUpdateDate: new Date().toDateString(),
    lastUpdateMonth: new Date().getMonth()
  }
}

const initialUserPreferences = {
  favoriteCategories: ['confucian'],
  interests: ['论语', '道德经'],
  learningGoals: ['提升文化素养'],
  studyTime: 'evening',
  difficulty: 'medium' as const
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      userInfo: null,
      isLoggedIn: false,
      learningStats: initialLearningStats,
      aiConfig: initialAIConfig,
      userPreferences: initialUserPreferences,
      
      // Actions
      login: (userInfo) => {
        set({
          userInfo: {
            ...userInfo,
            lastLoginDate: new Date().toISOString()
          },
          isLoggedIn: true
        })
      },
      
      logout: () => {
        set({
          userInfo: null,
          isLoggedIn: false
        })
      },
      
      updateUserInfo: (info) => {
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...info } : null
        }))
      },
      
      updateLearningStats: (stats) => {
        set((state) => ({
          learningStats: { ...state.learningStats, ...stats }
        }))
      },
      
      updateAIConfig: (config) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...config }
        }))
      },
      
      updateUserPreferences: (preferences) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences }
        }))
      },
      
      // 学习相关操作
      addReadingProgress: (bookId, progress) => {
        set((state) => ({
          learningStats: {
            ...state.learningStats,
            readingProgress: {
              ...state.learningStats.readingProgress,
              [bookId]: progress
            }
          }
        }))
      },
      
      addFavoriteBook: (bookId) => {
        set((state) => {
          const favoriteBooks = [...state.learningStats.favoriteBooks]
          if (!favoriteBooks.includes(bookId)) {
            favoriteBooks.push(bookId)
          }
          return {
            learningStats: {
              ...state.learningStats,
              favoriteBooks
            }
          }
        })
      },
      
      removeFavoriteBook: (bookId) => {
        set((state) => ({
          learningStats: {
            ...state.learningStats,
            favoriteBooks: state.learningStats.favoriteBooks.filter(id => id !== bookId)
          }
        }))
      },
      
      addAchievement: (achievementId) => {
        set((state) => {
          const achievements = [...state.learningStats.achievements]
          if (!achievements.includes(achievementId)) {
            achievements.push(achievementId)
          }
          return {
            learningStats: {
              ...state.learningStats,
              achievements
            }
          }
        })
      },
      
      updateStreak: () => {
        const today = new Date().toDateString()
        const { learningStats } = get()
        
        if (learningStats.lastCheckinDate !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toDateString()
          
          let newStreak = 1
          if (learningStats.lastCheckinDate === yesterdayStr) {
            newStreak = learningStats.streak + 1
          }
          
          set((state) => ({
            learningStats: {
              ...state.learningStats,
              streak: newStreak,
              lastCheckinDate: today,
              totalDays: state.learningStats.totalDays + 1
            }
          }))
        }
      },
      
      recordOCRUsage: () => {
        set((state) => ({
          learningStats: {
            ...state.learningStats,
            ocrCount: state.learningStats.ocrCount + 1
          }
        }))
      },
      
      recordChatUsage: () => {
        set((state) => ({
          learningStats: {
            ...state.learningStats,
            chatCount: state.learningStats.chatCount + 1
          }
        }))
      },
      
      recordAIUsage: () => {
        const today = new Date()
        const todayStr = today.toDateString()
        const currentMonth = today.getMonth()
        
        set((state) => {
          const usage = { ...state.aiConfig.usage }
          
          // 检查是否需要重置日统计
          if (usage.lastUpdateDate !== todayStr) {
            usage.todayCalls = 0
            usage.lastUpdateDate = todayStr
          }
          
          // 检查是否需要重置月统计
          if (usage.lastUpdateMonth !== currentMonth) {
            usage.monthCalls = 0
            usage.lastUpdateMonth = currentMonth
          }
          
          // 更新统计
          usage.todayCalls += 1
          usage.monthCalls += 1
          usage.totalCalls += 1
          
          return {
            aiConfig: {
              ...state.aiConfig,
              usage
            }
          }
        })
      }
    }),
    {
      name: 'ruzhi-user-store',
      partialize: (state) => ({
        userInfo: state.userInfo,
        isLoggedIn: state.isLoggedIn,
        learningStats: state.learningStats,
        aiConfig: state.aiConfig,
        userPreferences: state.userPreferences
      })
    }
  )
)
