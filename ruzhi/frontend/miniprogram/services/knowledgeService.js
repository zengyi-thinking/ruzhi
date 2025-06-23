/**
 * 知识图谱服务实现
 * 提供知识图谱数据处理和可视化
 */
const app = getApp()
const { request } = require('../utils/request')

/**
 * 知识图谱服务类
 */
class KnowledgeService {
  constructor() {
    this.initialized = false;
    this.apiBase = '';
    this.cachedConcepts = {};
  }
  
  /**
   * 初始化服务
   */
  async initialize() {
    try {
      // 从全局获取API基础URL
      if (app && app.globalData) {
        this.apiBase = app.globalData.apiBase || '';
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('知识图谱服务初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 获取图谱数据
   * @param {object} options - 查询参数
   */
  async getGraphData(options = {}) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      const params = {
        rootConcept: options.rootConcept || '儒家',
        depth: options.depth || 2,
        limit: options.limit || 30,
        includeAttributes: options.includeAttributes !== false
      };
      
      // 使用真实API
      if (this.apiBase) {
        try {
          const result = await request.get('/api/v1/knowledge/graph', params);
          
          if (result && result.success) {
            // 缓存概念数据
            this.cacheConceptData(result.data);
            
            return {
              success: true,
              data: result.data,
              isMock: false
            };
          } else {
            throw new Error('获取图谱数据失败: ' + (result?.message || '未知错误'));
          }
        } catch (apiError) {
          console.error('知识图谱API调用失败:', apiError);
          // 使用模拟数据作为备选方案
          return this.generateMockGraphData(params);
        }
      } else {
        // 无API时使用模拟数据
        return this.generateMockGraphData(params);
      }
    } catch (error) {
      console.error('获取图谱数据失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '获取图谱数据失败，请重试'
      };
    }
  }
  
  /**
   * 搜索概念
   * @param {string} query - 搜索关键词
   */
  async searchConcepts(query) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 使用真实API
      if (this.apiBase) {
        try {
          const result = await request.post('/api/v1/knowledge/search', { query });
          
          if (result && result.success) {
            return {
              success: true,
              data: result.data,
              isMock: false
            };
          } else {
            throw new Error('搜索概念失败: ' + (result?.message || '未知错误'));
          }
        } catch (apiError) {
          console.error('搜索概念API调用失败:', apiError);
          // 使用模拟数据作为备选方案
          return this.generateMockSearchResults(query);
        }
      } else {
        // 无API时使用模拟数据
        return this.generateMockSearchResults(query);
      }
    } catch (error) {
      console.error('搜索概念失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '搜索概念失败，请重试'
      };
    }
  }
  
  /**
   * 获取概念详情
   * @param {string} conceptId - 概念ID
   */
  async getConceptDetail(conceptId) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 检查缓存
      if (this.cachedConcepts[conceptId]) {
        return {
          success: true,
          data: this.cachedConcepts[conceptId],
          isMock: this.cachedConcepts[conceptId].isMock || false
        };
      }
      
      // 使用真实API
      if (this.apiBase) {
        try {
          const result = await request.get(`/api/v1/knowledge/concept/${conceptId}`);
          
          if (result && result.success) {
            // 缓存概念数据
            this.cachedConcepts[conceptId] = result.data;
            
            return {
              success: true,
              data: result.data,
              isMock: false
            };
          } else {
            throw new Error('获取概念详情失败: ' + (result?.message || '未知错误'));
          }
        } catch (apiError) {
          console.error('获取概念详情API调用失败:', apiError);
          // 使用模拟数据作为备选方案
          return this.generateMockConceptDetail(conceptId);
        }
      } else {
        // 无API时使用模拟数据
        return this.generateMockConceptDetail(conceptId);
      }
    } catch (error) {
      console.error('获取概念详情失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '获取概念详情失败，请重试'
      };
    }
  }
  
  /**
   * 获取概念关系
   * @param {string} conceptId - 概念ID
   */
  async getConceptRelations(conceptId) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 使用真实API
      if (this.apiBase) {
        try {
          const result = await request.get(`/api/v1/knowledge/concept/${conceptId}/relations`);
          
          if (result && result.success) {
            return {
              success: true,
              data: result.data,
              isMock: false
            };
          } else {
            throw new Error('获取概念关系失败: ' + (result?.message || '未知错误'));
          }
        } catch (apiError) {
          console.error('获取概念关系API调用失败:', apiError);
          // 使用模拟数据作为备选方案
          return this.generateMockConceptRelations(conceptId);
        }
      } else {
        // 无API时使用模拟数据
        return this.generateMockConceptRelations(conceptId);
      }
    } catch (error) {
      console.error('获取概念关系失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '获取概念关系失败，请重试'
      };
    }
  }
  
  /**
   * 缓存概念数据
   */
  cacheConceptData(graphData) {
    if (!graphData || !graphData.nodes) return;
    
    graphData.nodes.forEach(node => {
      if (node.id && node.data) {
        this.cachedConcepts[node.id] = {
          ...node.data,
          id: node.id
        };
      }
    });
  }
  
  /**
   * 生成模拟图谱数据
   */
  generateMockGraphData(params) {
    const rootConcept = params.rootConcept || '儒家';
    
    // 模拟图谱数据
    const mockData = {
      nodes: [
        {
          id: 'concept_1',
          label: rootConcept,
          data: {
            name: rootConcept,
            description: `${rootConcept}是中国古代重要的思想学派，强调仁义礼智信等道德价值。`,
            type: 'core',
            dynasty: '先秦',
            importance: 5
          },
          category: 0
        }
      ],
      links: []
    };
    
    // 添加子概念节点
    const childConcepts = this.getChildConceptsByRoot(rootConcept);
    
    childConcepts.forEach((concept, index) => {
      // 添加节点
      mockData.nodes.push({
        id: `concept_${index + 2}`,
        label: concept.name,
        data: {
          name: concept.name,
          description: concept.description,
          type: concept.type,
          dynasty: concept.dynasty,
          importance: concept.importance
        },
        category: 1
      });
      
      // 添加关系
      mockData.links.push({
        source: 'concept_1',
        target: `concept_${index + 2}`,
        value: concept.relationStrength || 1,
        name: concept.relation
      });
      
      // 缓存概念详情
      this.cachedConcepts[`concept_${index + 2}`] = {
        id: `concept_${index + 2}`,
        name: concept.name,
        description: concept.description,
        type: concept.type,
        dynasty: concept.dynasty,
        importance: concept.importance,
        attributes: concept.attributes || {},
        references: concept.references || [],
        isMock: true
      };
    });
    
    // 缓存根概念详情
    this.cachedConcepts['concept_1'] = {
      id: 'concept_1',
      name: rootConcept,
      description: `${rootConcept}是中国古代重要的思想学派，强调仁义礼智信等道德价值。`,
      type: 'core',
      dynasty: '先秦',
      importance: 5,
      attributes: {
        founder: rootConcept === '儒家' ? '孔子' : (rootConcept === '道家' ? '老子' : '未知'),
        values: rootConcept === '儒家' ? '仁义礼智信' : (rootConcept === '道家' ? '道法自然' : '未知')
      },
      references: [
        { title: `《${rootConcept}思想史》`, author: '张三' },
        { title: `${rootConcept}与中国传统文化`, author: '李四' }
      ],
      isMock: true
    };
    
    return {
      success: true,
      data: mockData,
      isMock: true
    };
  }
  
  /**
   * 根据根概念获取子概念
   */
  getChildConceptsByRoot(rootConcept) {
    // 预设的概念关系
    const conceptRelations = {
      '儒家': [
        {
          name: '仁',
          description: '仁是儒家核心价值观，代表人与人之间的博爱和同情。',
          type: 'value',
          dynasty: '先秦',
          importance: 5,
          relation: '核心价值',
          relationStrength: 1,
          attributes: {
            definition: '仁者爱人',
            classic: '论语'
          },
          references: [
            { title: '《论语·颜渊》', author: '孔子弟子' }
          ]
        },
        {
          name: '礼',
          description: '礼是社会规范和行为准则，维持社会秩序的重要手段。',
          type: 'value',
          dynasty: '先秦',
          importance: 4,
          relation: '行为规范',
          relationStrength: 0.9,
          attributes: {
            definition: '克己复礼',
            classic: '礼记'
          },
          references: [
            { title: '《礼记》', author: '戴圣' }
          ]
        },
        {
          name: '孝',
          description: '孝是儒家伦理体系中的重要概念，强调尊敬和侍奉父母长辈。',
          type: 'value',
          dynasty: '先秦',
          importance: 4,
          relation: '伦理基础',
          relationStrength: 0.8,
          attributes: {
            definition: '孝悌也者，其为仁之本欤',
            classic: '论语'
          },
          references: [
            { title: '《孝经》', author: '孔子' }
          ]
        },
        {
          name: '中庸',
          description: '中庸之道，提倡处事不偏不倚，持平公正。',
          type: 'principle',
          dynasty: '先秦',
          importance: 3,
          relation: '核心哲学',
          relationStrength: 0.7,
          attributes: {
            definition: '不偏之谓中，不易之谓庸',
            classic: '中庸'
          },
          references: [
            { title: '《中庸》', author: '子思' }
          ]
        },
        {
          name: '君子',
          description: '儒家理想人格，德才兼备的人。',
          type: 'concept',
          dynasty: '先秦',
          importance: 3,
          relation: '人格典范',
          relationStrength: 0.7
        }
      ],
      '道家': [
        {
          name: '道',
          description: '道是万物之源，宇宙运行的根本规律。',
          type: 'concept',
          dynasty: '先秦',
          importance: 5,
          relation: '核心概念',
          relationStrength: 1
        },
        {
          name: '无为',
          description: '无为而治，顺应自然规律，不加干涉。',
          type: 'principle',
          dynasty: '先秦',
          importance: 4,
          relation: '治理理念',
          relationStrength: 0.9
        },
        {
          name: '自然',
          description: '道法自然，强调顺应自然规律。',
          type: 'principle',
          dynasty: '先秦',
          importance: 4,
          relation: '核心思想',
          relationStrength: 0.8
        }
      ],
      '佛家': [
        {
          name: '空',
          description: '万法皆空，一切事物没有固定的实体。',
          type: 'concept',
          dynasty: '魏晋',
          importance: 5,
          relation: '核心教义',
          relationStrength: 1
        },
        {
          name: '缘起',
          description: '事物因缘和合而生起，无自性。',
          type: 'concept',
          dynasty: '魏晋',
          importance: 4,
          relation: '基本理论',
          relationStrength: 0.9
        },
        {
          name: '涅槃',
          description: '解脱生死轮回，达到寂静的境界。',
          type: 'concept',
          dynasty: '魏晋',
          importance: 4,
          relation: '终极目标',
          relationStrength: 0.8
        }
      ]
    };
    
    // 返回对应根概念的子概念，如果不存在则返回默认
    return conceptRelations[rootConcept] || [
      {
        name: '概念A',
        description: '这是一个相关概念。',
        type: 'concept',
        dynasty: '不详',
        importance: 3,
        relation: '相关概念',
        relationStrength: 0.7
      },
      {
        name: '概念B',
        description: '这是另一个相关概念。',
        type: 'concept',
        dynasty: '不详',
        importance: 2,
        relation: '相关概念',
        relationStrength: 0.5
      }
    ];
  }
  
  /**
   * 生成模拟搜索结果
   */
  generateMockSearchResults(query) {
    const allConcepts = [
      { id: 'concept_ruxue', name: '儒学', type: 'school', dynasty: '先秦', description: '儒学是中国传统文化的主要组成部分，强调仁义礼智信的道德价值体系。' },
      { id: 'concept_ren', name: '仁', type: 'value', dynasty: '先秦', description: '仁是儒家思想的核心概念，代表人与人之间的博爱和同情。' },
      { id: 'concept_li', name: '礼', type: 'value', dynasty: '先秦', description: '礼是社会规范和行为准则，维持社会秩序的重要手段。' },
      { id: 'concept_yi', name: '义', type: 'value', dynasty: '先秦', description: '义是指符合道德原则的行为准则，做正确的事。' },
      { id: 'concept_dao', name: '道', type: 'concept', dynasty: '先秦', description: '道是万物之源，宇宙运行的根本规律。' },
      { id: 'concept_wuwei', name: '无为', type: 'principle', dynasty: '先秦', description: '无为而治，顺应自然规律，不加干涉。' },
      { id: 'concept_junzi', name: '君子', type: 'concept', dynasty: '先秦', description: '儒家理想人格，德才兼备的人。' },
      { id: 'concept_xiaoren', name: '小人', type: 'concept', dynasty: '先秦', description: '与君子相对，指道德低下、自私自利的人。' },
      { id: 'concept_zhongyong', name: '中庸', type: 'principle', dynasty: '先秦', description: '中庸之道，提倡处事不偏不倚，持平公正。' }
    ];
    
    // 模拟搜索匹配逻辑
    const results = allConcepts.filter(concept => {
      return (
        concept.name.includes(query) ||
        concept.description.includes(query) ||
        concept.type.includes(query) ||
        concept.dynasty.includes(query)
      );
    });
    
    // 如果没有匹配结果，返回前3个作为推荐
    const searchResults = results.length > 0 ? results : allConcepts.slice(0, 3);
    
    return {
      success: true,
      data: {
        query: query,
        results: searchResults,
        totalCount: searchResults.length
      },
      isMock: true
    };
  }
  
  /**
   * 生成模拟概念详情
   */
  generateMockConceptDetail(conceptId) {
    // 预设的概念详情
    const mockConcepts = {
      'concept_ruxue': {
        id: 'concept_ruxue',
        name: '儒学',
        description: '儒学是中国传统文化的主要组成部分，强调仁义礼智信的道德价值体系。由孔子创立，经过孟子、荀子等发展，历经两千多年影响中国社会。',
        type: 'school',
        dynasty: '先秦',
        importance: 5,
        attributes: {
          founder: '孔子',
          mainTexts: '四书五经',
          values: '仁义礼智信',
          influence: '政治、教育、伦理、家庭'
        },
        references: [
          { title: '《论语》', author: '孔子弟子' },
          { title: '《孟子》', author: '孟子' },
          { title: '《中庸》', author: '子思' },
          { title: '《大学》', author: '曾子' }
        ],
        relatedConcepts: [
          { id: 'concept_ren', name: '仁' },
          { id: 'concept_li', name: '礼' },
          { id: 'concept_yi', name: '义' },
          { id: 'concept_junzi', name: '君子' },
          { id: 'concept_zhongyong', name: '中庸' }
        ]
      },
      'concept_ren': {
        id: 'concept_ren',
        name: '仁',
        description: '仁是儒家思想的核心概念，代表人与人之间的博爱和同情。孔子认为"仁者爱人"，是一切道德的基础。',
        type: 'value',
        dynasty: '先秦',
        importance: 5,
        attributes: {
          definition: '仁者爱人',
          classic: '论语',
          quotes: '己所不欲，勿施于人'
        },
        references: [
          { title: '《论语·颜渊》', author: '孔子弟子' },
          { title: '《孟子·公孙丑》', author: '孟子' }
        ],
        relatedConcepts: [
          { id: 'concept_ruxue', name: '儒学' },
          { id: 'concept_li', name: '礼' },
          { id: 'concept_yi', name: '义' }
        ]
      }
    };
    
    // 如果有预设数据，返回它
    if (mockConcepts[conceptId]) {
      // 缓存概念
      this.cachedConcepts[conceptId] = {
        ...mockConcepts[conceptId],
        isMock: true
      };
      
      return {
        success: true,
        data: mockConcepts[conceptId],
        isMock: true
      };
    }
    
    // 如果没有预设数据，生成通用模拟数据
    const conceptNumber = conceptId.split('_')[1] || '1';
    const mockConcept = {
      id: conceptId,
      name: `概念${conceptNumber}`,
      description: `这是关于概念${conceptNumber}的详细描述，包含其在中国传统文化中的地位、含义和影响。`,
      type: 'concept',
      dynasty: '不详',
      importance: 3,
      attributes: {
        definition: `概念${conceptNumber}的定义`,
        classic: '相关典籍',
        quotes: '相关引述'
      },
      references: [
        { title: `《关于概念${conceptNumber}的研究》`, author: '张三' },
        { title: `《概念${conceptNumber}论》`, author: '李四' }
      ],
      relatedConcepts: [
        { id: 'concept_related1', name: '相关概念1' },
        { id: 'concept_related2', name: '相关概念2' }
      ]
    };
    
    // 缓存概念
    this.cachedConcepts[conceptId] = {
      ...mockConcept,
      isMock: true
    };
    
    return {
      success: true,
      data: mockConcept,
      isMock: true
    };
  }
  
  /**
   * 生成模拟概念关系
   */
  generateMockConceptRelations(conceptId) {
    // 生成一些模拟关系数据
    const mockRelations = {
      inbound: [
        { 
          id: 'rel_1',
          source: 'concept_parent1',
          sourceName: '上级概念1',
          target: conceptId,
          type: '包含',
          description: '上级概念1包含此概念'
        },
        { 
          id: 'rel_2',
          source: 'concept_parent2',
          sourceName: '上级概念2',
          target: conceptId,
          type: '影响',
          description: '上级概念2影响了此概念的形成'
        }
      ],
      outbound: [
        { 
          id: 'rel_3',
          source: conceptId,
          target: 'concept_child1',
          targetName: '下级概念1',
          type: '包含',
          description: '此概念包含下级概念1'
        },
        { 
          id: 'rel_4',
          source: conceptId,
          target: 'concept_child2',
          targetName: '下级概念2',
          type: '影响',
          description: '此概念影响了下级概念2'
        }
      ],
      related: [
        { 
          id: 'rel_5',
          source: conceptId,
          target: 'concept_related1',
          targetName: '相关概念1',
          type: '相似',
          description: '与相关概念1有相似之处'
        },
        { 
          id: 'rel_6',
          source: 'concept_related2',
          sourceName: '相关概念2',
          target: conceptId,
          type: '对立',
          description: '与相关概念2存在对立关系'
        }
      ]
    };
    
    return {
      success: true,
      data: mockRelations,
      isMock: true
    };
  }
}

module.exports = {
  knowledgeService: new KnowledgeService()
};
