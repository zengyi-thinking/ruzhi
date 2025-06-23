"""
监控模块
提供健康检查、性能监控和错误追踪功能
"""
import time
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from flask import Flask
from sqlalchemy import text
import logging

from models.database import engine, SessionLocal
from config.settings import MONITORING_CONFIG, REDIS_CONFIG
from utils.logging_config import get_logger

logger = get_logger('monitoring')

class HealthChecker:
    """健康检查器"""
    
    def __init__(self):
        self.checks = {}
        self.last_check_time = None
        self.check_results = {}
    
    def register_check(self, name: str, check_func, critical: bool = True):
        """注册健康检查项"""
        self.checks[name] = {
            'func': check_func,
            'critical': critical
        }
    
    def run_checks(self) -> Dict[str, Any]:
        """运行所有健康检查"""
        results = {}
        overall_status = 'healthy'
        
        for name, check_config in self.checks.items():
            try:
                start_time = time.time()
                result = check_config['func']()
                duration = time.time() - start_time
                
                results[name] = {
                    'status': 'healthy' if result else 'unhealthy',
                    'duration_ms': round(duration * 1000, 2),
                    'critical': check_config['critical'],
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                # 如果是关键检查且失败，则整体状态为不健康
                if check_config['critical'] and not result:
                    overall_status = 'unhealthy'
                    
            except Exception as e:
                logger.error(f"健康检查 {name} 失败: {e}")
                results[name] = {
                    'status': 'error',
                    'error': str(e),
                    'critical': check_config['critical'],
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                if check_config['critical']:
                    overall_status = 'unhealthy'
        
        self.last_check_time = datetime.utcnow()
        self.check_results = results
        
        return {
            'status': overall_status,
            'timestamp': self.last_check_time.isoformat(),
            'checks': results
        }
    
    def get_cached_results(self) -> Optional[Dict[str, Any]]:
        """获取缓存的检查结果"""
        if (self.last_check_time and 
            datetime.utcnow() - self.last_check_time < timedelta(seconds=30)):
            return {
                'status': 'healthy' if all(
                    check.get('status') == 'healthy' 
                    for check in self.check_results.values()
                    if check.get('critical', True)
                ) else 'unhealthy',
                'timestamp': self.last_check_time.isoformat(),
                'checks': self.check_results
            }
        return None

class PerformanceMonitor:
    """性能监控器"""
    
    def __init__(self):
        self.metrics = {}
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.response_times = []
        self.lock = threading.Lock()
    
    def record_request(self, response_time: float, status_code: int):
        """记录请求指标"""
        with self.lock:
            self.request_count += 1
            self.response_times.append(response_time)
            
            if status_code >= 400:
                self.error_count += 1
            
            # 保持最近1000个响应时间记录
            if len(self.response_times) > 1000:
                self.response_times = self.response_times[-1000:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """获取性能指标"""
        with self.lock:
            uptime = time.time() - self.start_time
            
            # 计算响应时间统计
            if self.response_times:
                avg_response_time = sum(self.response_times) / len(self.response_times)
                max_response_time = max(self.response_times)
                min_response_time = min(self.response_times)
            else:
                avg_response_time = max_response_time = min_response_time = 0
            
            # 系统资源使用情况
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'uptime_seconds': round(uptime, 2),
                'request_count': self.request_count,
                'error_count': self.error_count,
                'error_rate': round(self.error_count / max(self.request_count, 1), 4),
                'response_time': {
                    'avg_ms': round(avg_response_time * 1000, 2),
                    'max_ms': round(max_response_time * 1000, 2),
                    'min_ms': round(min_response_time * 1000, 2)
                },
                'system': {
                    'cpu_percent': cpu_percent,
                    'memory': {
                        'total_mb': round(memory.total / 1024 / 1024, 2),
                        'used_mb': round(memory.used / 1024 / 1024, 2),
                        'percent': memory.percent
                    },
                    'disk': {
                        'total_gb': round(disk.total / 1024 / 1024 / 1024, 2),
                        'used_gb': round(disk.used / 1024 / 1024 / 1024, 2),
                        'percent': round(disk.used / disk.total * 100, 2)
                    }
                },
                'timestamp': datetime.utcnow().isoformat()
            }

# 全局实例
health_checker = HealthChecker()
performance_monitor = PerformanceMonitor()

# 健康检查函数
def check_database() -> bool:
    """检查数据库连接"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"数据库健康检查失败: {e}")
        return False

def check_redis() -> bool:
    """检查Redis连接"""
    try:
        import redis
        redis_client = redis.from_url(REDIS_CONFIG['url'])
        redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Redis健康检查失败: {e}")
        return False

def check_disk_space() -> bool:
    """检查磁盘空间"""
    try:
        disk = psutil.disk_usage('/')
        usage_percent = disk.used / disk.total * 100
        return usage_percent < 90  # 磁盘使用率小于90%
    except Exception as e:
        logger.error(f"磁盘空间检查失败: {e}")
        return False

def check_memory() -> bool:
    """检查内存使用"""
    try:
        memory = psutil.virtual_memory()
        return memory.percent < 90  # 内存使用率小于90%
    except Exception as e:
        logger.error(f"内存检查失败: {e}")
        return False

def check_ai_service() -> bool:
    """检查AI服务"""
    try:
        from services.ai_service import RealAIService
        # 简单的AI服务测试
        test_result = RealAIService.generate_character_response(
            "测试", "confucius", [], {"test": True}
        )
        return test_result.get('success', False)
    except Exception as e:
        logger.error(f"AI服务检查失败: {e}")
        return False

def setup_monitoring(app: Flask):
    """设置监控"""
    if not MONITORING_CONFIG['enabled']:
        return
    
    # 注册健康检查项
    health_checker.register_check('database', check_database, critical=True)
    health_checker.register_check('redis', check_redis, critical=False)
    health_checker.register_check('disk_space', check_disk_space, critical=True)
    health_checker.register_check('memory', check_memory, critical=True)
    health_checker.register_check('ai_service', check_ai_service, critical=False)
    
    # 添加请求监控中间件
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            response_time = time.time() - g.start_time
            performance_monitor.record_request(response_time, response.status_code)
        return response
    
    # 添加健康检查端点
    @app.route('/health')
    def health_check():
        # 尝试获取缓存结果
        cached_result = health_checker.get_cached_results()
        if cached_result:
            status_code = 200 if cached_result['status'] == 'healthy' else 503
            return jsonify(cached_result), status_code
        
        # 运行新的健康检查
        result = health_checker.run_checks()
        status_code = 200 if result['status'] == 'healthy' else 503
        return jsonify(result), status_code
    
    # 添加指标端点
    @app.route('/metrics')
    def metrics():
        return jsonify(performance_monitor.get_metrics())
    
    logger.info("监控系统已启用")

def get_system_info() -> Dict[str, Any]:
    """获取系统信息"""
    return {
        'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        'platform': platform.platform(),
        'cpu_count': psutil.cpu_count(),
        'memory_total_gb': round(psutil.virtual_memory().total / 1024 / 1024 / 1024, 2),
        'disk_total_gb': round(psutil.disk_usage('/').total / 1024 / 1024 / 1024, 2),
        'process_id': os.getpid(),
        'start_time': datetime.fromtimestamp(performance_monitor.start_time).isoformat()
    }
