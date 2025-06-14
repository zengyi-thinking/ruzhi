/**
 * 跨平台数据同步服务
 * 支持小程序、Web端、Android端的数据同步
 */

const { v4: uuidv4 } = require('uuid')
const redis = require('../config/redis')
const User = require('../models/User')
const LearningProgress = require('../models/LearningProgress')
const AIConfig = require('../models/AIConfig')
const ChatHistory = require('../models/ChatHistory')

class SyncService {
  constructor() {
    this.syncChannels = new Map()
    this.conflictResolvers = new Map()
    this.initializeConflictResolvers()
  }

  /**
   * 初始化冲突解决器
   */
  initializeConflictResolvers() {
    // 用户信息冲突解决：使用最新时间戳
    this.conflictResolvers.set('userInfo', (local, remote) => {
      return local.updatedAt > remote.updatedAt ? local : remote
    })

    // 学习进度冲突解决：合并进度，取最大值
    this.conflictResolvers.set('learningProgress', (local, remote) => {
      const merged = { ...local }
      Object.keys(remote).forEach(key => {
        if (key.endsWith('Progress') || key.endsWith('Count')) {
          merged[key] = Math.max(local[key] || 0, remote[key] || 0)
        } else if (key === 'favoriteBooks') {
          merged[key] = [...new Set([...(local[key] || []), ...(remote[key] || [])])]
        } else if (key === 'achievements') {
          merged[key] = [...new Set([...(local[key] || []), ...(remote[key] || [])])]
        } else {
          merged[key] = local.updatedAt > remote.updatedAt ? local[key] : remote[key]
        }
      })
      return merged
    })

    // AI配置冲突解决：使用最新配置
    this.conflictResolvers.set('aiConfig', (local, remote) => {
      return local.updatedAt > remote.updatedAt ? local : remote
    })

    // 聊天历史冲突解决：合并历史记录
    this.conflictResolvers.set('chatHistory', (local, remote) => {
      const allMessages = [...(local.messages || []), ...(remote.messages || [])]
      const uniqueMessages = allMessages.reduce((acc, msg) => {
        const existing = acc.find(m => m.id === msg.id)
        if (!existing) {
          acc.push(msg)
        }
        return acc
      }, [])
      
      return {
        ...local,
        messages: uniqueMessages.sort((a, b) => a.timestamp - b.timestamp),
        updatedAt: Math.max(local.updatedAt || 0, remote.updatedAt || 0)
      }
    })
  }

  /**
   * 用户登录时同步数据
   */
  async syncOnLogin(userId, platform, deviceId) {
    try {
      console.log(`用户 ${userId} 在 ${platform} 平台登录，开始数据同步`)

      // 获取服务器端数据
      const serverData = await this.getServerData(userId)
      
      // 创建同步会话
      const syncSession = {
        id: uuidv4(),
        userId,
        platform,
        deviceId,
        startTime: Date.now(),
        status: 'active'
      }

      // 存储同步会话
      await redis.setex(`sync:session:${syncSession.id}`, 3600, JSON.stringify(syncSession))
      await redis.sadd(`sync:user:${userId}`, syncSession.id)

      return {
        success: true,
        syncSessionId: syncSession.id,
        serverData,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('登录同步失败:', error)
      throw new Error('数据同步失败')
    }
  }

  /**
   * 获取服务器端数据
   */
  async getServerData(userId) {
    try {
      const [user, learningProgress, aiConfig, chatHistory] = await Promise.all([
        User.findById(userId),
        LearningProgress.findOne({ userId }),
        AIConfig.findOne({ userId }),
        ChatHistory.find({ userId }).sort({ updatedAt: -1 }).limit(100)
      ])

      return {
        userInfo: user ? {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          level: user.level,
          points: user.points,
          joinDate: user.joinDate,
          updatedAt: user.updatedAt.getTime()
        } : null,
        
        learningProgress: learningProgress ? {
          totalDays: learningProgress.totalDays,
          totalHours: learningProgress.totalHours,
          completedChapters: learningProgress.completedChapters,
          ocrCount: learningProgress.ocrCount,
          chatCount: learningProgress.chatCount,
          favoriteBooks: learningProgress.favoriteBooks,
          readingProgress: learningProgress.readingProgress,
          achievements: learningProgress.achievements,
          streak: learningProgress.streak,
          lastCheckinDate: learningProgress.lastCheckinDate,
          updatedAt: learningProgress.updatedAt.getTime()
        } : null,
        
        aiConfig: aiConfig ? {
          apiKey: aiConfig.apiKey,
          connected: aiConfig.connected,
          features: aiConfig.features,
          usage: aiConfig.usage,
          updatedAt: aiConfig.updatedAt.getTime()
        } : null,
        
        chatHistory: chatHistory.map(chat => ({
          character: chat.character,
          messages: chat.messages,
          updatedAt: chat.updatedAt.getTime()
        }))
      }
    } catch (error) {
      console.error('获取服务器数据失败:', error)
      throw error
    }
  }

  /**
   * 上传本地数据到服务器
   */
  async uploadLocalData(syncSessionId, localData) {
    try {
      const session = await this.getSyncSession(syncSessionId)
      if (!session) {
        throw new Error('同步会话不存在')
      }

      const { userId } = session
      console.log(`上传用户 ${userId} 的本地数据`)

      // 获取服务器当前数据
      const serverData = await this.getServerData(userId)

      // 解决数据冲突
      const mergedData = await this.resolveConflicts(localData, serverData)

      // 保存合并后的数据
      await this.saveServerData(userId, mergedData)

      // 更新同步会话状态
      session.lastSyncTime = Date.now()
      await redis.setex(`sync:session:${syncSessionId}`, 3600, JSON.stringify(session))

      return {
        success: true,
        mergedData,
        conflicts: this.getConflictSummary(localData, serverData, mergedData),
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('上传本地数据失败:', error)
      throw error
    }
  }

  /**
   * 解决数据冲突
   */
  async resolveConflicts(localData, serverData) {
    const mergedData = {}

    for (const [dataType, localValue] of Object.entries(localData)) {
      const serverValue = serverData[dataType]
      const resolver = this.conflictResolvers.get(dataType)

      if (!serverValue) {
        // 服务器没有数据，直接使用本地数据
        mergedData[dataType] = localValue
      } else if (!localValue) {
        // 本地没有数据，使用服务器数据
        mergedData[dataType] = serverValue
      } else if (resolver) {
        // 使用冲突解决器
        mergedData[dataType] = resolver(localValue, serverValue)
      } else {
        // 默认使用最新时间戳的数据
        const localTime = localValue.updatedAt || 0
        const serverTime = serverValue.updatedAt || 0
        mergedData[dataType] = localTime > serverTime ? localValue : serverValue
      }
    }

    // 处理服务器独有的数据
    for (const [dataType, serverValue] of Object.entries(serverData)) {
      if (!localData[dataType]) {
        mergedData[dataType] = serverValue
      }
    }

    return mergedData
  }

  /**
   * 保存合并后的数据到服务器
   */
  async saveServerData(userId, mergedData) {
    try {
      const promises = []

      // 保存用户信息
      if (mergedData.userInfo) {
        promises.push(
          User.findByIdAndUpdate(userId, {
            ...mergedData.userInfo,
            updatedAt: new Date()
          }, { upsert: true })
        )
      }

      // 保存学习进度
      if (mergedData.learningProgress) {
        promises.push(
          LearningProgress.findOneAndUpdate(
            { userId },
            { ...mergedData.learningProgress, userId, updatedAt: new Date() },
            { upsert: true }
          )
        )
      }

      // 保存AI配置
      if (mergedData.aiConfig) {
        promises.push(
          AIConfig.findOneAndUpdate(
            { userId },
            { ...mergedData.aiConfig, userId, updatedAt: new Date() },
            { upsert: true }
          )
        )
      }

      // 保存聊天历史
      if (mergedData.chatHistory && Array.isArray(mergedData.chatHistory)) {
        const chatPromises = mergedData.chatHistory.map(chat =>
          ChatHistory.findOneAndUpdate(
            { userId, character: chat.character },
            { ...chat, userId, updatedAt: new Date() },
            { upsert: true }
          )
        )
        promises.push(...chatPromises)
      }

      await Promise.all(promises)
      console.log(`用户 ${userId} 数据保存成功`)
    } catch (error) {
      console.error('保存服务器数据失败:', error)
      throw error
    }
  }

  /**
   * 获取同步会话
   */
  async getSyncSession(syncSessionId) {
    try {
      const sessionData = await redis.get(`sync:session:${syncSessionId}`)
      return sessionData ? JSON.parse(sessionData) : null
    } catch (error) {
      console.error('获取同步会话失败:', error)
      return null
    }
  }

  /**
   * 获取冲突摘要
   */
  getConflictSummary(localData, serverData, mergedData) {
    const conflicts = []

    for (const dataType of Object.keys(localData)) {
      const local = localData[dataType]
      const server = serverData[dataType]
      const merged = mergedData[dataType]

      if (local && server && JSON.stringify(local) !== JSON.stringify(server)) {
        conflicts.push({
          dataType,
          resolution: JSON.stringify(merged) === JSON.stringify(local) ? 'local' : 
                     JSON.stringify(merged) === JSON.stringify(server) ? 'server' : 'merged',
          localTimestamp: local.updatedAt || 0,
          serverTimestamp: server.updatedAt || 0
        })
      }
    }

    return conflicts
  }

  /**
   * 实时数据同步
   */
  async syncRealtime(userId, dataType, data) {
    try {
      // 广播数据变更到所有活跃会话
      const activeSessions = await redis.smembers(`sync:user:${userId}`)
      
      const syncMessage = {
        type: 'data_update',
        dataType,
        data,
        timestamp: Date.now(),
        userId
      }

      for (const sessionId of activeSessions) {
        const session = await this.getSyncSession(sessionId)
        if (session && session.status === 'active') {
          await redis.publish(`sync:channel:${sessionId}`, JSON.stringify(syncMessage))
        }
      }

      console.log(`实时同步数据到 ${activeSessions.length} 个会话`)
    } catch (error) {
      console.error('实时同步失败:', error)
    }
  }

  /**
   * 清理过期的同步会话
   */
  async cleanupExpiredSessions() {
    try {
      const allUsers = await redis.keys('sync:user:*')
      
      for (const userKey of allUsers) {
        const userId = userKey.split(':')[2]
        const sessions = await redis.smembers(userKey)
        
        for (const sessionId of sessions) {
          const session = await this.getSyncSession(sessionId)
          
          // 清理超过24小时的会话
          if (!session || Date.now() - session.startTime > 24 * 60 * 60 * 1000) {
            await redis.srem(userKey, sessionId)
            await redis.del(`sync:session:${sessionId}`)
          }
        }
      }
      
      console.log('同步会话清理完成')
    } catch (error) {
      console.error('清理同步会话失败:', error)
    }
  }
}

module.exports = new SyncService()
