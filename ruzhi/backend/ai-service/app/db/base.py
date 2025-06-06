"""
儒智AI服务 - 数据库基础配置
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config.settings import settings

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建Base类，所有模型都将继承自这个类
Base = declarative_base()


def get_db():
    """
    创建数据库会话依赖
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 