"""
儒智AI服务 - 对话服务
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.conversation import Conversation, Message, ConversationRead, ConversationSummary
from app.services.llm_service import llm_service


class ConversationService:
    """对话服务"""
    
    @staticmethod
    def get_conversations(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[ConversationSummary]:
        """
        获取用户所有对话
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            skip: 跳过条数
            limit: 限制条数
            
        Returns:
            对话摘要列表
        """
        # 查询对话及其消息数量
        conversations = db.query(
            Conversation,
            func.count(Message.id).label("message_count")
        ).join(
            Message, Conversation.id == Message.conversation_id, isouter=True
        ).filter(
            Conversation.user_id == user_id
        ).group_by(
            Conversation.id
        ).order_by(
            Conversation.updated_at.desc()
        ).offset(skip).limit(limit).all()
        
        # 构建返回结果
        result = []
        for conv, msg_count in conversations:
            result.append(ConversationSummary(
                id=conv.id,
                persona=conv.persona,
                title=conv.title,
                updated_at=conv.updated_at,
                message_count=msg_count
            ))
        
        return result
    
    @staticmethod
    def get_conversation(db: Session, conversation_id: int) -> Optional[ConversationRead]:
        """
        获取单个对话
        
        Args:
            db: 数据库会话
            conversation_id: 对话ID
            
        Returns:
            对话详情
        """
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return None
        
        # 获取消息
        messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
        
        # 构建返回结果
        return ConversationRead.from_orm(conversation)
    
    @staticmethod
    def create_conversation(db: Session, user_id: str, persona: str, title: str, first_message: str) -> ConversationRead:
        """
        创建对话
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            persona: 角色名称
            title: 对话标题
            first_message: 首条消息
            
        Returns:
            创建的对话
        """
        # 创建对话
        conversation = Conversation(
            user_id=user_id,
            persona=persona,
            title=title
        )
        db.add(conversation)
        db.flush()
        
        # 添加用户消息
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=first_message
        )
        db.add(user_message)
        db.flush()
        
        # 生成AI回复
        ai_response = llm_service.generate_response(
            persona=persona,
            message=first_message
        )
        
        # 添加AI消息
        ai_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response
        )
        db.add(ai_message)
        db.commit()
        
        # 刷新对话
        db.refresh(conversation)
        
        # 构建返回结果
        result = ConversationRead.from_orm(conversation)
        return result
    
    @staticmethod
    def add_message(db: Session, conversation_id: int, message: str) -> Optional[str]:
        """
        添加消息并获取回复
        
        Args:
            db: 数据库会话
            conversation_id: 对话ID
            message: 用户消息
            
        Returns:
            AI回复内容
        """
        # 查询对话
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return None
        
        # 获取历史消息
        history_messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at).all()
        
        # 转换为列表格式
        history = []
        for msg in history_messages:
            history.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # 添加用户消息
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=message
        )
        db.add(user_message)
        db.flush()
        
        # 生成AI回复
        ai_response = llm_service.generate_response(
            persona=conversation.persona,
            message=message,
            conversation_history=history
        )
        
        # 添加AI消息
        ai_message = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=ai_response
        )
        db.add(ai_message)
        
        # 更新对话时间
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        return ai_response
    
    @staticmethod
    def update_conversation(db: Session, conversation_id: int, title: Optional[str]) -> Optional[ConversationRead]:
        """
        更新对话
        
        Args:
            db: 数据库会话
            conversation_id: 对话ID
            title: 对话标题
            
        Returns:
            更新后的对话
        """
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return None
        
        if title is not None:
            conversation.title = title
        
        db.commit()
        db.refresh(conversation)
        
        return ConversationRead.from_orm(conversation)
    
    @staticmethod
    def delete_conversation(db: Session, conversation_id: int) -> bool:
        """
        删除对话
        
        Args:
            db: 数据库会话
            conversation_id: 对话ID
            
        Returns:
            是否成功
        """
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return False
        
        db.delete(conversation)
        db.commit()
        
        return True 