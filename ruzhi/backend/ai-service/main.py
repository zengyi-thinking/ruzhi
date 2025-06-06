"""
儒智AI服务 - 主应用
"""

import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.api.api import api_router
from app.config.settings import settings

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="儒智APP AI服务，提供对话、文本生成等功能",
    version="0.1.0",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含API路由
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["status"])
def read_root():
    """
    获取API状态
    """
    return {"status": "online", "service": settings.APP_NAME}


@app.get("/health", tags=["status"])
def health_check():
    """
    健康检查
    """
    return {"status": "healthy"} 