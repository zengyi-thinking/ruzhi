"""
儒智AI服务 - API路由集合
"""

from fastapi import APIRouter

# 直接导入各个路由模块，而不是从endpoints包导入
from app.api.endpoints.conversation import router as conversation_router
from app.api.endpoints.api_settings import router as api_settings_router

api_router = APIRouter()

api_router.include_router(conversation_router, prefix="/conversations", tags=["conversations"])
api_router.include_router(api_settings_router, prefix="/api-settings", tags=["api-settings"]) 