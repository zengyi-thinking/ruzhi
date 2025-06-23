"""
数据库模型定义
使用SQLAlchemy ORM实现数据持久化
"""
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import os

# 数据库配置
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/ruzhi')

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=os.getenv('SQL_DEBUG', 'False').lower() == 'true'
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明基类
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 用户模型
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # 关系
    learning_records = relationship("LearningRecord", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    ocr_records = relationship("OCRRecord", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")

# 学习记录模型
class LearningRecord(Base):
    __tablename__ = "learning_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content_type = Column(String(50), nullable=False)  # 'classic', 'dialogue', 'concept'
    content_id = Column(String(100), nullable=False)  # 内容标识符
    content_title = Column(String(200), nullable=False)
    progress = Column(Float, default=0.0)  # 学习进度 0-1
    time_spent = Column(Integer, default=0)  # 学习时间（秒）
    completion_status = Column(String(20), default='in_progress')  # 'not_started', 'in_progress', 'completed'
    notes = Column(Text, nullable=True)  # 用户笔记
    extra_data = Column(JSON, nullable=True)  # 额外元数据
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # 关系
    user = relationship("User", back_populates="learning_records")

# 对话记录模型
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    character_id = Column(String(50), nullable=False)  # 对话人物ID
    character_name = Column(String(100), nullable=False)  # 人物名称
    title = Column(String(200), nullable=True)  # 对话标题
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # 关系
    user = relationship("User", back_populates="conversations")
    messages = relationship("ConversationMessage", back_populates="conversation", cascade="all, delete-orphan")

# 对话消息模型
class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'assistant'
    content = Column(Text, nullable=False)
    thinking_process = Column(Text, nullable=True)  # AI思考过程
    confidence = Column(Float, nullable=True)  # 置信度
    extra_data = Column(JSON, nullable=True)  # 额外信息
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # 关系
    conversation = relationship("Conversation", back_populates="messages")

# OCR记录模型
class OCRRecord(Base):
    __tablename__ = "ocr_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    original_image_url = Column(String(500), nullable=False)  # 原始图片URL
    processed_image_url = Column(String(500), nullable=True)  # 处理后图片URL
    recognized_text = Column(Text, nullable=False)  # 识别的文本
    confidence_score = Column(Float, nullable=True)  # 识别置信度
    processing_time = Column(Float, nullable=True)  # 处理时间（秒）
    ocr_engine = Column(String(50), nullable=True)  # 使用的OCR引擎
    language = Column(String(20), default='zh')  # 识别语言
    status = Column(String(20), default='completed')  # 'processing', 'completed', 'failed'
    error_message = Column(Text, nullable=True)  # 错误信息
    extra_data = Column(JSON, nullable=True)  # 额外元数据
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # 关系
    user = relationship("User", back_populates="ocr_records")

# 学习计划模型
class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_content = Column(JSON, nullable=False)  # 学习目标内容
    duration_days = Column(Integer, nullable=False)  # 计划天数
    daily_time_minutes = Column(Integer, nullable=False)  # 每日学习时间（分钟）
    difficulty_level = Column(String(20), default='beginner')  # 'beginner', 'intermediate', 'advanced'
    status = Column(String(20), default='active')  # 'active', 'paused', 'completed', 'cancelled'
    progress = Column(Float, default=0.0)  # 完成进度 0-1
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 关系
    user = relationship("User", back_populates="study_plans")

# 用户成就模型
class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id = Column(String(100), nullable=False)  # 成就标识符
    achievement_name = Column(String(200), nullable=False)
    achievement_description = Column(Text, nullable=True)
    achievement_type = Column(String(50), nullable=False)  # 'learning', 'dialogue', 'ocr', 'streak'
    points = Column(Integer, default=0)  # 获得积分
    unlocked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # 关系
    user = relationship("User")

# API使用统计模型
class APIUsageLog(Base):
    __tablename__ = "api_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time = Column(Float, nullable=False)  # 响应时间（毫秒）
    request_size = Column(Integer, nullable=True)  # 请求大小（字节）
    response_size = Column(Integer, nullable=True)  # 响应大小（字节）
    ip_address = Column(String(45), nullable=True)  # 支持IPv6
    user_agent = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # 关系
    user = relationship("User")

# 系统配置模型
class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config_key = Column(String(100), unique=True, nullable=False, index=True)
    config_value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

# 创建所有表
def create_tables():
    """创建所有数据库表"""
    Base.metadata.create_all(bind=engine)

# 删除所有表（仅用于开发环境）
def drop_tables():
    """删除所有数据库表"""
    Base.metadata.drop_all(bind=engine)
