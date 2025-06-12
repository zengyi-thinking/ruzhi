"""
AI服务模块 - 集成DeepSeek API
"""
import requests
import time
import random
import hashlib
from datetime import datetime
from typing import Dict, List, Any
import logging

from config.settings import AI_API_CONFIG, API_RATE_LIMIT, CACHE_CONFIG
from models.data_storage import api_config_storage, api_stats, api_cache, rate_limit_tracker

logger = logging.getLogger(__name__)

class RealAIService:
    """真实AI服务类 - 集成DeepSeek API"""

    @staticmethod
    def check_rate_limit(user_id: str) -> bool:
        """检查API调用频率限制"""
        current_time = time.time()
        current_minute = int(current_time // 60)
        current_hour = int(current_time // 3600)

        if user_id not in rate_limit_tracker:
            rate_limit_tracker[user_id] = {
                'minute_requests': {},
                'hour_requests': {}
            }

        user_limits = rate_limit_tracker[user_id]

        # 检查每分钟限制
        minute_count = user_limits['minute_requests'].get(current_minute, 0)
        if minute_count >= API_RATE_LIMIT['max_requests_per_minute']:
            return False

        # 检查每小时限制
        hour_count = user_limits['hour_requests'].get(current_hour, 0)
        if hour_count >= API_RATE_LIMIT['max_requests_per_hour']:
            return False

        # 更新计数
        user_limits['minute_requests'][current_minute] = minute_count + 1
        user_limits['hour_requests'][current_hour] = hour_count + 1

        # 清理过期数据
        RealAIService._cleanup_rate_limit_data(user_limits, current_minute, current_hour)

        return True

    @staticmethod
    def _cleanup_rate_limit_data(user_limits: dict, current_minute: int, current_hour: int):
        """清理过期的频率限制数据"""
        # 清理超过1分钟的数据
        expired_minutes = [m for m in user_limits['minute_requests'].keys() if m < current_minute - 1]
        for m in expired_minutes:
            del user_limits['minute_requests'][m]

        # 清理超过1小时的数据
        expired_hours = [h for h in user_limits['hour_requests'].keys() if h < current_hour - 1]
        for h in expired_hours:
            del user_limits['hour_requests'][h]

    @staticmethod
    def get_cache_key(prompt: str, character: str = None) -> str:
        """生成缓存键"""
        content = f"{prompt}_{character or 'default'}"
        return hashlib.md5(content.encode()).hexdigest()

    @staticmethod
    def get_from_cache(cache_key: str) -> dict:
        """从缓存获取结果"""
        if not CACHE_CONFIG['enabled']:
            return None

        if cache_key in api_cache:
            cached_data = api_cache[cache_key]
            # 检查是否过期
            if time.time() - cached_data['timestamp'] < CACHE_CONFIG['ttl']:
                return cached_data['data']
            else:
                del api_cache[cache_key]

        return None

    @staticmethod
    def save_to_cache(cache_key: str, data: dict):
        """保存到缓存"""
        if not CACHE_CONFIG['enabled']:
            return

        # 如果缓存已满，删除最旧的条目
        if len(api_cache) >= CACHE_CONFIG['max_size']:
            oldest_key = min(api_cache.keys(), key=lambda k: api_cache[k]['timestamp'])
            del api_cache[oldest_key]

        api_cache[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }

    @staticmethod
    def call_deepseek_api(messages: list, character: str = None) -> dict:
        """调用DeepSeek API"""
        try:
            # 使用配置存储中的API设置
            config = {
                'api_key': api_config_storage.get('apiKey') or AI_API_CONFIG['deepseek']['api_key'],
                'base_url': api_config_storage.get('baseUrl') or AI_API_CONFIG['deepseek']['base_url'],
                'model': api_config_storage.get('model') or AI_API_CONFIG['deepseek']['model'],
                'max_tokens': api_config_storage.get('maxTokens') or AI_API_CONFIG['deepseek']['max_tokens'],
                'temperature': api_config_storage.get('temperature') or AI_API_CONFIG['deepseek']['temperature']
            }

            # 构建请求头
            headers = {
                'Authorization': f'Bearer {config["api_key"]}',
                'Content-Type': 'application/json'
            }

            # 构建请求数据
            request_data = {
                'model': config['model'],
                'messages': messages,
                'max_tokens': config['max_tokens'],
                'temperature': config['temperature'],
                'stream': False
            }

            # 记录请求开始时间
            start_time = time.time()

            # 发送请求
            response = requests.post(
                f"{config['base_url']}/chat/completions",
                headers=headers,
                json=request_data,
                timeout=config.get('timeout', 30)
            )

            # 计算响应时间
            response_time = int((time.time() - start_time) * 1000)

            # 更新统计数据
            RealAIService._update_api_stats(True, response_time)

            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'content': result['choices'][0]['message']['content'],
                    'usage': result.get('usage', {}),
                    'model': result.get('model', config['model']),
                    'response_time': response_time
                }
            else:
                logger.error(f"DeepSeek API错误: {response.status_code} - {response.text}")
                RealAIService._update_api_stats(False, response_time)
                return {
                    'success': False,
                    'error': f'API调用失败: {response.status_code}',
                    'fallback': True
                }

        except requests.exceptions.Timeout:
            logger.error("DeepSeek API调用超时")
            RealAIService._update_api_stats(False, 0)
            return {
                'success': False,
                'error': 'API调用超时',
                'fallback': True
            }
        except Exception as e:
            logger.error(f"DeepSeek API调用异常: {str(e)}")
            RealAIService._update_api_stats(False, 0)
            return {
                'success': False,
                'error': f'API调用异常: {str(e)}',
                'fallback': True
            }

    @staticmethod
    def _update_api_stats(success: bool, response_time: int):
        """更新API统计数据"""
        today = datetime.now().date()

        # 更新总请求数
        api_stats['totalRequests'] += 1

        # 更新成功/失败计数
        if success:
            api_stats['successfulRequests'] += 1
            api_stats['totalResponseTime'] += response_time
        else:
            api_stats['failedRequests'] += 1

        # 更新今日请求数
        if api_stats['lastRequestDate'] != today:
            api_stats['todayRequests'] = 1
            api_stats['lastRequestDate'] = today
        else:
            api_stats['todayRequests'] += 1

    @staticmethod
    def _get_related_concepts(concept_name: str) -> list:
        """获取相关概念"""
        concept_relations = {
            '仁': ['义', '礼', '智', '信'],
            '义': ['仁', '礼', '信', '勇'],
            '礼': ['仁', '义', '乐', '文'],
            '智': ['仁', '义', '学', '思'],
            '信': ['仁', '义', '诚', '忠'],
            '道': ['德', '自然', '无为', '阴阳'],
            '德': ['道', '仁', '义', '善']
        }
        return concept_relations.get(concept_name, [])

    @staticmethod
    def _get_concept_category(concept_name: str) -> str:
        """获取概念分类"""
        categories = {
            '仁': '儒家核心概念',
            '义': '儒家核心概念', 
            '礼': '儒家核心概念',
            '智': '儒家核心概念',
            '信': '儒家核心概念',
            '道': '道家核心概念',
            '德': '道家核心概念',
            '自然': '道家核心概念',
            '无为': '道家核心概念'
        }
        return categories.get(concept_name, '传统文化概念')

    @staticmethod
    def generate_character_response(user_message: str, character_id: str, conversation_history: list = None, settings: dict = None) -> dict:
        """生成AI人物回复"""
        user_id = 'default_user'  # 可以从请求中获取

        # 检查频率限制
        if not RealAIService.check_rate_limit(user_id):
            return {
                'success': False,
                'error': '请求过于频繁，请稍后再试',
                'fallback': True
            }

        # 检查缓存
        cache_key = RealAIService.get_cache_key(user_message, character_id)
        cached_result = RealAIService.get_from_cache(cache_key)
        if cached_result:
            logger.info(f"从缓存返回结果: {cache_key}")
            return cached_result

        # 构建人物设定 - 优化版本
        character_prompts = {
            'confucius': {
                'name': '孔子',
                'title': '至圣先师',
                'era': '春秋时期（公元前551-479年）',
                'core_concepts': ['仁', '礼', '义', '智', '信', '恕'],
                'personality': '温和谦逊、循循善诱、重视教育、强调道德修养',
                'speaking_style': '语言温和而有力，善用生活化的比喻，常引用《诗经》等典籍，喜欢通过提问引导思考',
                'philosophical_focus': '强调仁爱、礼制、教育的重要性，主张"有教无类"，重视个人品德修养',
                'typical_expressions': ['学而时习之', '有朋自远方来', '己所不欲，勿施于人', '温故而知新'],
                'background': '儒家学派创始人，中国古代最伟大的思想家、教育家之一'
            },
            'laozi': {
                'name': '老子',
                'title': '道德天尊',
                'era': '春秋时期（约公元前6世纪）',
                'core_concepts': ['道', '德', '无为', '自然', '阴阳', '虚静'],
                'personality': '深邃超脱、淡泊名利、崇尚自然、富有哲理智慧',
                'speaking_style': '言简意赅，善用悖论和对比，语言充满诗意和哲理，常用自然现象作比喻',
                'philosophical_focus': '强调"道法自然"、"无为而治"，主张顺应自然规律，追求内心的宁静与和谐',
                'typical_expressions': ['道可道，非常道', '无为而无不为', '上善若水', '知足常乐'],
                'background': '道家学派创始人，《道德经》作者，中国古代哲学的重要奠基人'
            },
            'mencius': {
                'name': '孟子',
                'title': '亚圣',
                'era': '战国时期（公元前372-289年）',
                'core_concepts': ['性善论', '仁政', '民本', '浩然之气', '四端'],
                'personality': '正直刚毅、雄辩有力、富有正义感、关心民生',
                'speaking_style': '雄辩滔滔，善用排比和反问，逻辑严密，常用生动的比喻说理',
                'philosophical_focus': '发展儒家思想，提出性善论，强调仁政和民本思想，主张君主应以德治国',
                'typical_expressions': ['人之初，性本善', '民为贵，社稷次之，君为轻', '富贵不能淫，贫贱不能移'],
                'background': '儒家重要代表人物，被尊称为"亚圣"，对儒家思想发展贡献巨大'
            },
            'zhuxi': {
                'name': '朱熹',
                'title': '理学大师',
                'era': '南宋时期（1130-1200年）',
                'core_concepts': ['理', '气', '格物致知', '存天理，灭人欲', '四书'],
                'personality': '严谨治学、博学深思、理性分析、注重实证',
                'speaking_style': '逻辑清晰，条理分明，善于分析和论证，语言精确，注重概念的准确性',
                'philosophical_focus': '集理学之大成，强调"理"的至上性，主张通过格物致知达到对天理的认识',
                'typical_expressions': ['格物致知', '存天理，灭人欲', '理一分殊', '知行并进'],
                'background': '宋代理学集大成者，对《四书》的注释成为后世科举考试的标准'
            },
            'wangyangming': {
                'name': '王阳明',
                'title': '心学宗师',
                'era': '明代时期（1472-1529年）',
                'core_concepts': ['心即理', '知行合一', '致良知', '格物'],
                'personality': '豁达开朗、注重实践、强调直觉、追求内心觉悟',
                'speaking_style': '简明直接，深入浅出，善于用日常事例说明深刻道理，强调内心体验',
                'philosophical_focus': '创立心学，强调"心即理"，主张通过内心的良知来认识和实践道德',
                'typical_expressions': ['心即理也', '知行合一', '致良知', '此心不动，随机而动'],
                'background': '明代心学创始人，既是哲学家又是军事家、政治家，强调知行合一的实践哲学'
            }
        }

        character_info = character_prompts.get(character_id, character_prompts['confucius'])

        # 构建优化的系统提示
        core_concepts_str = '、'.join(character_info['core_concepts'])
        typical_expressions_str = '、'.join(character_info['typical_expressions'])

        system_prompt = f"""你是{character_info['name']}（{character_info['title']}），生活在{character_info['era']}，{character_info['background']}。

【人物特征】
- 性格特点：{character_info['personality']}
- 表达风格：{character_info['speaking_style']}
- 核心理念：{core_concepts_str}
- 哲学重点：{character_info['philosophical_focus']}
- 常用表达：{typical_expressions_str}

【对话要求】
1. 严格按照{character_info['name']}的思想体系和表达方式回答
2. 体现{character_info['era']}的时代特色和文化背景
3. 适当引用你的经典语句和思想观点
4. 语言要有古典韵味，但要让现代人能够理解
5. 回答要有深度和启发性，体现传统文化智慧
6. 可以结合具体事例或比喻来阐述观点
7. 保持谦逊和教育者的姿态

【回答格式】
- 字数控制在200-500字之间
- 语言要符合{character_info['name']}的身份和时代
- 要有逻辑性和条理性
- 结尾可以给出实践建议或进一步思考的方向

请以{character_info['name']}的身份，用你的智慧和见解来回答用户的问题。"""

        # 构建对话消息
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message}
        ]

        # 添加对话历史（最近3轮）
        if conversation_history:
            recent_history = conversation_history[-6:]  # 最近3轮对话
            for msg in recent_history:
                messages.append({
                    'role': msg.get('role', 'user'),
                    'content': msg.get('content', '')
                })
            messages.append({'role': 'user', 'content': user_message})

        # 调用AI API
        api_result = RealAIService.call_deepseek_api(messages, character_id)

        if api_result['success']:
            # 生成思考过程（模拟）
            thinking_process = RealAIService._generate_thinking_process(user_message, character_info)

            result = {
                'success': True,
                'reply': api_result['content'],
                'thinking': thinking_process,
                'character': character_info['name'],
                'confidence': random.uniform(0.85, 0.98),
                'timestamp': datetime.now().isoformat(),
                'usage': api_result.get('usage', {}),
                'source': 'deepseek_api'
            }

            # 保存到缓存
            RealAIService.save_to_cache(cache_key, result)

            return result

        elif api_result.get('fallback'):
            # API失败时使用备用回复
            return RealAIService._generate_fallback_response(user_message, character_info)

        else:
            return api_result

    @staticmethod
    def _generate_thinking_process(user_message: str, character_info: dict) -> str:
        """生成思考过程（简化版）"""
        thinking_templates = [
            f"从{character_info['name']}的角度来看，这个问题涉及到...",
            f"结合{character_info['era']}的时代背景，我认为...",
            f"根据{character_info['core_concepts'][0]}的理念，这个问题...",
            f"这让我想起了{character_info['typical_expressions'][0]}这句话..."
        ]

        return random.choice(thinking_templates)

    @staticmethod
    def _generate_fallback_response(user_message: str, character_info: dict) -> dict:
        """生成备用回复"""
        fallback_responses = {
            'confucius': "学而时习之，不亦说乎？您提出的问题很有深度，需要我们从仁爱的角度来思考。在儒家思想中，我们强调修身齐家治国平天下，您的问题正体现了这种思辨精神。",
            'laozi': "道可道，非常道。您的问题触及了道的本质，需要我们以无为的心境来体悟。正如水善利万物而不争，我们应该顺应自然，在宁静中寻找答案。",
            'mencius': "人之初，性本善。您的疑问反映了对人性的思考，这正是我们需要深入探讨的。通过培养浩然之气，我们可以更好地理解这个问题的本质。",
            'zhuxi': "格物致知，诚意正心。您的问题需要我们通过理性分析来解答。在理学的框架下，我们要存天理，去人欲，通过格物来达到对真理的认识。",
            'wangyangming': "知行合一，致良知。您的问题很好地体现了理论与实践的关系。我们要通过内心的良知来指导行动，在实践中验证和完善我们的认识。"
        }

        reply = fallback_responses.get(character_info.get('name', '').lower().replace(' ', ''),
                                     fallback_responses['confucius'])

        return {
            'success': True,
            'reply': reply,
            'thinking': f"这是一个很有意思的问题，让我从{character_info['name']}的角度来思考...",
            'character': character_info['name'],
            'confidence': 0.75,
            'timestamp': datetime.now().isoformat(),
            'source': 'fallback_response'
        }
