"""
儒智知识图谱服务 - API端点
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any
import os

from ..schemas.graph import (
    NodeType, RelationType, ConceptResponse, GraphDataResponse,
    GraphSearch, GraphExpand, PathFindRequest, QueryResponse
)
from ..services.graph_service import GraphService

# 创建路由器
router = APIRouter()

# 获取环境变量
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

# 实例化图谱服务
graph_service = None

def get_graph_service() -> GraphService:
    """获取图谱服务实例"""
    global graph_service
    if graph_service is None:
        try:
            graph_service = GraphService(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Neo4j连接失败: {str(e)}")
    return graph_service

@router.get("/concept/{concept_id}", response_model=ConceptResponse)
async def get_concept(concept_id: str, service: GraphService = Depends(get_graph_service)):
    """获取概念详情"""
    concept = service.get_concept(concept_id)
    if concept is None:
        raise HTTPException(status_code=404, detail=f"概念 '{concept_id}' 不存在")
    return concept

@router.post("/search", summary="搜索节点")
async def search_nodes(
    search: GraphSearch,
    service: GraphService = Depends(get_graph_service)
):
    """搜索节点"""
    nodes = service.search_nodes(
        search.query,
        [nt.value for nt in search.node_types] if search.node_types else None,
        search.limit
    )
    return {"nodes": nodes}

@router.post("/expand", response_model=GraphDataResponse, summary="扩展节点")
async def expand_node(
    expand: GraphExpand,
    service: GraphService = Depends(get_graph_service)
):
    """扩展节点"""
    graph_data = service.expand_node(
        expand.node_id,
        [rt.value for rt in expand.relation_types] if expand.relation_types else None,
        expand.depth,
        expand.limit
    )
    return graph_data

@router.post("/path", response_model=GraphDataResponse, summary="查找路径")
async def find_path(
    path_request: PathFindRequest,
    service: GraphService = Depends(get_graph_service)
):
    """查找两个节点之间的路径"""
    graph_data = service.find_path(
        path_request.source_id,
        path_request.target_id,
        path_request.max_depth,
        [rt.value for rt in path_request.relation_types] if path_request.relation_types else None
    )
    return graph_data

@router.get("/query", response_model=QueryResponse, summary="自然语言查询")
async def natural_language_query(
    q: str = Query(..., description="查询文本"),
    service: GraphService = Depends(get_graph_service)
):
    """自然语言查询"""
    result = service.natural_language_query(q)
    return result

@router.get("/node_types", summary="获取节点类型")
async def get_node_types():
    """获取可用的节点类型"""
    return {
        "node_types": [
            {"id": nt.value, "name": nt.name} for nt in NodeType
        ]
    }

@router.get("/relation_types", summary="获取关系类型")
async def get_relation_types():
    """获取可用的关系类型"""
    return {
        "relation_types": [
            {"id": rt.value, "name": rt.name} for rt in RelationType
        ]
    }

@router.get("/featured_concepts", summary="获取推荐概念")
async def get_featured_concepts(
    limit: int = Query(10, description="返回结果数量"),
    service: GraphService = Depends(get_graph_service)
):
    """获取推荐概念"""
    # 在实际项目中，可以基于重要性、热度等排序
    # 这里使用模拟数据
    return {
        "featured": [
            {"id": "concept-1", "name": "仁", "definition": "儒家核心价值观，推己及人的恻隐之心"},
            {"id": "concept-2", "name": "义", "definition": "道德判断的标准，合宜的行为"},
            {"id": "concept-3", "name": "礼", "definition": "社会规范与秩序的体现"},
            {"id": "concept-4", "name": "智", "definition": "明辨是非的能力"},
            {"id": "concept-5", "name": "信", "definition": "诚实守信，言行一致"}
        ]
    } 