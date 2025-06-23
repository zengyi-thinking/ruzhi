"""
增强版AI对话服务模块
实现长期记忆、个性化对话、情感分析和对话摘要功能
"""
import json
import time
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging

from services.character_service import character_service
from services.enhanced_knowledge_service import enhanced_knowledge_service
from utils.logging_config import get_logger, business_logger
from models.crud import ConversationCRUD, UserCRUD
from models.database import SessionLocal

logger = get_logger('enhanced_ai_service')

class ConversationMemory:
    """对话记忆管理器"""
    
    def __init__(self, max_short_term: int = 10, max_long_term: int = 50):
        self.max_short_term = max_short_term
        self.max_long_term = max_long_term
        self.short_term_memory = []  # 最近的对话
        self.long_term_memory = []   # 重要的对话摘要
        self.user_preferences = {}   # 用户偏好
        self.conversation_themes = []  # 对话主题
    
    def add_message(self, role: str, content: str, importance: float = 0.5):
        """添加消息到记忆"""
        message = {
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'importance': importance
        }
        
        # 添加到短期记忆
        self.short_term_memory.append(message)
        
        # 维护短期记忆大小
        if len(self.short_term_memory) > self.max_short_term:
            # 将重要的消息转移到长期记忆
            old_message = self.short_term_memory.pop(0)
            if old_message['importance'] > 0.7:
                self._add_to_long_term(old_message)
    
    def _add_to_long_term(self, message: Dict[str, Any]):
        """添加到长期记忆"""
        # 生成摘要
        summary = self._generate_summary(message)
        
        long_term_entry = {
            'summary': summary,
            'original_content': message['content'],
            'timestamp': message['timestamp'],
            'importance': message['importance']
        }
        
        self.long_term_memory.append(long_term_entry)
        
        # 维护长期记忆大小
        if len(self.long_term_memory) > self.max_long_term:
            # 移除最不重要的记忆
            self.long_term_memory.sort(key=lambda x: x['importance'])
            self.long_term_memory.pop(0)
    
    def _generate_summary(self, message: Dict[str, Any]) -> str:
        """生成消息摘要"""
        content = message['content']
        
        # 简单的摘要生成逻辑
        if len(content) > 100:
            # 提取关键句子
            sentences = content.split('。')
            if len(sentences) > 1:
                return sentences[0] + '。'
        
        return content[:50] + '...' if len(content) > 50 else content
    
    def get_context(self) -> str:
        """获取对话上下文"""
        context_parts = []
        
        # 添加长期记忆摘要
        if self.long_term_memory:
            recent_long_term = self.long_term_memory[-3:]  # 最近3个重要记忆
            context_parts.append("重要对话回顾：")
            for memory in recent_long_term:
                context_parts.append(f"- {memory['summary']}")
        
        # 添加短期记忆
        if self.short_term_memory:
            context_parts.append("\n最近对话：")
            for message in self.short_term_memory[-5:]:  # 最近5条消息
                role_name = "用户" if message['role'] == 'user' else "我"
                context_parts.append(f"{role_name}: {message['content']}")
        
        return "\n".join(context_parts)
    
    def update_preferences(self, preferences: Dict[str, Any]):
        """更新用户偏好"""
        self.user_preferences.update(preferences)
    
    def add_theme(self, theme: str):
        """添加对话主题"""
        if theme not in self.conversation_themes:
            self.conversation_themes.append(theme)

class EmotionAnalyzer:
    """情感分析器"""
    
    # 情感词典
    EMOTION_KEYWORDS = {
        'joy': ['开心', '高兴', '快乐', '愉快', '兴奋', '满意'],
        'sadness': ['难过', '伤心', '悲伤', '沮丧', '失落', '痛苦'],
        'anger': ['生气', '愤怒', '恼火', '烦躁', '不满', '气愤'],
        'fear': ['害怕', '恐惧', '担心', '忧虑', '紧张', '不安'],
        'surprise': ['惊讶', '意外', '震惊', '吃惊', '诧异'],
        'neutral': ['平静', '正常', '一般', '还好', '普通']
    }
    
    @classmethod
    def analyze_emotion(cls, text: str) -> Dict[str, Any]:
        """分析文本情感"""
        text = text.lower()
        emotion_scores = {}
        
        # 计算各种情感的得分
        for emotion, keywords in cls.EMOTION_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                score += text.count(keyword)
            emotion_scores[emotion] = score
        
        # 找出主要情感
        if sum(emotion_scores.values()) == 0:
            primary_emotion = 'neutral'
            confidence = 0.5
        else:
            primary_emotion = max(emotion_scores, key=emotion_scores.get)
            total_score = sum(emotion_scores.values())
            confidence = emotion_scores[primary_emotion] / total_score
        
        return {
            'primary_emotion': primary_emotion,
            'confidence': confidence,
            'emotion_scores': emotion_scores,
            'emotion_label': cls._get_emotion_label(primary_emotion)
        }
    
    @classmethod
    def _get_emotion_label(cls, emotion: str) -> str:
        """获取情感标签"""
        labels = {
            'joy': '愉悦',
            'sadness': '悲伤',
            'anger': '愤怒',
            'fear': '恐惧',
            'surprise': '惊讶',
            'neutral': '平静'
        }
        return labels.get(emotion, '未知')

class PersonalitySimulator:
    """人物性格模拟器"""
    
    @staticmethod
    def adapt_response_style(character_data: Dict[str, Any], user_emotion: str, context: str) -> Dict[str, Any]:
        """根据人物性格和用户情感调整回复风格"""
        personality_traits = character_data.get('personality_traits', {})
        dialogue_style = character_data.get('dialogue_style', '')
        speech_patterns = character_data.get('speech_patterns', [])
        
        # 基于用户情感调整回复策略
        response_strategy = {
            'tone': 'neutral',
            'approach': 'direct',
            'empathy_level': 0.5,
            'teaching_style': 'informative'
        }
        
        # 根据人物特质调整
        if personality_traits.get('compassion', 0) > 7:
            response_strategy['empathy_level'] = 0.8
        
        if personality_traits.get('wisdom', 0) > 8:
            response_strategy['teaching_style'] = 'philosophical'
        
        if personality_traits.get('humor', 0) > 7:
            response_strategy['tone'] = 'light'
        
        # 根据用户情感调整
        if user_emotion == 'sadness':
            response_strategy['tone'] = 'gentle'
            response_strategy['empathy_level'] = min(response_strategy['empathy_level'] + 0.3, 1.0)
        elif user_emotion == 'anger':
            response_strategy['tone'] = 'calm'
            response_strategy['approach'] = 'indirect'
        elif user_emotion == 'joy':
            response_strategy['tone'] = 'encouraging'
        
        return response_strategy

class EnhancedAIService:
    """增强版AI对话服务"""
    
    def __init__(self):
        self.conversation_memories = {}  # 用户ID -> ConversationMemory
        self.emotion_analyzer = EmotionAnalyzer()
        self.personality_simulator = PersonalitySimulator()
    
    def get_or_create_memory(self, user_id: str, character_id: str) -> ConversationMemory:
        """获取或创建对话记忆"""
        memory_key = f"{user_id}_{character_id}"
        if memory_key not in self.conversation_memories:
            self.conversation_memories[memory_key] = ConversationMemory()
        return self.conversation_memories[memory_key]
    
    def generate_character_response(self, user_message: str, character_id: str, 
                                  user_id: str = None, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """生成增强版人物回复"""
        try:
            start_time = time.time()
            
            # 获取人物信息
            character_data = character_service.get_character_for_dialogue(character_id)
            if not character_data:
                return {
                    'success': False,
                    'error': f'未找到人物: {character_id}'
                }
            
            # 情感分析
            emotion_analysis = self.emotion_analyzer.analyze_emotion(user_message)
            
            # 获取对话记忆
            memory = None
            if user_id:
                memory = self.get_or_create_memory(user_id, character_id)
                memory.add_message('user', user_message, self._calculate_importance(user_message))
            
            # 获取上下文
            context = memory.get_context() if memory else ""
            
            # 人物性格模拟
            response_strategy = self.personality_simulator.adapt_response_style(
                character_data, 
                emotion_analysis['primary_emotion'], 
                context
            )
            
            # 构建提示词
            prompt = self._build_enhanced_prompt(
                character_data, user_message, context, 
                emotion_analysis, response_strategy
            )
            
            # 生成回复（这里使用模拟回复，实际应该调用AI API）
            ai_response = self._generate_mock_response(
                character_data, user_message, response_strategy
            )
            
            # 添加回复到记忆
            if memory:
                memory.add_message('assistant', ai_response, 0.6)
            
            # 记录对话日志
            if user_id:
                business_logger.log_ai_interaction(
                    user_id, character_id,
                    {
                        'message': user_message,
                        'emotion': emotion_analysis,
                        'context_length': len(context)
                    },
                    {
                        'response': ai_response[:100] + '...',
                        'strategy': response_strategy,
                        'processing_time': time.time() - start_time
                    }
                )
            
            return {
                'success': True,
                'data': {
                    'response': ai_response,
                    'character': {
                        'id': character_id,
                        'name': character_data['name'],
                        'title': character_data.get('title', '')
                    },
                    'emotion_analysis': emotion_analysis,
                    'response_strategy': response_strategy,
                    'thinking_process': self._generate_thinking_process(
                        user_message, character_data, response_strategy
                    ),
                    'confidence': 0.85,
                    'processing_time': time.time() - start_time,
                    'context_used': bool(context),
                    'memory_summary': self._get_memory_summary(memory) if memory else None
                }
            }
            
        except Exception as e:
            logger.error(f"AI对话生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_importance(self, message: str) -> float:
        """计算消息重要性"""
        importance = 0.5
        
        # 基于长度
        if len(message) > 100:
            importance += 0.1
        
        # 基于关键词
        important_keywords = ['学习', '困惑', '问题', '帮助', '理解', '感悟']
        for keyword in important_keywords:
            if keyword in message:
                importance += 0.1
        
        # 基于情感强度
        emotion = self.emotion_analyzer.analyze_emotion(message)
        if emotion['confidence'] > 0.7:
            importance += 0.2
        
        return min(importance, 1.0)
    
    def _build_enhanced_prompt(self, character_data: Dict[str, Any], user_message: str,
                             context: str, emotion_analysis: Dict[str, Any], 
                             response_strategy: Dict[str, Any]) -> str:
        """构建增强版提示词"""
        prompt_parts = [
            f"你是{character_data['name']}（{character_data.get('title', '')}），{character_data.get('description', '')}",
            f"你的对话风格：{character_data.get('dialogue_style', '')}",
            f"你的核心思想：{', '.join(character_data.get('key_thoughts', []))}",
        ]
        
        if context:
            prompt_parts.append(f"对话背景：{context}")
        
        prompt_parts.extend([
            f"用户情感状态：{emotion_analysis['emotion_label']}（置信度：{emotion_analysis['confidence']:.2f}）",
            f"回复策略：语调{response_strategy['tone']}，共情程度{response_strategy['empathy_level']:.1f}",
            f"用户问题：{user_message}",
            "请以符合你的身份和性格的方式回复，体现你的思想特色和对话风格。"
        ])
        
        return "\n".join(prompt_parts)
    
    def _generate_mock_response(self, character_data: Dict[str, Any], 
                              user_message: str, response_strategy: Dict[str, Any]) -> str:
        """生成模拟回复"""
        character_name = character_data['name']
        
        # 基于人物和策略生成不同风格的回复
        if character_name == '孔子':
            if response_strategy['tone'] == 'gentle':
                return "学而时习之，不亦说乎？你的困惑我能理解，学习本就是一个循序渐进的过程。让我们一起探讨这个问题。"
            else:
                return "君子求诸己，小人求诸人。你提出的问题很有意义，这正体现了求学的态度。"
        
        elif character_name == '老子':
            if response_strategy['tone'] == 'calm':
                return "道可道，非常道。世间万物皆有其规律，不必过于执着。顺应自然，内心自会平静。"
            else:
                return "上善若水，水善利万物而不争。你的思考很深刻，这正是智慧的体现。"
        
        else:
            return f"作为{character_name}，我认为你的问题很有价值。让我们从传统智慧的角度来思考这个问题。"
    
    def _generate_thinking_process(self, user_message: str, character_data: Dict[str, Any],
                                 response_strategy: Dict[str, Any]) -> str:
        """生成思考过程"""
        return f"基于{character_data['name']}的思想特点，我分析了用户的情感状态，采用了{response_strategy['tone']}的语调来回应，希望能够体现{character_data.get('dialogue_style', '')}的特色。"
    
    def _get_memory_summary(self, memory: ConversationMemory) -> Dict[str, Any]:
        """获取记忆摘要"""
        if not memory:
            return None
        
        return {
            'short_term_count': len(memory.short_term_memory),
            'long_term_count': len(memory.long_term_memory),
            'themes': memory.conversation_themes[-3:],  # 最近3个主题
            'preferences': memory.user_preferences
        }
    
    def get_conversation_summary(self, user_id: str, character_id: str) -> Dict[str, Any]:
        """获取对话摘要"""
        memory_key = f"{user_id}_{character_id}"
        memory = self.conversation_memories.get(memory_key)
        
        if not memory:
            return {'summary': '暂无对话记录'}
        
        # 生成对话摘要
        total_messages = len(memory.short_term_memory) + len(memory.long_term_memory)
        main_themes = memory.conversation_themes
        
        summary = {
            'total_messages': total_messages,
            'main_themes': main_themes,
            'recent_topics': [msg['content'][:30] + '...' for msg in memory.short_term_memory[-3:]],
            'key_insights': [mem['summary'] for mem in memory.long_term_memory[-3:]],
            'user_preferences': memory.user_preferences
        }
        
        return summary

# 全局增强版AI服务实例
enhanced_ai_service = EnhancedAIService()
