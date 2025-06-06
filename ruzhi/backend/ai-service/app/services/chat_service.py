"""
儒智AI对话服务 - 聊天服务
"""

import logging
from enum import Enum
from typing import Dict, List, Any, Optional
import json
import os
import random
import uuid

from ..schemas.chat import ChatRequest, ChatResponse, HistoricalFigure, MessageRole
from .llm_service import LLMService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class ChatService:
    """历史人物对话服务"""

    def __init__(self):
        """初始化聊天服务"""
        logger.info("正在初始化AI对话服务...")
        # 人物知识库
        self.character_knowledge = self._load_character_knowledge()
        # 会话历史
        self.conversations = {}
        # 初始化LLM服务
        try:
            self.llm_service = LLMService()
            self.use_llm = True
            logger.info("成功加载LLM服务")
        except Exception as e:
            logger.warning(f"LLM服务加载失败，将使用规则基回复: {e}")
            self.use_llm = False
        logger.info("AI对话服务初始化完成")

    def _load_character_knowledge(self) -> Dict[str, Dict[str, Any]]:
        """加载历史人物知识库"""
        # 这里可以从数据库或JSON文件加载，此处先使用内存数据作为示例
        knowledge = {
            "mengzi": {
                "name": "孟子",
                "time_period": "战国时期",
                "description": "孟子，名轲，字子舆，战国中期思想家、教育家，儒家学派的代表人物，与孔子并称为'孔孟'。",
                "teachings": [
                    "性善论：人性本善，人皆有恻隐之心",
                    "王道政治：主张仁政，反对暴政",
                    "民本思想：民为贵，社稷次之，君为轻",
                    "义利观：义内于心，利外于物"
                ],
                "famous_quotes": [
                    "富贵不能淫，贫贱不能移，威武不能屈，此之谓大丈夫。",
                    "民为贵，社稷次之，君为轻。",
                    "得道者多助，失道者寡助。",
                    "鱼，我所欲也；熊掌，亦我所欲也，二者不可得兼，舍鱼而取熊掌者也。"
                ],
                "style": "高雅睿智，善于辩论，语气坚定有力，富有说服力。回答问题时喜欢引经据典，用比喻阐明道理。"
            },
            "confucius": {
                "name": "孔子",
                "time_period": "春秋末期",
                "description": "孔子，名丘，字仲尼，春秋末期思想家、教育家，儒家学派创始人。",
                "teachings": [
                    "仁者爱人：提倡仁爱精神",
                    "礼制思想：重视礼仪，维护社会秩序",
                    "中庸之道：走中间路线，不偏不倚",
                    "教育平等：有教无类"
                ],
                "famous_quotes": [
                    "学而时习之，不亦说乎？",
                    "三人行，必有我师焉。",
                    "己所不欲，勿施于人。",
                    "知之者不如好之者，好之者不如乐之者。"
                ],
                "style": "言辞谦和，语言简练精炼，善于启发引导。回答问题常用比喻和寓言，引导对方自己思考得出结论。"
            },
            "xunzi": {
                "name": "荀子",
                "time_period": "战国末期",
                "description": "荀子，名况，字卿，战国末期思想家、文学家，儒家代表人物之一。",
                "teachings": [
                    "性恶论：人性本恶，可通过礼义教化",
                    "天人相分：天行有常，不为尧存，不为桀亡",
                    "重视礼义：礼义是维持社会秩序的基础",
                    "注重实践：不空谈，重视实际行动"
                ],
                "famous_quotes": [
                    "人之性恶，其善者伪也。",
                    "君子性非异也，善假于物也。",
                    "不闻不若闻之，闻之不若见之，见之不若知之，知之不若行之。",
                    "天行有常，不为尧存，不为桀亡。"
                ],
                "style": "语言犀利直接，逻辑严密，善于分析辩论。回答问题时常用对比论证，条理清晰，直指本质。"
            }
        }
        return knowledge

    def list_available_characters(self) -> List[Dict[str, str]]:
        """获取可用的历史人物列表"""
        characters = []
        for char_id, info in self.character_knowledge.items():
            characters.append({
                "id": char_id,
                "name": info["name"],
                "time_period": info["time_period"],
                "short_description": info["description"][:50] + "..."
            })
        return characters

    def get_character_info(self, character: HistoricalFigure) -> Dict[str, Any]:
        """获取历史人物详细信息"""
        char_id = character.value
        if char_id in self.character_knowledge:
            return {
                "id": char_id,
                **self.character_knowledge[char_id]
            }
        return {"error": f"未找到人物: {char_id}"}

    def _get_conversation_id(self, user_id: str, character_id: str) -> str:
        """生成会话ID"""
        return f"{user_id}_{character_id}"

    def _format_prompt(self, character_id: str, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """根据角色和对话历史格式化提示词"""
        if character_id not in self.character_knowledge:
            raise ValueError(f"未知角色: {character_id}")
            
        character = self.character_knowledge[character_id]
        
        # 构建系统提示
        system_prompt = f"""
你是{character['name']}，{character['time_period']}的思想家。
{character['description']}

你的主要思想:
{' '.join(character['teachings'])}

你的语言风格:
{character['style']}

以下是你的一些著名言论，请参考它们来回答问题:
{' '.join(character['famous_quotes'])}

请用中文回答，保持你的语言风格和思想观点的一致性。
如果问题超出你所处时代的知识范围，请委婉表示这超出了你的知识范围，
但可以尝试根据你的思想体系来思考这个问题。
"""
        
        # 构建完整提示
        formatted_messages = [{"role": "system", "content": system_prompt}]
        
        # 添加对话历史
        for message in messages:
            formatted_messages.append({
                "role": "user" if message["role"] == MessageRole.USER else "assistant",
                "content": message["content"]
            })
        
        return formatted_messages

    def _generate_response(self, character_id: str, prompt: List[Dict[str, str]]) -> str:
        """生成回复"""
        logger.info(f"正在生成{self.character_knowledge[character_id]['name']}的回复...")
        
        # 使用LLM服务生成回复
        if self.use_llm:
            try:
                # 获取角色对应的persona名称
                if character_id == "confucius":
                    persona = "孔子"
                elif character_id == "mengzi":
                    persona = "孟子"
                elif character_id == "xunzi":
                    persona = "现代导师"  # 临时处理，实际应该有专门的荀子角色
                else:
                    persona = "现代导师"
                
                # 从提示中提取最后一条用户消息
                user_message = prompt[-1]["content"]
                
                # 转换之前的会话历史为LLM服务需要的格式
                history = []
                for i in range(0, len(prompt) - 1):
                    if i == 0:  # 跳过系统提示
                        continue 
                    msg = prompt[i]
                    history.append(msg)
                
                # 使用LLM服务生成回复
                response = self.llm_service.generate_response(
                    persona=persona,
                    message=user_message,
                    conversation_history=history
                )
                
                return response
            except Exception as e:
                logger.error(f"LLM生成失败: {str(e)}")
                # 如果LLM失败，回退到规则基回复
                return self._fallback_response(character_id, prompt[-1]["content"])
        else:
            # 使用规则基回复
            return self._fallback_response(character_id, prompt[-1]["content"])
    
    def _fallback_response(self, character_id: str, user_message: str) -> str:
        """规则基回复，作为备选方案"""
        character = self.character_knowledge[character_id]
        
        # 简单的规则基生成，作为LLM不可用时的备选
        if "你好" in user_message or "您好" in user_message or "介绍" in user_message:
            return f"吾乃{character['name']}。{random.choice(character['famous_quotes'])}"
        
        elif "思想" in user_message or "理念" in user_message or "观点" in user_message:
            return f"{random.choice(character['teachings'])}。{random.choice(character['famous_quotes'])}"
            
        elif "现代" in user_message or "科技" in user_message or "电脑" in user_message:
            return f"此事非吾时代所知。然以吾之见，{random.choice(character['teachings'])}"
            
        else:
            # 默认回复
            return random.choice(character['famous_quotes'])
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """处理聊天请求"""
        user_id = request.user_id
        character = request.character
        message = request.message
        
        # 获取会话ID
        conv_id = self._get_conversation_id(user_id, character.value)
        
        # 如果是新会话，初始化会话历史
        if conv_id not in self.conversations:
            self.conversations[conv_id] = []
            
        # 添加用户消息到历史
        self.conversations[conv_id].append({
            "role": MessageRole.USER,
            "content": message
        })
        
        # 格式化提示并生成回复
        prompt = self._format_prompt(character.value, self.conversations[conv_id])
        response_text = self._generate_response(character.value, prompt)
        
        # 添加AI回复到历史
        self.conversations[conv_id].append({
            "role": MessageRole.ASSISTANT,
            "content": response_text
        })
        
        # 如果历史太长，裁剪以节省内存（保留最新的10条）
        if len(self.conversations[conv_id]) > 20:
            self.conversations[conv_id] = self.conversations[conv_id][-20:]
            
        return ChatResponse(
            message_id=f"msg_{uuid.uuid4().hex[:8]}",
            content=response_text,
            character=character
        )
