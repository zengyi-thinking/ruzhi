/**
 * 知识图谱可视化服务
 * 提供儒家概念知识图谱的交互式探索与可视化功能
 */

const app = getApp()
const { BASE_URL } = require('../config/ai')

// 离线数据 - 核心概念关系
const OFFLINE_CONCEPTS = {
  'nodes': [
    {
      id: 'ren',
      name: '仁',
      category: 'core',
      description: '儒家思想的核心概念，意为"仁爱"、"仁德"，是儒家伦理的最高境界。',
      quotes: [
        { text: '仁者爱人', source: '《论语·颜渊》' },
        { text: '己欲立而立人，己欲达而达人', source: '《论语·雍也》' }
      ]
    },
    {
      id: 'yi',
      name: '义',
      category: 'core',
      description: '道德的准则和规范，是判断行为正当性的标准。',
      quotes: [
        { text: '见义不为，无勇也', source: '《论语·为政》' },
        { text: '义以为质', source: '《论语·卫灵公》' }
      ]
    },
    {
      id: 'li',
      name: '礼',
      category: 'core',
      description: '社会规范和行为准则，维系社会秩序的重要方式。',
      quotes: [
        { text: '不学礼，无以立', source: '《论语·季氏》' },
        { text: '克己复礼为仁', source: '《论语·颜渊》' }
      ]
    },
    {
      id: 'zhi',
      name: '智',
      category: 'core',
      description: '认知、理解和判断的能力，辨别是非的智慧。',
      quotes: [
        { text: '知者不惑', source: '《论语·子张》' },
        { text: '知之为知之，不知为不知', source: '《论语·为政》' }
      ]
    },
    {
      id: 'xin',
      name: '信',
      category: 'core',
      description: '诚实守信，言行一致的品德。',
      quotes: [
        { text: '人而无信，不知其可也', source: '《论语·为政》' },
        { text: '言必信，行必果', source: '《论语·子路》' }
      ]
    },
    {
      id: 'junzi',
      name: '君子',
      category: 'ideal',
      description: '儒家理想中的人格典范，道德修养高尚的人。',
      quotes: [
        { text: '君子坦荡荡，小人长戚戚', source: '《论语·述而》' },
        { text: '君子和而不同，小人同而不和', source: '《论语·子路》' }
      ]
    },
    {
      id: 'zhong',
      name: '忠',
      category: 'virtue',
      description: '尽心竭力，真诚待人。',
      quotes: [
        { text: '忠恕违道不远', source: '《论语·里仁》' }
      ]
    },
    {
      id: 'shu',
      name: '恕',
      category: 'virtue',
      description: '推己及人，体谅他人。',
      quotes: [
        { text: '己所不欲，勿施于人', source: '《论语·颜渊》' }
      ]
    },
    {
      id: 'zhong_yong',
      name: '中庸',
      category: 'principle',
      description: '不偏不倚，恰到好处的处世原则。',
      quotes: [
        { text: '中庸之为德也，其至矣乎', source: '《中庸》' }
      ]
    },
    {
      id: 'xiao',
      name: '孝',
      category: 'virtue',
      description: '尊敬和关爱父母的品德。',
      quotes: [
        { text: '孝弟也者，其为仁之本与', source: '《论语·学而》' }
      ]
    }
  ],
  'links': [
    { source: 'ren', target: 'junzi', relationship: '品质', description: '仁是君子的核心品质' },
    { source: 'yi', target: 'junzi', relationship: '品质', description: '义是君子的核心品质' },
    { source: 'li', target: 'junzi', relationship: '品质', description: '礼是君子的核心品质' },
    { source: 'zhi', target: 'junzi', relationship: '品质', description: '智是君子的核心品质' },
    { source: 'xin', target: 'junzi', relationship: '品质', description: '信是君子的核心品质' },
    { source: 'ren', target: 'zhong', relationship: '包含', description: '仁包含忠的意涵' },
    { source: 'ren', target: 'shu', relationship: '包含', description: '仁包含恕的意涵' },
    { source: 'zhong', target: 'shu', relationship: '互补', description: '忠恕互为表里' },
    { source: 'li', target: 'yi', relationship: '互补', description: '礼与义互相依存' },
    { source: 'ren', target: 'xiao', relationship: '基础', description: '孝是仁的基础' },
    { source: 'zhong_yong', target: 'junzi', relationship: '修养', description: '中庸是君子的修养方法' }
  ]
}

const knowledgeGraphService = {
  /**
   * 初始化服务
   */
  init() {
    this.apiKey = wx.getStorageSync('deepseekApiKey') || ''
    this.isOnline = true
    this.graphCache = null
  },

  /**
   * 检查网络连接和API配置
   * @returns {Promise<boolean>} 是否在线可用
   */
  async checkConnection() {
    try {
      if (!this.apiKey) {
        console.log('API密钥未配置')
        this.isOnline = false
        return false
      }

      const networkType = await new Promise(resolve => {
        wx.getNetworkType({
          success: res => resolve(res.networkType)
        })
      })

      this.isOnline = networkType !== 'none'
      return this.isOnline
    } catch (error) {
      console.error('检查连接失败:', error)
      this.isOnline = false
      return false
    }
  },

  /**
   * 获取知识图谱数据
   * @param {string} concept 中心概念（可选）
   * @param {number} depth 探索深度（默认为1）
   * @returns {Promise<Object>} 知识图谱数据
   */
  async getGraphData(concept = null, depth = 1) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/knowledge-graph`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              data: {
                concept,
                depth
              },
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          // 缓存图谱数据
          this.graphCache = response
          wx.setStorageSync('knowledge_graph_cache', response)
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取知识图谱数据失败:', error)
          // 尝试从缓存获取
          if (this.graphCache) {
            return {
              success: true,
              data: this.graphCache,
              source: 'memory_cache',
              warning: '使用内存缓存数据'
            }
          }
          
          const cachedGraph = wx.getStorageSync('knowledge_graph_cache')
          if (cachedGraph) {
            this.graphCache = cachedGraph
            return {
              success: true,
              data: cachedGraph,
              source: 'storage_cache',
              warning: '使用存储缓存数据'
            }
          }
        }
      }
      
      // 离线模式：使用预设数据
      const offlineGraph = this.filterGraphData(OFFLINE_CONCEPTS, concept, depth)
      
      return {
        success: true,
        data: offlineGraph,
        source: 'offline'
      }
    } catch (error) {
      console.error('获取知识图谱数据错误:', error)
      return {
        success: false,
        error: error.message || '获取知识图谱数据失败',
        data: OFFLINE_CONCEPTS
      }
    }
  },

  /**
   * 根据中心概念和深度过滤图谱数据
   * @param {Object} graphData 完整图谱数据
   * @param {string} concept 中心概念
   * @param {number} depth 探索深度
   * @returns {Object} 过滤后的图谱数据
   */
  filterGraphData(graphData, concept, depth) {
    // 如果没有指定中心概念或深度为0，返回完整数据
    if (!concept || depth <= 0) {
      return graphData
    }
    
    // 寻找中心概念节点
    const centerNode = graphData.nodes.find(node => node.id === concept)
    if (!centerNode) {
      return graphData // 如果找不到中心概念，返回完整数据
    }
    
    // 构建包含中心概念的节点集合
    const includeNodeIds = new Set([concept])
    const includedNodes = [centerNode]
    
    // 广度优先搜索相关节点
    for (let currentDepth = 0; currentDepth < depth; currentDepth++) {
      const newNodeIds = new Set()
      
      // 遍历所有边，找出与当前节点集合相连的节点
      graphData.links.forEach(link => {
        if (includeNodeIds.has(link.source) && !includeNodeIds.has(link.target)) {
          newNodeIds.add(link.target)
        } else if (includeNodeIds.has(link.target) && !includeNodeIds.has(link.source)) {
          newNodeIds.add(link.source)
        }
      })
      
      // 将新节点添加到包含集合中
      newNodeIds.forEach(id => {
        includeNodeIds.add(id)
        const node = graphData.nodes.find(n => n.id === id)
        if (node) {
          includedNodes.push(node)
        }
      })
    }
    
    // 过滤出包含在节点集合中的边
    const includedLinks = graphData.links.filter(link => 
      includeNodeIds.has(link.source) && includeNodeIds.has(link.target)
    )
    
    return {
      nodes: includedNodes,
      links: includedLinks
    }
  },

  /**
   * 搜索概念
   * @param {string} query 搜索关键词
   * @returns {Promise<Object>} 搜索结果
   */
  async searchConcepts(query) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/search-concepts`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              data: { query },
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('搜索概念失败:', error)
        }
      }
      
      // 离线模式：在预设数据中搜索
      const searchResults = OFFLINE_CONCEPTS.nodes.filter(node => 
        node.name.includes(query) || 
        node.description.includes(query) ||
        node.quotes.some(quote => quote.text.includes(query))
      )
      
      return {
        success: true,
        data: { results: searchResults },
        source: 'offline'
      }
    } catch (error) {
      console.error('搜索概念错误:', error)
      return {
        success: false,
        error: error.message || '搜索概念失败',
        data: { results: [] }
      }
    }
  },

  /**
   * 获取概念详情
   * @param {string} conceptId 概念ID
   * @returns {Promise<Object>} 概念详情
   */
  async getConceptDetails(conceptId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/concept-details/${conceptId}`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取概念详情失败:', error)
        }
      }
      
      // 离线模式：从预设数据中获取
      const conceptNode = OFFLINE_CONCEPTS.nodes.find(node => node.id === conceptId)
      
      if (!conceptNode) {
        return {
          success: false,
          error: '概念不存在',
          data: null
        }
      }
      
      // 找出与该概念相关的所有关系
      const relations = OFFLINE_CONCEPTS.links.filter(link => 
        link.source === conceptId || link.target === conceptId
      )
      
      // 构建关联概念
      const relatedConcepts = relations.map(relation => {
        const relatedId = relation.source === conceptId ? relation.target : relation.source
        const relatedNode = OFFLINE_CONCEPTS.nodes.find(node => node.id === relatedId)
        
        return {
          id: relatedId,
          name: relatedNode ? relatedNode.name : '未知概念',
          relationship: relation.relationship,
          description: relation.description
        }
      })
      
      // 扩展概念信息
      const expandedInfo = {
        definition: conceptNode.description,
        history: `${conceptNode.name}的概念起源于先秦时期，在儒家思想发展过程中不断丰富和完善。`,
        significance: `${conceptNode.name}是理解儒家思想体系的重要概念，对中国传统文化有深远影响。`,
        modernValue: `在现代社会，${conceptNode.name}的思想依然具有重要的现实意义和应用价值。`
      }
      
      const result = {
        ...conceptNode,
        relatedConcepts,
        expandedInfo
      }
      
      return {
        success: true,
        data: result,
        source: 'offline'
      }
    } catch (error) {
      console.error('获取概念详情错误:', error)
      return {
        success: false,
        error: error.message || '获取概念详情失败',
        data: null
      }
    }
  },

  /**
   * 获取概念关系
   * @param {string} conceptId 概念ID
   * @returns {Promise<Object>} 概念关系
   */
  async getConceptRelations(conceptId) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/concept-relations/${conceptId}`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('获取概念关系失败:', error)
        }
      }
      
      // 离线模式：从预设数据中获取
      const relations = OFFLINE_CONCEPTS.links.filter(link => 
        link.source === conceptId || link.target === conceptId
      )
      
      const relatedConcepts = relations.map(relation => {
        const relatedId = relation.source === conceptId ? relation.target : relation.source
        const relatedNode = OFFLINE_CONCEPTS.nodes.find(node => node.id === relatedId)
        const direction = relation.source === conceptId ? 'outgoing' : 'incoming'
        
        return {
          id: relatedId,
          name: relatedNode ? relatedNode.name : '未知概念',
          relationship: relation.relationship,
          description: relation.description,
          direction
        }
      })
      
      return {
        success: true,
        data: { relations: relatedConcepts },
        source: 'offline'
      }
    } catch (error) {
      console.error('获取概念关系错误:', error)
      return {
        success: false,
        error: error.message || '获取概念关系失败',
        data: { relations: [] }
      }
    }
  },

  /**
   * 探索关联路径
   * @param {string} conceptA 起始概念ID
   * @param {string} conceptB 目标概念ID
   * @returns {Promise<Object>} 关联路径
   */
  async exploreConnectionPath(conceptA, conceptB) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/connection-path`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'GET',
              data: {
                from: conceptA,
                to: conceptB
              },
              header: {
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('探索关联路径失败:', error)
        }
      }
      
      // 离线模式：简单路径搜索
      const path = this.findPath(OFFLINE_CONCEPTS, conceptA, conceptB)
      
      return {
        success: true,
        data: { path },
        source: 'offline'
      }
    } catch (error) {
      console.error('探索关联路径错误:', error)
      return {
        success: false,
        error: error.message || '探索关联路径失败',
        data: { path: [] }
      }
    }
  },

  /**
   * 简单的广度优先搜索路径算法
   * @param {Object} graphData 图谱数据
   * @param {string} startId 起始节点ID
   * @param {string} endId 目标节点ID
   * @returns {Array} 路径
   */
  findPath(graphData, startId, endId) {
    // 如果起始或目标节点不存在，返回空路径
    if (!graphData.nodes.find(n => n.id === startId) || !graphData.nodes.find(n => n.id === endId)) {
      return []
    }
    
    // 如果起始和目标是同一节点，返回该节点
    if (startId === endId) {
      const node = graphData.nodes.find(n => n.id === startId)
      return [{ node, link: null }]
    }
    
    // 广度优先搜索
    const queue = [{ id: startId, path: [] }]
    const visited = new Set([startId])
    
    while (queue.length > 0) {
      const { id, path } = queue.shift()
      
      // 查找与当前节点相连的所有边
      const connectedLinks = graphData.links.filter(link => 
        link.source === id || link.target === id
      )
      
      for (const link of connectedLinks) {
        const nextId = link.source === id ? link.target : link.source
        
        if (nextId === endId) {
          // 找到目标节点，构建完整路径
          const fullPath = [...path]
          const currentNode = graphData.nodes.find(n => n.id === id)
          const targetNode = graphData.nodes.find(n => n.id === endId)
          
          fullPath.push({ 
            node: currentNode, 
            link: null 
          })
          
          fullPath.push({ 
            node: targetNode, 
            link 
          })
          
          return fullPath
        }
        
        if (!visited.has(nextId)) {
          visited.add(nextId)
          const newPath = [...path]
          const currentNode = graphData.nodes.find(n => n.id === id)
          
          newPath.push({ 
            node: currentNode, 
            link 
          })
          
          queue.push({ id: nextId, path: newPath })
        }
      }
    }
    
    // 如果没有找到路径，返回空数组
    return []
  },

  /**
   * 生成概念地图
   * @param {Array} topics 主题列表
   * @returns {Promise<Object>} 概念地图
   */
  async generateConceptMap(topics) {
    try {
      // 检查网络和API可用性
      const isConnected = await this.checkConnection()
      
      if (isConnected) {
        const url = `${BASE_URL}/concept-map`
        
        try {
          const response = await new Promise((resolve, reject) => {
            wx.request({
              url,
              method: 'POST',
              data: { topics },
              header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              success: res => {
                if (res.statusCode === 200) {
                  resolve(res.data)
                } else {
                  reject(new Error(`API请求失败: ${res.statusCode}`))
                }
              },
              fail: err => reject(err)
            })
          })
          
          return {
            success: true,
            data: response,
            source: 'online'
          }
        } catch (error) {
          console.error('生成概念地图失败:', error)
        }
      }
      
      // 离线模式：从预设数据中筛选相关概念
      const relevantNodes = OFFLINE_CONCEPTS.nodes.filter(node => 
        topics.some(topic => 
          node.name.includes(topic) || 
          node.description.includes(topic) ||
          node.category === topic
        )
      )
      
      const nodeIds = relevantNodes.map(node => node.id)
      
      const relevantLinks = OFFLINE_CONCEPTS.links.filter(link => 
        nodeIds.includes(link.source) && nodeIds.includes(link.target)
      )
      
      return {
        success: true,
        data: {
          nodes: relevantNodes,
          links: relevantLinks,
          topics
        },
        source: 'offline'
      }
    } catch (error) {
      console.error('生成概念地图错误:', error)
      return {
        success: false,
        error: error.message || '生成概念地图失败',
        data: {
          nodes: [],
          links: [],
          topics
        }
      }
    }
  },

  /**
   * 获取离线图谱数据
   * @returns {Object} 离线图谱数据
   */
  getOfflineGraphData() {
    return OFFLINE_CONCEPTS
  }
}

module.exports = knowledgeGraphService 