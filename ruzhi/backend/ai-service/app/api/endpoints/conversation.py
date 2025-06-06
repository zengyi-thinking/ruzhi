"""
儒智AI服务 - 对话API
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Path
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.conversation import ConversationCreate, ConversationRead, ConversationSummary, ConversationUpdate, MessageCreate
from app.services.conversation_service import ConversationService
from app.api.deps import get_current_user_id

router = APIRouter()


@router.get("/", response_model=List[ConversationSummary], summary="获取用户所有对话")
async def get_conversations(
    skip: int = Query(0, description="跳过条数"),
    limit: int = Query(100, description="限制条数"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    获取用户所有对话列表
    """
    conversations = ConversationService.get_conversations(db, user_id, skip, limit)
    return conversations


@router.post("/", response_model=ConversationRead, status_code=status.HTTP_201_CREATED, summary="创建新对话")
async def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    创建新对话
    """
    result = ConversationService.create_conversation(
        db=db,
        user_id=user_id,
        persona=conversation.persona,
        title=conversation.title,
        first_message=conversation.first_message
    )
    return result


@router.get("/{conversation_id}", response_model=ConversationRead, summary="获取对话详情")
async def get_conversation(
    conversation_id: int = Path(..., description="对话ID"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    获取对话详情
    """
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="没有权限访问此对话")
    
    return conversation


@router.post("/{conversation_id}/messages", response_model=str, summary="发送消息")
async def add_message(
    conversation_id: int = Path(..., description="对话ID"),
    message: str = Body(..., embed=True, description="消息内容"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    发送消息并获取AI回复
    """
    # 首先检查对话是否存在以及用户是否有权限
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="没有权限访问此对话")
    
    # 添加消息并获取回复
    response = ConversationService.add_message(db, conversation_id, message)
    if not response:
        raise HTTPException(status_code=500, detail="发送消息失败")
    
    return response


@router.patch("/{conversation_id}", response_model=ConversationRead, summary="更新对话")
async def update_conversation(
    conversation_id: int = Path(..., description="对话ID"),
    conversation_update: ConversationUpdate = Body(..., description="更新内容"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    更新对话信息
    """
    # 首先检查对话是否存在以及用户是否有权限
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="没有权限修改此对话")
    
    # 更新对话
    updated_conversation = ConversationService.update_conversation(
        db=db,
        conversation_id=conversation_id,
        title=conversation_update.title
    )
    
    if not updated_conversation:
        raise HTTPException(status_code=500, detail="更新对话失败")
    
    return updated_conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除对话")
async def delete_conversation(
    conversation_id: int = Path(..., description="对话ID"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """
    删除对话
    """
    # 首先检查对话是否存在以及用户是否有权限
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="没有权限删除此对话")
    
    # 删除对话
    result = ConversationService.delete_conversation(db, conversation_id)
    if not result:
        raise HTTPException(status_code=500, detail="删除对话失败")
    
    return None 