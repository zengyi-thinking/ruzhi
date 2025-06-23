"""
高级AI对话服务
集成真实AI模型、RAG增强、个性化回复等功能
"""
import asyncio
import time
import json
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime

from services.real_ai_service import real_ai_service
from services.prompt_builder import prompt_builder
from services.rag_service import rag_service
from services.enhanced_ai_service import enhanced_ai_service, EmotionAnalyzer, ConversationMemory
from services.character_service import character_service
from utils.logging_config import get_logger, business_logger

logger = get_logger('advanced_ai_service')

class ResponseQualityFilter:
    """回复质量过滤器"""
    
    @staticmethod
    def validate_response(response: str, character_data: Dict[str, Any]) -> Dict[str, Any]:
        """验证回复质量"""
        issues = []
        score = 1.0
        
        # 检查长度
        if len(response) < 20:
            issues.append("回复过短")
            score -= 0.3
        elif len(response) > 2000:
            issues.append("回复过长")
            score -= 0.2
        
        # 检查是否包含人物特色
        character_name = character_data.get('name', '')
        if character_name and character_name not in response:
            # 检查是否体现人物思想
            key_thoughts = character_data.get('key_thoughts', [])
            if not any(thought in response for thought in key_thoughts):
                issues.append("缺乏人物特色")
                score -= 0.2
        
        # 检查是否有不当内容
        inappropriate_words = ['暴力', '仇恨', '歧视']
        if any(word in response for word in inappropriate_words):
            issues.append("包含不当内容")
            score -= 0.5
        
        # 检查是否偏离主题
        cultural_keywords = ['文化', '传统', '思想', '哲学', '道德', '学习']
        if not any(keyword in response for keyword in cultural_keywords):
            issues.append("可能偏离传统文化主题")
            score -= 0.1
        
        return {
            'is_valid': score >= 0.6,
            'quality_score': max(score, 0.0),
            'issues': issues
        }
    
    @staticmethod
    def enhance_response_diversity(response: str, recent_responses: List[str]) -> str:
        """增强回复多样性"""
        if not recent_responses:
            return response
        
        # 检查是否与最近的回复过于相似
        for recent in recent_responses[-3:]:  # 检查最近3个回复
            if ResponseQualityFilter._calculate_similarity(response, recent) > 0.8:
                # 如果相似度过高，添加变化
                return ResponseQualityFilter._add_variation(response)
        
        return response
    
    @staticmethod
    def _calculate_similarity(text1: str, text2: str) -> float:
        """计算文本相似度"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    @staticmethod
    def _add_variation(response: str) -> str:
        """为回复添加变化"""
        variations = [
            "换个角度来看，",
            "从另一个层面来说，",
            "进一步思考，",
            "补充一点，"
        ]
        
        import random
        variation = random.choice(variations)
        return f"{variation}{response}"

class AdvancedAIService:
    """高级AI对话服务"""
    
    def __init__(self):
        self.quality_filter = ResponseQualityFilter()
        self.conversation_memories = {}
        self.recent_responses = {}  # 存储最近的回复用于多样性检查
    
    async def generate_advanced_response(self, user_message: str, character_id: str,
                                       user_id: str = None, user_context: Dict[str, Any] = None,
                                       stream: bool = False) -> Dict[str, Any]:
        """生成高级AI回复"""
        try:
            start_time = time.time()
            
            # 1. 获取人物信息
            character_data = character_service.get_character_for_dialogue(character_id)
            if not character_data:
                return {
                    'success': False,
                    'error': f'未找到人物: {character_id}'
                }
            
            # 2. 情感分析
            emotion_analysis = EmotionAnalyzer.analyze_emotion(user_message)
            
            # 3. 问题类型分析
            question_type = prompt_builder.analyze_question_type(user_message)
            
            # 4. 获取或创建对话记忆
            memory = self._get_or_create_memory(user_id, character_id)
            if memory:
                memory.add_message('user', user_message, self._calculate_importance(user_message))
            
            # 5. RAG知识增强
            rag_result = rag_service.enhance_query_with_knowledge(
                user_message, character_id, user_context
            )
            
            # 6. 构建用户上下文
            enhanced_context = self._build_enhanced_context(
                user_context or {}, emotion_analysis, question_type, memory, rag_result
            )
            
            # 7. 构建智能提示词
            conversation_history = self._get_conversation_history(memory)
            prompt = prompt_builder.build_character_prompt(
                character_data, enhanced_context, conversation_history
            )
            
            # 8. RAG增强提示词
            if rag_result['relevant_knowledge']:
                prompt = prompt_builder.build_rag_enhanced_prompt(
                    prompt, rag_result['relevant_knowledge']
                )
            
            # 9. 添加问题类型特定指导
            type_prompt = prompt_builder.build_question_type_prompt(question_type, user_message)
            if type_prompt:
                prompt += f"\n\n{type_prompt}"
            
            # 10. 构建消息列表
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_message}
            ]
            
            # 11. 调用AI生成回复
            if stream:
                return await self._generate_stream_response(
                    messages, character_data, user_id, character_id, 
                    enhanced_context, rag_result, start_time
                )
            else:
                return await self._generate_single_response(
                    messages, character_data, user_id, character_id,
                    enhanced_context, rag_result, start_time, memory
                )
                
        except Exception as e:
            logger.error(f"高级AI对话生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _generate_single_response(self, messages: List[Dict[str, str]], 
                                      character_data: Dict[str, Any], user_id: str,
                                      character_id: str, enhanced_context: Dict[str, Any],
                                      rag_result: Dict[str, Any], start_time: float,
                                      memory: ConversationMemory) -> Dict[str, Any]:
        """生成单次回复"""
        # 调用真实AI服务
        ai_result = await real_ai_service.generate_response(messages)
        
        if not ai_result['success']:
            # 如果AI调用失败，使用增强版AI服务作为备用
            logger.warning("真实AI调用失败，使用备用服务")
            fallback_result = enhanced_ai_service.generate_character_response(
                messages[-1]['content'], character_id, user_id
            )
            if fallback_result['success']:
                ai_result = {
                    'success': True,
                    'content': fallback_result['data']['response'],
                    'model': 'fallback',
                    'usage': {}
                }
            else:
                return ai_result
        
        # 质量验证和增强
        response_content = ai_result['content']
        
        # 检查回复质量
        quality_check = self.quality_filter.validate_response(response_content, character_data)
        
        # 增强多样性
        recent_responses = self.recent_responses.get(f"{user_id}_{character_id}", [])
        response_content = self.quality_filter.enhance_response_diversity(
            response_content, recent_responses
        )
        
        # 更新最近回复记录
        if user_id:
            key = f"{user_id}_{character_id}"
            if key not in self.recent_responses:
                self.recent_responses[key] = []
            self.recent_responses[key].append(response_content)
            if len(self.recent_responses[key]) > 5:
                self.recent_responses[key].pop(0)
        
        # 添加回复到记忆
        if memory:
            memory.add_message('assistant', response_content, 0.6)
        
        # 生成思考过程
        thinking_process = self._generate_thinking_process(
            enhanced_context, rag_result, quality_check
        )
        
        # 生成相关推荐
        related_recommendations = self._generate_recommendations(
            enhanced_context, rag_result, character_data
        )
        
        processing_time = time.time() - start_time
        
        # 记录业务日志
        if user_id:
            business_logger.log_ai_interaction(
                user_id, character_id,
                {
                    'message': messages[-1]['content'],
                    'emotion': enhanced_context.get('emotion_analysis', {}),
                    'question_type': enhanced_context.get('question_type'),
                    'rag_knowledge_count': rag_result['knowledge_count']
                },
                {
                    'response_length': len(response_content),
                    'quality_score': quality_check['quality_score'],
                    'model': ai_result.get('model', 'unknown'),
                    'processing_time': processing_time
                }
            )
        
        return {
            'success': True,
            'data': {
                'response': response_content,
                'character': {
                    'id': character_id,
                    'name': character_data['name'],
                    'title': character_data.get('title', '')
                },
                'emotion_analysis': enhanced_context.get('emotion_analysis', {}),
                'question_type': enhanced_context.get('question_type'),
                'thinking_process': thinking_process,
                'quality_assessment': quality_check,
                'rag_enhancement': {
                    'knowledge_used': rag_result['knowledge_count'],
                    'knowledge_summary': rag_result['knowledge_summary']
                },
                'related_recommendations': related_recommendations,
                'processing_time': processing_time,
                'model_info': {
                    'provider': ai_result.get('provider', 'unknown'),
                    'model': ai_result.get('model', 'unknown'),
                    'usage': ai_result.get('usage', {})
                },
                'conversation_context': {
                    'memory_summary': self._get_memory_summary(memory),
                    'context_used': bool(enhanced_context.get('conversation_context'))
                }
            }
        }
    
    async def _generate_stream_response(self, messages: List[Dict[str, str]],
                                      character_data: Dict[str, Any], user_id: str,
                                      character_id: str, enhanced_context: Dict[str, Any],
                                      rag_result: Dict[str, Any], start_time: float) -> AsyncGenerator[Dict[str, Any], None]:
        """生成流式回复"""
        try:
            full_response = ""
            
            # 首先发送初始信息
            yield {
                'type': 'start',
                'data': {
                    'character': {
                        'id': character_id,
                        'name': character_data['name'],
                        'title': character_data.get('title', '')
                    },
                    'emotion_analysis': enhanced_context.get('emotion_analysis', {}),
                    'question_type': enhanced_context.get('question_type'),
                    'rag_enhancement': {
                        'knowledge_used': rag_result['knowledge_count'],
                        'knowledge_summary': rag_result['knowledge_summary']
                    }
                }
            }
            
            # 流式生成回复
            async for chunk in real_ai_service.generate_stream_response(messages):
                if chunk and not chunk.startswith('[错误'):
                    full_response += chunk
                    yield {
                        'type': 'content',
                        'data': {'chunk': chunk}
                    }
            
            # 发送完成信息
            processing_time = time.time() - start_time
            quality_check = self.quality_filter.validate_response(full_response, character_data)
            
            yield {
                'type': 'complete',
                'data': {
                    'full_response': full_response,
                    'quality_assessment': quality_check,
                    'processing_time': processing_time,
                    'thinking_process': self._generate_thinking_process(
                        enhanced_context, rag_result, quality_check
                    ),
                    'related_recommendations': self._generate_recommendations(
                        enhanced_context, rag_result, character_data
                    )
                }
            }
            
        except Exception as e:
            logger.error(f"流式回复生成失败: {e}")
            yield {
                'type': 'error',
                'data': {'error': str(e)}
            }
    
    def _build_enhanced_context(self, user_context: Dict[str, Any], 
                              emotion_analysis: Dict[str, Any], question_type: str,
                              memory: ConversationMemory, rag_result: Dict[str, Any]) -> Dict[str, Any]:
        """构建增强的用户上下文"""
        enhanced_context = user_context.copy()
        enhanced_context.update({
            'emotion_analysis': emotion_analysis,
            'question_type': question_type,
            'conversation_context': memory.get_context() if memory else "",
            'rag_knowledge': rag_result['knowledge_context'],
            'user_level': user_context.get('user_level', 'beginner'),
            'current_topic': self._extract_topic(user_context.get('user_message', ''))
        })
        
        # 根据情感和问题类型调整回复策略
        response_strategy = self._determine_response_strategy(emotion_analysis, question_type)
        enhanced_context['response_strategy'] = response_strategy
        
        return enhanced_context
    
    def _determine_response_strategy(self, emotion_analysis: Dict[str, Any], 
                                   question_type: str) -> Dict[str, Any]:
        """确定回复策略"""
        primary_emotion = emotion_analysis.get('primary_emotion', 'neutral')
        
        strategy = {
            'tone': 'neutral',
            'empathy_level': 0.5,
            'teaching_style': 'informative',
            'response_depth': 'medium'
        }
        
        # 根据情感调整
        if primary_emotion == 'sadness':
            strategy.update({
                'tone': 'gentle',
                'empathy_level': 0.8,
                'teaching_style': 'supportive'
            })
        elif primary_emotion == 'anger':
            strategy.update({
                'tone': 'calm',
                'empathy_level': 0.7,
                'teaching_style': 'patient'
            })
        elif primary_emotion == 'joy':
            strategy.update({
                'tone': 'encouraging',
                'empathy_level': 0.6,
                'teaching_style': 'enthusiastic'
            })
        
        # 根据问题类型调整
        if question_type == 'learning_difficulty':
            strategy.update({
                'teaching_style': 'step_by_step',
                'response_depth': 'detailed'
            })
        elif question_type == 'philosophical_inquiry':
            strategy.update({
                'teaching_style': 'socratic',
                'response_depth': 'deep'
            })
        elif question_type == 'practical_guidance':
            strategy.update({
                'teaching_style': 'practical',
                'response_depth': 'actionable'
            })
        
        return strategy
    
    def _get_or_create_memory(self, user_id: str, character_id: str) -> Optional[ConversationMemory]:
        """获取或创建对话记忆"""
        if not user_id:
            return None
        
        memory_key = f"{user_id}_{character_id}"
        if memory_key not in self.conversation_memories:
            self.conversation_memories[memory_key] = ConversationMemory()
        return self.conversation_memories[memory_key]
    
    def _get_conversation_history(self, memory: ConversationMemory) -> List[Dict[str, str]]:
        """获取对话历史"""
        if not memory:
            return []
        
        history = []
        for msg in memory.short_term_memory[-6:]:  # 最近6条消息
            history.append({
                'role': msg['role'],
                'content': msg['content']
            })
        return history
    
    def _calculate_importance(self, message: str) -> float:
        """计算消息重要性"""
        importance = 0.5
        
        # 基于长度
        if len(message) > 100:
            importance += 0.1
        
        # 基于关键词
        important_keywords = ['学习', '困惑', '问题', '帮助', '理解', '感悟', '思考']
        for keyword in important_keywords:
            if keyword in message:
                importance += 0.1
        
        return min(importance, 1.0)
    
    def _extract_topic(self, message: str) -> str:
        """提取对话主题"""
        topics = {
            '仁': '仁爱思想',
            '礼': '礼制文化',
            '道': '道家哲学',
            '德': '道德修养',
            '学习': '学习方法',
            '教育': '教育理念',
            '政治': '政治思想',
            '哲学': '哲学思辨'
        }
        
        for keyword, topic in topics.items():
            if keyword in message:
                return topic
        
        return '传统文化'
    
    def _generate_thinking_process(self, enhanced_context: Dict[str, Any],
                                 rag_result: Dict[str, Any], 
                                 quality_check: Dict[str, Any]) -> str:
        """生成思考过程"""
        process_parts = []
        
        # 情感分析结果
        emotion = enhanced_context.get('emotion_analysis', {})
        if emotion:
            process_parts.append(f"识别用户情感：{emotion.get('emotion_label', '未知')}")
        
        # 问题类型分析
        question_type = enhanced_context.get('question_type')
        if question_type:
            type_names = {
                'learning_difficulty': '学习困难',
                'emotional_support': '情感支持',
                'philosophical_inquiry': '哲学思辨',
                'practical_guidance': '实践指导'
            }
            process_parts.append(f"问题类型：{type_names.get(question_type, question_type)}")
        
        # RAG增强信息
        if rag_result['knowledge_count'] > 0:
            process_parts.append(f"检索到{rag_result['knowledge_count']}个相关知识点")
        
        # 回复策略
        strategy = enhanced_context.get('response_strategy', {})
        if strategy:
            process_parts.append(f"采用{strategy.get('tone', '中性')}语调，{strategy.get('teaching_style', '信息性')}教学方式")
        
        # 质量评估
        if quality_check:
            process_parts.append(f"回复质量评分：{quality_check['quality_score']:.2f}")
        
        return "；".join(process_parts)
    
    def _generate_recommendations(self, enhanced_context: Dict[str, Any],
                                rag_result: Dict[str, Any], 
                                character_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """生成相关推荐"""
        recommendations = []
        
        # 基于RAG知识推荐
        for item in rag_result.get('relevant_knowledge', [])[:2]:
            if item['type'] == 'concept':
                recommendations.append({
                    'type': 'concept',
                    'title': f"深入了解：{item['title']}",
                    'description': item['content'][:50] + "..."
                })
        
        # 基于人物推荐相关内容
        character_thoughts = character_data.get('key_thoughts', [])
        if character_thoughts:
            recommendations.append({
                'type': 'character_thought',
                'title': f"探索{character_data['name']}的其他思想",
                'description': f"了解更多关于{character_thoughts[0]}的内容"
            })
        
        # 基于问题类型推荐
        question_type = enhanced_context.get('question_type')
        if question_type == 'learning_difficulty':
            recommendations.append({
                'type': 'learning_method',
                'title': "学习方法指导",
                'description': "获取更多学习传统文化的有效方法"
            })
        
        return recommendations[:3]  # 最多返回3个推荐
    
    def _get_memory_summary(self, memory: ConversationMemory) -> Optional[Dict[str, Any]]:
        """获取记忆摘要"""
        if not memory:
            return None
        
        return {
            'short_term_count': len(memory.short_term_memory),
            'long_term_count': len(memory.long_term_memory),
            'themes': memory.conversation_themes[-3:],
            'preferences': memory.user_preferences
        }

# 全局高级AI服务实例
advanced_ai_service = AdvancedAIService()
