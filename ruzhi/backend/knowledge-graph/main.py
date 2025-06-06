"""
儒智知识图谱服务 - 主入口
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
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

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

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