"""
儒智OCR服务 - 主入口
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from contextlib import asynccontextmanager
from datetime import datetime

# 导入API模块
from app.api.endpoints import router as ocr_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时的初始化
    logger.info("正在启动OCR服务...")
    yield
    # 关闭时的清理
    logger.info("正在关闭OCR服务...")

app = FastAPI(
    title="儒智OCR服务",
    description="古籍智能识别OCR服务API",
    version="0.1.0",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 根路径
@app.get("/")
async def root():
    """服务状态检查"""
    return {"message": "儒智OCR服务已启动", "status": "running"}

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# 包含OCR路由
app.include_router(ocr_router, prefix="/api/v1/ocr", tags=["ocr"])

# 主函数
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 