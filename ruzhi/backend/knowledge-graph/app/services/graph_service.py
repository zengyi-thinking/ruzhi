"""
儒智知识图谱服务 - 图谱服务实现
提供与Neo4j数据库的交互功能
"""

import logging
from typing import List, Dict, Any, Optional, Union, Tuple

# 尝试导入neo4j，如果失败则使用模拟模式
try:
    from neo4j import GraphDatabase, Session, Transaction
    from neo4j.exceptions import Neo4jError
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    # 创建模拟的类型
    class Transaction:
        pass
    
    class Session:
        def execute_read(self, func, *args, **kwargs):
            return func(None, *args, **kwargs)

from ..schemas.graph import (
    NodeType, RelationType,
    ConceptResponse, GraphDataResponse, 
    GraphNodeResponse, GraphRelationResponse,
    RelatedConcept, ConceptOrigin, HistoricalEvent
)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class GraphService:
    """知识图谱服务，提供与Neo4j的交互功能"""

    def __init__(self, uri: str, user: str, password: str):
        """
        初始化图谱服务
        
        Args:
            uri: Neo4j数据库URI
            user: 用户名
            password: 密码
        """
        self._driver = None
        self._mock_mode = not NEO4J_AVAILABLE
        
        if not self._mock_mode:
            try:
                self._driver = GraphDatabase.driver(uri, auth=(user, password))
                logger.info("Neo4j连接成功")
            except Exception as e:
                logger.error(f"Neo4j连接失败: {e}")
                logger.info("切换到模拟模式")
                self._mock_mode = True
        else:
            logger.info("Neo4j驱动不可用，使用模拟模式")
    
    def close(self):
        """关闭数据库连接"""
        if self._driver and not self._mock_mode:
            self._driver.close()
    
    def verify_connectivity(self) -> bool:
        """
        验证数据库连接
        
        Returns:
            连接是否成功
        """
        if self._mock_mode:
            return True
            
        try:
            with self._driver.session() as session:
                result = session.run("RETURN 1 AS result")
                return result.single()["result"] == 1
        except Exception as e:
            logger.error(f"Neo4j连接验证失败: {e}")
            return False
    
    def get_concept(self, concept_id: str) -> Optional[ConceptResponse]:
        """
        获取概念详情
        
        Args:
            concept_id: 概念ID
            
        Returns:
            概念详情，若不存在则返回None
        """
        if self._mock_mode:
            # 返回模拟数据
            mock_concepts = {
                "concept-1": {
                    "id": "concept-1", 
                    "name": "仁", 
                    "definition": "儒家核心价值观，推己及人的恻隐之心",
                    "alternative_names": ["仁爱", "仁德", "仁心"],
                    "importance": 0.9
                },
                "concept-2": {
                    "id": "concept-2", 
                    "name": "义", 
                    "definition": "道德判断的标准，合宜的行为",
                    "alternative_names": ["正义", "义理"],
                    "importance": 0.85
                },
                "concept-3": {
                    "id": "concept-3", 
                    "name": "礼", 
                    "definition": "社会规范与秩序的体现",
                    "alternative_names": ["礼仪", "礼节", "礼制"],
                    "importance": 0.8
                },
            }
            
            if concept_id not in mock_concepts:
                return None
                
            concept = mock_concepts[concept_id]
            
            # 添加固定的出处、相关概念和历史事件
            origins = [self._get_mock_origin(concept_id)]
            related = self._get_mock_related_concepts(concept_id)
            events = self._get_mock_events(concept_id)
            
            return ConceptResponse(
                id=concept["id"],
                name=concept["name"],
                definition=concept["definition"],
                alternative_names=concept["alternative_names"],
                origins=origins,
                related_concepts=related,
                historical_events=events,
                importance=concept["importance"]
            )
        
        try:
            with self._driver.session() as session:
                # 获取基本概念信息
                concept_data = session.execute_read(self._get_concept_data, concept_id)
                if not concept_data:
                    return None
                    
                # 获取概念出处
                origins = session.execute_read(self._get_concept_origins, concept_id)
                
                # 获取相关概念
                related = session.execute_read(self._get_related_concepts, concept_id)
                
                # 获取相关历史事件
                events = session.execute_read(self._get_concept_events, concept_id)
                
                # 构建响应
                return ConceptResponse(
                    id=concept_id,
                    name=concept_data["name"],
                    definition=concept_data.get("definition", ""),
                    alternative_names=concept_data.get("alternative_names", []),
                    origins=origins,
                    related_concepts=related,
                    historical_events=events,
                    importance=concept_data.get("importance", 0.5)
                )
        except Exception as e:
            logger.error(f"获取概念失败: {e}")
            return None
    
    def search_nodes(self, query: str, node_types: Optional[List[str]] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """
        搜索节点
        
        Args:
            query: 搜索关键词
            node_types: 节点类型列表
            limit: 最大返回结果数
            
        Returns:
            节点列表
        """
        if self._mock_mode:
            # 返回模拟数据
            mock_nodes = [
                {"id": "concept-1", "name": "仁", "type": "concept", "definition": "儒家核心价值观，推己及人的恻隐之心"},
                {"id": "concept-2", "name": "义", "type": "concept", "definition": "道德判断的标准，合宜的行为"},
                {"id": "concept-3", "name": "礼", "type": "concept", "definition": "社会规范与秩序的体现"},
                {"id": "concept-4", "name": "智", "type": "concept", "definition": "明辨是非的能力"},
                {"id": "concept-5", "name": "信", "type": "concept", "definition": "诚实守信，言行一致"},
                {"id": "person-1", "name": "孔子", "type": "person", "definition": "儒家学派创始人，名丘，字仲尼"},
                {"id": "person-2", "name": "孟子", "type": "person", "definition": "战国时期儒家代表人物，名轲"},
                {"id": "person-3", "name": "荀子", "type": "person", "definition": "战国时期儒家代表人物，名况"},
                {"id": "book-1", "name": "论语", "type": "book", "definition": "记录孔子及其弟子言行的语录集"},
                {"id": "book-2", "name": "孟子", "type": "book", "definition": "记录孟子思想的语录集"}
            ]
            
            # 根据搜索关键词过滤
            if query:
                filtered_nodes = []
                for node in mock_nodes:
                    if (query.lower() in node["name"].lower() or 
                        query.lower() in node.get("definition", "").lower()):
                        filtered_nodes.append(node)
                mock_nodes = filtered_nodes
            
            # 根据节点类型过滤
            if node_types and len(node_types) > 0:
                mock_nodes = [n for n in mock_nodes if n["type"] in node_types]
            
            # 限制返回数量
            return mock_nodes[:limit]
        
        try:
            with self._driver.session() as session:
                return session.execute_read(self._search_nodes_tx, query, node_types, limit)
        except Exception as e:
            logger.error(f"搜索节点失败: {e}")
            return []
    
    def expand_node(
        self, 
        node_id: str, 
        relation_types: Optional[List[str]] = None,
        depth: int = 1,
        limit: int = 10
    ) -> GraphDataResponse:
        """
        扩展节点关系
        
        Args:
            node_id: 节点ID
            relation_types: 关系类型列表
            depth: 扩展深度
            limit: 每种关系返回的最大节点数
            
        Returns:
            图谱数据
        """
        if self._mock_mode:
            # 返回模拟数据
            if node_id == "concept-1":  # 仁
                return GraphDataResponse(
                    nodes=[
                        GraphNodeResponse(
                            id="concept-1",
                            name="仁",
                            type="concept",
                            properties={"definition": "儒家核心价值观", "importance": 0.9}
                        ),
                        GraphNodeResponse(
                            id="concept-4",
                            name="孝",
                            type="concept",
                            properties={"definition": "尊敬及奉养父母", "importance": 0.7}
                        ),
                        GraphNodeResponse(
                            id="concept-5",
                            name="悌",
                            type="concept",
                            properties={"definition": "兄友弟恭", "importance": 0.6}
                        ),
                        GraphNodeResponse(
                            id="person-1",
                            name="孔子",
                            type="person",
                            properties={"lifetime": "公元前551年-公元前479年"}
                        )
                    ],
                    relationships=[
                        GraphRelationResponse(
                            source="concept-1",
                            target="concept-4",
                            type="INCLUDES",
                            properties={"strength": 0.8}
                        ),
                        GraphRelationResponse(
                            source="concept-1",
                            target="concept-5",
                            type="INCLUDES",
                            properties={"strength": 0.7}
                        ),
                        GraphRelationResponse(
                            source="person-1",
                            target="concept-1",
                            type="DISCUSSES",
                            properties={"strength": 0.9}
                        )
                    ]
                )
            elif node_id == "concept-2":  # 义
                return GraphDataResponse(
                    nodes=[
                        GraphNodeResponse(
                            id="concept-2",
                            name="义",
                            type="concept",
                            properties={"definition": "道德判断的标准", "importance": 0.85}
                        ),
                        GraphNodeResponse(
                            id="person-2",
                            name="孟子",
                            type="person",
                            properties={"lifetime": "公元前372年-公元前289年"}
                        ),
                        GraphNodeResponse(
                            id="book-2",
                            name="孟子",
                            type="book",
                            properties={"era": "战国时期"}
                        )
                    ],
                    relationships=[
                        GraphRelationResponse(
                            source="person-2",
                            target="concept-2",
                            type="DISCUSSES",
                            properties={"strength": 0.9}
                        ),
                        GraphRelationResponse(
                            source="book-2",
                            target="concept-2",
                            type="MENTIONS",
                            properties={"frequency": "高"}
                        )
                    ]
                )
            else:
                return GraphDataResponse(
                    nodes=[
                        GraphNodeResponse(
                            id=node_id,
                            name="未知概念",
                            type="concept",
                            properties={}
                        )
                    ],
                    relationships=[]
                )
        
        try:
            with self._driver.session() as session:
                result = session.execute_read(
                    self._expand_node_tx, 
                    node_id, 
                    relation_types, 
                    depth, 
                    limit
                )
                
                nodes = [
                    GraphNodeResponse(
                        id=node["id"],
                        name=node["name"],
                        type=node["type"],
                        properties=node.get("properties", {})
                    )
                    for node in result["nodes"]
                ]
                
                relationships = [
                    GraphRelationResponse(
                        source=rel["source"],
                        target=rel["target"],
                        type=rel["type"],
                        properties=rel.get("properties", {})
                    )
                    for rel in result["relationships"]
                ]
                
                return GraphDataResponse(
                    nodes=nodes,
                    relationships=relationships
                )
        except Exception as e:
            logger.error(f"扩展节点失败: {e}")
            return GraphDataResponse(nodes=[], relationships=[])
    
    def find_path(
        self, 
        source_id: str, 
        target_id: str,
        max_depth: int = 4,
        relation_types: Optional[List[str]] = None
    ) -> GraphDataResponse:
        """
        查找两个节点之间的路径
        
        Args:
            source_id: 源节点ID
            target_id: 目标节点ID
            max_depth: 最大深度
            relation_types: 关系类型列表
            
        Returns:
            路径图谱数据
        """
        if self._mock_mode:
            # 返回一些模拟路径数据
            if source_id == "person-1" and target_id == "concept-1":  # 孔子 -> 仁
                return GraphDataResponse(
                    nodes=[
                        GraphNodeResponse(
                            id="person-1",
                            name="孔子",
                            type="person",
                            properties={"lifetime": "公元前551年-公元前479年"}
                        ),
                        GraphNodeResponse(
                            id="book-1",
                            name="论语",
                            type="book",
                            properties={}
                        ),
                        GraphNodeResponse(
                            id="concept-1",
                            name="仁",
                            type="concept",
                            properties={"definition": "儒家核心价值观"}
                        )
                    ],
                    relationships=[
                        GraphRelationResponse(
                            source="person-1",
                            target="book-1",
                            type="WROTE",
                            properties={}
                        ),
                        GraphRelationResponse(
                            source="book-1",
                            target="concept-1",
                            type="MENTIONS",
                            properties={"frequency": "高"}
                        )
                    ]
                )
            # 如果找不到路径，返回空结果
            return GraphDataResponse(nodes=[], relationships=[])
        
        try:
            with self._driver.session() as session:
                result = session.execute_read(
                    self._find_path_tx,
                    source_id,
                    target_id,
                    max_depth,
                    relation_types
                )
                
                nodes = [
                    GraphNodeResponse(
                        id=node["id"],
                        name=node["name"],
                        type=node["type"],
                        properties=node.get("properties", {})
                    )
                    for node in result["nodes"]
                ]
                
                relationships = [
                    GraphRelationResponse(
                        source=rel["source"],
                        target=rel["target"],
                        type=rel["type"],
                        properties=rel.get("properties", {})
                    )
                    for rel in result["relationships"]
                ]
                
                return GraphDataResponse(
                    nodes=nodes,
                    relationships=relationships
                )
        except Exception as e:
            logger.error(f"查找路径失败: {e}")
            return GraphDataResponse(nodes=[], relationships=[])
    
    def natural_language_query(self, query: str) -> Dict[str, Any]:
        """
        自然语言查询
        
        Args:
            query: 查询文本
            
        Returns:
            查询结果
        """
        if self._mock_mode:
            # 使用模拟的自然语言理解和问答
            answer = self._mock_answer_generation(query, [])
            
            # 构建响应
            return {
                "answer": answer,
                "source_passages": [
                    {"source": "《孟子·梁惠王上》", "content": "民为贵，社稷次之，君为轻。是故得乎丘民而为天子..."}
                ],
                "related_concepts": [
                    {"name": "仁", "relation": "相关概念"},
                    {"name": "义", "relation": "相关概念"},
                    {"name": "礼", "relation": "相关概念"}
                ]
            }
        
        # 在实际项目中，这里应该使用专门的NLP模型和向量检索
        try:
            with self._driver.session() as session:
                # 基于关键词匹配查询相关概念
                keywords = self._extract_keywords(query)
                concepts = []
                
                for keyword in keywords:
                    results = session.execute_read(self._search_nodes_tx, keyword, ["concept"], 3)
                    concepts.extend(results)
                
                # 使用模拟的自然语言理解和问答
                answer = self._mock_answer_generation(query, concepts)
                
                # 构建响应
                return {
                    "answer": answer,
                    "source_passages": [
                        {"source": "《孟子·梁惠王上》", "content": "民为贵，社稷次之，君为轻。是故得乎丘民而为天子..."}
                    ],
                    "related_concepts": [
                        {"name": c["name"], "relation": "相关概念"} for c in concepts[:3]
                    ]
                }
        except Exception as e:
            logger.error(f"自然语言查询失败: {e}")
            return {
                "answer": "抱歉，处理您的问题时出现错误",
                "source_passages": [],
                "related_concepts": []
            }
    
    # Transaction 函数
    def _get_concept_data(self, tx: Optional[Transaction], concept_id: str) -> Dict[str, Any]:
        """获取概念基本信息"""
        if tx is None:  # 模拟模式
            return {}
            
        query = """
        MATCH (c:Concept)
        WHERE c.id = $id
        RETURN c.name as name, 
               c.definition as definition,
               c.importance as importance,
               c.alternative_names as alternative_names
        """
        result = tx.run(query, id=concept_id)
        record = result.single()
        if not record:
            return {}
        
        return {
            "name": record["name"],
            "definition": record["definition"] if record["definition"] else "",
            "importance": record["importance"] if record["importance"] else 0.5,
            "alternative_names": record["alternative_names"] if record["alternative_names"] else []
        }
    
    def _get_concept_origins(self, tx: Optional[Transaction], concept_id: str) -> List[ConceptOrigin]:
        """获取概念出处"""
        if tx is None:  # 模拟模式
            return [self._get_mock_origin(concept_id)]
            
        query = """
        MATCH (c:Concept {id: $id})-[:MENTIONED_IN]->(p:Passage)
        RETURN p.book as book, p.chapter as chapter, p.text as text, p.content as content
        """
        result = tx.run(query, id=concept_id)
        
        origins = []
        for record in result:
            origins.append(
                ConceptOrigin(
                    text=record["text"] if record["text"] else "",
                    passage=record["content"] if record["content"] else "",
                    book=record["book"] if record["book"] else "",
                    chapter=record["chapter"] if record["chapter"] else None
                )
            )
        
        if not origins:
            # 如果没有找到出处，添加一个模拟数据
            origins.append(self._get_mock_origin(concept_id))
        
        return origins
    
    def _get_related_concepts(self, tx: Optional[Transaction], concept_id: str) -> List[RelatedConcept]:
        """获取相关概念"""
        if tx is None:  # 模拟模式
            return self._get_mock_related_concepts(concept_id)
            
        query = """
        MATCH (c:Concept {id: $id})-[r]->(related:Concept)
        RETURN related.name as name, type(r) as relation, r.strength as strength, r.description as description
        UNION
        MATCH (c:Concept {id: $id})<-[r]-(related:Concept)
        RETURN related.name as name, type(r) as relation, r.strength as strength, r.description as description
        """
        result = tx.run(query, id=concept_id)
        
        related = []
        for record in result:
            related.append(
                RelatedConcept(
                    name=record["name"],
                    relation=record["relation"],
                    strength=record["strength"] if record["strength"] else 0.5,
                    description=record["description"] if record["description"] else None
                )
            )
        
        if not related:
            # 如果没有找到相关概念，添加一些模拟数据
            related = self._get_mock_related_concepts(concept_id)
        
        return related
    
    def _get_concept_events(self, tx: Optional[Transaction], concept_id: str) -> List[HistoricalEvent]:
        """获取相关历史事件"""
        if tx is None:  # 模拟模式
            return self._get_mock_events(concept_id)
            
        query = """
        MATCH (c:Concept {id: $id})-[:RELATED_TO]->(e:Event)
        RETURN e.name as name, e.date as date, e.description as description, e.related_people as related_people
        """
        result = tx.run(query, id=concept_id)
        
        events = []
        for record in result:
            events.append(
                HistoricalEvent(
                    name=record["name"],
                    date=record["date"] if record["date"] else None,
                    description=record["description"] if record["description"] else "",
                    related_people=record["related_people"] if record["related_people"] else []
                )
            )
        
        return events
    
    def _search_nodes_tx(self, tx: Optional[Transaction], query: str, node_types: Optional[List[str]], limit: int) -> List[Dict[str, Any]]:
        """搜索节点事务"""
        if tx is None:  # 模拟模式
            return []
            
        query_param = f"%{query}%"
        
        if node_types and len(node_types) > 0:
            types_filter = "WHERE n.type IN $types AND "
            types_param = node_types
        else:
            types_filter = "WHERE "
            types_param = []
        
        cypher_query = f"""
        MATCH (n)
        {types_filter}(n.name CONTAINS $query OR n.definition CONTAINS $query)
        RETURN n.id as id, n.name as name, n.type as type, n.definition as definition
        LIMIT $limit
        """
        
        result = tx.run(cypher_query, query=query_param, types=types_param, limit=limit)
        
        nodes = []
        for record in result:
            node = {
                "id": record["id"],
                "name": record["name"],
                "type": record["type"]
            }
            
            if record["definition"]:
                node["definition"] = record["definition"]
            
            nodes.append(node)
        
        # 如果没有结果，返回一些模拟数据（仅用于开发阶段）
        if not nodes and not node_types:
            nodes = [
                {"id": "concept-1", "name": "仁", "type": "concept", "definition": "儒家核心价值观，推己及人的恻隐之心"},
                {"id": "concept-2", "name": "义", "type": "concept", "definition": "道德判断的标准，合宜的行为"},
                {"id": "concept-3", "name": "礼", "type": "concept", "definition": "社会规范与秩序的体现"}
            ]
        
        return nodes
    
    def _expand_node_tx(
        self, 
        tx: Optional[Transaction], 
        node_id: str,
        relation_types: Optional[List[str]],
        depth: int,
        limit: int
    ) -> Dict[str, Any]:
        """扩展节点关系事务"""
        if tx is None:  # 模拟模式
            return {"nodes": [], "relationships": []}
            
        # 处理关系类型过滤
        if relation_types and len(relation_types) > 0:
            rel_filter = "WHERE type(r) IN $relation_types"
            rel_param = relation_types
        else:
            rel_filter = ""
            rel_param = []
        
        # 使用基本查询
        basic_query = f"""
        MATCH (n {{id: $node_id}})-[r]->(m)
        {rel_filter}
        WITH n, r, m
        LIMIT $limit
        RETURN 
            collect(DISTINCT {{
                id: n.id,
                name: n.name,
                type: n.type,
                properties: n {{.*}}
            }}) + 
            collect(DISTINCT {{
                id: m.id,
                name: m.name,
                type: m.type,
                properties: m {{.*}}
            }}) as nodes,
            collect({{
                source: n.id,
                target: m.id,
                type: type(r),
                properties: r {{.*}}
            }}) as relationships
        """
        
        result = tx.run(
            basic_query,
            node_id=node_id,
            relation_types=rel_param,
            limit=limit
        )
        record = result.single()
        
        # 如果仍无结果，返回模拟数据
        if not record:
            return {
                "nodes": [
                    {"id": node_id, "name": "仁", "type": "concept", "properties": {"definition": "儒家核心价值观"}},
                    {"id": "concept-4", "name": "孝", "type": "concept", "properties": {"definition": "尊敬及奉养父母"}},
                    {"id": "concept-5", "name": "悌", "type": "concept", "properties": {"definition": "兄友弟恭"}}
                ],
                "relationships": [
                    {"source": node_id, "target": "concept-4", "type": "INCLUDES", "properties": {"strength": 0.8}},
                    {"source": node_id, "target": "concept-5", "type": "INCLUDES", "properties": {"strength": 0.7}}
                ]
            }
        
        return {
            "nodes": record["nodes"],
            "relationships": record["relationships"]
        }
    
    def _find_path_tx(
        self,
        tx: Optional[Transaction],
        source_id: str,
        target_id: str,
        max_depth: int,
        relation_types: Optional[List[str]]
    ) -> Dict[str, Any]:
        """查找路径事务"""
        if tx is None:  # 模拟模式
            return {"nodes": [], "relationships": []}
            
        # 处理关系类型过滤
        if relation_types and len(relation_types) > 0:
            rel_filter = f":{','.join(relation_types)}"
        else:
            rel_filter = ""
        
        cypher_query = f"""
        MATCH path = shortestPath((source {{id: $source_id}})-[{rel_filter}*..{max_depth}]->(target {{id: $target_id}}))
        RETURN
            [node in nodes(path) | {{
                id: node.id,
                name: node.name,
                type: node.type,
                properties: node {{.*}}
            }}] as nodes,
            [rel in relationships(path) | {{
                source: startNode(rel).id,
                target: endNode(rel).id,
                type: type(rel),
                properties: rel {{.*}}
            }}] as relationships
        """
        
        result = tx.run(cypher_query, source_id=source_id, target_id=target_id)
        record = result.single()
        
        if not record:
            return {
                "nodes": [],
                "relationships": []
            }
        
        return {
            "nodes": record["nodes"],
            "relationships": record["relationships"]
        }
    
    # 辅助方法
    def _extract_keywords(self, query: str) -> List[str]:
        """从查询文本中提取关键词"""
        # 在实际项目中应使用NLP技术提取关键词
        # 这里使用简单的分词方法
        # 先移除标点符号
        import re
        cleaned = re.sub(r'[^\w\s]', '', query)
        
        # 分词并移除停用词
        stopwords = {"的", "是", "在", "一个", "和", "与", "什么", "如何", "为什么", "怎样", "有", "了", "这个", "那个"}
        words = cleaned.split()
        keywords = [w for w in words if w not in stopwords and len(w) > 1]
        
        return keywords or [query]  # 如果没有提取到关键词，返回原始查询
    
    def _mock_answer_generation(self, query: str, concepts: List[Dict[str, Any]]) -> str:
        """生成模拟的问答响应"""
        # 实际项目中应使用更复杂的问答系统
        if "仁" in query or any(c["name"] == "仁" for c in concepts):
            return "仁是儒家思想的核心价值观，代表推己及人的恻隐之心。孟子认为仁是人内在的善性，《孟子·离娄章句上》中说：\"仁之实，事亲是也。\"强调仁的实际表现在于孝顺父母。"
            
        elif "义" in query or any(c["name"] == "义" for c in concepts):
            return "义是儒家思想中道德判断的标准，指合宜的行为。孟子说：\"义之实，从兄是也。\"意味着义体现在对兄长的敬重上。义与利相对，孟子主张\"舍生取义\"，认为道义比生命更重要。"
            
        elif "礼" in query or any(c["name"] == "礼" for c in concepts):
            return "礼是儒家社会规范与秩序的体现，包括各种仪式、行为准则和道德规范。孔子强调：\"不学礼，无以立。\"礼不仅是外在形式，更是内在修养的体现，需要与仁相结合。"
            
        else:
            return "孟子思想是儒家学说的重要组成部分，他继承并发展了孔子的思想，强调人性本善、仁政王道，主张\"民为贵，社稷次之，君为轻\"。他的思想体现在四书之一的《孟子》中，对中国哲学产生了深远影响。"
    
    # 模拟数据方法
    def _get_mock_origin(self, concept_id: str) -> ConceptOrigin:
        """生成模拟的概念出处"""
        if concept_id == "concept-1":  # 仁
            return ConceptOrigin(
                text="《论语·学而》",
                passage="子曰：为政以德，譬如北辰，居其所而众星共之。",
                book="论语",
                chapter="学而第一"
            )
        elif concept_id == "concept-2":  # 义
            return ConceptOrigin(
                text="《孟子·离娄章句上》",
                passage="仁之实，事亲是也；义之实，从兄是也。",
                book="孟子",
                chapter="离娄章句上"
            )
        else:
            return ConceptOrigin(
                text="《论语·八佾》",
                passage="子曰：人而不仁，如礼何？人而不仁，如乐何？",
                book="论语",
                chapter="八佾第三"
            )
    
    def _get_mock_related_concepts(self, concept_id: str) -> List[RelatedConcept]:
        """生成模拟的相关概念"""
        if concept_id == "concept-1":  # 仁
            return [
                RelatedConcept(
                    name="孝",
                    relation="IS_A",
                    strength=0.9,
                    description="仁的具体表现之一"
                ),
                RelatedConcept(
                    name="义",
                    relation="COMPLEMENTARY_TO",
                    strength=0.8,
                    description="与仁相辅相成"
                )
            ]
        elif concept_id == "concept-2":  # 义
            return [
                RelatedConcept(
                    name="仁",
                    relation="COMPLEMENTARY_TO",
                    strength=0.8,
                    description="与义相辅相成"
                ),
                RelatedConcept(
                    name="礼",
                    relation="RELATED_TO",
                    strength=0.7,
                    description="礼为义的外在表现"
                )
            ]
        else:
            return [
                RelatedConcept(
                    name="仁",
                    relation="RELATED_TO",
                    strength=0.7,
                    description="核心儒家价值观"
                )
            ]
    
    def _get_mock_events(self, concept_id: str) -> List[HistoricalEvent]:
        """生成模拟的历史事件"""
        if concept_id == "concept-1":  # 仁
            return [
                HistoricalEvent(
                    name="孔子周游列国",
                    date="前497年-前484年",
                    description="孔子带领弟子周游列国，传播仁道思想",
                    related_people=["孔子", "颜回", "子路"]
                )
            ]
        elif concept_id == "concept-2":  # 义
            return [
                HistoricalEvent(
                    name="孟子见梁惠王",
                    date="前335年",
                    description="孟子与梁惠王讨论王道政治与仁义之道",
                    related_people=["孟子", "梁惠王"]
                )
            ]
        else:
            return [] 