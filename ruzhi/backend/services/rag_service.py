"""
RAG (检索增强生成) 服务模块
基于知识库检索相关内容，增强AI回复的准确性和权威性
"""
import re
import math
from typing import Dict, List, Any, Optional, Tuple
from collections import Counter
import logging

from services.enhanced_knowledge_service import enhanced_knowledge_service
from services.character_service import character_service
from utils.logging_config import get_logger

logger = get_logger('rag_service')

class TextSimilarity:
    """文本相似度计算器"""
    
    @staticmethod
    def cosine_similarity(text1: str, text2: str) -> float:
        """计算余弦相似度"""
        # 简单的词频向量相似度计算
        words1 = TextSimilarity._tokenize(text1)
        words2 = TextSimilarity._tokenize(text2)
        
        # 构建词汇表
        vocab = set(words1 + words2)
        
        # 构建词频向量
        vec1 = [words1.count(word) for word in vocab]
        vec2 = [words2.count(word) for word in vocab]
        
        # 计算余弦相似度
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = math.sqrt(sum(a * a for a in vec1))
        magnitude2 = math.sqrt(sum(a * a for a in vec2))
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """简单的中文分词"""
        # 移除标点符号，按字符分割
        text = re.sub(r'[^\w\s]', '', text)
        # 对于中文，按字符分割；对于英文，按词分割
        tokens = []
        for char in text:
            if '\u4e00' <= char <= '\u9fff':  # 中文字符
                tokens.append(char)
            elif char.isalpha():  # 英文字符
                tokens.append(char.lower())
        return tokens
    
    @staticmethod
    def jaccard_similarity(text1: str, text2: str) -> float:
        """计算Jaccard相似度"""
        words1 = set(TextSimilarity._tokenize(text1))
        words2 = set(TextSimilarity._tokenize(text2))
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if len(union) == 0:
            return 0.0
        
        return len(intersection) / len(union)

class KnowledgeRetriever:
    """知识检索器"""
    
    def __init__(self):
        self.similarity_calculator = TextSimilarity()
    
    def retrieve_relevant_knowledge(self, query: str, character_id: str = None, 
                                  top_k: int = 5) -> List[Dict[str, Any]]:
        """检索相关知识"""
        try:
            relevant_items = []
            
            # 1. 从知识库搜索相关内容
            knowledge_results = enhanced_knowledge_service.search_knowledge(query, limit=10)
            for item in knowledge_results:
                similarity = self._calculate_relevance(query, item)
                if similarity > 0.1:  # 相似度阈值
                    relevant_items.append({
                        'type': 'knowledge',
                        'title': item['title'],
                        'content': item['description'],
                        'source': item['type'],
                        'similarity': similarity,
                        'data': item['data']
                    })
            
            # 2. 如果指定了人物，检索人物相关信息
            if character_id:
                character_info = self._get_character_knowledge(character_id, query)
                if character_info:
                    relevant_items.extend(character_info)
            
            # 3. 检索相关概念
            concept_info = self._get_concept_knowledge(query)
            relevant_items.extend(concept_info)
            
            # 4. 按相似度排序并返回top_k
            relevant_items.sort(key=lambda x: x['similarity'], reverse=True)
            return relevant_items[:top_k]
            
        except Exception as e:
            logger.error(f"知识检索失败: {e}")
            return []
    
    def _calculate_relevance(self, query: str, item: Dict[str, Any]) -> float:
        """计算相关性得分"""
        # 计算与标题的相似度
        title_similarity = self.similarity_calculator.cosine_similarity(
            query, item.get('title', '')
        )
        
        # 计算与描述的相似度
        desc_similarity = self.similarity_calculator.cosine_similarity(
            query, item.get('description', '')
        )
        
        # 加权平均
        relevance = title_similarity * 0.7 + desc_similarity * 0.3
        
        # 根据搜索得分调整
        search_score = item.get('score', 0)
        if search_score > 0:
            relevance += search_score * 0.01  # 搜索得分的权重
        
        return min(relevance, 1.0)
    
    def _get_character_knowledge(self, character_id: str, query: str) -> List[Dict[str, Any]]:
        """获取人物相关知识"""
        try:
            character = character_service.get_character(character_id)
            if not character:
                return []
            
            knowledge_items = []
            
            # 人物的核心思想
            for thought in character.get('key_thoughts', []):
                if thought.lower() in query.lower() or query.lower() in thought.lower():
                    knowledge_items.append({
                        'type': 'character_thought',
                        'title': f"{character['name']}的思想：{thought}",
                        'content': f"{character['name']}强调{thought}的重要性",
                        'source': 'character',
                        'similarity': 0.8,
                        'data': {'character_id': character_id, 'thought': thought}
                    })
            
            # 人物的名言
            for quote in character.get('famous_quotes', []):
                similarity = self.similarity_calculator.cosine_similarity(query, quote)
                if similarity > 0.2:
                    knowledge_items.append({
                        'type': 'character_quote',
                        'title': f"{character['name']}名言",
                        'content': quote,
                        'source': 'character',
                        'similarity': similarity,
                        'data': {'character_id': character_id, 'quote': quote}
                    })
            
            return knowledge_items
            
        except Exception as e:
            logger.error(f"获取人物知识失败: {e}")
            return []
    
    def _get_concept_knowledge(self, query: str) -> List[Dict[str, Any]]:
        """获取概念相关知识"""
        try:
            # 从增强知识服务获取概念
            concepts = enhanced_knowledge_service.concepts
            knowledge_items = []
            
            for concept_id, concept in concepts.items():
                # 检查概念名称匹配
                if concept['name'] in query or query in concept['name']:
                    knowledge_items.append({
                        'type': 'concept',
                        'title': f"概念：{concept['name']}",
                        'content': concept.get('definition', ''),
                        'source': 'concept',
                        'similarity': 0.9,
                        'data': concept
                    })
                
                # 检查现代应用匹配
                for app in concept.get('modern_applications', []):
                    if query.lower() in app.get('field', '').lower():
                        knowledge_items.append({
                            'type': 'concept_application',
                            'title': f"{concept['name']}在{app['field']}的应用",
                            'content': app.get('application', ''),
                            'source': 'concept',
                            'similarity': 0.7,
                            'data': {'concept': concept, 'application': app}
                        })
            
            return knowledge_items
            
        except Exception as e:
            logger.error(f"获取概念知识失败: {e}")
            return []

class RAGService:
    """RAG服务主类"""
    
    def __init__(self):
        self.retriever = KnowledgeRetriever()
        self.quality_threshold = 0.3  # 知识质量阈值
    
    def enhance_query_with_knowledge(self, user_query: str, character_id: str = None,
                                   user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """使用知识库增强查询"""
        try:
            # 检索相关知识
            relevant_knowledge = self.retriever.retrieve_relevant_knowledge(
                user_query, character_id, top_k=5
            )
            
            # 过滤低质量知识
            high_quality_knowledge = [
                item for item in relevant_knowledge 
                if item['similarity'] >= self.quality_threshold
            ]
            
            # 构建知识上下文
            knowledge_context = self._build_knowledge_context(high_quality_knowledge)
            
            # 生成知识摘要
            knowledge_summary = self._generate_knowledge_summary(high_quality_knowledge)
            
            return {
                'enhanced_query': user_query,
                'relevant_knowledge': high_quality_knowledge,
                'knowledge_context': knowledge_context,
                'knowledge_summary': knowledge_summary,
                'knowledge_count': len(high_quality_knowledge)
            }
            
        except Exception as e:
            logger.error(f"RAG增强失败: {e}")
            return {
                'enhanced_query': user_query,
                'relevant_knowledge': [],
                'knowledge_context': '',
                'knowledge_summary': '',
                'knowledge_count': 0
            }
    
    def _build_knowledge_context(self, knowledge_items: List[Dict[str, Any]]) -> str:
        """构建知识上下文"""
        if not knowledge_items:
            return ""
        
        context_parts = ["相关知识背景："]
        
        for i, item in enumerate(knowledge_items[:3], 1):  # 最多使用3个知识点
            context_parts.append(f"{i}. {item['title']}")
            context_parts.append(f"   {item['content'][:150]}...")
            context_parts.append("")
        
        return "\n".join(context_parts)
    
    def _generate_knowledge_summary(self, knowledge_items: List[Dict[str, Any]]) -> str:
        """生成知识摘要"""
        if not knowledge_items:
            return "未找到相关知识"
        
        # 按类型分组
        by_type = {}
        for item in knowledge_items:
            item_type = item['type']
            if item_type not in by_type:
                by_type[item_type] = []
            by_type[item_type].append(item)
        
        summary_parts = []
        
        if 'knowledge' in by_type:
            summary_parts.append(f"找到{len(by_type['knowledge'])}个相关知识点")
        
        if 'character_thought' in by_type or 'character_quote' in by_type:
            char_count = len(by_type.get('character_thought', [])) + len(by_type.get('character_quote', []))
            summary_parts.append(f"包含{char_count}个人物相关内容")
        
        if 'concept' in by_type:
            summary_parts.append(f"涉及{len(by_type['concept'])}个核心概念")
        
        return "，".join(summary_parts) if summary_parts else "找到少量相关信息"
    
    def validate_knowledge_quality(self, knowledge_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """验证知识质量"""
        validated_items = []
        
        for item in knowledge_items:
            # 检查内容长度
            content = item.get('content', '')
            if len(content) < 10:
                continue
            
            # 检查相似度
            if item.get('similarity', 0) < self.quality_threshold:
                continue
            
            # 检查内容质量（简单的启发式规则）
            if self._is_high_quality_content(content):
                validated_items.append(item)
        
        return validated_items
    
    def _is_high_quality_content(self, content: str) -> bool:
        """判断内容质量"""
        # 简单的质量检查规则
        if len(content) < 20:
            return False
        
        # 检查是否包含有意义的词汇
        meaningful_words = ['思想', '理念', '概念', '原理', '方法', '应用', '意义', '价值']
        if not any(word in content for word in meaningful_words):
            return False
        
        return True
    
    def get_knowledge_statistics(self) -> Dict[str, Any]:
        """获取知识库统计信息"""
        try:
            stats = enhanced_knowledge_service.get_knowledge_statistics()
            
            return {
                'total_knowledge_items': (
                    stats['characters']['total_characters'] +
                    stats['classics']['total'] +
                    stats['concepts']['total']
                ),
                'characters': stats['characters']['total_characters'],
                'classics': stats['classics']['total'],
                'concepts': stats['concepts']['total'],
                'retrieval_quality_threshold': self.quality_threshold
            }
            
        except Exception as e:
            logger.error(f"获取知识库统计失败: {e}")
            return {
                'total_knowledge_items': 0,
                'characters': 0,
                'classics': 0,
                'concepts': 0,
                'retrieval_quality_threshold': self.quality_threshold
            }

# 全局RAG服务实例
rag_service = RAGService()
