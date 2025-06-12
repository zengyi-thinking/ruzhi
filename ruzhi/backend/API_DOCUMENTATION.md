# 儒智后端API文档

## 概述

儒智后端API提供智能历史分析、个性化推荐、学习路径规划等功能，支持Web端和小程序端的数据需求。

## 基础信息

- **基础URL**: `http://localhost:8000`
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据内容
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

## API接口列表

### 1. 健康检查

**接口**: `GET /health`

**描述**: 检查服务健康状态

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "service": "ruzhi-backend"
}
```

### 2. 获取用户学习历史

**接口**: `GET /api/v1/user/{user_id}/learning-history`

**描述**: 获取用户的学习历史数据和统计信息

**路径参数**:
- `user_id` (string): 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "session_001",
        "topic": "论语",
        "duration": 35,
        "date": "2024-01-15",
        "type": "reading",
        "completion": 85
      }
    ],
    "stats": {
      "totalStudyTime": 120,
      "completedSessions": 15,
      "favoriteTopics": ["论语", "孟子"],
      "learningStreak": 12,
      "knowledgePoints": 2340,
      "conversationCount": 28
    }
  }
}
```

### 3. 生成AI智能分析

**接口**: `POST /api/v1/user/{user_id}/ai-analysis`

**描述**: 基于用户学习历史生成AI智能分析和洞察

**路径参数**:
- `user_id` (string): 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "strength",
        "title": "学习专注度高",
        "description": "您的平均学习时长为35.2分钟，显示出良好的专注力",
        "confidence": 0.85,
        "actionable": false
      }
    ],
    "analysisData": {
      "weeklyProgress": [
        {
          "week": "第1周",
          "study": 120,
          "conversation": 8
        }
      ],
      "topicDistribution": [
        {
          "topic": "论语",
          "percentage": 35,
          "sessions": 16
        }
      ]
    }
  }
}
```

### 4. 获取个性化推荐

**接口**: `GET /api/v1/user/{user_id}/recommendations`

**描述**: 基于用户学习历史和AI分析生成个性化推荐

**路径参数**:
- `user_id` (string): 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec_001",
        "type": "classic",
        "title": "《孟子》深度学习",
        "description": "基于您对论语的深入学习，孟子思想将是很好的进阶选择",
        "difficulty": 4,
        "estimatedTime": 45,
        "relevanceScore": 0.92,
        "tags": ["儒家", "进阶", "思想"],
        "reason": "与您已掌握的儒家思想高度相关"
      }
    ],
    "totalCount": 5,
    "averageRelevance": 0.87
  }
}
```

### 5. 获取学习路径规划

**接口**: `GET /api/v1/user/{user_id}/learning-paths`

**描述**: 基于用户当前水平生成个性化学习路径

**路径参数**:
- `user_id` (string): 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "paths": [
      {
        "id": "confucian-advanced",
        "title": "儒家思想进阶路径",
        "description": "深入学习儒家核心经典，提升思想境界",
        "difficulty": "intermediate",
        "estimatedWeeks": 8,
        "modules": [
          {
            "id": "conf-1",
            "title": "孟子思想深入",
            "description": "学习孟子的仁政思想和性善论",
            "type": "reading",
            "estimatedHours": 15,
            "completed": false,
            "locked": false
          }
        ],
        "prerequisites": ["论语基础"],
        "outcomes": ["深入理解儒家思想", "掌握经典原文"],
        "popularity": 95
      }
    ],
    "currentLevel": 1500,
    "completedTopics": ["论语", "孟子"]
  }
}
```

### 6. 获取对话总结

**接口**: `GET /api/v1/user/{user_id}/conversation-summary`

**描述**: 获取用户对话历史的AI智能总结

**路径参数**:
- `user_id` (string): 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "id": "conv_001",
        "character": "孔子",
        "topic": "仁爱思想的现代意义",
        "date": "2024-01-15",
        "duration": 25,
        "messageCount": 18,
        "keyInsights": [
          "仁爱是儒家思想的核心，强调人与人之间的关爱",
          "现代社会中仁爱思想体现在社会责任和公民意识"
        ],
        "knowledgePoints": ["仁", "爱人", "社会责任"],
        "emotionalTone": "thoughtful",
        "learningOutcomes": [
          "深入理解仁爱思想的内涵",
          "掌握儒家核心价值观"
        ],
        "difficulty": 4,
        "satisfaction": 9
      }
    ],
    "totalCount": 3,
    "stats": {
      "totalConversations": 3,
      "averageDuration": 24.5,
      "averageSatisfaction": 8.7
    }
  }
}
```

### 7. 分析单次对话

**接口**: `POST /api/v1/conversation/analyze`

**描述**: 分析单次对话内容，提取关键信息和洞察

**请求体**:
```json
{
  "id": "conv_001",
  "character": "孔子",
  "topic": "仁爱思想",
  "messages": [
    {
      "role": "user",
      "content": "老师，什么是仁？"
    },
    {
      "role": "assistant", 
      "content": "仁者爱人，这是仁的核心含义..."
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "conv_001",
    "character": "孔子",
    "topic": "仁爱思想",
    "keyInsights": ["深入探讨了仁爱思想的核心内涵"],
    "knowledgePoints": ["仁", "爱人"],
    "emotionalTone": "thoughtful",
    "learningOutcomes": ["理解仁的基本概念"],
    "difficulty": 3,
    "satisfaction": 8
  }
}
```

### 8. 记录学习会话

**接口**: `POST /api/v1/user/{user_id}/learning-session`

**描述**: 记录用户的学习会话数据

**路径参数**:
- `user_id` (string): 用户ID

**请求体**:
```json
{
  "topic": "论语",
  "duration": 35,
  "type": "reading",
  "completion": 85
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "session_new_001",
    "topic": "论语",
    "duration": 35,
    "date": "2024-01-15T10:30:00",
    "type": "reading",
    "completion": 85
  }
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### Python示例
```python
import requests

# 获取用户学习历史
response = requests.get('http://localhost:8000/api/v1/user/user_001/learning-history')
data = response.json()

if data['success']:
    print(f"用户总学习时长: {data['data']['stats']['totalStudyTime']}分钟")
```

### JavaScript示例
```javascript
// 获取AI分析
fetch('http://localhost:8000/api/v1/user/user_001/ai-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('AI洞察:', data.data.insights);
  }
});
```

## 部署说明

1. 安装依赖：`pip install -r requirements.txt`
2. 启动服务：`python app.py`
3. 服务将在 `http://localhost:8000` 启动

## 注意事项

- 当前版本使用内存存储，重启服务后数据会丢失
- 生产环境建议使用数据库存储
- API响应时间通常在100-500ms之间
- 支持CORS跨域请求
