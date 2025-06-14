import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // 应用状态
  isInitialized: boolean
  hasShownWelcome: boolean
  isMobile: boolean
  isOnline: boolean
  
  // 主题设置
  theme: 'light' | 'dark' | 'auto'
  
  // 用户偏好
  preferences: {
    language: 'zh-CN' | 'en-US'
    fontSize: 'small' | 'medium' | 'large'
    autoPlay: boolean
    notifications: boolean
    dataSync: boolean
  }
  
  // 应用配置
  config: {
    apiBaseUrl: string
    cdnBaseUrl: string
    version: string
    buildTime: string
  }
  
  // Actions
  initializeStore: () => void
  setInitialized: (initialized: boolean) => void
  setHasShownWelcome: (shown: boolean) => void
  setIsMobile: (mobile: boolean) => void
  setIsOnline: (online: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  updateConfig: (config: Partial<AppState['config']>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isInitialized: false,
      hasShownWelcome: false,
      isMobile: false,
      isOnline: navigator.onLine,
      theme: 'auto',
      
      preferences: {
        language: 'zh-CN',
        fontSize: 'medium',
        autoPlay: true,
        notifications: true,
        dataSync: true
      },
      
      config: {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
        cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL || '/assets',
        version: import.meta.env.VITE_APP_VERSION || '1.0.3',
        buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
      },
      
      // Actions
      initializeStore: () => {
        // 检测移动设备
        const checkMobile = () => {
          const userAgent = navigator.userAgent
          const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
          return mobileRegex.test(userAgent) || window.innerWidth < 768
        }
        
        // 监听网络状态
        const handleOnline = () => set({ isOnline: true })
        const handleOffline = () => set({ isOnline: false })
        
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        // 监听窗口大小变化
        const handleResize = () => {
          set({ isMobile: window.innerWidth < 768 })
        }
        
        window.addEventListener('resize', handleResize)
        
        set({
          isInitialized: true,
          isMobile: checkMobile(),
          isOnline: navigator.onLine
        })
        
        // 清理函数
        return () => {
          window.removeEventListener('online', handleOnline)
          window.removeEventListener('offline', handleOffline)
          window.removeEventListener('resize', handleResize)
        }
      },
      
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      
      setHasShownWelcome: (shown) => set({ hasShownWelcome: shown }),
      
      setIsMobile: (mobile) => set({ isMobile: mobile }),
      
      setIsOnline: (online) => set({ isOnline: online }),
      
      setTheme: (theme) => {
        set({ theme })
        
        // 应用主题到DOM
        const root = document.documentElement
        if (theme === 'dark') {
          root.classList.add('dark')
        } else if (theme === 'light') {
          root.classList.remove('dark')
        } else {
          // auto模式，根据系统偏好
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            root.classList.add('dark')
          } else {
            root.classList.remove('dark')
          }
        }
      },
      
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }))
      },
      
      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig }
        }))
      }
    }),
    {
      name: 'ruzhi-app-store',
      partialize: (state) => ({
        hasShownWelcome: state.hasShownWelcome,
        theme: state.theme,
        preferences: state.preferences
      })
    }
  )
)

// 监听系统主题变化
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    const { theme, setTheme } = useAppStore.getState()
    if (theme === 'auto') {
      setTheme('auto') // 重新应用auto主题
    }
  })
}
