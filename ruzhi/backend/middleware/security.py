"""
安全中间件
提供JWT认证、CORS、安全头等安全功能
"""
import jwt
import time
import redis
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g, current_app
from typing import Optional, Dict, Any
import logging

from config.settings import JWT_CONFIG, REDIS_CONFIG, API_RATE_LIMIT, SECURITY_CONFIG

logger = logging.getLogger(__name__)

# Redis连接
try:
    redis_client = redis.from_url(REDIS_CONFIG['url'], **{
        k: v for k, v in REDIS_CONFIG.items() if k != 'url'
    })
except Exception as e:
    logger.warning(f"Redis连接失败，将使用内存存储: {e}")
    redis_client = None

class JWTManager:
    """JWT令牌管理器"""
    
    @staticmethod
    def generate_tokens(user_id: str, user_data: Dict[str, Any] = None) -> Dict[str, str]:
        """生成访问令牌和刷新令牌"""
        now = datetime.now(timezone.utc)
        
        # 访问令牌载荷
        access_payload = {
            'user_id': user_id,
            'type': 'access',
            'iat': now,
            'exp': now + timedelta(seconds=JWT_CONFIG['access_token_expires']),
            'iss': JWT_CONFIG['issuer'],
            'aud': JWT_CONFIG['audience']
        }
        
        # 刷新令牌载荷
        refresh_payload = {
            'user_id': user_id,
            'type': 'refresh',
            'iat': now,
            'exp': now + timedelta(seconds=JWT_CONFIG['refresh_token_expires']),
            'iss': JWT_CONFIG['issuer'],
            'aud': JWT_CONFIG['audience']
        }
        
        # 添加用户数据
        if user_data:
            access_payload.update(user_data)
        
        # 生成令牌
        access_token = jwt.encode(
            access_payload,
            JWT_CONFIG['secret_key'],
            algorithm=JWT_CONFIG['algorithm']
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            JWT_CONFIG['secret_key'],
            algorithm=JWT_CONFIG['algorithm']
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': JWT_CONFIG['access_token_expires']
        }
    
    @staticmethod
    def verify_token(token: str, token_type: str = 'access') -> Optional[Dict[str, Any]]:
        """验证JWT令牌"""
        try:
            payload = jwt.decode(
                token,
                JWT_CONFIG['secret_key'],
                algorithms=[JWT_CONFIG['algorithm']],
                audience=JWT_CONFIG['audience'],
                issuer=JWT_CONFIG['issuer']
            )
            
            # 检查令牌类型
            if payload.get('type') != token_type:
                return None
            
            # 检查是否在黑名单中
            if JWTManager.is_token_blacklisted(token):
                return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT令牌已过期")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"JWT令牌无效: {e}")
            return None
    
    @staticmethod
    def blacklist_token(token: str, expires_in: int = None):
        """将令牌加入黑名单"""
        if not redis_client:
            return
        
        try:
            # 解码令牌获取过期时间
            payload = jwt.decode(
                token,
                JWT_CONFIG['secret_key'],
                algorithms=[JWT_CONFIG['algorithm']],
                options={"verify_exp": False}
            )
            
            exp = payload.get('exp')
            if exp:
                expires_in = exp - int(time.time())
                if expires_in > 0:
                    redis_client.setex(f"blacklist:{token}", expires_in, "1")
        except Exception as e:
            logger.error(f"令牌黑名单操作失败: {e}")
    
    @staticmethod
    def is_token_blacklisted(token: str) -> bool:
        """检查令牌是否在黑名单中"""
        if not redis_client:
            return False
        
        try:
            return redis_client.exists(f"blacklist:{token}")
        except Exception as e:
            logger.error(f"检查令牌黑名单失败: {e}")
            return False

class RateLimiter:
    """API频率限制器"""
    
    @staticmethod
    def is_rate_limited(identifier: str, limit_type: str = 'general') -> bool:
        """检查是否超出频率限制"""
        if not API_RATE_LIMIT['enabled'] or not redis_client:
            return False
        
        try:
            current_time = int(time.time())
            
            # 分钟级限制
            minute_key = f"rate_limit:{identifier}:{limit_type}:minute:{current_time // 60}"
            minute_count = redis_client.incr(minute_key)
            if minute_count == 1:
                redis_client.expire(minute_key, 60)
            
            if minute_count > API_RATE_LIMIT['max_requests_per_minute']:
                return True
            
            # 小时级限制
            hour_key = f"rate_limit:{identifier}:{limit_type}:hour:{current_time // 3600}"
            hour_count = redis_client.incr(hour_key)
            if hour_count == 1:
                redis_client.expire(hour_key, 3600)
            
            if hour_count > API_RATE_LIMIT['max_requests_per_hour']:
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"频率限制检查失败: {e}")
            return False
    
    @staticmethod
    def get_rate_limit_info(identifier: str, limit_type: str = 'general') -> Dict[str, int]:
        """获取频率限制信息"""
        if not redis_client:
            return {}
        
        try:
            current_time = int(time.time())
            
            minute_key = f"rate_limit:{identifier}:{limit_type}:minute:{current_time // 60}"
            hour_key = f"rate_limit:{identifier}:{limit_type}:hour:{current_time // 3600}"
            
            minute_count = int(redis_client.get(minute_key) or 0)
            hour_count = int(redis_client.get(hour_key) or 0)
            
            return {
                'minute_remaining': max(0, API_RATE_LIMIT['max_requests_per_minute'] - minute_count),
                'hour_remaining': max(0, API_RATE_LIMIT['max_requests_per_hour'] - hour_count),
                'minute_limit': API_RATE_LIMIT['max_requests_per_minute'],
                'hour_limit': API_RATE_LIMIT['max_requests_per_hour']
            }
            
        except Exception as e:
            logger.error(f"获取频率限制信息失败: {e}")
            return {}

def require_auth(f):
    """需要认证的装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 获取Authorization头
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': '缺少认证令牌'}), 401
        
        # 解析Bearer令牌
        try:
            scheme, token = auth_header.split(' ', 1)
            if scheme.lower() != 'bearer':
                return jsonify({'error': '无效的认证方案'}), 401
        except ValueError:
            return jsonify({'error': '无效的认证头格式'}), 401
        
        # 验证令牌
        payload = JWTManager.verify_token(token)
        if not payload:
            return jsonify({'error': '无效或过期的令牌'}), 401
        
        # 将用户信息存储到g对象中
        g.current_user_id = payload['user_id']
        g.current_user_payload = payload
        
        return f(*args, **kwargs)
    
    return decorated_function

def rate_limit(limit_type: str = 'general'):
    """频率限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 获取客户端标识符
            identifier = request.remote_addr
            if hasattr(g, 'current_user_id'):
                identifier = g.current_user_id
            
            # 检查频率限制
            if RateLimiter.is_rate_limited(identifier, limit_type):
                return jsonify({
                    'error': '请求过于频繁，请稍后再试',
                    'rate_limit_info': RateLimiter.get_rate_limit_info(identifier, limit_type)
                }), 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def add_security_headers(response):
    """添加安全头"""
    # 安全头配置
    security_headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
    
    # 只在HTTPS环境下添加HSTS头
    if not SECURITY_CONFIG['force_https']:
        security_headers.pop('Strict-Transport-Security', None)
    
    for header, value in security_headers.items():
        response.headers[header] = value
    
    return response
