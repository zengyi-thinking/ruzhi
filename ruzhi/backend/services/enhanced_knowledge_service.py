"""
增强版知识库服务模块
整合历史人物、经典文献、概念图谱等知识资源，提供智能检索和个性化推荐
"""
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import logging
from datetime import datetime

from utils.logging_config import get_logger
from services.character_service import character_service

logger = get_logger('enhanced_knowledge_service')

class EnhancedKnowledgeService:
    """增强版知识库服务类"""
    
    def __init__(self):
        self.classics = {}
        self.concepts = {}
        self.concept_relationships = []
        self.knowledge_graph = {}
        self.load_all_knowledge()
    
    def load_all_knowledge(self):
        """加载所有知识库数据"""
        try:
            data_dir = Path(__file__).parent.parent.parent / 'data'
            
            # 加载经典文献
            self._load_classics(data_dir / 'classics')
            
            # 加载概念图谱
            self._load_concepts(data_dir / 'concepts')
            
            # 构建知识图谱
            self._build_knowledge_graph()
            
            logger.info(f"增强版知识库加载完成: {len(self.classics)}部经典, {len(self.concepts)}个概念")
            
        except Exception as e:
            logger.error(f"知识库加载失败: {e}")
            # 使用默认数据
            self._load_default_data()
    
    def _load_classics(self, classics_dir: Path):
        """加载经典文献数据"""
        try:
            sishu_file = classics_dir / 'sishu_database.json'
            if sishu_file.exists():
                with open(sishu_file, 'r', encoding='utf-8') as f:
                    sishu_data = json.load(f)
                    self.classics.update(sishu_data.get('classics', {}))
                    
                    # 为每个经典添加索引信息
                    for classic_id, classic in self.classics.items():
                        classic['search_keywords'] = self._extract_classic_keywords(classic)
                        classic['difficulty_score'] = self._calculate_classic_difficulty(classic)
            
        except Exception as e:
            logger.error(f"加载经典文献失败: {e}")
    
    def _load_concepts(self, concepts_dir: Path):
        """加载概念图谱数据"""
        try:
            concept_file = concepts_dir / 'concept_graph.json'
            if concept_file.exists():
                with open(concept_file, 'r', encoding='utf-8') as f:
                    concept_data = json.load(f)
                    self.concepts = concept_data.get('concepts', {})
                    self.concept_relationships = concept_data.get('relationships', [])
                    
                    # 为每个概念添加扩展信息
                    for concept_id, concept in self.concepts.items():
                        concept['search_keywords'] = self._extract_concept_keywords(concept)
                        concept['learning_priority'] = self._calculate_learning_priority(concept)
            
        except Exception as e:
            logger.error(f"加载概念图谱失败: {e}")
    
    def _load_default_data(self):
        """加载默认数据"""
        self.concepts = {
            'ren': {
                'name': '仁',
                'category': '儒家思想',
                'definition': '儒家思想的核心概念，指爱人、仁爱、仁慈的品德',
                'importance_score': 10,
                'difficulty_level': '中级'
            },
            'dao': {
                'name': '道',
                'category': '道家思想', 
                'definition': '道家哲学的核心概念，指宇宙万物的本源和规律',
                'importance_score': 10,
                'difficulty_level': '高级'
            }
        }
        
        self.classics = {
            'lunyu': {
                'title': '论语',
                'author': '孔子弟子及再传弟子',
                'dynasty': '春秋',
                'description': '记录孔子及其弟子言行的语录体散文集'
            }
        }
    
    def _extract_classic_keywords(self, classic: Dict[str, Any]) -> List[str]:
        """提取经典文献关键词"""
        keywords = []
        keywords.append(classic.get('title', ''))
        keywords.append(classic.get('author', ''))
        keywords.extend(classic.get('structure', {}).get('main_themes', []))
        return [kw for kw in keywords if kw]
    
    def _extract_concept_keywords(self, concept: Dict[str, Any]) -> List[str]:
        """提取概念关键词"""
        keywords = []
        keywords.append(concept.get('name', ''))
        keywords.append(concept.get('category', ''))
        keywords.extend([app.get('field', '') for app in concept.get('modern_applications', [])])
        return [kw for kw in keywords if kw]
    
    def _calculate_classic_difficulty(self, classic: Dict[str, Any]) -> float:
        """计算经典文献难度"""
        structure = classic.get('structure', {})
        chapters = structure.get('total_chapters', 1)
        themes = len(structure.get('main_themes', []))
        
        difficulty = min(chapters * 0.1 + themes * 0.2, 5.0)
        return round(difficulty, 1)
    
    def _calculate_learning_priority(self, concept: Dict[str, Any]) -> float:
        """计算概念学习优先级"""
        importance = concept.get('importance_score', 5)
        difficulty = 6 - concept.get('difficulty_level', 'medium').count('高级') * 2
        applications = len(concept.get('modern_applications', []))
        
        priority = (importance * 0.4 + difficulty * 0.3 + applications * 0.3)
        return round(priority, 1)
    
    def _build_knowledge_graph(self):
        """构建知识图谱"""
        self.knowledge_graph = {
            'nodes': {},
            'edges': [],
            'categories': {}
        }
        
        # 添加人物节点
        characters = character_service.get_all_characters()
        for char_id, char in characters.items():
            self.knowledge_graph['nodes'][f"char_{char_id}"] = {
                'id': f"char_{char_id}",
                'type': 'character',
                'name': char['name'],
                'category': char.get('dynasty', '未知'),
                'data': char
            }
        
        # 添加经典节点
        for classic_id, classic in self.classics.items():
            self.knowledge_graph['nodes'][f"classic_{classic_id}"] = {
                'id': f"classic_{classic_id}",
                'type': 'classic',
                'name': classic['title'],
                'category': '经典文献',
                'data': classic
            }
        
        # 添加概念节点
        for concept_id, concept in self.concepts.items():
            self.knowledge_graph['nodes'][f"concept_{concept_id}"] = {
                'id': f"concept_{concept_id}",
                'type': 'concept',
                'name': concept['name'],
                'category': concept.get('category', '未分类'),
                'data': concept
            }
    
    def search_knowledge(self, query: str, types: List[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """搜索知识库"""
        if not query:
            return []
        
        query = query.lower()
        results = []
        
        # 搜索人物
        if not types or 'character' in types:
            char_results = character_service.search_characters(query, limit)
            for char in char_results:
                results.append({
                    'type': 'character',
                    'id': char['id'],
                    'title': char['name'],
                    'description': char.get('description', ''),
                    'score': char.get('search_score', 0),
                    'data': char
                })
        
        # 搜索经典
        if not types or 'classic' in types:
            for classic_id, classic in self.classics.items():
                score = 0
                if query in classic.get('title', '').lower():
                    score += 10
                if query in classic.get('author', '').lower():
                    score += 8
                if query in classic.get('description', '').lower():
                    score += 5
                
                if score > 0:
                    results.append({
                        'type': 'classic',
                        'id': classic_id,
                        'title': classic['title'],
                        'description': classic.get('description', ''),
                        'score': score,
                        'data': classic
                    })
        
        # 搜索概念
        if not types or 'concept' in types:
            for concept_id, concept in self.concepts.items():
                score = 0
                if query in concept.get('name', '').lower():
                    score += 10
                if query in concept.get('definition', '').lower():
                    score += 8
                if query in concept.get('modern_interpretation', '').lower():
                    score += 5
                
                if score > 0:
                    results.append({
                        'type': 'concept',
                        'id': concept_id,
                        'title': concept['name'],
                        'description': concept.get('definition', ''),
                        'score': score,
                        'data': concept
                    })
        
        # 按评分排序
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def get_learning_path(self, user_level: str, interests: List[str] = None) -> Dict[str, Any]:
        """获取个性化学习路径"""
        interests = interests or []
        
        # 推荐人物
        recommended_characters = character_service.get_recommended_characters(interests, 3)
        
        # 推荐概念
        recommended_concepts = []
        for concept_id, concept in self.concepts.items():
            if any(interest.lower() in concept.get('category', '').lower() for interest in interests):
                recommended_concepts.append(concept)
        
        # 推荐经典
        recommended_classics = []
        for classic_id, classic in self.classics.items():
            if any(interest.lower() in classic.get('description', '').lower() for interest in interests):
                recommended_classics.append(classic)
        
        return {
            'user_level': user_level,
            'recommended_characters': recommended_characters,
            'recommended_concepts': recommended_concepts[:5],
            'recommended_classics': recommended_classics[:2],
            'estimated_duration': self._estimate_learning_duration(user_level),
            'learning_objectives': self._get_learning_objectives(user_level),
            'next_steps': self._get_next_steps(user_level)
        }
    
    def _estimate_learning_duration(self, user_level: str) -> str:
        """估算学习时长"""
        duration_mapping = {
            'beginner': '2-3个月',
            'intermediate': '3-4个月',
            'advanced': '6个月以上'
        }
        return duration_mapping.get(user_level, '2-3个月')
    
    def _get_learning_objectives(self, user_level: str) -> List[str]:
        """获取学习目标"""
        objectives_mapping = {
            'beginner': [
                '理解传统文化基本概念',
                '认识重要历史人物',
                '建立文化认知框架'
            ],
            'intermediate': [
                '深入理解概念关系',
                '掌握思辨方法',
                '能够分析文化现象'
            ],
            'advanced': [
                '系统掌握理论体系',
                '具备研究能力',
                '能够创新性思考'
            ]
        }
        return objectives_mapping.get(user_level, [])
    
    def _get_next_steps(self, user_level: str) -> List[str]:
        """获取下一步建议"""
        steps_mapping = {
            'beginner': [
                '从《论语》开始阅读经典',
                '了解孔子、老子等重要人物',
                '学习仁、礼、道等核心概念'
            ],
            'intermediate': [
                '深入研读四书五经',
                '比较不同学派思想',
                '分析概念之间的关系'
            ],
            'advanced': [
                '进行专题研究',
                '撰写学术论文',
                '参与学术讨论'
            ]
        }
        return steps_mapping.get(user_level, [])
    
    def get_knowledge_statistics(self) -> Dict[str, Any]:
        """获取知识库统计信息"""
        char_stats = character_service.get_character_statistics()
        
        return {
            'characters': char_stats,
            'classics': {
                'total': len(self.classics),
                'by_dynasty': self._get_classics_by_dynasty()
            },
            'concepts': {
                'total': len(self.concepts),
                'by_category': self._get_concepts_by_category()
            },
            'knowledge_graph': {
                'nodes': len(self.knowledge_graph.get('nodes', {})),
                'edges': len(self.knowledge_graph.get('edges', []))
            }
        }
    
    def _get_classics_by_dynasty(self) -> Dict[str, int]:
        """按朝代统计经典"""
        dynasty_count = {}
        for classic in self.classics.values():
            dynasty = classic.get('dynasty', '未知')
            dynasty_count[dynasty] = dynasty_count.get(dynasty, 0) + 1
        return dynasty_count
    
    def _get_concepts_by_category(self) -> Dict[str, int]:
        """按类别统计概念"""
        category_count = {}
        for concept in self.concepts.values():
            category = concept.get('category', '未分类')
            category_count[category] = category_count.get(category, 0) + 1
        return category_count

# 全局增强版知识库服务实例
enhanced_knowledge_service = EnhancedKnowledgeService()
