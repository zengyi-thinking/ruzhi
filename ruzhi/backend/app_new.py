"""
儒智项目 - 重构后的主应用文件
传统文化智能学习平台后端服务
"""
import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 导入配置和工具
from config.settings import FLASK_CONFIG
from utils.helpers import setup_logging, handle_errors

# 导入路由蓝图
from routes.ocr_routes import ocr_bp
from routes.dialogue_routes import dialogue_bp
from routes.learning_routes import learning_bp
from routes.classics_routes import classics_bp
from routes.knowledge_routes import knowledge_bp
from routes.config_routes import config_bp

# 设置日志
setup_logging()
logger = logging.getLogger(__name__)

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
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
        return jsonify({
            "success": True,
            "status": "healthy",
            "timestamp": "2024-01-16T10:00:00Z",
            "services": {
                "ocr": "active",
                "ai_dialogue": "active",
                "learning_center": "active",
                "classics_reading": "active",
                "knowledge_graph": "active",
                "api_config": "active"
            }
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
