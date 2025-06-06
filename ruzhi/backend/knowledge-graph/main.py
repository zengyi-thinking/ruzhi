from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import logging
from neo4j import GraphDatabase
from contextlib import asynccontextmanager
import os

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 数据库连接
neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
neo4j_user = os.getenv("NEO4J_USER", "neo4j")
neo4j_password = os.getenv("NEO4J_PASSWORD", "password")

# 初始化Neo4j驱动
driver = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时连接数据库
    global driver
    logger.info("正在连接Neo4j数据库...")
    try:
        driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        # 验证连接
        with driver.session() as session:
            result = session.run("RETURN 1 AS num")
            record = result.single()
            if record and record["num"] == 1:
                logger.info("Neo4j数据库连接成功")
            else:
                logger.error("Neo4j数据库连接验证失败")
    except Exception as e:
        logger.error(f"Neo4j数据库连接失败: {e}")
    
    yield
    
    # 关闭时清理资源
    if driver:
        driver.close()
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

# 模型定义
class RelatedConcept(BaseModel):
    name: str
    relation: str
    strength: float

class ConceptOrigin(BaseModel):
    text: str
    passage: str

class ConceptResponse(BaseModel):
    concept: str
    definition: str
    origins: List[ConceptOrigin]
    related_concepts: List[RelatedConcept]
    historical_events: List[Dict[str, Any]] = []

class QueryResponse(BaseModel):
    answer: str
    source_passages: List[Dict[str, Any]]
    related_concepts: List[Dict[str, str]]

# 辅助函数
def get_db_session():
    if not driver:
        raise HTTPException(status_code=500, detail="数据库连接未初始化")
    return driver.session()

def query_concept(tx, concept_name):
    query = """
    MATCH (c:Concept {name: $name})
    OPTIONAL MATCH (c)-[r]->(related)
    RETURN c, collect(distinct {relation: type(r), target: related, strength: r.strength}) as relations
    """
    result = tx.run(query, name=concept_name)
    record = result.single()
    if not record:
        return None
    
    concept = record["c"]
    relations = record["relations"]
    
    return {
        "concept": concept["name"],
        "definition": concept.get("definition", ""),
        "relations": relations
    }

def query_origins(tx, concept_name):
    query = """
    MATCH (c:Concept {name: $name})-[:MENTIONED_IN]->(p:Passage)
    RETURN p.source as text, p.content as passage
    """
    result = tx.run(query, name=concept_name)
    return [{"text": record["text"], "passage": record["passage"]} for record in result]

def natural_language_query(tx, query_text):
    # 这里应该是实际的自然语言处理和图谱查询逻辑
    # 简化实现，返回模拟数据
    return {
        "answer": "根据《孟子·梁惠王上》，孟子认为战争应当是正义之战，反对无端发动战争。",
        "source_passages": [
            {"source": "《孟子·梁惠王上》", "content": "..."}
        ],
        "related_concepts": [
            {"name": "仁政", "relation": "相关概念"},
            {"name": "王道", "relation": "相关概念"}
        ]
    }

# API端点
@app.get("/")
async def root():
    return {"message": "儒智知识图谱服务已启动"}

@app.get("/health")
async def health_check():
    try:
        with get_db_session() as session:
            result = session.run("RETURN 1 AS num")
            record = result.single()
            if record and record["num"] == 1:
                return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "unhealthy"}

@app.get("/api/v1/knowledge/concept/{concept_id}", response_model=ConceptResponse)
async def get_concept(concept_id: str, session=Depends(get_db_session)):
    try:
        # 查询概念基本信息
        concept_data = session.execute_read(query_concept, concept_id)
        if not concept_data:
            raise HTTPException(status_code=404, detail=f"概念 '{concept_id}' 未找到")
        
        # 查询概念出处
        origins = session.execute_read(query_origins, concept_id)
        
        # 处理关系数据
        related_concepts = []
        for relation in concept_data["relations"]:
            if relation["target"] and "name" in relation["target"]:
                related_concepts.append({
                    "name": relation["target"]["name"],
                    "relation": relation["relation"],
                    "strength": relation.get("strength", 0.5)
                })
        
        # 构建响应
        response = {
            "concept": concept_data["concept"],
            "definition": concept_data["definition"],
            "origins": origins,
            "related_concepts": related_concepts,
            "historical_events": []  # 简化实现，实际应查询历史事件
        }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"查询概念失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/knowledge/query", response_model=QueryResponse)
async def query(q: str = Query(..., description="自然语言查询"), session=Depends(get_db_session)):
    try:
        # 处理自然语言查询
        result = session.execute_read(natural_language_query, q)
        return result
    except Exception as e:
        logger.error(f"自然语言查询失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True) 