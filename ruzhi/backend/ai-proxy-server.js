/**
 * AI代理服务器示例
 * 用于代理小程序对AI API的调用，保护API密钥安全
 * 
 * 使用方法：
 * 1. npm install express cors axios dotenv
 * 2. 创建 .env 文件，添加 DEEPSEEK_API_KEY=your_api_key
 * 3. node ai-proxy-server.js
 */

const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// DeepSeek API配置
const DEEPSEEK_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
  maxTokens: 2000,
  temperature: 0.7
}

// 系统提示词
const SYSTEM_PROMPTS = {
  historical_chat: (character) => `你是${character}，请以第一人称的方式回答问题，体现该人物的思想、性格和语言风格。回答要准确、生动，富有教育意义。`,
  ocr_explanation: `你是一位专业的古籍文献专家，请对古籍文字进行详细解释，包括现代汉语翻译、词汇含义、文化背景和历史意义。`,
  knowledge_qa: `你是一位中国传统文化专家，请准确回答传统文化问题，提供深入浅出的解释。`
}

// 历史人物对话API
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { character, message, history = [], settings = {} } = req.body

    if (!character || !message) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      })
    }

    // 构建消息
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.historical_chat(character)
      }
    ]

    // 添加历史对话
    history.forEach(item => {
      if (item.user) messages.push({ role: 'user', content: item.user })
      if (item.assistant) messages.push({ role: 'assistant', content: item.assistant })
    })

    // 添加当前消息
    messages.push({ role: 'user', content: message })

    // 调用DeepSeek API
    const response = await callDeepSeekAPI(messages)

    if (response.success) {
      res.json({
        success: true,
        data: {
          reply: response.data.content,
          character: character,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
        }
      })
    } else {
      throw new Error(response.error)
    }

  } catch (error) {
    console.error('历史人物对话失败:', error)
    
    // 返回降级回复
    res.json({
      success: true,
      data: {
        reply: generateFallbackResponse(req.body.character, req.body.message),
        character: req.body.character,
        timestamp: new Date().toISOString(),
        isMock: true
      }
    })
  }
})

// OCR文本解释API
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { text, context = '' } = req.body

    if (!text) {
      return res.status(400).json({
        success: false,
        error: '缺少文本内容'
      })
    }

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.ocr_explanation
      },
      {
        role: 'user',
        content: `请解释以下古籍文字：\n${text}\n${context ? '上下文：' + context : ''}`
      }
    ]

    const response = await callDeepSeekAPI(messages)

    if (response.success) {
      res.json({
        success: true,
        data: {
          explanation: response.data.content,
          originalText: text,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
        }
      })
    } else {
      throw new Error(response.error)
    }

  } catch (error) {
    console.error('OCR文本解释失败:', error)
    
    res.json({
      success: true,
      data: {
        explanation: `这段古文"${req.body.text}"体现了中国传统文化的深刻内涵，建议进一步学习相关经典著作以获得更深入的理解。`,
        originalText: req.body.text,
        timestamp: new Date().toISOString(),
        isMock: true
      }
    })
  }
})

// 知识问答API
app.post('/api/ai/qa', async (req, res) => {
  try {
    const { question, category = 'general' } = req.body

    if (!question) {
      return res.status(400).json({
        success: false,
        error: '缺少问题内容'
      })
    }

    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS.knowledge_qa
      },
      {
        role: 'user',
        content: question
      }
    ]

    const response = await callDeepSeekAPI(messages)

    if (response.success) {
      res.json({
        success: true,
        data: {
          answer: response.data.content,
          question: question,
          category: category,
          timestamp: new Date().toISOString(),
          usage: response.data.usage
        }
      })
    } else {
      throw new Error(response.error)
    }

  } catch (error) {
    console.error('知识问答失败:', error)
    
    res.json({
      success: true,
      data: {
        answer: `关于"${req.body.question}"这个问题，涉及到中国传统文化的重要内容。建议您深入学习相关经典，或咨询专业的文化学者以获得更准确的答案。`,
        question: req.body.question,
        category: req.body.category,
        timestamp: new Date().toISOString(),
        isMock: true
      }
    })
  }
})

// 调用DeepSeek API
async function callDeepSeekAPI(messages) {
  try {
    if (!DEEPSEEK_CONFIG.apiKey) {
      throw new Error('DeepSeek API密钥未配置')
    }

    const response = await axios.post(
      `${DEEPSEEK_CONFIG.baseURL}/chat/completions`,
      {
        model: DEEPSEEK_CONFIG.model,
        messages: messages,
        max_tokens: DEEPSEEK_CONFIG.maxTokens,
        temperature: DEEPSEEK_CONFIG.temperature,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    if (response.data && response.data.choices && response.data.choices[0]) {
      return {
        success: true,
        data: {
          content: response.data.choices[0].message.content,
          usage: response.data.usage
        }
      }
    }

    throw new Error('API响应格式错误')

  } catch (error) {
    console.error('DeepSeek API调用失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// 生成降级回复
function generateFallbackResponse(character, message) {
  const responses = {
    '孔子': [
      '学而时习之，不亦说乎？学习需要持之以恒，反复实践。',
      '己所不欲，勿施于人。这是做人的基本道理。',
      '三人行，必有我师焉。每个人都有值得学习的地方。'
    ],
    '老子': [
      '道可道，非常道。真正的道理是难以用言语完全表达的。',
      '无为而无不为。顺应自然规律，反而能成就更多事情。',
      '知者不言，言者不知。真正有智慧的人往往不多言。'
    ],
    '孟子': [
      '人之初，性本善。每个人都有善良的本性。',
      '民为贵，社稷次之，君为轻。人民是最重要的。',
      '富贵不能淫，贫贱不能移，威武不能屈。'
    ]
  }

  const characterResponses = responses[character] || responses['孔子']
  return characterResponses[Math.floor(Math.random() * characterResponses.length)]
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI代理服务运行正常',
    timestamp: new Date().toISOString(),
    config: {
      hasApiKey: !!DEEPSEEK_CONFIG.apiKey,
      model: DEEPSEEK_CONFIG.model
    }
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`AI代理服务器启动成功，端口: ${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/api/health`)
  console.log(`DeepSeek API密钥: ${DEEPSEEK_CONFIG.apiKey ? '已配置' : '未配置'}`)
})

module.exports = app
