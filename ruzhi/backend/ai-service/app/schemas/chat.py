"""
儒智AI对话服务 - 聊天模型定义
"""

from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional, Dict, Any


class MessageRole(str, Enum):
    """消息角色枚举"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """聊天消息"""
    role: MessageRole
    content: str


class HistoricalFigure(str, Enum):
    """历史人物枚举"""
    CONFUCIUS = "confucius"  # 孔子
    MENGZI = "mengzi"        # 孟子
    XUNZI = "xunzi"          # 荀子
    ZHUANGZI = "zhuangzi"    # 庄子
    LAOZI = "laozi"          # 老子
    MOZI = "mozi"            # 墨子
    HANFEIZI = "hanfeizi"    # 韩非子


class ChatRequest(BaseModel):
    """聊天请求"""
    user_id: str = Field(default="guest", description="用户ID")
    message: str = Field(..., description="用户消息内容")
    character: HistoricalFigure = Field(
        default=HistoricalFigure.CONFUCIUS,
        description="选择要对话的历史人物"
    )


class ChatResponse(BaseModel):
    """聊天响应"""
    message_id: str
    content: str
    character: HistoricalFigure


class CharacterInfo(BaseModel):
    """历史人物信息"""
    id: str
    name: str
    time_period: str
    description: str
    teachings: List[str]
    famous_quotes: List[str]
    style: str 