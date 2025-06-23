"""
数据库CRUD操作
提供数据访问层的基础操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from datetime import datetime, timezone
import bcrypt

from .database import (
    User, LearningRecord, Conversation, ConversationMessage, 
    OCRRecord, StudyPlan, UserAchievement, APIUsageLog, SystemConfig
)

class UserCRUD:
    """用户相关的数据库操作"""
    
    @staticmethod
    def create_user(db: Session, username: str, email: str, password: str, full_name: str = None) -> User:
        """创建新用户"""
        # 密码哈希
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            full_name=full_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """根据ID获取用户"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """验证密码"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def update_last_login(db: Session, user_id: str):
        """更新最后登录时间"""
        db.query(User).filter(User.id == user_id).update({
            "last_login": datetime.now(timezone.utc)
        })
        db.commit()

class LearningCRUD:
    """学习记录相关的数据库操作"""
    
    @staticmethod
    def create_learning_record(db: Session, user_id: str, content_type: str, 
                             content_id: str, content_title: str) -> LearningRecord:
        """创建学习记录"""
        record = LearningRecord(
            user_id=user_id,
            content_type=content_type,
            content_id=content_id,
            content_title=content_title
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    
    @staticmethod
    def update_learning_progress(db: Session, record_id: str, progress: float, 
                               time_spent: int = None, notes: str = None):
        """更新学习进度"""
        update_data = {"progress": progress, "updated_at": datetime.now(timezone.utc)}
        
        if time_spent is not None:
            update_data["time_spent"] = time_spent
        if notes is not None:
            update_data["notes"] = notes
        if progress >= 1.0:
            update_data["completion_status"] = "completed"
        
        db.query(LearningRecord).filter(LearningRecord.id == record_id).update(update_data)
        db.commit()
    
    @staticmethod
    def get_user_learning_records(db: Session, user_id: str, 
                                content_type: str = None) -> List[LearningRecord]:
        """获取用户学习记录"""
        query = db.query(LearningRecord).filter(LearningRecord.user_id == user_id)
        
        if content_type:
            query = query.filter(LearningRecord.content_type == content_type)
        
        return query.order_by(desc(LearningRecord.updated_at)).all()

class ConversationCRUD:
    """对话相关的数据库操作"""
    
    @staticmethod
    def create_conversation(db: Session, user_id: str, character_id: str, 
                          character_name: str, title: str = None) -> Conversation:
        """创建对话"""
        conversation = Conversation(
            user_id=user_id,
            character_id=character_id,
            character_name=character_name,
            title=title
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return conversation
    
    @staticmethod
    def add_message(db: Session, conversation_id: str, role: str, content: str,
                   thinking_process: str = None, confidence: float = None) -> ConversationMessage:
        """添加对话消息"""
        message = ConversationMessage(
            conversation_id=conversation_id,
            role=role,
            content=content,
            thinking_process=thinking_process,
            confidence=confidence
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    @staticmethod
    def get_user_conversations(db: Session, user_id: str, 
                             character_id: str = None) -> List[Conversation]:
        """获取用户对话列表"""
        query = db.query(Conversation).filter(
            and_(Conversation.user_id == user_id, Conversation.is_active == True)
        )
        
        if character_id:
            query = query.filter(Conversation.character_id == character_id)
        
        return query.order_by(desc(Conversation.updated_at)).all()
    
    @staticmethod
    def get_conversation_messages(db: Session, conversation_id: str) -> List[ConversationMessage]:
        """获取对话消息"""
        return db.query(ConversationMessage).filter(
            ConversationMessage.conversation_id == conversation_id
        ).order_by(asc(ConversationMessage.created_at)).all()

class OCRCRUD:
    """OCR记录相关的数据库操作"""
    
    @staticmethod
    def create_ocr_record(db: Session, user_id: str, original_image_url: str,
                         recognized_text: str, confidence_score: float = None,
                         processing_time: float = None, ocr_engine: str = None) -> OCRRecord:
        """创建OCR记录"""
        record = OCRRecord(
            user_id=user_id,
            original_image_url=original_image_url,
            recognized_text=recognized_text,
            confidence_score=confidence_score,
            processing_time=processing_time,
            ocr_engine=ocr_engine
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    
    @staticmethod
    def get_user_ocr_records(db: Session, user_id: str, limit: int = 50) -> List[OCRRecord]:
        """获取用户OCR记录"""
        return db.query(OCRRecord).filter(
            OCRRecord.user_id == user_id
        ).order_by(desc(OCRRecord.created_at)).limit(limit).all()

class SystemCRUD:
    """系统配置相关的数据库操作"""
    
    @staticmethod
    def get_config(db: Session, config_key: str) -> Optional[SystemConfig]:
        """获取系统配置"""
        return db.query(SystemConfig).filter(
            and_(SystemConfig.config_key == config_key, SystemConfig.is_active == True)
        ).first()
    
    @staticmethod
    def set_config(db: Session, config_key: str, config_value: Any, description: str = None):
        """设置系统配置"""
        config = db.query(SystemConfig).filter(SystemConfig.config_key == config_key).first()
        
        if config:
            config.config_value = config_value
            config.description = description
            config.updated_at = datetime.now(timezone.utc)
        else:
            config = SystemConfig(
                config_key=config_key,
                config_value=config_value,
                description=description
            )
            db.add(config)
        
        db.commit()
        return config
    
    @staticmethod
    def log_api_usage(db: Session, endpoint: str, method: str, status_code: int,
                     response_time: float, user_id: str = None, ip_address: str = None,
                     user_agent: str = None, error_message: str = None):
        """记录API使用日志"""
        log = APIUsageLog(
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message
        )
        db.add(log)
        db.commit()
        return log
