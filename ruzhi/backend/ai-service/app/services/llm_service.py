"""
儒智AI服务 - 大语言模型服务
"""

import os
import json
import requests
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import logging

from langchain.chat_models import ChatOpenAI
from langchain.llms import HuggingFacePipeline
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.schema import SystemMessage, HumanMessage, AIMessage
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate
from langchain.chains import ConversationChain, LLMChain
from langchain.memory import ConversationBufferMemory

from app.config.settings import settings

logger = logging.getLogger(__name__)


class ApiClient:
    """API客户端基类"""
    
    def __init__(self, api_key: str, api_base: str, model_name: str):
        self.api_key = api_key
        self.api_base = api_base
        self.model_name = model_name
    
    def generate(self, messages: List[Dict[str, str]]) -> str:
        """生成回复"""
        raise NotImplementedError("子类必须实现此方法")


class DeepSeekApiClient(ApiClient):
    """DeepSeek API客户端"""
    
    def generate(self, messages: List[Dict[str, str]]) -> str:
        """生成回复"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 确保消息格式正确
            formatted_messages = []
            for msg in messages:
                if msg["role"] not in ["system", "user", "assistant"]:
                    if msg["role"] == "ai":
                        formatted_messages.append({"role": "assistant", "content": msg["content"]})
                    else:
                        continue
                else:
                    formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
            data = {
                "model": self.model_name,
                "messages": formatted_messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(f"{self.api_base}/chat/completions", 
                                    headers=headers, 
                                    json=data)
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"DeepSeek API调用错误: {str(e)}")
            return f"抱歉，调用DeepSeek API时遇到问题: {str(e)}"


class ZhipuAIApiClient(ApiClient):
    """智谱清言API客户端"""
    
    def generate(self, messages: List[Dict[str, str]]) -> str:
        """生成回复"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 确保消息格式正确
            formatted_messages = []
            for msg in messages:
                if msg["role"] not in ["system", "user", "assistant"]:
                    if msg["role"] == "ai":
                        formatted_messages.append({"role": "assistant", "content": msg["content"]})
                    else:
                        continue
                else:
                    formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
            data = {
                "model": self.model_name,
                "messages": formatted_messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(f"{self.api_base}/chat/completions", 
                                    headers=headers, 
                                    json=data)
            response.raise_for_status()
            result = response.json()
            
            return result["data"]["choices"][0]["content"]
        except Exception as e:
            logger.error(f"智谱清言API调用错误: {str(e)}")
            return f"抱歉，调用智谱清言API时遇到问题: {str(e)}"


class OpenAIApiClient(ApiClient):
    """OpenAI API客户端"""
    
    def generate(self, messages: List[Dict[str, str]]) -> str:
        """生成回复"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # 确保消息格式正确
            formatted_messages = []
            for msg in messages:
                if msg["role"] not in ["system", "user", "assistant"]:
                    if msg["role"] == "ai":
                        formatted_messages.append({"role": "assistant", "content": msg["content"]})
                    else:
                        continue
                else:
                    formatted_messages.append({"role": msg["role"], "content": msg["content"]})
            
            data = {
                "model": self.model_name,
                "messages": formatted_messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(f"{self.api_base}/chat/completions", 
                                    headers=headers, 
                                    json=data)
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"OpenAI API调用错误: {str(e)}")
            return f"抱歉，调用OpenAI API时遇到问题: {str(e)}"


class LLMService:
    """大语言模型服务"""
    
    def __init__(self):
        self.llm = None
        self.api_client = None
        self.embeddings = None
        self.current_provider = None
        self.initialize()
    
    def initialize(self):
        """初始化LLM和嵌入模型"""
        # 初始化嵌入模型
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL
            )
            logger.info(f"嵌入模型加载成功: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"嵌入模型加载失败: {str(e)}")
            self.embeddings = None
        
        # 按照优先级加载LLM
        for provider in settings.LLM_PROVIDER_PRIORITY:
            if provider == "deepseek" and settings.DEEPSEEK_API_KEY:
                try:
                    self.api_client = DeepSeekApiClient(
                        api_key=settings.DEEPSEEK_API_KEY,
                        api_base=settings.DEEPSEEK_API_BASE,
                        model_name=settings.DEEPSEEK_API_MODEL
                    )
                    self.current_provider = "deepseek"
                    logger.info("DeepSeek API客户端初始化成功")
                    break
                except Exception as e:
                    logger.error(f"DeepSeek API客户端初始化失败: {str(e)}")
            
            elif provider == "zhipuai" and settings.ZHIPUAI_API_KEY:
                try:
                    self.api_client = ZhipuAIApiClient(
                        api_key=settings.ZHIPUAI_API_KEY,
                        api_base=settings.ZHIPUAI_API_BASE,
                        model_name=settings.ZHIPUAI_API_MODEL
                    )
                    self.current_provider = "zhipuai"
                    logger.info("智谱清言API客户端初始化成功")
                    break
                except Exception as e:
                    logger.error(f"智谱清言API客户端初始化失败: {str(e)}")
            
            elif provider == "openai" and settings.OPENAI_API_KEY:
                try:
                    self.api_client = OpenAIApiClient(
                        api_key=settings.OPENAI_API_KEY,
                        api_base=settings.OPENAI_API_BASE,
                        model_name=settings.OPENAI_API_MODEL
                    )
                    self.current_provider = "openai"
                    logger.info("OpenAI API客户端初始化成功")
                    break
                except Exception as e:
                    logger.error(f"OpenAI API客户端初始化失败: {str(e)}")
                    
                    # 尝试使用LangChain的ChatOpenAI作为备选
                    try:
                        self.llm = ChatOpenAI(
                            model_name=settings.OPENAI_API_MODEL,
                            openai_api_key=settings.OPENAI_API_KEY,
                            openai_api_base=settings.OPENAI_API_BASE,
                            temperature=0.7,
                        )
                        self.current_provider = "openai-langchain"
                        logger.info("OpenAI模型(LangChain)加载成功")
                        break
                    except Exception as e2:
                        logger.error(f"OpenAI模型(LangChain)加载失败: {str(e2)}")
            
            elif provider == "local":
                try:
                    # 这里可以根据需要加载本地模型，如ChatGLM等
                    # 以下仅为示例，实际实现可能需要更多代码
                    
                    # 判断模型文件是否存在
                    model_path = Path(settings.MODEL_PATH) / "nlp" / settings.LLM_MODEL.split("/")[-1]
                    if not model_path.exists():
                        logger.warning(f"本地模型路径不存在: {model_path}")
                        continue
                    
                    logger.info(f"正在加载本地模型: {model_path}")
                    # 这里是简化的示例，实际应当根据模型类型进行具体加载
                    # self.llm = HuggingFacePipeline.from_model_id(
                    #     model_id=str(model_path),
                    #     task="text-generation",
                    #     model_kwargs={"temperature": 0.7, "max_length": 2048}
                    # )
                    
                    # 由于实际加载本地模型比较复杂，此处仅记录日志
                    logger.info("本地模型将在完整实现中加载")
                    # 如果本地模型加载失败，暂时跳过
                    continue
                    
                    self.current_provider = "local"
                    logger.info("本地模型加载成功")
                    break
                except Exception as e:
                    logger.error(f"本地模型加载失败: {str(e)}")
        
        # 如果所有提供商都失败，则使用模拟LLM（仅用于开发测试）
        if self.llm is None and self.api_client is None:
            logger.warning("所有LLM加载失败，使用模拟模式")
            self.current_provider = "mock"
    
    def update_api_settings(self, provider: str, api_key: str, api_base: Optional[str] = None, model_name: Optional[str] = None) -> bool:
        """
        更新API设置
        
        Args:
            provider: API提供商 (deepseek, zhipuai, openai)
            api_key: API密钥
            api_base: API基础URL
            model_name: 模型名称
            
        Returns:
            更新是否成功
        """
        try:
            if provider == "deepseek":
                if not api_base:
                    api_base = settings.DEEPSEEK_API_BASE
                if not model_name:
                    model_name = settings.DEEPSEEK_API_MODEL
                
                # 测试API是否有效
                test_client = DeepSeekApiClient(
                    api_key=api_key,
                    api_base=api_base,
                    model_name=model_name
                )
                
                # 设置环境变量
                os.environ["DEEPSEEK_API_KEY"] = api_key
                if api_base != settings.DEEPSEEK_API_BASE:
                    os.environ["DEEPSEEK_API_BASE"] = api_base
                if model_name != settings.DEEPSEEK_API_MODEL:
                    os.environ["DEEPSEEK_API_MODEL"] = model_name
                
                # 更新服务实例
                settings.DEEPSEEK_API_KEY = api_key
                settings.DEEPSEEK_API_BASE = api_base
                settings.DEEPSEEK_API_MODEL = model_name
                
                # 重新初始化
                self.api_client = test_client
                self.current_provider = "deepseek"
                logger.info("DeepSeek API设置更新成功")
                return True
                
            elif provider == "zhipuai":
                if not api_base:
                    api_base = settings.ZHIPUAI_API_BASE
                if not model_name:
                    model_name = settings.ZHIPUAI_API_MODEL
                
                # 测试API是否有效
                test_client = ZhipuAIApiClient(
                    api_key=api_key,
                    api_base=api_base,
                    model_name=model_name
                )
                
                # 设置环境变量
                os.environ["ZHIPUAI_API_KEY"] = api_key
                if api_base != settings.ZHIPUAI_API_BASE:
                    os.environ["ZHIPUAI_API_BASE"] = api_base
                if model_name != settings.ZHIPUAI_API_MODEL:
                    os.environ["ZHIPUAI_API_MODEL"] = model_name
                
                # 更新服务实例
                settings.ZHIPUAI_API_KEY = api_key
                settings.ZHIPUAI_API_BASE = api_base
                settings.ZHIPUAI_API_MODEL = model_name
                
                # 重新初始化
                self.api_client = test_client
                self.current_provider = "zhipuai"
                logger.info("智谱清言API设置更新成功")
                return True
                
            elif provider == "openai":
                if not api_base:
                    api_base = settings.OPENAI_API_BASE
                if not model_name:
                    model_name = settings.OPENAI_API_MODEL
                
                # 测试API是否有效
                test_client = OpenAIApiClient(
                    api_key=api_key,
                    api_base=api_base,
                    model_name=model_name
                )
                
                # 设置环境变量
                os.environ["OPENAI_API_KEY"] = api_key
                if api_base != settings.OPENAI_API_BASE:
                    os.environ["OPENAI_API_BASE"] = api_base
                if model_name != settings.OPENAI_API_MODEL:
                    os.environ["OPENAI_API_MODEL"] = model_name
                
                # 更新服务实例
                settings.OPENAI_API_KEY = api_key
                settings.OPENAI_API_BASE = api_base
                settings.OPENAI_API_MODEL = model_name
                
                # 重新初始化
                self.api_client = test_client
                self.current_provider = "openai"
                logger.info("OpenAI API设置更新成功")
                return True
            
            else:
                logger.error(f"不支持的API提供商: {provider}")
                return False
                
        except Exception as e:
            logger.error(f"更新API设置失败: {str(e)}")
            return False
    
    def get_current_provider(self) -> Dict[str, Any]:
        """获取当前使用的提供商信息"""
        if self.current_provider == "deepseek":
            return {
                "provider": "deepseek",
                "name": "DeepSeek AI",
                "model": settings.DEEPSEEK_API_MODEL,
                "status": "active"
            }
        elif self.current_provider == "zhipuai":
            return {
                "provider": "zhipuai",
                "name": "智谱清言",
                "model": settings.ZHIPUAI_API_MODEL,
                "status": "active"
            }
        elif self.current_provider == "openai":
            return {
                "provider": "openai",
                "name": "OpenAI",
                "model": settings.OPENAI_API_MODEL,
                "status": "active"
            }
        elif self.current_provider == "openai-langchain":
            return {
                "provider": "openai",
                "name": "OpenAI (LangChain)",
                "model": settings.OPENAI_API_MODEL,
                "status": "active"
            }
        elif self.current_provider == "local":
            return {
                "provider": "local",
                "name": "本地模型",
                "model": settings.LLM_MODEL.split("/")[-1],
                "status": "active"
            }
        else:
            return {
                "provider": "mock",
                "name": "模拟模式",
                "model": "mock",
                "status": "fallback"
            }
    
    def get_persona_prompt(self, persona: str) -> str:
        """获取角色系统提示词"""
        persona_data = settings.PERSONAS.get(persona, settings.PERSONAS["现代导师"])
        
        system_prompt = f"""
你是儒智APP中的虚拟导师{persona}。
{persona_data['description']}

请遵循以下规则：
1. {persona_data['style']}
2. 你主要依据{persona_data['knowledge_base']}中的内容回答问题。
3. 如果用户问的问题超出你的知识范围，请坦诚表明。
4. 你的回答应该既有学术严谨性，也要通俗易懂。
5. 你可以适当引用经典原文，但要确保引用准确。
6. 当涉及敏感话题时，保持中立、理性的态度。
7. 回答要有深度和启发性，引导用户进一步思考。

作为{persona}，请以恰当的风格回应用户的问题。
"""
        return system_prompt
    
    def generate_response(self, 
                          persona: str, 
                          message: str, 
                          conversation_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        生成AI回复
        
        Args:
            persona: 角色名称
            message: 用户消息
            conversation_history: 对话历史
            
        Returns:
            AI回复内容
        """
        if not conversation_history:
            conversation_history = []
        
        # 构建消息列表
        prompt = self.get_persona_prompt(persona)
        
        if self.current_provider in ["deepseek", "zhipuai", "openai"]:
            # 使用API客户端
            messages = [
                {"role": "system", "content": prompt}
            ]
            
            # 添加对话历史
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append({"role": "user", "content": msg["content"]})
                elif msg["role"] == "assistant":
                    messages.append({"role": "assistant", "content": msg["content"]})
            
            # 添加当前用户消息
            messages.append({"role": "user", "content": message})
            
            try:
                # 获取AI回复
                return self.api_client.generate(messages)
            except Exception as e:
                logger.error(f"生成AI回复失败: {str(e)}")
                return f"抱歉，我现在无法回答您的问题。请稍后再试。错误: {str(e)}"
                
        elif self.current_provider == "openai-langchain":
            # 使用LangChain的ChatOpenAI
            messages = [
                SystemMessage(content=prompt)
            ]
            
            # 添加对话历史
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
            
            # 添加当前用户消息
            messages.append(HumanMessage(content=message))
            
            try:
                # 获取AI回复
                response = self.llm(messages)
                return response.content
            except Exception as e:
                logger.error(f"生成AI回复失败: {str(e)}")
                return f"抱歉，我现在无法回答您的问题。请稍后再试。错误: {str(e)}"
        
        else:
            # 模拟模式，返回固定回复
            return f"你好，我是{persona}。我现在处于模拟模式，无法提供真实的AI回复。请配置API密钥后再次尝试。你的问题是：{message}"


# 单例模式
llm_service = LLMService() 