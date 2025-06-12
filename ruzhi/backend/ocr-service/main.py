"""
儒智OCR服务 - 主入口
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging
import sys
import traceback
import time
from contextlib import asynccontextmanager
from datetime import datetime

# 导入API模块
from app.api.endpoints import router as ocr_router

# 配置增强的日志系统
def setup_logging():
    """设置增强的日志配置"""
    # 创建日志格式器
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    )

    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # 文件处理器
    file_handler = logging.FileHandler("logs/ocr_service.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    # 错误文件处理器
    error_handler = logging.FileHandler("logs/ocr_errors.log", encoding="utf-8")
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)

    # 配置根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    return logging.getLogger(__name__)

# 确保日志目录存在
import os
os.makedirs("logs", exist_ok=True)

logger = setup_logging()

# 记录服务启动时间
start_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时的初始化
    logger.info("正在启动OCR服务...")
    logger.info("服务配置: 端口=8001, 环境=开发")
    try:
        # 这里可以添加服务初始化逻辑
        # 例如：加载模型、连接数据库等
        logger.info("OCR服务初始化完成")
        yield
    except Exception as e:
        logger.error(f"服务启动失败: {e}")
        raise
    finally:
        # 关闭时的清理
        logger.info("正在关闭OCR服务...")
        logger.info("OCR服务已安全关闭")

app = FastAPI(
    title="儒智OCR服务",
    description="古籍智能识别OCR服务API",
    version="0.1.0",
    lifespan=lifespan
)

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有HTTP请求"""
    start_time = time.time()

    # 记录请求信息
    logger.info(f"请求开始: {request.method} {request.url}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        # 记录响应信息
        logger.info(
            f"请求完成: {request.method} {request.url} - "
            f"状态码: {response.status_code} - "
            f"处理时间: {process_time:.3f}s"
        )

        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        return response

    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"请求失败: {request.method} {request.url} - "
            f"错误: {str(e)} - "
            f"处理时间: {process_time:.3f}s"
        )
        raise

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常处理器
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """处理HTTP异常"""
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail} - URL: {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP错误",
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求验证异常"""
    logger.warning(f"请求验证失败: {exc.errors()} - URL: {request.url}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "请求验证失败",
            "message": "请求参数不符合要求",
            "details": exc.errors(),
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理所有未捕获的异常"""
    error_id = f"error_{int(time.time())}_{hash(str(exc)) % 10000}"

    logger.error(
        f"未处理异常 [{error_id}]: {type(exc).__name__}: {str(exc)} - "
        f"URL: {request.url} - "
        f"Traceback: {traceback.format_exc()}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "服务器内部错误",
            "message": "服务遇到意外错误，请稍后重试",
            "error_id": error_id,
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

# 根路径
@app.get("/")
async def root():
    """服务状态检查"""
    return {"message": "儒智OCR服务已启动", "status": "running"}

# 健康检查
@app.get("/health")
async def health_check():
    """增强的健康检查"""
    try:
        import psutil
        import platform

        # 系统信息
        system_info = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "OCR服务",
            "version": "0.1.0",
            "system": {
                "platform": platform.system(),
                "python_version": platform.python_version(),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent if platform.system() != 'Windows' else psutil.disk_usage('C:').percent
            },
            "uptime": time.time() - start_time if 'start_time' in globals() else 0
        }

        # 检查关键组件状态
        components_status = {
            "ocr_engine": "available",  # 这里应该检查实际的OCR引擎状态
            "file_system": "accessible",
            "memory": "normal" if psutil.virtual_memory().percent < 80 else "high",
            "cpu": "normal" if psutil.cpu_percent() < 80 else "high"
        }

        system_info["components"] = components_status

        # 如果有任何组件状态异常，标记为警告
        if any(status in ["high", "error", "unavailable"] for status in components_status.values()):
            system_info["status"] = "warning"

        logger.debug(f"健康检查完成: {system_info['status']}")
        return system_info

    except ImportError:
        # 如果psutil不可用，返回基本信息
        logger.warning("psutil不可用，返回基本健康检查信息")
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "OCR服务",
            "version": "0.1.0",
            "message": "基本健康检查（系统监控不可用）"
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "error",
            "timestamp": datetime.now().isoformat(),
            "service": "OCR服务",
            "error": str(e)
        }

# 包含OCR路由
app.include_router(ocr_router, prefix="/api/v1/ocr", tags=["ocr"])

# 主函数
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 