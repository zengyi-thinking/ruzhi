#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
儒智知识图谱初始化脚本
用于导入基础的《孟子》知识图谱数据
"""

import os
import logging
import json
from neo4j import GraphDatabase
from typing import Dict, List, Any

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

# 示例数据
SAMPLE_CONCEPTS = [
    {
        "name": "仁政",
        "definition": "以仁德治理国家的政治主张",
        "related": [
            {"name": "王道", "relation": "IMPLEMENTS", "strength": 0.92},
            {"name": "霸道", "relation": "OPPOSES", "strength": 0.88}
        ],
        "origins": [
            {
                "source": "《孟子·梁惠王上》",
                "content": "孟子见梁惠王。王曰：\"叟，不远千里而来，亦将有以利吾国乎？\"孟子对曰：\"王何必曰利？亦有仁义而已矣。\""
            }
        ]
    },
    {
        "name": "性善论",
        "definition": "认为人的本性是善良的哲学观点",
        "related": [
            {"name": "四端", "relation": "EVIDENCE_OF", "strength": 0.95},
            {"name": "性恶论", "relation": "OPPOSES", "strength": 0.90}
        ],
        "origins": [
            {
                "source": "《孟子·告子上》",
                "content": "告子曰：\"性，犹杞柳也；义，犹桮棬也。以人性为仁义，犹以杞柳为桮棬。\"孟子曰：\"子能顺杞柳之性而以为桮棬乎？将戕贼杞柳而后以为桮棬也？如将戕贼杞柳而以为桮棬，则亦将戕贼人以为仁义与？率天下之人而祸仁义者，必子之言夫！\""
            }
        ]
    },
    {
        "name": "四端",
        "definition": "孟子提出的人皆有的四种善端：恻隐之心、羞恶之心、辞让之心、是非之心",
        "related": [
            {"name": "性善论", "relation": "SUPPORTS", "strength": 0.95},
            {"name": "仁义礼智", "relation": "CORRESPONDS_TO", "strength": 0.90}
        ],
        "origins": [
            {
                "source": "《孟子·公孙丑上》",
                "content": "孟子曰：\"人皆有不忍人之心。先王有不忍人之心，斯有不忍人之政矣。以不忍人之心，行不忍人之政，治天下可运之掌上。所以谓人皆有不忍人之心者，今人乍见孺子将入于井，皆有怵惕恻隐之心。非所以内交于孺子之父母也，非所以要誉于乡党朋友也，非恶其声而然也。由是观之，无恻隐之心，非人也；无羞恶之心，非人也；无辞让之心，非人也；无是非之心，非人也。恻隐之心，仁之端也；羞恶之心，义之端也；辞让之心，礼之端也；是非之心，智之端也。人之有是四端也，犹其有四体也。\""
            }
        ]
    }
]

def create_concept_node(tx, concept: Dict[str, Any]):
    """创建概念节点"""
    query = """
    MERGE (c:Concept {name: $name})
    SET c.definition = $definition
    RETURN c
    """
    result = tx.run(query, name=concept["name"], definition=concept["definition"])
    return result.single()["c"]

def create_passage_node(tx, passage: Dict[str, str]):
    """创建文本段落节点"""
    query = """
    MERGE (p:Passage {source: $source, content: $content})
    RETURN p
    """
    result = tx.run(query, source=passage["source"], content=passage["content"])
    return result.single()["p"]

def create_relationship(tx, source_name: str, target_name: str, relation_type: str, strength: float = 0.5):
    """创建节点之间的关系"""
    query = """
    MATCH (source:Concept {name: $source_name})
    MATCH (target:Concept {name: $target_name})
    MERGE (source)-[r:%s {strength: $strength}]->(target)
    RETURN r
    """ % relation_type
    result = tx.run(query, source_name=source_name, target_name=target_name, strength=strength)
    return result.single()["r"] if result.peek() else None

def create_mention_relationship(tx, concept_name: str, passage_source: str, passage_content: str):
    """创建概念与文本段落之间的关系"""
    query = """
    MATCH (c:Concept {name: $concept_name})
    MATCH (p:Passage {source: $source, content: $content})
    MERGE (c)-[r:MENTIONED_IN]->(p)
    RETURN r
    """
    result = tx.run(
        query, 
        concept_name=concept_name, 
        source=passage_source, 
        content=passage_content
    )
    return result.single()["r"] if result.peek() else None

def init_graph():
    """初始化知识图谱"""
    logger.info("开始初始化知识图谱...")
    
    try:
        # 连接Neo4j数据库
        driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        
        with driver.session() as session:
            # 清空数据库（谨慎使用）
            logger.info("清空现有数据...")
            session.run("MATCH (n) DETACH DELETE n")
            
            # 导入概念
            for concept in SAMPLE_CONCEPTS:
                logger.info(f"导入概念: {concept['name']}")
                
                # 创建概念节点
                session.execute_write(create_concept_node, concept)
                
                # 创建关联概念关系
                for related in concept.get("related", []):
                    # 确保关联概念节点存在
                    session.execute_write(
                        create_concept_node, 
                        {"name": related["name"], "definition": ""}
                    )
                    
                    # 创建关系
                    session.execute_write(
                        create_relationship,
                        concept["name"],
                        related["name"],
                        related["relation"],
                        related.get("strength", 0.5)
                    )
                
                # 创建文本段落和关系
                for origin in concept.get("origins", []):
                    # 创建段落节点
                    session.execute_write(create_passage_node, origin)
                    
                    # 创建概念与段落的关系
                    session.execute_write(
                        create_mention_relationship,
                        concept["name"],
                        origin["source"],
                        origin["content"]
                    )
            
            # 验证导入结果
            result = session.run("MATCH (n) RETURN count(n) as nodeCount")
            node_count = result.single()["nodeCount"]
            
            result = session.run("MATCH ()-[r]->() RETURN count(r) as relCount")
            rel_count = result.single()["relCount"]
            
            logger.info(f"知识图谱初始化完成: {node_count} 个节点, {rel_count} 个关系")
        
    except Exception as e:
        logger.error(f"初始化知识图谱失败: {e}")
    finally:
        if driver:
            driver.close()

if __name__ == "__main__":
    init_graph() 