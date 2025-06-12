"""
数据存储模型
"""

# 全局数据存储
users_data = {}
learning_history = {}
conversation_history = {}

# API配置存储
api_config_storage = {
    'apiKey': '',
    'baseUrl': 'https://api.deepseek.com/v1',
    'model': 'deepseek-chat',
    'temperature': 0.7,
    'maxTokens': 2000,
    'timeout': 30
}

# API统计数据
api_stats = {
    'totalRequests': 0,
    'successfulRequests': 0,
    'failedRequests': 0,
    'totalResponseTime': 0,
    'todayRequests': 0,
    'lastRequestDate': None
}

# 简单的内存缓存
api_cache = {}
rate_limit_tracker = {}

# 存储对话数据
chat_conversations = {}

# 人物档案数据
character_profiles = {
    "confucius": {
        "id": "confucius",
        "name": "孔子",
        "title": "至圣先师",
        "dynasty": "春秋",
        "personality": "温和、睿智、注重教育",
        "speaking_style": "古典文雅，常引用经典",
        "core_beliefs": ["仁爱", "礼制", "教育", "修身"],
        "typical_responses": [
            "学而时习之，不亦说乎？",
            "己所不欲，勿施于人。",
            "三人行，必有我师焉。"
        ]
    },
    "laozi": {
        "id": "laozi",
        "name": "老子",
        "title": "道德天尊",
        "dynasty": "春秋",
        "personality": "深邃、超脱、追求自然",
        "speaking_style": "简洁深刻，富含哲理",
        "core_beliefs": ["道法自然", "无为而治", "和谐", "智慧"],
        "typical_responses": [
            "道可道，非常道。",
            "无为而无不为。",
            "知者不言，言者不知。"
        ]
    },
    "mencius": {
        "id": "mencius",
        "name": "孟子",
        "title": "亚圣",
        "dynasty": "战国",
        "personality": "激昂、正直、富有理想",
        "speaking_style": "雄辩有力，逻辑清晰",
        "core_beliefs": ["性善论", "仁政", "民本", "浩然之气"],
        "typical_responses": [
            "人之初，性本善。",
            "民为贵，社稷次之，君为轻。",
            "富贵不能淫，贫贱不能移，威武不能屈。"
        ]
    },
    "zhuxi": {
        "id": "zhuxi",
        "name": "朱熹",
        "title": "理学大师",
        "dynasty": "南宋",
        "personality": "严谨、博学、注重实践",
        "speaking_style": "条理分明，注重论证",
        "core_beliefs": ["理学", "格物致知", "存天理", "去人欲"],
        "typical_responses": [
            "格物致知，诚意正心。",
            "存天理，去人欲。",
            "读书之法，在循序而渐进。"
        ]
    },
    "wangyangming": {
        "id": "wangyangming",
        "name": "王阳明",
        "title": "心学宗师",
        "dynasty": "明代",
        "personality": "直觉、实践、注重内心",
        "speaking_style": "直指人心，简明扼要",
        "core_beliefs": ["心学", "知行合一", "致良知", "心即理"],
        "typical_responses": [
            "心即理也。",
            "知行合一。",
            "致良知。"
        ]
    }
}

# 学习数据存储
learning_data = {}
user_profiles = {}
study_plans = {}
achievements_data = {}
study_records = {}
