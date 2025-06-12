"""
儒智知识图谱服务 - 主入口
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import sys
import time
import traceback
from contextlib import asynccontextmanager
from datetime import datetime
import os

# 导入API模块
try:
    from app.api.endpoints import router as graph_router
    from app.services.graph_service import GraphService
    MODULES_AVAILABLE = True
except ImportError:
    MODULES_AVAILABLE = False
    # 如果导入失败，创建mock模块
    from fastapi import APIRouter
    graph_router = APIRouter()
    
    # 简单的mock GraphService类
    class GraphService:
        def __init__(self, *args, **kwargs):
            pass
            
        def verify_connectivity(self):
            return True
            
        def close(self):
            pass

# 获取环境变量
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

# 配置增强的日志系统
def setup_logging():
    """设置增强的日志配置"""
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # 确保日志目录存在
    os.makedirs("logs", exist_ok=True)

    file_handler = logging.FileHandler("logs/knowledge_graph.log", encoding="utf-8")
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    error_handler = logging.FileHandler("logs/knowledge_graph_errors.log", encoding="utf-8")
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    return logging.getLogger(__name__)

logger = setup_logging()
start_time = time.time()

# 图谱服务实例
graph_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时连接数据库
    global graph_service
    logger.info("正在初始化知识图谱服务...")
    
    if MODULES_AVAILABLE:
        try:
            graph_service = GraphService(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
            if graph_service.verify_connectivity():
                logger.info("Neo4j数据库连接成功")
            else:
                logger.warning("Neo4j数据库连接验证失败，使用模拟模式")
        except Exception as e:
            logger.error(f"Neo4j数据库连接失败: {e}")
            logger.info("使用模拟模式继续")
    else:
        logger.warning("模块导入失败，使用mock服务")
        graph_service = GraphService(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
    
    yield
    
    # 关闭时清理资源
    if graph_service:
        graph_service.close()
        logger.info("Neo4j数据库连接已关闭")

app = FastAPI(
    title="儒智知识图谱服务",
    description="《孟子》知识图谱系统API",
    version="0.1.0",
    lifespan=lifespan
)

# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有HTTP请求"""
    start_time_req = time.time()

    logger.info(f"请求开始: {request.method} {request.url}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time_req

        logger.info(
            f"请求完成: {request.method} {request.url} - "
            f"状态码: {response.status_code} - "
            f"处理时间: {process_time:.3f}s"
        )

        response.headers["X-Process-Time"] = str(process_time)
        return response

    except Exception as e:
        process_time = time.time() - start_time_req
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

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理所有未捕获的异常"""
    error_id = f"kg_error_{int(time.time())}_{hash(str(exc)) % 10000}"

    logger.error(
        f"未处理异常 [{error_id}]: {type(exc).__name__}: {str(exc)} - "
        f"URL: {request.url} - "
        f"Traceback: {traceback.format_exc()}"
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "知识图谱服务内部错误",
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
    mode = "模拟模式" if not MODULES_AVAILABLE or getattr(graph_service, "_mock_mode", True) else "正常模式"
    return {"message": "儒智知识图谱服务已启动", "status": "running", "mode": mode}

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    mode = "模拟模式" if not MODULES_AVAILABLE or getattr(graph_service, "_mock_mode", True) else "正常模式"
    
    if graph_service and graph_service.verify_connectivity():
        return {"status": "healthy", "database": "connected", "mode": mode}
    else:
        return {"status": "unhealthy", "database": "disconnected", "mode": mode}

# 如果模块可用，包含知识图谱路由
if MODULES_AVAILABLE:
    app.include_router(graph_router, prefix="/api/v1/knowledge", tags=["knowledge-graph"])
else:
    # 提供最小的模拟路径
    @app.get("/api/v1/knowledge/concept/{concept_id}")
    async def get_concept_mock(concept_id: str):
        """模拟概念详情API"""
        return {
            "id": concept_id,
            "name": "仁",
            "definition": "儒家核心价值观，推己及人的恻隐之心",
            "alternative_names": ["仁爱", "仁德"],
            "origins": [
                {
                    "text": "《论语·学而》",
                    "passage": "子曰：为政以德，譬如北辰，居其所而众星共之。",
                    "book": "论语",
                    "chapter": "学而第一"
                }
            ],
            "related_concepts": [
                {
                    "name": "孝",
                    "relation": "IS_A",
                    "strength": 0.9,
                    "description": "仁的具体表现之一"
                }
            ],
            "historical_events": [],
            "importance": 0.9
        }

    @app.post("/api/v1/knowledge/search")
    async def search_mock():
        """模拟搜索API"""
        return {
            "nodes": [
                {"id": "concept-1", "name": "仁", "type": "concept", "definition": "儒家核心价值观"},
                {"id": "concept-2", "name": "义", "type": "concept", "definition": "道德判断标准"}
            ]
        }

# 启动服务
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=True) 