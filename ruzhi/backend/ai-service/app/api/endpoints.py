"""
儒智AI对话服务 - API端点
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List, Optional
import time

from ..schemas.chat import ChatRequest, ChatResponse, HistoricalFigure
from ..services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_character(request: ChatRequest):
    """
    与历史人物对话
    """
    try:
        response = chat_service.chat(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"聊天失败: {str(e)}")

@router.get("/characters")
async def list_characters():
    """
    获取可用的历史人物列表
    """
    try:
        characters = chat_service.list_available_characters()
        return {"characters": characters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取人物列表失败: {str(e)}")

@router.get("/characters/{character_id}")
async def get_character_info(character_id: str):
    """
    获取历史人物详细信息
    """
    try:
        # 将字符串ID转换为枚举
        try:
            char_enum = HistoricalFigure(character_id)
        except ValueError:
            raise HTTPException(status_code=404, detail=f"未找到人物: {character_id}")
        
        info = chat_service.get_character_info(char_enum)
        if "error" in info:
            raise HTTPException(status_code=404, detail=info["error"])
            
        return info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取人物信息失败: {str(e)}")

@router.get("/health")
async def health_check():
    """
    健康检查
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "ai-dialogue"
    } 