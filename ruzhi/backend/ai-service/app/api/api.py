"""
儒智AI服务 - API路由集合
"""

from fastapi import APIRouter

from app.api.endpoints import conversation, api_settings

api_router = APIRouter()

api_router.include_router(conversation.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(api_settings.router, prefix="/api-settings", tags=["api-settings"]) 