/**
 * AI服务实现
 * 集成DeepSeek API和历史人物对话功能
 */
const app = getApp()
const { request } = require('../utils/request')

// 历史人物角色设定
const CHARACTER_PROFILES = {
  "孔子": {
    prompt: `你现在是孔子，中国儒家学派创始人，春秋时期著名的思想家和教育家。
你的语言风格应当温和而有教化意义，常引用《诗》《书》等古代经典。
你强调"仁"、"礼"、"中庸"等理念，重视道德修养和教育。
你会用"吾""子"等古代称谓，语言简洁有力，常以反问启发对方。
请以第一人称回应，保持谦逊而睿智的态度，体现出你的思想精髓。`
  },
  "老子": {
    prompt: `你现在是老子，道家思想创始人，《道德经》作者。
你的语言应当深邃、朴素而富有哲理，喜欢用自然界的比喻阐述深刻道理。
你崇尚"道法自然"，反对人为干预，推崇"无为而治"的理念。
你会使用古雅、含蓄的表达方式，常见短句精炼而意蕴深远。
请以第一人称回应，保持神秘而通达的气质，体现出道家思想的精髓。`
  },
  "孟子": {
    prompt: `你现在是孟子，儒家重要代表人物，性善论倡导者。
你的语言风格应当慷慨激昂、富有说服力，善于用比喻阐述观点。
你强调"仁政"、"王道"，主张"民为贵，社稷次之，君为轻"。
你会使用"人皆有"这样的开头阐述人性观点，善于论辩。
请以第一人称回应，保持乐观、坚定的态度，体现出你的思想精髓。`
  },
  "庄子": {
    prompt: `你现在是庄子，道家重要代表人物，《庄子》一书作者。
你的语言风格应当灵动飘逸，充满想象力，善于讲述寓言故事。
你崇尚"逍遥游"、"齐物论"等理念，主张摆脱世俗束缚，追求精神自由。
你会使用奇特的比喻和假设情境，常有出人意料的思维转折。
请以第一人称回应，保持豁达、幽默的态度，体现出超然物外的精神境界。`
  },
  "韩非子": {
    prompt: `你现在是韩非子，法家思想集大成者，战国末期政治家。
你的语言风格应当严肃、理性而务实，分析问题冷静客观。
你强调"法、术、势"相结合的治国方略，主张严刑峻法，反对儒家的"仁义"。
你会使用具体的历史事例论证观点，语言简练、条理清晰。
请以第一人称回应，保持冷静、锐利的态度，体现出法家思想的精髓。`
  },
  "王阳明": {
    prompt: `你现在是王阳明，明代著名思想家，心学大成者。
你的语言风格应当平和而富有启发性，善于引导对方内省。
你强调"知行合一"、"致良知"等理念，主张心即理，万物皆在心中。
你会使用日常生活的例子阐述深刻道理，语言平实但见解深刻。
请以第一人称回应，保持温和、坚定的态度，体现出心学思想的精髓。`
  }
}

/**
 * AI服务类
 */
class AIService {
  constructor() {
    this.initialized = false;
    this.apiKey = '';
    this.baseUrl = 'https://api.deepseek.com/v1';
  }
  
  /**
   * 初始化服务
   */
  async initialize() {
    try {
      // 从全局配置或本地存储获取API密钥
      this.apiKey = this.getApiKey();
      
      // 检查API密钥有效性
      if (!this.apiKey) {
        console.log('DeepSeek API密钥未配置，将使用模拟响应');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('AI服务初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 获取API密钥
   */
  getApiKey() {
    // 优先从全局配置获取
    if (app && app.globalData && app.globalData.deepseekApiKey) {
      return app.globalData.deepseekApiKey;
    }
    
    // 从本地存储获取
    try {
      const config = wx.getStorageSync('ai_config') || {};
      return config.apiKey || '';
    } catch (error) {
      console.error('获取API密钥失败:', error);
      return '';
    }
  }
  
  /**
   * 与历史人物对话
   * @param {string} character - 历史人物名称
   * @param {string} message - 用户消息
   * @param {Array} history - 对话历史
   */
  async chatWithHistoricalFigure(character, message, history = []) {
    try {
      // 如果未初始化则先初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 获取角色设定
      const characterProfile = CHARACTER_PROFILES[character] || {
        prompt: `你现在是${character}，中国历史上的著名人物。请以第一人称回应，保持符合历史上${character}的思想和语言风格。`
      };
      
      // 构建系统指令
      const systemPrompt = `${characterProfile.prompt}
请以${character}的身份，用第一人称回答用户的问题。回答要言简意赅，富有智慧，符合${character}的思想和历史背景。
不要提及你是AI或模型，始终保持在${character}的角色中。`;

      // 构建对话历史
      const messages = [
        { role: "system", content: systemPrompt }
      ];
      
      // 添加历史消息
      if (history && history.length > 0) {
        for (const chat of history) {
          if (chat.user) messages.push({ role: "user", content: chat.user });
          if (chat.assistant) messages.push({ role: "assistant", content: chat.assistant });
        }
      }
      
      // 添加当前消息
      messages.push({ role: "user", content: message });

      // 如果有API密钥，调用DeepSeek API
      if (this.apiKey) {
        try {
          const response = await this.callDeepSeekAPI(messages);
          
          return {
            success: true,
            character: character,
            message: response.choices[0].message.content,
            isMock: false
          };
        } catch (apiError) {
          console.error('DeepSeek API调用失败:', apiError);
          // API失败后使用模拟响应
          return this.generateMockResponse(character, message);
        }
      } else {
        // 无API密钥时使用模拟响应
        return this.generateMockResponse(character, message);
      }
    } catch (error) {
      console.error('对话处理失败:', error);
      return {
        success: false,
        error: error.message || '未知错误',
        message: '很抱歉，我暂时无法回应，请稍后再试。'
      };
    }
  }
  
  /**
   * 调用DeepSeek API
   */
  async callDeepSeekAPI(messages) {
    const response = await request.post(`${this.baseUrl}/chat/completions`, {
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response;
  }
  
  /**
   * 生成模拟响应
   */
  generateMockResponse(character, message) {
    // 根据角色和提问内容生成模拟回复
    const mockResponses = {
      "孔子": [
        "吾闻之，学而时习之，不亦说乎。有朋自远方来，不亦乐乎。人不知而不愠，不亦君子乎。",
        "君子有三畏：畏天命，畏大人，畏圣人之言。小人不知天命而不畏也，狎大人，侮圣人之言。",
        "知之为知之，不知为不知，是知也。",
        "工欲善其事，必先利其器。居是邦也，事其大夫之贤者，友其士之仁者。",
        "己所不欲，勿施于人。"
      ],
      "老子": [
        "道可道，非常道；名可名，非常名。无名，天地之始；有名，万物之母。",
        "天下万物生于有，有生于无。",
        "合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。",
        "知人者智，自知者明。胜人者有力，自胜者强。",
        "上善若水，水利万物而不争，处众人之所恶，故几于道。"
      ],
      "孟子": [
        "人皆有不忍人之心。先王有不忍人之心，斯有不忍人之政矣。",
        "得道者多助，失道者寡助。寡助之至，亲戚畔之；多助之至，天下顺之。",
        "人之所以异于禽兽者几希，庶民去之，君子存之。",
        "鱼，我所欲也；熊掌，亦我所欲也。二者不可得兼，舍鱼而取熊掌者也。",
        "民为贵，社稷次之，君为轻。"
      ]
    };
    
    // 默认回复
    const defaultResponses = [
      "此问题值得深思。古人云，温故而知新，可以为师矣。",
      "一言以蔽之，修身齐家治国平天下，此乃大道。",
      "子问及此，让我思索片刻。天行健，君子以自强不息；地势坤，君子以厚德载物。",
      "此问题颇有意思。古人讲究知行合一，不以规矩，不成方圆。",
      "承蒙垂问，容我细细道来。古之学者必有师，师者，所以传道受业解惑也。"
    ];
    
    // 获取角色的回复列表，如果没有则使用默认回复
    const responses = mockResponses[character] || defaultResponses;
    
    // 随机选择一个回复
    const randomIndex = Math.floor(Math.random() * responses.length);
    
    return {
      success: true,
      character: character,
      message: responses[randomIndex],
      isMock: true
    };
  }
}

module.exports = {
  aiService: new AIService()
};
