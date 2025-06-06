"""
儒智AI服务 - 对话数据模型
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from app.db.base import Base


class Conversation(Base):
    """对话数据库模型"""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), index=True)
    persona = Column(String(50), index=True)  # 虚拟导师角色
    title = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联的消息
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """消息数据库模型"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True)
    role = Column(String(20), index=True)  # user 或 assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联的对话
    conversation = relationship("Conversation", back_populates="messages")


# Pydantic 模型，用于API请求和响应

class MessageBase(BaseModel):
    """消息基础模型"""
    role: str
    content: str


class MessageCreate(MessageBase):
    """创建消息模型"""
    pass


class MessageRead(MessageBase):
    """读取消息模型"""
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class ConversationBase(BaseModel):
    """对话基础模型"""
    persona: str
    title: str


class ConversationCreate(ConversationBase):
    """创建对话模型"""
    first_message: str


class ConversationUpdate(BaseModel):
    """更新对话模型"""
    title: Optional[str] = None


class ConversationRead(ConversationBase):
    """读取对话模型"""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageRead] = []

    class Config:
        orm_mode = True


class ConversationSummary(BaseModel):
    """对话摘要模型"""
    id: int
    persona: str
    title: str
    updated_at: datetime
    message_count: int

    class Config:
        orm_mode = True 