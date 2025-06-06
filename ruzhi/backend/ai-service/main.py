"""
儒智AI对话服务 - 主入口
"""

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from typing import List, Optional

from app.schemas.chat import ChatRequest, ChatResponse, HistoricalFigure
from app.services.chat_service import ChatService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="儒智AI对话服务",
    description="《孟子》历史人物对话API",
    version="0.1.0",
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建聊天服务实例
chat_service = ChatService()

# 根路径
@app.get("/")
async def root():
    """服务状态检查"""
    return {"message": "儒智AI对话服务已启动", "status": "running"}

# 创建API路由
router = APIRouter(prefix="/api/v1/dialogue", tags=["dialogue"])

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

# 添加路由
app.include_router(router)

# 启动服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=True) 