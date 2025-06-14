import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { QueryClient, QueryClientProvider } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 页面组件
import Layout from '@/components/Layout'
import Loading from '@/components/Loading'
import ErrorBoundary from '@/components/ErrorBoundary'

// 懒加载页面
const Welcome = React.lazy(() => import('@/pages/Welcome'))
const Home = React.lazy(() => import('@/pages/Home'))
const OCR = React.lazy(() => import('@/pages/OCR'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const Classics = React.lazy(() => import('@/pages/Classics'))
const ClassicsDetail = React.lazy(() => import('@/pages/Classics/Detail'))
const Knowledge = React.lazy(() => import('@/pages/Knowledge'))
const Profile = React.lazy(() => import('@/pages/Profile'))
const Achievements = React.lazy(() => import('@/pages/Achievements'))

// 工具和服务
import { useAppStore } from '@/stores/app'
import { initializeApp } from '@/utils/app'
import '@/styles/global.css'

// 配置dayjs
dayjs.locale('zh-cn')

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      refetchOnWindowFocus: false
    }
  }
})

// Antd主题配置
const theme = {
  token: {
    colorPrimary: '#667eea',
    colorSuccess: '#27ae60',
    colorWarning: '#f39c12',
    colorError: '#e74c3c',
    colorInfo: '#3498db',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
  },
  components: {
    Button: {
      borderRadius: 20,
      controlHeight: 40
    },
    Card: {
      borderRadius: 16
    },
    Input: {
      borderRadius: 12,
      controlHeight: 40
    }
  }
}

const App: React.FC = () => {
  const { isInitialized, hasShownWelcome, initializeStore } = useAppStore()

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp()
        initializeStore()
      } catch (error) {
        console.error('应用初始化失败:', error)
      }
    }
    
    init()
  }, [initializeStore])

  if (!isInitialized) {
    return <Loading />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN} theme={theme}>
          <AntdApp>
            <Router>
              <AnimatePresence mode="wait">
                <Routes>
                  {/* 欢迎页面 */}
                  <Route 
                    path="/welcome" 
                    element={
                      <Suspense fallback={<Loading />}>
                        <Welcome />
                      </Suspense>
                    } 
                  />
                  
                  {/* 主应用布局 */}
                  <Route path="/" element={<Layout />}>
                    <Route 
                      index 
                      element={
                        hasShownWelcome ? (
                          <Suspense fallback={<Loading />}>
                            <Home />
                          </Suspense>
                        ) : (
                          <Navigate to="/welcome" replace />
                        )
                      } 
                    />
                    
                    <Route 
                      path="ocr" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <OCR />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="chat" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <Chat />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="classics" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <Classics />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="classics/:id" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <ClassicsDetail />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="knowledge" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <Knowledge />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="profile" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <Profile />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="achievements" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <Achievements />
                        </Suspense>
                      } 
                    />
                  </Route>
                  
                  {/* 404重定向 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Router>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
