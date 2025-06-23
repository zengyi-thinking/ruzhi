"""
应用配置文件 - 安全版本
使用环境变量管理敏感配置
"""
import os
import secrets
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def get_bool_env(key: str, default: bool = False) -> bool:
    """获取布尔类型环境变量"""
    return os.getenv(key, str(default)).lower() in ('true', '1', 'yes', 'on')

def get_int_env(key: str, default: int = 0) -> int:
    """获取整数类型环境变量"""
    try:
        return int(os.getenv(key, str(default)))
    except ValueError:
        return default

def get_float_env(key: str, default: float = 0.0) -> float:
    """获取浮点数类型环境变量"""
    try:
        return float(os.getenv(key, str(default)))
    except ValueError:
        return default

# 应用基础配置
APP_CONFIG = {
    'name': '儒智传统文化智能学习平台',
    'version': '2.0.0',
    'environment': os.getenv('FLASK_ENV', 'development'),
    'debug': get_bool_env('DEBUG', False),
    'secret_key': os.getenv('SECRET_KEY') or secrets.token_hex(32),
    'host': os.getenv('HOST', '127.0.0.1'),
    'port': get_int_env('PORT', 8000)
}

# 数据库配置
DATABASE_CONFIG = {
    'url': os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ruzhi'),
    'pool_size': get_int_env('DB_POOL_SIZE', 10),
    'max_overflow': get_int_env('DB_MAX_OVERFLOW', 20),
    'pool_pre_ping': True,
    'echo': get_bool_env('SQL_DEBUG', False)
}

# Redis配置
REDIS_CONFIG = {
    'url': os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    'decode_responses': True,
    'socket_timeout': 5,
    'socket_connect_timeout': 5,
    'retry_on_timeout': True
}

# AI API 配置
AI_API_CONFIG = {
    'deepseek': {
        'base_url': os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
        'api_key': os.getenv('DEEPSEEK_API_KEY', ''),
        'model': os.getenv('DEEPSEEK_MODEL', 'deepseek-chat'),
        'max_tokens': get_int_env('DEEPSEEK_MAX_TOKENS', 2000),
        'temperature': get_float_env('DEEPSEEK_TEMPERATURE', 0.7),
        'timeout': get_int_env('DEEPSEEK_TIMEOUT', 30)
    }
}

# JWT配置
JWT_CONFIG = {
    'secret_key': os.getenv('JWT_SECRET_KEY') or secrets.token_hex(32),
    'algorithm': 'HS256',
    'access_token_expires': get_int_env('JWT_ACCESS_TOKEN_EXPIRES', 3600),  # 1小时
    'refresh_token_expires': get_int_env('JWT_REFRESH_TOKEN_EXPIRES', 2592000),  # 30天
    'issuer': 'ruzhi-app',
    'audience': 'ruzhi-users'
}

# API调用限制配置
API_RATE_LIMIT = {
    'enabled': get_bool_env('RATE_LIMIT_ENABLED', True),
    'max_requests_per_minute': get_int_env('RATE_LIMIT_PER_MINUTE', 60),
    'max_requests_per_hour': get_int_env('RATE_LIMIT_PER_HOUR', 1000),
    'storage_uri': REDIS_CONFIG['url']
}

# 缓存配置
CACHE_CONFIG = {
    'enabled': True,
    'type': 'redis',
    'redis_url': REDIS_CONFIG['url'],
    'default_timeout': get_int_env('CACHE_DEFAULT_TIMEOUT', 3600),  # 1小时
    'key_prefix': 'ruzhi_cache:'
}

# 文件上传配置
UPLOAD_CONFIG = {
    'folder': os.getenv('UPLOAD_FOLDER', 'uploads'),
    'max_content_length': get_int_env('MAX_CONTENT_LENGTH', 16 * 1024 * 1024),  # 16MB
    'allowed_extensions': set(os.getenv('ALLOWED_EXTENSIONS', 'jpg,jpeg,png,bmp,pdf').split(',')),
    'ocr_max_size': get_int_env('OCR_MAX_IMAGE_SIZE', 10 * 1024 * 1024)  # 10MB
}

# CORS配置
CORS_CONFIG = {
    'origins': os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','),
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With'],
    'supports_credentials': True
}

# 安全配置
SECURITY_CONFIG = {
    'password_min_length': 8,
    'password_require_uppercase': True,
    'password_require_lowercase': True,
    'password_require_numbers': True,
    'password_require_special': False,
    'session_timeout': get_int_env('SESSION_TIMEOUT', 3600),  # 1小时
    'max_login_attempts': get_int_env('MAX_LOGIN_ATTEMPTS', 5),
    'lockout_duration': get_int_env('LOCKOUT_DURATION', 900),  # 15分钟
    'force_https': get_bool_env('FORCE_HTTPS', False),
    'secure_cookies': get_bool_env('SECURE_COOKIES', False)
}

# 日志配置
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'formatter': 'detailed',
            'filename': os.getenv('LOG_FILE', 'logs/app.log'),
            'maxBytes': get_int_env('LOG_MAX_BYTES', 10 * 1024 * 1024),  # 10MB
            'backupCount': get_int_env('LOG_BACKUP_COUNT', 5),
            'encoding': 'utf-8'
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'level': 'ERROR',
            'formatter': 'detailed',
            'filename': os.getenv('ERROR_LOG_FILE', 'logs/error.log'),
            'maxBytes': get_int_env('LOG_MAX_BYTES', 10 * 1024 * 1024),  # 10MB
            'backupCount': get_int_env('LOG_BACKUP_COUNT', 5),
            'encoding': 'utf-8'
        }
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False
        },
        'ruzhi': {
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False
        },
        'sqlalchemy.engine': {
            'handlers': ['file'],
            'level': 'WARNING' if not get_bool_env('SQL_DEBUG') else 'INFO',
            'propagate': False
        }
    }
}

# OCR服务配置
OCR_CONFIG = {
    'default_engine': os.getenv('OCR_DEFAULT_ENGINE', 'easyocr'),
    'supported_engines': ['easyocr', 'paddleocr'],
    'max_image_size': get_int_env('OCR_MAX_IMAGE_SIZE', 10 * 1024 * 1024),  # 10MB
    'supported_formats': set(os.getenv('OCR_SUPPORTED_FORMATS', 'jpg,jpeg,png,bmp').split(',')),
    'supported_languages': ['zh', 'en'],
    'confidence_threshold': get_float_env('OCR_CONFIDENCE_THRESHOLD', 0.5),
    'preprocessing': {
        'resize_max_width': get_int_env('OCR_RESIZE_MAX_WIDTH', 2048),
        'resize_max_height': get_int_env('OCR_RESIZE_MAX_HEIGHT', 2048),
        'enhance_contrast': get_bool_env('OCR_ENHANCE_CONTRAST', True),
        'denoise': get_bool_env('OCR_DENOISE', True)
    }
}

# 监控配置
MONITORING_CONFIG = {
    'enabled': get_bool_env('ENABLE_METRICS', True),
    'metrics_port': get_int_env('METRICS_PORT', 9090),
    'health_check_interval': get_int_env('HEALTH_CHECK_INTERVAL', 30),
    'performance_tracking': get_bool_env('PERFORMANCE_TRACKING', True)
}

# 邮件配置
MAIL_CONFIG = {
    'server': os.getenv('MAIL_SERVER', ''),
    'port': get_int_env('MAIL_PORT', 587),
    'use_tls': get_bool_env('MAIL_USE_TLS', True),
    'use_ssl': get_bool_env('MAIL_USE_SSL', False),
    'username': os.getenv('MAIL_USERNAME', ''),
    'password': os.getenv('MAIL_PASSWORD', ''),
    'default_sender': os.getenv('MAIL_DEFAULT_SENDER', 'noreply@ruzhi.com')
}

# 第三方服务配置
EXTERNAL_SERVICES = {
    'sentry': {
        'dsn': os.getenv('SENTRY_DSN', ''),
        'environment': APP_CONFIG['environment'],
        'traces_sample_rate': get_float_env('SENTRY_TRACES_SAMPLE_RATE', 0.1)
    },
    'google_analytics': {
        'tracking_id': os.getenv('GOOGLE_ANALYTICS_ID', '')
    }
}

# 验证必需的环境变量
def validate_config():
    """验证必需的配置项"""
    required_vars = []

    if APP_CONFIG['environment'] == 'production':
        required_vars.extend([
            'SECRET_KEY',
            'JWT_SECRET_KEY',
            'DATABASE_URL',
            'DEEPSEEK_API_KEY'
        ])

    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        raise ValueError(f"缺少必需的环境变量: {', '.join(missing_vars)}")

    return True

# 兼容性配置（保持向后兼容）
FLASK_CONFIG = {
    'DEBUG': APP_CONFIG['debug'],
    'HOST': APP_CONFIG['host'],
    'PORT': APP_CONFIG['port']
}
