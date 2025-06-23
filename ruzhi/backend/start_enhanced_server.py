#!/usr/bin/env python3
"""
儒智项目增强版服务器启动脚本
集成了数据持久化、安全配置、日志监控和OCR功能
"""
import os
import sys
import argparse
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def check_dependencies():
    """检查依赖项"""
    missing_deps = []
    
    try:
        import flask
    except ImportError:
        missing_deps.append('flask')
    
    try:
        import sqlalchemy
    except ImportError:
        missing_deps.append('sqlalchemy')
    
    try:
        import redis
    except ImportError:
        missing_deps.append('redis')
    
    try:
        import cv2
    except ImportError:
        missing_deps.append('opencv-python')
    
    try:
        import PIL
    except ImportError:
        missing_deps.append('Pillow')
    
    if missing_deps:
        print(f"❌ 缺少依赖项: {', '.join(missing_deps)}")
        print("请运行: pip install -r requirements.txt")
        return False
    
    print("✅ 所有依赖项已安装")
    return True

def setup_environment():
    """设置环境"""
    # 创建必要的目录
    directories = [
        'logs',
        'uploads',
        'data/temp'
    ]
    
    for directory in directories:
        dir_path = project_root / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 创建目录: {directory}")
    
    # 检查环境变量文件
    env_file = project_root / '.env'
    env_example = project_root / '.env.example'
    
    if not env_file.exists() and env_example.exists():
        print("⚠️  未找到.env文件，请复制.env.example并配置")
        return False
    
    return True

def initialize_database():
    """初始化数据库"""
    try:
        from database_init import init_database, get_database_info
        
        print("🗄️  检查数据库连接...")
        db_info = get_database_info()
        
        if db_info.get('connection_status') == 'failed':
            print("❌ 数据库连接失败，尝试初始化...")
            success = init_database()
            if not success:
                print("❌ 数据库初始化失败")
                return False
        
        print("✅ 数据库连接正常")
        print(f"   - 数据表数量: {len(db_info.get('tables', []))}")
        print(f"   - 用户数量: {db_info.get('user_count', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        return False

def test_services():
    """测试服务功能"""
    print("🧪 测试服务功能...")
    
    # 测试OCR服务
    try:
        from services.enhanced_ocr_service import enhanced_ocr_service
        engine_info = enhanced_ocr_service.get_engine_info()
        print(f"   - OCR引擎: {list(engine_info['engines'].keys())}")
        
        # 测试图像验证
        test_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        validation = enhanced_ocr_service.validate_image(test_image)
        if validation['valid']:
            print("   ✅ OCR服务正常")
        else:
            print(f"   ⚠️  OCR服务异常: {validation.get('error', '未知错误')}")
            
    except Exception as e:
        print(f"   ❌ OCR服务测试失败: {e}")
    
    # 测试AI服务
    try:
        from services.ai_service import RealAIService
        # 简单测试（不实际调用API）
        print("   ✅ AI服务模块加载正常")
        
    except Exception as e:
        print(f"   ❌ AI服务测试失败: {e}")
    
    # 测试日志系统
    try:
        from utils.logging_config import get_logger
        test_logger = get_logger('test')
        test_logger.info("日志系统测试")
        print("   ✅ 日志系统正常")
        
    except Exception as e:
        print(f"   ❌ 日志系统测试失败: {e}")

def start_server(host='0.0.0.0', port=8000, debug=False):
    """启动服务器"""
    try:
        from app import create_app
        from config.settings import validate_config
        
        # 验证配置
        print("🔧 验证配置...")
        try:
            validate_config()
            print("✅ 配置验证通过")
        except ValueError as e:
            print(f"❌ 配置验证失败: {e}")
            return False
        
        # 创建应用
        print("🚀 创建Flask应用...")
        app = create_app()
        
        # 启动服务器
        print(f"🌐 启动服务器...")
        print(f"   - 地址: http://{host}:{port}")
        print(f"   - 调试模式: {'开启' if debug else '关闭'}")
        print(f"   - API文档: http://{host}:{port}/health")
        print(f"   - 监控指标: http://{host}:{port}/metrics")
        print("=" * 50)
        
        app.run(host=host, port=port, debug=debug, threaded=True)
        
    except Exception as e:
        print(f"❌ 服务器启动失败: {e}")
        return False

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='儒智项目增强版服务器')
    parser.add_argument('--host', default='0.0.0.0', help='服务器地址')
    parser.add_argument('--port', type=int, default=8000, help='服务器端口')
    parser.add_argument('--debug', action='store_true', help='启用调试模式')
    parser.add_argument('--skip-checks', action='store_true', help='跳过检查步骤')
    parser.add_argument('--init-db', action='store_true', help='仅初始化数据库')
    parser.add_argument('--test-only', action='store_true', help='仅运行测试')
    
    args = parser.parse_args()
    
    print("🏛️  儒智 - 传统文化智能学习平台 (增强版)")
    print("=" * 50)
    
    if not args.skip_checks:
        # 检查依赖
        if not check_dependencies():
            sys.exit(1)
        
        # 设置环境
        if not setup_environment():
            sys.exit(1)
        
        # 初始化数据库
        if not initialize_database():
            print("⚠️  数据库初始化失败，但服务器仍可启动（使用内存存储）")
        
        # 测试服务
        test_services()
    
    if args.init_db:
        print("✅ 数据库初始化完成")
        return
    
    if args.test_only:
        print("✅ 测试完成")
        return
    
    # 启动服务器
    print("\n🚀 准备启动服务器...")
    start_server(args.host, args.port, args.debug)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"\n❌ 启动失败: {e}")
        sys.exit(1)
