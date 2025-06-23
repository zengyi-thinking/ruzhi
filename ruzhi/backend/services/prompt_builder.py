"""
智能提示词构建器
根据人物性格、用户情感、对话历史等动态构建AI提示词
"""
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

from utils.logging_config import get_logger

logger = get_logger('prompt_builder')

class PromptBuilder:
    """智能提示词构建器"""
    
    def __init__(self):
        self.base_templates = self._load_base_templates()
        self.personality_modifiers = self._load_personality_modifiers()
        self.context_enhancers = self._load_context_enhancers()
    
    def _load_base_templates(self) -> Dict[str, str]:
        """加载基础提示词模板"""
        return {
            'character_base': """你是{character_name}（{character_title}），{character_description}

你的核心思想：{key_thoughts}
你的对话风格：{dialogue_style}
你的语言特点：{speech_patterns}

请始终保持你的身份特征，用符合你的思想和时代背景的方式回答问题。""",
            
            'context_aware': """基于以下对话背景：
{conversation_context}

用户当前的情感状态：{user_emotion}
用户的学习水平：{user_level}
当前讨论的主题：{current_topic}""",
            
            'response_guidance': """回复指导：
- 语调：{tone}
- 共情程度：{empathy_level}
- 教学方式：{teaching_style}
- 回复深度：{response_depth}
- 是否需要举例：{need_examples}""",
            
            'knowledge_integration': """相关知识背景：
{relevant_knowledge}

请结合这些知识背景，给出准确、有深度的回答。"""
        }
    
    def _load_personality_modifiers(self) -> Dict[str, Dict[str, str]]:
        """加载人物性格修饰符"""
        return {
            'confucius': {
                'tone_modifier': '温和而深刻，善于启发',
                'teaching_approach': '循循善诱，因材施教',
                'language_style': '简洁而富含哲理，常用比喻',
                'value_emphasis': '强调仁德、礼制、教育的重要性'
            },
            'laozi': {
                'tone_modifier': '深邃玄妙，平和淡然',
                'teaching_approach': '点到为止，启发自悟',
                'language_style': '言简意赅，富含悖论',
                'value_emphasis': '强调道法自然、无为而治'
            },
            'mencius': {
                'tone_modifier': '雄辩有力，充满激情',
                'teaching_approach': '论辩式教学，逻辑严密',
                'language_style': '铿锵有力，善用排比',
                'value_emphasis': '强调性善论、仁政、民本思想'
            },
            'zhuangzi': {
                'tone_modifier': '幽默风趣，天马行空',
                'teaching_approach': '寓言式教学，启发想象',
                'language_style': '生动有趣，富有创意',
                'value_emphasis': '强调逍遥自在、相对主义'
            }
        }
    
    def _load_context_enhancers(self) -> Dict[str, str]:
        """加载上下文增强器"""
        return {
            'learning_difficulty': """用户在学习上遇到困难，需要：
- 耐心的解释和鼓励
- 循序渐进的指导
- 具体的学习方法建议""",
            
            'emotional_support': """用户需要情感支持，应该：
- 表现出理解和同情
- 提供心理安慰
- 分享相关的人生智慧""",
            
            'philosophical_inquiry': """用户进行哲学思辨，需要：
- 深入的思想交流
- 多角度的分析
- 启发性的问题引导""",
            
            'practical_guidance': """用户寻求实践指导，应该：
- 提供具体可行的建议
- 结合现代生活场景
- 给出实施步骤"""
        }
    
    def build_character_prompt(self, character_data: Dict[str, Any], 
                             user_context: Dict[str, Any],
                             conversation_history: List[Dict[str, str]] = None) -> str:
        """构建人物角色提示词"""
        try:
            # 基础人物信息
            character_info = self._format_character_info(character_data)
            
            # 用户上下文信息
            context_info = self._format_user_context(user_context)
            
            # 对话历史摘要
            history_summary = self._summarize_conversation_history(conversation_history)
            
            # 个性化修饰
            personality_mod = self._get_personality_modifier(character_data.get('id', ''))
            
            # 构建完整提示词
            prompt_parts = [
                self.base_templates['character_base'].format(**character_info),
                self.base_templates['context_aware'].format(**context_info),
                self._build_response_guidance(user_context, personality_mod),
                history_summary
            ]
            
            # 过滤空内容
            prompt_parts = [part for part in prompt_parts if part.strip()]
            
            return '\n\n'.join(prompt_parts)
            
        except Exception as e:
            logger.error(f"构建人物提示词失败: {e}")
            return self._get_fallback_prompt(character_data)
    
    def _format_character_info(self, character_data: Dict[str, Any]) -> Dict[str, str]:
        """格式化人物信息"""
        return {
            'character_name': character_data.get('name', ''),
            'character_title': character_data.get('title', ''),
            'character_description': character_data.get('description', ''),
            'key_thoughts': '、'.join(character_data.get('key_thoughts', [])),
            'dialogue_style': character_data.get('dialogue_style', ''),
            'speech_patterns': '；'.join(character_data.get('speech_patterns', []))
        }
    
    def _format_user_context(self, user_context: Dict[str, Any]) -> Dict[str, str]:
        """格式化用户上下文"""
        emotion_analysis = user_context.get('emotion_analysis', {})
        
        return {
            'conversation_context': user_context.get('conversation_context', '暂无对话历史'),
            'user_emotion': emotion_analysis.get('emotion_label', '平静'),
            'user_level': user_context.get('user_level', '初学者'),
            'current_topic': user_context.get('current_topic', '传统文化学习')
        }
    
    def _summarize_conversation_history(self, history: List[Dict[str, str]]) -> str:
        """总结对话历史"""
        if not history or len(history) == 0:
            return ""
        
        # 获取最近的几轮对话
        recent_history = history[-6:]  # 最近3轮对话（用户+助手）
        
        summary_parts = ["最近的对话内容："]
        for msg in recent_history:
            role = "用户" if msg['role'] == 'user' else "我"
            content = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
            summary_parts.append(f"{role}: {content}")
        
        return '\n'.join(summary_parts)
    
    def _get_personality_modifier(self, character_id: str) -> Dict[str, str]:
        """获取人物性格修饰符"""
        return self.personality_modifiers.get(character_id, {
            'tone_modifier': '温和友善',
            'teaching_approach': '耐心指导',
            'language_style': '简洁明了',
            'value_emphasis': '传统文化的价值'
        })
    
    def _build_response_guidance(self, user_context: Dict[str, Any], 
                               personality_mod: Dict[str, str]) -> str:
        """构建回复指导"""
        response_strategy = user_context.get('response_strategy', {})
        
        guidance_info = {
            'tone': response_strategy.get('tone', '友善'),
            'empathy_level': f"{response_strategy.get('empathy_level', 0.5):.1f}",
            'teaching_style': response_strategy.get('teaching_style', '启发式'),
            'response_depth': self._determine_response_depth(user_context),
            'need_examples': '是' if user_context.get('user_level') == 'beginner' else '否'
        }
        
        guidance = self.base_templates['response_guidance'].format(**guidance_info)
        
        # 添加人物特色指导
        personality_guidance = f"""
人物特色要求：
- 语调风格：{personality_mod.get('tone_modifier', '')}
- 教学方式：{personality_mod.get('teaching_approach', '')}
- 语言特点：{personality_mod.get('language_style', '')}
- 价值强调：{personality_mod.get('value_emphasis', '')}"""
        
        return guidance + personality_guidance
    
    def _determine_response_depth(self, user_context: Dict[str, Any]) -> str:
        """确定回复深度"""
        user_level = user_context.get('user_level', 'beginner')
        question_type = user_context.get('question_type', 'general')
        
        if user_level == 'beginner':
            return '基础解释，通俗易懂'
        elif user_level == 'intermediate':
            return '适中深度，有一定理论性'
        elif user_level == 'advanced':
            return '深入分析，理论与实践并重'
        else:
            return '根据问题复杂度调整'
    
    def build_rag_enhanced_prompt(self, base_prompt: str, 
                                relevant_knowledge: List[Dict[str, Any]]) -> str:
        """构建RAG增强的提示词"""
        if not relevant_knowledge:
            return base_prompt
        
        # 格式化相关知识
        knowledge_parts = []
        for item in relevant_knowledge[:3]:  # 最多使用3个相关知识点
            knowledge_parts.append(f"- {item.get('title', '')}: {item.get('content', '')[:200]}...")
        
        knowledge_section = self.base_templates['knowledge_integration'].format(
            relevant_knowledge='\n'.join(knowledge_parts)
        )
        
        return f"{base_prompt}\n\n{knowledge_section}"
    
    def build_question_type_prompt(self, question_type: str, user_message: str) -> str:
        """根据问题类型构建特定提示词"""
        type_prompts = {
            'learning_difficulty': """用户在学习中遇到困难，请：
1. 先表示理解和鼓励
2. 分析问题的根源
3. 提供具体的解决方法
4. 给出循序渐进的学习建议""",
            
            'emotional_support': """用户需要情感支持，请：
1. 表现出同理心和关怀
2. 分享相关的人生智慧
3. 提供积极的心理引导
4. 避免说教，多用启发""",
            
            'philosophical_inquiry': """用户进行哲学思辨，请：
1. 深入分析问题的本质
2. 提供多角度的思考
3. 引用相关的经典观点
4. 启发用户进一步思考""",
            
            'practical_guidance': """用户寻求实践指导，请：
1. 提供具体可行的建议
2. 结合现代生活场景
3. 给出详细的实施步骤
4. 预见可能的困难和解决方案"""
        }
        
        return type_prompts.get(question_type, "")
    
    def _get_fallback_prompt(self, character_data: Dict[str, Any]) -> str:
        """获取备用提示词"""
        character_name = character_data.get('name', '智者')
        return f"""你是{character_name}，一位传统文化的传承者。
请用温和、智慧的方式回答用户的问题，体现传统文化的深度和价值。
保持耐心和理解，给出有启发性的回答。"""
    
    def analyze_question_type(self, user_message: str) -> str:
        """分析问题类型"""
        message_lower = user_message.lower()
        
        # 学习困难关键词
        if any(keyword in message_lower for keyword in ['困难', '不懂', '难理解', '学不会', '困惑']):
            return 'learning_difficulty'
        
        # 情感支持关键词
        if any(keyword in message_lower for keyword in ['难过', '沮丧', '迷茫', '焦虑', '压力', '心情']):
            return 'emotional_support'
        
        # 哲学思辨关键词
        if any(keyword in message_lower for keyword in ['为什么', '如何理解', '本质', '意义', '价值']):
            return 'philosophical_inquiry'
        
        # 实践指导关键词
        if any(keyword in message_lower for keyword in ['怎么做', '如何应用', '实践', '方法', '建议']):
            return 'practical_guidance'
        
        return 'general'

# 全局提示词构建器实例
prompt_builder = PromptBuilder()
