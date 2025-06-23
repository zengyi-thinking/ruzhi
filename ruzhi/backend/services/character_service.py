"""
历史人物服务模块
管理和提供历史人物数据，支持智能检索和个性化推荐
"""
import json
import os
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
from pathlib import Path

from utils.logging_config import get_logger

logger = get_logger('character_service')

class CharacterService:
    """历史人物服务类"""
    
    def __init__(self):
        self.characters = {}
        self.character_index = {}
        self.categories = {}
        self.dynasties = {}
        self.load_all_characters()
    
    def load_all_characters(self):
        """加载所有历史人物数据"""
        try:
            # 获取数据目录
            data_dir = Path(__file__).parent.parent.parent / 'data' / 'characters'
            
            # 加载主要人物数据
            main_file = data_dir / 'historical_figures.json'
            if main_file.exists():
                with open(main_file, 'r', encoding='utf-8') as f:
                    main_data = json.load(f)
                    self._process_character_data(main_data.get('characters', []))
            
            # 加载扩展人物数据
            extended_file = data_dir / 'extended_figures.json'
            if extended_file.exists():
                with open(extended_file, 'r', encoding='utf-8') as f:
                    extended_data = json.load(f)
                    self._process_character_data(extended_data.get('characters', []))
            
            # 构建索引
            self._build_indexes()
            
            logger.info(f"成功加载 {len(self.characters)} 个历史人物")
            
        except Exception as e:
            logger.error(f"加载历史人物数据失败: {e}")
            self.characters = {}
    
    def _process_character_data(self, characters: List[Dict[str, Any]]):
        """处理人物数据"""
        for char in characters:
            char_id = char.get('id')
            if char_id:
                # 添加计算字段
                char['age'] = self._calculate_age(char.get('birth_year'), char.get('death_year'))
                char['era_period'] = self._get_era_period(char.get('birth_year'))
                char['influence_score'] = self._calculate_influence_score(char)
                
                self.characters[char_id] = char
    
    def _build_indexes(self):
        """构建检索索引"""
        for char_id, char in self.characters.items():
            # 朝代索引
            dynasty = char.get('dynasty', '未知')
            if dynasty not in self.dynasties:
                self.dynasties[dynasty] = []
            self.dynasties[dynasty].append(char_id)
            
            # 思想流派索引
            key_thoughts = char.get('key_thoughts', [])
            for thought in key_thoughts:
                if thought not in self.categories:
                    self.categories[thought] = []
                self.categories[thought].append(char_id)
            
            # 关键词索引
            keywords = self._extract_keywords(char)
            self.character_index[char_id] = keywords
    
    def _calculate_age(self, birth_year: int, death_year: int) -> Optional[int]:
        """计算年龄"""
        if birth_year and death_year:
            return abs(death_year - birth_year)
        return None
    
    def _get_era_period(self, birth_year: int) -> str:
        """获取历史时期"""
        if not birth_year:
            return "未知时期"
        
        if birth_year < -770:
            return "春秋以前"
        elif birth_year < -221:
            return "春秋战国"
        elif birth_year < 220:
            return "秦汉时期"
        elif birth_year < 589:
            return "魏晋南北朝"
        elif birth_year < 907:
            return "隋唐时期"
        elif birth_year < 1279:
            return "宋元时期"
        elif birth_year < 1644:
            return "明朝时期"
        elif birth_year < 1912:
            return "清朝时期"
        else:
            return "近现代"
    
    def _calculate_influence_score(self, char: Dict[str, Any]) -> float:
        """计算影响力评分"""
        score = 0.0
        
        # 基于人格特质
        traits = char.get('personality_traits', {})
        for trait, value in traits.items():
            score += value * 0.1
        
        # 基于名言数量
        quotes = char.get('famous_quotes', [])
        score += len(quotes) * 0.5
        
        # 基于思想数量
        thoughts = char.get('key_thoughts', [])
        score += len(thoughts) * 0.3
        
        # 基于现代相关性
        if char.get('modern_relevance'):
            score += 2.0
        
        return round(score, 2)
    
    def _extract_keywords(self, char: Dict[str, Any]) -> List[str]:
        """提取关键词"""
        keywords = []
        
        # 添加基本信息
        keywords.extend([char.get('name', ''), char.get('full_name', ''), char.get('title', '')])
        
        # 添加朝代和时期
        keywords.extend([char.get('dynasty', ''), char.get('era_period', '')])
        
        # 添加核心思想
        keywords.extend(char.get('key_thoughts', []))
        
        # 添加相关概念
        keywords.extend(char.get('related_concepts', []))
        
        # 过滤空值并去重
        return list(set([kw for kw in keywords if kw]))
    
    def get_character(self, character_id: str) -> Optional[Dict[str, Any]]:
        """获取指定人物信息"""
        return self.characters.get(character_id)
    
    def get_all_characters(self) -> Dict[str, Dict[str, Any]]:
        """获取所有人物信息"""
        return self.characters
    
    def search_characters(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """搜索历史人物"""
        if not query:
            return []
        
        query = query.lower()
        results = []
        
        for char_id, char in self.characters.items():
            score = 0
            
            # 名字匹配
            if query in char.get('name', '').lower():
                score += 10
            if query in char.get('full_name', '').lower():
                score += 8
            
            # 朝代匹配
            if query in char.get('dynasty', '').lower():
                score += 5
            
            # 思想匹配
            for thought in char.get('key_thoughts', []):
                if query in thought.lower():
                    score += 3
            
            # 描述匹配
            if query in char.get('description', '').lower():
                score += 2
            
            # 关键词匹配
            keywords = self.character_index.get(char_id, [])
            for keyword in keywords:
                if query in keyword.lower():
                    score += 1
            
            if score > 0:
                char_copy = char.copy()
                char_copy['search_score'] = score
                results.append(char_copy)
        
        # 按评分排序
        results.sort(key=lambda x: x['search_score'], reverse=True)
        return results[:limit]
    
    def get_characters_by_dynasty(self, dynasty: str) -> List[Dict[str, Any]]:
        """按朝代获取人物"""
        char_ids = self.dynasties.get(dynasty, [])
        return [self.characters[char_id] for char_id in char_ids]
    
    def get_characters_by_thought(self, thought: str) -> List[Dict[str, Any]]:
        """按思想流派获取人物"""
        char_ids = self.categories.get(thought, [])
        return [self.characters[char_id] for char_id in char_ids]
    
    def get_recommended_characters(self, user_interests: List[str], limit: int = 5) -> List[Dict[str, Any]]:
        """基于用户兴趣推荐人物"""
        recommendations = []
        
        for char_id, char in self.characters.items():
            score = 0
            
            # 基于用户兴趣匹配
            for interest in user_interests:
                interest_lower = interest.lower()
                
                # 匹配核心思想
                for thought in char.get('key_thoughts', []):
                    if interest_lower in thought.lower():
                        score += 3
                
                # 匹配相关概念
                for concept in char.get('related_concepts', []):
                    if interest_lower in concept.lower():
                        score += 2
                
                # 匹配交互偏好主题
                topics = char.get('interaction_preferences', {}).get('topics', [])
                for topic in topics:
                    if interest_lower in topic.lower():
                        score += 2
            
            # 加入影响力评分
            score += char.get('influence_score', 0) * 0.1
            
            if score > 0:
                char_copy = char.copy()
                char_copy['recommendation_score'] = score
                recommendations.append(char_copy)
        
        # 按推荐评分排序
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        return recommendations[:limit]
    
    def get_character_statistics(self) -> Dict[str, Any]:
        """获取人物统计信息"""
        stats = {
            'total_characters': len(self.characters),
            'dynasties': {},
            'thought_schools': {},
            'era_distribution': {},
            'top_influential': []
        }
        
        # 朝代分布
        for dynasty, char_ids in self.dynasties.items():
            stats['dynasties'][dynasty] = len(char_ids)
        
        # 思想流派分布
        for thought, char_ids in self.categories.items():
            stats['thought_schools'][thought] = len(char_ids)
        
        # 时期分布
        for char in self.characters.values():
            era = char.get('era_period', '未知时期')
            stats['era_distribution'][era] = stats['era_distribution'].get(era, 0) + 1
        
        # 最具影响力人物
        influential_chars = sorted(
            self.characters.values(),
            key=lambda x: x.get('influence_score', 0),
            reverse=True
        )[:10]
        
        stats['top_influential'] = [
            {
                'id': char['id'],
                'name': char['name'],
                'influence_score': char.get('influence_score', 0)
            }
            for char in influential_chars
        ]
        
        return stats
    
    def get_character_for_dialogue(self, character_id: str) -> Optional[Dict[str, Any]]:
        """获取用于对话的人物信息"""
        char = self.get_character(character_id)
        if not char:
            return None
        
        # 提取对话相关信息
        dialogue_info = {
            'id': char['id'],
            'name': char['name'],
            'title': char.get('title', ''),
            'dynasty': char.get('dynasty', ''),
            'description': char.get('description', ''),
            'personality_traits': char.get('personality_traits', {}),
            'dialogue_style': char.get('dialogue_style', ''),
            'speech_patterns': char.get('speech_patterns', []),
            'key_thoughts': char.get('key_thoughts', []),
            'famous_quotes': char.get('famous_quotes', []),
            'interaction_preferences': char.get('interaction_preferences', {}),
            'background': char.get('background', {}),
            'modern_relevance': char.get('modern_relevance', '')
        }
        
        return dialogue_info

# 全局人物服务实例
character_service = CharacterService()
