"""
日志配置模块
提供结构化日志记录和监控功能
"""
import os
import json
import logging
import logging.config
from datetime import datetime
from typing import Dict, Any, Optional
from flask import request, g
import traceback

from config.settings import LOGGING_CONFIG, APP_CONFIG

class StructuredFormatter(logging.Formatter):
    """结构化日志格式化器"""
    
    def format(self, record):
        # 基础日志信息
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # 添加请求上下文信息
        if hasattr(g, 'request_id'):
            log_data['request_id'] = g.request_id
        
        if request:
            log_data['request'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', '')
            }
        
        # 添加用户信息
        if hasattr(g, 'current_user_id'):
            log_data['user_id'] = g.current_user_id
        
        # 添加异常信息
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }
        
        # 添加额外字段
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
        
        return json.dumps(log_data, ensure_ascii=False)

class RequestLogger:
    """请求日志记录器"""
    
    def __init__(self):
        self.logger = logging.getLogger('ruzhi.request')
    
    def log_request_start(self, request_id: str):
        """记录请求开始"""
        self.logger.info(
            "请求开始",
            extra={
                'extra_data': {
                    'event': 'request_start',
                    'request_id': request_id,
                    'method': request.method,
                    'path': request.path,
                    'query_string': request.query_string.decode(),
                    'content_length': request.content_length,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', '')
                }
            }
        )
    
    def log_request_end(self, request_id: str, status_code: int, response_time: float):
        """记录请求结束"""
        self.logger.info(
            "请求结束",
            extra={
                'extra_data': {
                    'event': 'request_end',
                    'request_id': request_id,
                    'status_code': status_code,
                    'response_time_ms': response_time * 1000,
                    'method': request.method,
                    'path': request.path
                }
            }
        )
    
    def log_error(self, request_id: str, error: Exception, status_code: int = 500):
        """记录请求错误"""
        self.logger.error(
            f"请求错误: {str(error)}",
            exc_info=True,
            extra={
                'extra_data': {
                    'event': 'request_error',
                    'request_id': request_id,
                    'error_type': type(error).__name__,
                    'status_code': status_code,
                    'method': request.method,
                    'path': request.path
                }
            }
        )

class BusinessLogger:
    """业务日志记录器"""
    
    def __init__(self):
        self.logger = logging.getLogger('ruzhi.business')
    
    def log_user_action(self, user_id: str, action: str, details: Dict[str, Any] = None):
        """记录用户行为"""
        self.logger.info(
            f"用户行为: {action}",
            extra={
                'extra_data': {
                    'event': 'user_action',
                    'user_id': user_id,
                    'action': action,
                    'details': details or {},
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )
    
    def log_ai_interaction(self, user_id: str, character_id: str, 
                          request_data: Dict[str, Any], response_data: Dict[str, Any]):
        """记录AI交互"""
        self.logger.info(
            "AI交互",
            extra={
                'extra_data': {
                    'event': 'ai_interaction',
                    'user_id': user_id,
                    'character_id': character_id,
                    'request': request_data,
                    'response': response_data,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )
    
    def log_ocr_processing(self, user_id: str, image_info: Dict[str, Any], 
                          result: Dict[str, Any]):
        """记录OCR处理"""
        self.logger.info(
            "OCR处理",
            extra={
                'extra_data': {
                    'event': 'ocr_processing',
                    'user_id': user_id,
                    'image_info': image_info,
                    'result': result,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )
    
    def log_learning_progress(self, user_id: str, content_id: str, 
                            progress_data: Dict[str, Any]):
        """记录学习进度"""
        self.logger.info(
            "学习进度更新",
            extra={
                'extra_data': {
                    'event': 'learning_progress',
                    'user_id': user_id,
                    'content_id': content_id,
                    'progress_data': progress_data,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )

class SecurityLogger:
    """安全日志记录器"""
    
    def __init__(self):
        self.logger = logging.getLogger('ruzhi.security')
    
    def log_login_attempt(self, username: str, success: bool, ip_address: str, 
                         user_agent: str = None):
        """记录登录尝试"""
        level = logging.INFO if success else logging.WARNING
        message = "登录成功" if success else "登录失败"
        
        self.logger.log(
            level,
            message,
            extra={
                'extra_data': {
                    'event': 'login_attempt',
                    'username': username,
                    'success': success,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )
    
    def log_rate_limit_exceeded(self, identifier: str, endpoint: str, 
                              limit_type: str):
        """记录频率限制超出"""
        self.logger.warning(
            "频率限制超出",
            extra={
                'extra_data': {
                    'event': 'rate_limit_exceeded',
                    'identifier': identifier,
                    'endpoint': endpoint,
                    'limit_type': limit_type,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )
    
    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """记录安全事件"""
        self.logger.warning(
            f"安全事件: {event_type}",
            extra={
                'extra_data': {
                    'event': 'security_event',
                    'event_type': event_type,
                    'details': details,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        )

def setup_logging():
    """设置日志配置"""
    # 确保日志目录存在
    log_dir = os.path.dirname(LOGGING_CONFIG['handlers']['file']['filename'])
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    # 应用日志配置
    logging.config.dictConfig(LOGGING_CONFIG)
    
    # 设置结构化格式化器（如果需要）
    if APP_CONFIG['environment'] == 'production':
        # 在生产环境中使用JSON格式
        for handler_name in ['file', 'error_file']:
            handler = logging.getLogger().handlers[0]  # 简化处理
            if hasattr(handler, 'setFormatter'):
                handler.setFormatter(StructuredFormatter())

def get_logger(name: str) -> logging.Logger:
    """获取指定名称的日志记录器"""
    return logging.getLogger(f'ruzhi.{name}')

# 创建全局日志记录器实例
request_logger = RequestLogger()
business_logger = BusinessLogger()
security_logger = SecurityLogger()
