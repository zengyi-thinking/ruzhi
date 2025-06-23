"""
儒智项目 - 重构后的主应用文件
传统文化智能学习平台后端服务 - 增强版
"""
import os
import sys
import uuid
import time
from flask import Flask, jsonify, request, g
from flask_cors import CORS
import logging
from datetime import datetime

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入配置和工具
from config.settings import APP_CONFIG, CORS_CONFIG, FLASK_CONFIG
from utils.logging_config import setup_logging, request_logger, business_logger, security_logger
from utils.monitoring import setup_monitoring
from middleware.security import add_security_headers, require_auth, rate_limit

# 导入路由蓝图
from routes.ocr_routes import ocr_bp
from routes.dialogue_routes import dialogue_bp
from routes.learning_routes import learning_bp
from routes.classics_routes import classics_bp
from routes.knowledge_routes import knowledge_bp
from routes.config_routes import config_bp

# 设置日志
setup_logging()
logger = logging.getLogger('ruzhi.app')

def create_app():
    """创建Flask应用 - 增强版"""
    app = Flask(__name__)

    # 应用配置
    app.config.update({
        'SECRET_KEY': APP_CONFIG['secret_key'],
        'DEBUG': APP_CONFIG['debug'],
        'JSON_AS_ASCII': False,  # 支持中文JSON
        'MAX_CONTENT_LENGTH': 16 * 1024 * 1024  # 16MB
    })

    # 配置CORS
    CORS(app,
         origins=CORS_CONFIG['origins'],
         methods=CORS_CONFIG['methods'],
         allow_headers=CORS_CONFIG['allow_headers'],
         supports_credentials=CORS_CONFIG['supports_credentials'])

    # 设置监控
    setup_monitoring(app)

    # 请求中间件
    @app.before_request
    def before_request():
        # 生成请求ID
        g.request_id = str(uuid.uuid4())
        g.start_time = time.time()

        # 记录请求开始
        request_logger.log_request_start(g.request_id)

    @app.after_request
    def after_request(response):
        # 添加安全头
        response = add_security_headers(response)

        # 记录请求结束
        if hasattr(g, 'start_time'):
            response_time = time.time() - g.start_time
            request_logger.log_request_end(g.request_id, response.status_code, response_time)

        return response

    @app.errorhandler(Exception)
    def handle_exception(e):
        # 记录错误
        if hasattr(g, 'request_id'):
            request_logger.log_error(g.request_id, e)

        # 返回错误响应
        if isinstance(e, ValueError):
            return jsonify({'error': str(e)}), 400
        elif isinstance(e, PermissionError):
            return jsonify({'error': '权限不足'}), 403
        else:
            return jsonify({'error': '服务器内部错误'}), 500
    
    # 注册蓝图
    app.register_blueprint(ocr_bp)
    app.register_blueprint(dialogue_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(classics_bp)
    app.register_blueprint(knowledge_bp)
    app.register_blueprint(config_bp)
    
    # 基础路由
    @app.route('/')
    def index():
        """首页"""
        return jsonify({
            "message": "儒智 - 传统文化智能学习平台",
            "version": "2.0.0",
            "status": "running",
            "features": [
                "OCR古籍识别",
                "AI人物对话",
                "智能学习中心",
                "经典阅读注释",
                "知识图谱探索",
                "API配置管理"
            ]
        })
    
    @app.route('/api/v1/health')
    @handle_errors
    def health_check():
        """健康检查"""
        import time
        return jsonify({
            "success": True,
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "response_time": time.time(),
            "services": {
                "ocr": "active",
                "ai_dialogue": "active",
                "learning_center": "active",
                "classics_reading": "active",
                "knowledge_graph": "active",
                "api_config": "active"
            }
        })

    @app.route('/api/v1/ai/test', methods=['POST'])
    @handle_errors
    def test_ai_service():
        """测试AI服务连接"""
        try:
            data = request.get_json()
            message = data.get('message', '你好')

            # 这里应该调用真实的AI服务
            # 暂时返回模拟响应
            return jsonify({
                "success": True,
                "model": "deepseek-chat",
                "reply": f"这是对'{message}'的AI回复（测试模式）",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500

    @app.route('/api/v1/ocr/status')
    @handle_errors
    def ocr_service_status():
        """OCR服务状态检查"""
        return jsonify({
            "success": True,
            "status": "active",
            "supportedFormats": ["jpg", "jpeg", "png", "bmp"],
            "maxFileSize": "10MB",
            "timestamp": datetime.now().isoformat()
        })

    @app.route('/api/v1/database/status')
    @handle_errors
    def database_status():
        """数据库连接状态检查"""
        return jsonify({
            "success": True,
            "status": "connected",
            "dbType": "SQLite",
            "timestamp": datetime.now().isoformat()
        })
    
    @app.route('/api/v1/info')
    @handle_errors
    def get_app_info():
        """获取应用信息"""
        return jsonify({
            "success": True,
            "data": {
                "name": "儒智 - 传统文化智能学习平台",
                "version": "2.0.0",
                "description": "基于AI技术的中国传统文化学习平台，提供OCR识别、智能对话、经典阅读等功能",
                "author": "儒智开发团队",
                "features": {
                    "ocr_recognition": {
                        "name": "OCR古籍识别",
                        "description": "支持古籍、手写、印刷体等多种文本识别",
                        "status": "active"
                    },
                    "ai_dialogue": {
                        "name": "AI人物对话",
                        "description": "与孔子、老子等历史人物进行智能对话",
                        "status": "active"
                    },
                    "learning_center": {
                        "name": "智能学习中心",
                        "description": "个性化学习计划和进度跟踪",
                        "status": "active"
                    },
                    "classics_reading": {
                        "name": "经典阅读",
                        "description": "经典文献阅读和AI智能注释",
                        "status": "active"
                    },
                    "knowledge_graph": {
                        "name": "知识图谱",
                        "description": "传统文化概念关系可视化",
                        "status": "active"
                    }
                },
                "api_version": "v1",
                "endpoints": {
                    "ocr": "/api/v1/ocr",
                    "dialogue": "/api/v1/dialogue",
                    "learning": "/api/v1/learning",
                    "classics": "/api/v1/classics",
                    "knowledge": "/api/v1/knowledge",
                    "config": "/api/v1/config"
                }
            }
        })
    
    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "API端点不存在",
            "code": 404
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": "HTTP方法不被允许",
            "code": 405
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"服务器内部错误: {str(error)}")
        return jsonify({
            "success": False,
            "error": "服务器内部错误",
            "code": 500
        }), 500
    
    # 请求日志中间件
    @app.before_request
    def log_request_info():
        if request.path.startswith('/api/'):
            logger.info(f"API请求: {request.method} {request.path}")
    
    @app.after_request
    def log_response_info(response):
        if request.path.startswith('/api/'):
            logger.info(f"API响应: {request.method} {request.path} - {response.status_code}")
        return response
    
    return app

# 创建应用实例
app = create_app()

if __name__ == '__main__':
    logger.info("启动儒智传统文化智能学习平台...")
    logger.info("=" * 50)
    logger.info("🏛️  儒智 - 传统文化智能学习平台")
    logger.info("📚 功能模块:")
    logger.info("   • OCR古籍识别")
    logger.info("   • AI人物对话")
    logger.info("   • 智能学习中心")
    logger.info("   • 经典阅读注释")
    logger.info("   • 知识图谱探索")
    logger.info("   • API配置管理")
    logger.info("=" * 50)
    
    app.run(
        host=FLASK_CONFIG['HOST'],
        port=FLASK_CONFIG['PORT'],
        debug=FLASK_CONFIG['DEBUG']
    )
