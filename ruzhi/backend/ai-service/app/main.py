"""
儒智AI服务 - 主应用
"""

import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.config.settings import settings
from app.db.base import engine, Base

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 创建数据库表
Base.metadata.create_all(bind=engine)

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
async def root():
    """
    根路径，返回服务状态
    """
    return {"status": "online", "service": settings.APP_NAME}


@app.get("/health", tags=["status"])
async def health_check():
    """
    健康检查接口
    """
    return {"status": "healthy"} 