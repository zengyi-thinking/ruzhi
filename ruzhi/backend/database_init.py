"""
数据库初始化脚本
创建数据库表并插入初始数据
"""
import os
import sys
from datetime import datetime, timezone

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.database import create_tables, drop_tables, SessionLocal, engine
from models.crud import UserCRUD, SystemCRUD
from sqlalchemy import text
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_connection():
    """检查数据库连接"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("数据库连接成功")
            return True
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        return False

def create_database_if_not_exists():
    """创建数据库（如果不存在）"""
    try:
        # 从DATABASE_URL中提取数据库名
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ruzhi')
        
        # 解析数据库URL
        from urllib.parse import urlparse
        parsed = urlparse(database_url)
        
        database_name = parsed.path[1:]  # 去掉开头的'/'
        
        # 连接到postgres数据库来创建目标数据库
        admin_url = database_url.replace(f'/{database_name}', '/postgres')
        
        from sqlalchemy import create_engine
        admin_engine = create_engine(admin_url)
        
        with admin_engine.connect() as connection:
            # 设置自动提交模式
            connection.execute(text("COMMIT"))
            
            # 检查数据库是否存在
            result = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": database_name}
            )
            
            if not result.fetchone():
                # 创建数据库
                connection.execute(text(f"CREATE DATABASE {database_name}"))
                logger.info(f"数据库 {database_name} 创建成功")
            else:
                logger.info(f"数据库 {database_name} 已存在")
        
        admin_engine.dispose()
        
    except Exception as e:
        logger.warning(f"创建数据库时出错（可能数据库已存在）: {e}")

def init_database(reset=False):
    """初始化数据库"""
    logger.info("开始初始化数据库...")
    
    # 检查数据库连接
    if not check_database_connection():
        logger.info("尝试创建数据库...")
        create_database_if_not_exists()
        
        # 再次检查连接
        if not check_database_connection():
            logger.error("无法连接到数据库，请检查配置")
            return False
    
    try:
        # 如果需要重置，先删除所有表
        if reset:
            logger.info("重置数据库：删除所有表...")
            drop_tables()
        
        # 创建所有表
        logger.info("创建数据库表...")
        create_tables()
        
        # 插入初始数据
        logger.info("插入初始数据...")
        insert_initial_data()
        
        logger.info("数据库初始化完成！")
        return True
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        return False

def insert_initial_data():
    """插入初始数据"""
    db = SessionLocal()
    try:
        # 创建管理员用户
        admin_user = UserCRUD.get_user_by_username(db, "admin")
        if not admin_user:
            admin_user = UserCRUD.create_user(
                db=db,
                username="admin",
                email="admin@ruzhi.com",
                password="admin123",  # 生产环境中应该使用更安全的密码
                full_name="系统管理员"
            )
            logger.info("创建管理员用户成功")
        
        # 插入系统配置
        configs = [
            {
                "config_key": "app_version",
                "config_value": {"version": "2.0.0", "build": "20241223"},
                "description": "应用版本信息"
            },
            {
                "config_key": "ai_models",
                "config_value": {
                    "default_model": "deepseek-chat",
                    "available_models": ["deepseek-chat", "gpt-3.5-turbo"],
                    "max_tokens": 2000,
                    "temperature": 0.7
                },
                "description": "AI模型配置"
            },
            {
                "config_key": "ocr_settings",
                "config_value": {
                    "default_engine": "easyocr",
                    "supported_languages": ["zh", "en"],
                    "max_image_size": 10485760,  # 10MB
                    "supported_formats": ["jpg", "jpeg", "png", "bmp"]
                },
                "description": "OCR服务配置"
            },
            {
                "config_key": "rate_limits",
                "config_value": {
                    "api_calls_per_minute": 60,
                    "api_calls_per_hour": 1000,
                    "ocr_calls_per_day": 100,
                    "ai_calls_per_day": 500
                },
                "description": "API调用频率限制"
            }
        ]
        
        for config_data in configs:
            existing_config = SystemCRUD.get_config(db, config_data["config_key"])
            if not existing_config:
                SystemCRUD.set_config(
                    db=db,
                    config_key=config_data["config_key"],
                    config_value=config_data["config_value"],
                    description=config_data["description"]
                )
                logger.info(f"插入系统配置: {config_data['config_key']}")
        
        logger.info("初始数据插入完成")
        
    except Exception as e:
        logger.error(f"插入初始数据失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def get_database_info():
    """获取数据库信息"""
    db = SessionLocal()
    try:
        # 获取表信息
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
        
        # 获取用户数量
        from models.database import User
        user_count = db.query(User).count()
        
        info = {
            "database_url": os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ruzhi'),
            "tables": tables,
            "user_count": user_count,
            "connection_status": "connected"
        }
        
        return info
        
    except Exception as e:
        return {
            "database_url": os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ruzhi'),
            "error": str(e),
            "connection_status": "failed"
        }
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='数据库初始化工具')
    parser.add_argument('--reset', action='store_true', help='重置数据库（删除所有数据）')
    parser.add_argument('--info', action='store_true', help='显示数据库信息')
    
    args = parser.parse_args()
    
    if args.info:
        info = get_database_info()
        print("数据库信息:")
        for key, value in info.items():
            print(f"  {key}: {value}")
    else:
        success = init_database(reset=args.reset)
        if success:
            print("数据库初始化成功！")
            sys.exit(0)
        else:
            print("数据库初始化失败！")
            sys.exit(1)
