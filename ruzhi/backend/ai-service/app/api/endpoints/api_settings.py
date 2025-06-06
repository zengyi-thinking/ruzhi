"""
儒智AI服务 - API设置管理接口
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.services.llm_service import llm_service
from app.config.settings import settings
from app.api.deps import get_current_user_id

router = APIRouter()


class ApiSettingsUpdate(BaseModel):
    """API设置更新请求模型"""
    provider: str
    api_key: str
    api_base: Optional[str] = None
    model_name: Optional[str] = None


class ApiProviderInfo(BaseModel):
    """API提供商信息响应模型"""
    provider: str
    name: str
    model: str
    status: str


@router.get("/current", response_model=ApiProviderInfo, summary="获取当前使用的API提供商")
async def get_current_api_provider(user_id: str = Depends(get_current_user_id)):
    """
    获取当前使用的API提供商信息
    """
    return llm_service.get_current_provider()


@router.put("/update", response_model=Dict[str, Any], summary="更新API设置")
async def update_api_settings(
    settings_update: ApiSettingsUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """
    更新API设置
    
    - **provider**: API提供商 (deepseek, zhipuai, openai)
    - **api_key**: API密钥
    - **api_base**: 可选，API基础URL
    - **model_name**: 可选，模型名称
    """
    # 在开发环境中，任何用户都可以更新设置
    if not settings.DEBUG:
        # 在生产环境中，可能需要添加管理员权限检查
        # 这里简化实现，假设所有认证通过的用户都可以更新
        pass
    
    # 验证提供商
    if settings_update.provider not in ["deepseek", "zhipuai", "openai"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的API提供商: {settings_update.provider}"
        )
    
    # 更新API设置
    success = llm_service.update_api_settings(
        provider=settings_update.provider,
        api_key=settings_update.api_key,
        api_base=settings_update.api_base,
        model_name=settings_update.model_name
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新API设置失败"
        )
    
    # 返回更新后的提供商信息
    return {
        "success": True,
        "message": f"成功更新 {settings_update.provider} API设置",
        "provider": llm_service.get_current_provider()
    }


@router.get("/providers", summary="获取支持的API提供商列表")
async def get_supported_providers():
    """
    获取支持的API提供商列表
    """
    return [
        {
            "provider": "deepseek",
            "name": "DeepSeek AI",
            "description": "DeepSeek大语言模型服务",
            "url": "https://www.deepseek.com/",
            "default_model": settings.DEEPSEEK_API_MODEL,
            "default_api_base": settings.DEEPSEEK_API_BASE
        },
        {
            "provider": "zhipuai",
            "name": "智谱清言",
            "description": "智谱AI大语言模型服务",
            "url": "https://open.bigmodel.cn/",
            "default_model": settings.ZHIPUAI_API_MODEL,
            "default_api_base": settings.ZHIPUAI_API_BASE
        },
        {
            "provider": "openai",
            "name": "OpenAI",
            "description": "OpenAI大语言模型服务",
            "url": "https://platform.openai.com/",
            "default_model": settings.OPENAI_API_MODEL,
            "default_api_base": settings.OPENAI_API_BASE
        }
    ] 