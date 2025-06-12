"""
应用配置文件
"""
import os

# AI API 配置
AI_API_CONFIG = {
    'deepseek': {
        'base_url': 'https://api.deepseek.com/v1',
        'api_key': os.getenv('DEEPSEEK_API_KEY', 'sk-your-api-key-here'),
        'model': 'deepseek-chat',
        'max_tokens': 2000,
        'temperature': 0.7
    }
}

# API调用限制配置
API_RATE_LIMIT = {
    'max_requests_per_minute': 20,
    'max_requests_per_hour': 100
}

# 缓存配置
CACHE_CONFIG = {
    'enabled': True,
    'ttl': 3600,  # 1小时
    'max_size': 1000
}

# Flask配置
FLASK_CONFIG = {
    'DEBUG': True,
    'HOST': '0.0.0.0',
    'PORT': 8000
}

# 日志配置
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}
