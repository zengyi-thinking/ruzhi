"""
真实AI服务模块
集成DeepSeek、OpenAI等真实AI模型，提供智能化对话服务
"""
import json
import time
import asyncio
import aiohttp
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
import logging

from config.settings import AI_API_CONFIG
from utils.logging_config import get_logger, business_logger
from services.enhanced_knowledge_service import enhanced_knowledge_service

logger = get_logger('real_ai_service')

class AIModelProvider:
    """AI模型提供者基类"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.base_url = config.get('base_url')
        self.api_key = config.get('api_key')
        self.model = config.get('model')
        self.max_tokens = config.get('max_tokens', 2000)
        self.temperature = config.get('temperature', 0.7)
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                              stream: bool = False) -> Dict[str, Any]:
        """生成AI回复"""
        raise NotImplementedError
    
    async def generate_stream_response(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """生成流式AI回复"""
        raise NotImplementedError

class DeepSeekProvider(AIModelProvider):
    """DeepSeek AI模型提供者"""
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                              stream: bool = False) -> Dict[str, Any]:
        """生成DeepSeek回复"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature,
                'stream': stream
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'{self.base_url}/chat/completions',
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            'success': True,
                            'content': result['choices'][0]['message']['content'],
                            'usage': result.get('usage', {}),
                            'model': self.model
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"DeepSeek API错误: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f'API调用失败: {response.status}'
                        }
                        
        except Exception as e:
            logger.error(f"DeepSeek API调用异常: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def generate_stream_response(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """生成DeepSeek流式回复"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature,
                'stream': True
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'{self.base_url}/chat/completions',
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        async for line in response.content:
                            line = line.decode('utf-8').strip()
                            if line.startswith('data: '):
                                data = line[6:]
                                if data == '[DONE]':
                                    break
                                try:
                                    chunk = json.loads(data)
                                    if 'choices' in chunk and len(chunk['choices']) > 0:
                                        delta = chunk['choices'][0].get('delta', {})
                                        if 'content' in delta:
                                            yield delta['content']
                                except json.JSONDecodeError:
                                    continue
                    else:
                        error_text = await response.text()
                        logger.error(f"DeepSeek流式API错误: {response.status} - {error_text}")
                        yield f"[错误: API调用失败 {response.status}]"
                        
        except Exception as e:
            logger.error(f"DeepSeek流式API调用异常: {e}")
            yield f"[错误: {str(e)}]"

class OpenAIProvider(AIModelProvider):
    """OpenAI模型提供者"""
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                              stream: bool = False) -> Dict[str, Any]:
        """生成OpenAI回复"""
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.max_tokens,
                'temperature': self.temperature,
                'stream': stream
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            'success': True,
                            'content': result['choices'][0]['message']['content'],
                            'usage': result.get('usage', {}),
                            'model': self.model
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"OpenAI API错误: {response.status} - {error_text}")
                        return {
                            'success': False,
                            'error': f'API调用失败: {response.status}'
                        }
                        
        except Exception as e:
            logger.error(f"OpenAI API调用异常: {e}")
            return {
                'success': False,
                'error': str(e)
            }

class MockProvider(AIModelProvider):
    """模拟AI提供者（用于测试和备用）"""
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                              stream: bool = False) -> Dict[str, Any]:
        """生成模拟回复"""
        # 模拟API延迟
        await asyncio.sleep(0.5)
        
        # 基于最后一条消息生成回复
        last_message = messages[-1]['content'] if messages else ""
        
        # 简单的回复生成逻辑
        if '仁' in last_message:
            response = "仁者爱人，这是孔子思想的核心。仁不仅是一种品德，更是一种生活态度。在现代社会，我们可以通过关爱他人、承担社会责任来践行仁的精神。"
        elif '道' in last_message:
            response = "道法自然，这是老子的核心思想。道是宇宙万物的本源，我们应该顺应自然规律，保持内心的平静与和谐。"
        elif '学习' in last_message:
            response = "学而时习之，不亦说乎？学习是一个持续的过程，需要不断地复习和实践。重要的是保持好奇心和求知欲。"
        else:
            response = "您提出的问题很有意义。传统文化博大精深，每个概念都蕴含着深刻的智慧。让我们一起探讨这个话题。"
        
        return {
            'success': True,
            'content': response,
            'usage': {'total_tokens': len(response)},
            'model': 'mock-model'
        }
    
    async def generate_stream_response(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """生成模拟流式回复"""
        response = await self.generate_response(messages)
        if response['success']:
            content = response['content']
            # 模拟打字效果
            for i in range(0, len(content), 2):
                yield content[i:i+2]
                await asyncio.sleep(0.05)

class RealAIService:
    """真实AI服务管理器"""
    
    def __init__(self):
        self.providers = {}
        self.default_provider = 'mock'  # 默认使用模拟提供者
        self._initialize_providers()
    
    def _initialize_providers(self):
        """初始化AI提供者"""
        try:
            # 初始化DeepSeek提供者
            if AI_API_CONFIG.get('deepseek', {}).get('api_key'):
                self.providers['deepseek'] = DeepSeekProvider(AI_API_CONFIG['deepseek'])
                self.default_provider = 'deepseek'
                logger.info("DeepSeek提供者初始化成功")
            
            # 初始化OpenAI提供者
            if AI_API_CONFIG.get('openai', {}).get('api_key'):
                self.providers['openai'] = OpenAIProvider(AI_API_CONFIG['openai'])
                if self.default_provider == 'mock':
                    self.default_provider = 'openai'
                logger.info("OpenAI提供者初始化成功")
            
            # 总是初始化模拟提供者作为备用
            self.providers['mock'] = MockProvider({'model': 'mock-model'})
            
            logger.info(f"AI服务初始化完成，可用提供者: {list(self.providers.keys())}")
            logger.info(f"默认提供者: {self.default_provider}")
            
        except Exception as e:
            logger.error(f"AI提供者初始化失败: {e}")
            # 确保至少有模拟提供者可用
            self.providers = {'mock': MockProvider({'model': 'mock-model'})}
            self.default_provider = 'mock'
    
    def get_provider(self, provider_name: str = None) -> AIModelProvider:
        """获取AI提供者"""
        provider_name = provider_name or self.default_provider
        return self.providers.get(provider_name, self.providers['mock'])
    
    async def generate_response(self, messages: List[Dict[str, str]], 
                              provider: str = None, stream: bool = False) -> Dict[str, Any]:
        """生成AI回复"""
        try:
            ai_provider = self.get_provider(provider)
            start_time = time.time()
            
            result = await ai_provider.generate_response(messages, stream)
            
            # 记录API调用信息
            processing_time = time.time() - start_time
            logger.info(f"AI API调用完成: 提供者={provider or self.default_provider}, "
                       f"耗时={processing_time:.3f}秒, 成功={result['success']}")
            
            if result['success']:
                result['processing_time'] = processing_time
                result['provider'] = provider or self.default_provider
            
            return result
            
        except Exception as e:
            logger.error(f"AI回复生成失败: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def generate_stream_response(self, messages: List[Dict[str, str]], 
                                     provider: str = None) -> AsyncGenerator[str, None]:
        """生成流式AI回复"""
        try:
            ai_provider = self.get_provider(provider)
            async for chunk in ai_provider.generate_stream_response(messages):
                yield chunk
                
        except Exception as e:
            logger.error(f"AI流式回复生成失败: {e}")
            yield f"[错误: {str(e)}]"
    
    def get_available_providers(self) -> List[str]:
        """获取可用的AI提供者列表"""
        return list(self.providers.keys())
    
    def get_provider_info(self) -> Dict[str, Any]:
        """获取提供者信息"""
        return {
            'available_providers': self.get_available_providers(),
            'default_provider': self.default_provider,
            'provider_configs': {
                name: {
                    'model': provider.model,
                    'max_tokens': provider.max_tokens,
                    'temperature': provider.temperature
                }
                for name, provider in self.providers.items()
            }
        }

# 全局真实AI服务实例
real_ai_service = RealAIService()
