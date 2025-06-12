"""
儒智后端API服务
基于Flask框架，提供智能历史分析、个性化推荐等功能
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import random
import uuid
import os
import requests
import time
from typing import Dict, List, Any

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置日志
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI API 配置
AI_API_CONFIG = {
    'deepseek': {
        'base_url': 'https://api.deepseek.com/v1',
        'api_key': os.getenv('DEEPSEEK_API_KEY', 'sk-your-api-key-here'),
        'model': 'deepseek-chat',
        'max_tokens': 2000,
        'temperature': 0.7
    }
}

# API调用限制配置
API_RATE_LIMIT = {
    'max_requests_per_minute': 20,
    'max_requests_per_hour': 100
}

# 缓存配置
CACHE_CONFIG = {
    'enabled': True,
    'ttl': 3600,  # 1小时
    'max_size': 1000
}

# 简单的内存缓存
api_cache = {}
rate_limit_tracker = {}

# API配置存储
api_config_storage = {
    'apiKey': '',
    'baseUrl': 'https://api.deepseek.com/v1',
    'model': 'deepseek-chat',
    'temperature': 0.7,
    'maxTokens': 2000,
    'timeout': 30
}

# API统计数据
api_stats = {
    'totalRequests': 0,
    'successfulRequests': 0,
    'failedRequests': 0,
    'totalResponseTime': 0,
    'todayRequests': 0,
    'lastRequestDate': None
}

# 错误处理
@app.errorhandler(404)
def not_found(error):
    """处理404错误"""
    return jsonify({
        "success": False,
        "error": "接口不存在",
        "message": "请检查请求URL是否正确",
        "available_endpoints": "访问根路径 / 查看可用接口列表"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """处理500错误"""
    return jsonify({
        "success": False,
        "error": "服务器内部错误",
        "message": "请稍后重试或联系管理员"
    }), 500

@app.errorhandler(400)
def bad_request(error):
    """处理400错误"""
    return jsonify({
        "success": False,
        "error": "请求参数错误",
        "message": "请检查请求参数格式和内容"
    }), 400

# 请求日志中间件
@app.before_request
def log_request_info():
    """记录请求信息"""
    logger.info(f"请求: {request.method} {request.url} - IP: {request.remote_addr}")

@app.after_request
def log_response_info(response):
    """记录响应信息"""
    logger.info(f"响应: {response.status_code} - {request.method} {request.url}")
    return response

# 模拟数据存储
users_data = {}
learning_history = {}
conversation_history = {}

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
        import hashlib
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
            f"根据{character_info['background']}的思想体系，我需要考虑...",
            f"结合传统文化的智慧，这个问题的核心在于...",
            f"以{character_info['name']}的人生阅历，我认为..."
        ]

        return random.choice(thinking_templates)

    @staticmethod
    def _generate_fallback_response(user_message: str, character_info: dict) -> dict:
        """生成备用回复"""
        fallback_responses = {
            'confucius': "学而时习之，不亦说乎？您提出的问题很有深度，需要我们从仁爱的角度来思考。在儒家思想中，我们强调修身齐家治国平天下，您的问题正体现了这种思辨精神。",
            'laozi': "道可道，非常道。您的问题触及了事物的本质。在道家看来，万事万物都有其自然的规律，我们需要以无为而治的心态来理解和应对。",
            'mencius': "人之初，性本善。您的疑问反映了对人性和社会的深入思考。从性善论的角度来看，我们应该相信人的本性是善良的，关键在于如何培养和引导。",
            'zhuxi': "格物致知，诚意正心。您的问题需要我们运用理学的方法来分析。通过深入研究事物的本质，我们可以获得真正的知识和智慧。",
            'wangyangming': "知行合一，心即理也。您的思考很有价值。在心学看来，真正的智慧来自于内心的体悟和实践的结合，理论与行动不可分离。"
        }

        # 构建人物设定映射
        character_prompts = {
            'confucius': {'name': '孔子'},
            'laozi': {'name': '老子'},
            'mencius': {'name': '孟子'},
            'zhuxi': {'name': '朱熹'},
            'wangyangming': {'name': '王阳明'}
        }

        character_id = next((k for k, v in character_prompts.items() if v['name'] == character_info['name']), 'confucius')

        return {
            'success': True,
            'reply': fallback_responses.get(character_id, fallback_responses['confucius']),
            'thinking': f"虽然无法连接到AI服务，但我依然可以从{character_info['name']}的角度为您提供一些思考...",
            'character': character_info['name'],
            'confidence': 0.75,
            'timestamp': datetime.now().isoformat(),
            'source': 'fallback_response'
        }

class AIAnalysisService:
    """AI分析服务类"""
    
    @staticmethod
    def analyze_learning_patterns(user_id: str, history_data: List[Dict]) -> Dict[str, Any]:
        """分析学习模式"""
        if not history_data:
            return {
                "insights": [],
                "strengths": [],
                "improvements": [],
                "recommendations": []
            }
        
        # 模拟AI分析逻辑
        total_sessions = len(history_data)
        avg_duration = sum(session.get('duration', 0) for session in history_data) / total_sessions
        
        # 生成洞察
        insights = []
        if avg_duration > 30:
            insights.append({
                "type": "strength",
                "title": "学习专注度高",
                "description": f"您的平均学习时长为{avg_duration:.1f}分钟，显示出良好的专注力",
                "confidence": 0.85,
                "actionable": False
            })
        
        if total_sessions > 10:
            insights.append({
                "type": "strength", 
                "title": "学习习惯良好",
                "description": f"已完成{total_sessions}次学习会话，展现了持续学习的好习惯",
                "confidence": 0.92,
                "actionable": False
            })
        
        # 分析学习主题偏好
        topics = {}
        for session in history_data:
            topic = session.get('topic', '其他')
            topics[topic] = topics.get(topic, 0) + 1
        
        if topics:
            most_studied = max(topics, key=topics.get)
            least_studied = min(topics, key=topics.get) if len(topics) > 1 else None
            
            if least_studied and topics[least_studied] < topics[most_studied] * 0.3:
                insights.append({
                    "type": "improvement",
                    "title": f"{least_studied}学习需要加强",
                    "description": f"相比{most_studied}，您在{least_studied}方面的学习较少，建议增加相关内容",
                    "confidence": 0.78,
                    "actionable": True
                })
        
        return {
            "insights": insights,
            "total_sessions": total_sessions,
            "avg_duration": avg_duration,
            "topic_distribution": topics
        }
    
    @staticmethod
    def generate_recommendations(user_id: str, analysis_result: Dict) -> List[Dict]:
        """生成个性化推荐"""
        recommendations = []
        
        # 基于分析结果生成推荐
        topic_dist = analysis_result.get('topic_distribution', {})
        
        # 推荐经典学习
        if '论语' in topic_dist and topic_dist['论语'] > 3:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "classic",
                "title": "《孟子》深度学习",
                "description": "基于您对论语的深入学习，孟子思想将是很好的进阶选择",
                "difficulty": 4,
                "estimatedTime": 45,
                "relevanceScore": 0.92,
                "tags": ["儒家", "进阶", "思想"],
                "reason": "与您已掌握的儒家思想高度相关"
            })
        
        # 推荐对话学习
        if analysis_result.get('avg_duration', 0) > 25:
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "conversation",
                "title": "与朱熹探讨理学",
                "description": "深入探讨宋代理学思想，提升哲学思辨能力",
                "difficulty": 5,
                "estimatedTime": 35,
                "relevanceScore": 0.88,
                "tags": ["理学", "哲学", "高级"],
                "reason": "您的学习专注度很高，可以挑战更深层次的内容",
                "character": "朱熹"
            })
        
        # 推荐基础补强
        weak_topics = [topic for topic, count in topic_dist.items() if count < 2]
        if weak_topics:
            topic = random.choice(weak_topics)
            recommendations.append({
                "id": str(uuid.uuid4()),
                "type": "concept",
                "title": f"{topic}基础概念学习",
                "description": f"系统学习{topic}的核心概念，夯实基础",
                "difficulty": 3,
                "estimatedTime": 25,
                "relevanceScore": 0.75,
                "tags": [topic, "基础", "概念"],
                "reason": f"AI分析显示您在{topic}方面需要加强"
            })
        
        return recommendations
    
    @staticmethod
    def plan_learning_path(user_id: str, current_level: int, completed_topics: List[str]) -> List[Dict]:
        """规划学习路径"""
        paths = []
        
        # 儒家经典路径
        if '论语' in completed_topics:
            confucian_modules = [
                {
                    "id": "conf-1",
                    "title": "孟子思想深入",
                    "description": "学习孟子的仁政思想和性善论",
                    "type": "reading",
                    "estimatedHours": 15,
                    "completed": '孟子' in completed_topics,
                    "locked": False
                },
                {
                    "id": "conf-2", 
                    "title": "中庸之道",
                    "description": "理解中庸的哲学内涵",
                    "type": "conversation",
                    "estimatedHours": 12,
                    "completed": False,
                    "locked": '孟子' not in completed_topics
                }
            ]
            
            paths.append({
                "id": "confucian-advanced",
                "title": "儒家思想进阶路径",
                "description": "深入学习儒家核心经典，提升思想境界",
                "difficulty": "intermediate",
                "estimatedWeeks": 8,
                "modules": confucian_modules,
                "prerequisites": ["论语基础"],
                "outcomes": ["深入理解儒家思想", "掌握经典原文", "提升人文素养"],
                "popularity": 95
            })
        
        # 道家入门路径
        if '道德经' not in completed_topics:
            taoist_modules = [
                {
                    "id": "tao-1",
                    "title": "道德经导读", 
                    "description": "学习老子的道家思想精髓",
                    "type": "reading",
                    "estimatedHours": 16,
                    "completed": False,
                    "locked": False
                }
            ]
            
            paths.append({
                "id": "taoist-beginner",
                "title": "道家哲学入门路径",
                "description": "从道德经开始，探索道家思想的深邃智慧",
                "difficulty": "beginner", 
                "estimatedWeeks": 6,
                "modules": taoist_modules,
                "prerequisites": ["基础哲学概念"],
                "outcomes": ["理解道家核心思想", "掌握辩证思维"],
                "popularity": 78
            })
        
        return paths

class ConversationAnalyzer:
    """对话分析器"""
    
    @staticmethod
    def analyze_conversation(conversation_data: Dict) -> Dict:
        """分析单次对话"""
        messages = conversation_data.get('messages', [])
        
        # 提取关键词
        keywords = ConversationAnalyzer._extract_keywords(messages)
        
        # 分析情感倾向
        emotional_tone = ConversationAnalyzer._analyze_emotion(messages)
        
        # 生成洞察
        insights = ConversationAnalyzer._generate_insights(messages, keywords)
        
        return {
            "id": conversation_data.get('id', str(uuid.uuid4())),
            "character": conversation_data.get('character', '未知'),
            "topic": conversation_data.get('topic', '通用对话'),
            "date": conversation_data.get('date', datetime.now().isoformat()),
            "duration": conversation_data.get('duration', len(messages) * 2),
            "messageCount": len(messages),
            "keyInsights": insights,
            "knowledgePoints": keywords,
            "emotionalTone": emotional_tone,
            "learningOutcomes": ConversationAnalyzer._extract_outcomes(insights),
            "difficulty": min(5, max(1, len(keywords))),
            "satisfaction": random.randint(7, 10)
        }
    
    @staticmethod
    def _extract_keywords(messages: List[Dict]) -> List[str]:
        """提取关键词"""
        # 简化的关键词提取逻辑
        keywords = []
        common_terms = ['仁', '义', '礼', '智', '信', '道', '德', '天', '人', '性', '善', '恶']
        
        for msg in messages:
            content = msg.get('content', '')
            for term in common_terms:
                if term in content and term not in keywords:
                    keywords.append(term)
        
        return keywords[:6]  # 最多返回6个关键词
    
    @staticmethod
    def _analyze_emotion(messages: List[Dict]) -> str:
        """分析情感倾向"""
        # 简化的情感分析
        positive_words = ['好', '善', '美', '正', '和', '乐']
        thoughtful_words = ['思', '考', '虑', '想', '悟', '理']
        
        pos_count = 0
        thought_count = 0
        
        for msg in messages:
            content = msg.get('content', '')
            pos_count += sum(1 for word in positive_words if word in content)
            thought_count += sum(1 for word in thoughtful_words if word in content)
        
        if thought_count > pos_count:
            return 'thoughtful'
        elif pos_count > 0:
            return 'positive'
        else:
            return 'neutral'
    
    @staticmethod
    def _generate_insights(messages: List[Dict], keywords: List[str]) -> List[str]:
        """生成洞察"""
        insights = []
        
        if '仁' in keywords:
            insights.append('深入探讨了仁爱思想的现代意义和实践价值')
        
        if '道' in keywords:
            insights.append('理解了道家思想中"道法自然"的哲学内涵')
        
        if len(messages) > 10:
            insights.append('通过深入对话，加深了对传统文化的理解')
        
        if not insights:
            insights.append('通过对话交流，获得了新的思考角度')
        
        return insights
    
    @staticmethod
    def _extract_outcomes(insights: List[str]) -> List[str]:
        """提取学习成果"""
        outcomes = []
        
        for insight in insights:
            if '仁爱' in insight:
                outcomes.append('深入理解仁爱思想的内涵')
            elif '道' in insight:
                outcomes.append('掌握道家核心理念')
            else:
                outcomes.append('提升传统文化认知水平')
        
        return outcomes

# 初始化一些模拟数据
def init_mock_data():
    """初始化模拟数据"""
    # 模拟用户学习历史
    learning_history['user_001'] = [
        {
            "id": "session_001",
            "topic": "论语",
            "duration": 35,
            "date": "2024-01-15",
            "type": "reading",
            "completion": 85
        },
        {
            "id": "session_002", 
            "topic": "孟子",
            "duration": 28,
            "date": "2024-01-12",
            "type": "conversation",
            "completion": 92
        },
        {
            "id": "session_003",
            "topic": "道德经", 
            "duration": 15,
            "date": "2024-01-10",
            "type": "reading",
            "completion": 60
        }
    ]
    
    # 模拟对话历史
    conversation_history['user_001'] = [
        {
            "id": "conv_001",
            "character": "孔子",
            "topic": "仁爱思想的现代意义",
            "date": "2024-01-15",
            "duration": 25,
            "messages": [
                {"role": "user", "content": "老师，仁爱思想在现代社会还有意义吗？"},
                {"role": "assistant", "content": "仁爱是人类永恒的主题，在现代社会更需要这种关爱精神..."}
            ]
        }
    ]

# API路由定义

@app.route('/', methods=['GET'])
def api_overview():
    """API服务概览 - 根据Accept头返回HTML或JSON"""
    # 检查客户端是否接受HTML
    if 'text/html' in request.headers.get('Accept', ''):
        # 返回HTML页面
        return render_template('index.html')

    # 返回JSON格式的API信息
    api_info = {
        "service": "儒智后端API服务",
        "version": "1.0.0",
        "description": "提供智能历史分析、个性化推荐、学习路径规划等功能",
        "timestamp": datetime.now().isoformat(),
        "status": "running",
        "endpoints": {
            "健康检查": {
                "url": "/health",
                "method": "GET",
                "description": "检查服务健康状态"
            },
            "用户学习历史": {
                "url": "/api/v1/user/{user_id}/learning-history",
                "method": "GET",
                "description": "获取用户学习历史数据和统计信息"
            },
            "AI智能分析": {
                "url": "/api/v1/user/{user_id}/ai-analysis",
                "method": "POST",
                "description": "基于用户学习历史生成AI智能分析"
            },
            "个性化推荐": {
                "url": "/api/v1/user/{user_id}/recommendations",
                "method": "GET",
                "description": "获取基于AI分析的个性化推荐"
            },
            "学习路径规划": {
                "url": "/api/v1/user/{user_id}/learning-paths",
                "method": "GET",
                "description": "获取个性化学习路径规划"
            },
            "对话总结": {
                "url": "/api/v1/user/{user_id}/conversation-summary",
                "method": "GET",
                "description": "获取用户对话历史的智能总结"
            },
            "对话分析": {
                "url": "/api/v1/conversation/analyze",
                "method": "POST",
                "description": "分析单次对话内容"
            },
            "记录学习会话": {
                "url": "/api/v1/user/{user_id}/learning-session",
                "method": "POST",
                "description": "记录用户学习会话数据"
            }
        },
        "documentation": "请查看 API_DOCUMENTATION.md 获取详细文档",
        "test_user": "user_001",
        "example_requests": {
            "获取学习历史": "GET /api/v1/user/user_001/learning-history",
            "健康检查": "GET /health"
        }
    }

    return jsonify(api_info)

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    """处理favicon请求，避免404错误"""
    return '', 204

@app.route('/api', methods=['GET'])
def api_info():
    """API信息简化版本"""
    return jsonify({
        "message": "儒智后端API服务",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/",
        "health_check": "/health"
    })

@app.route('/health', methods=['GET'])
@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "ruzhi-backend",
        "version": "1.0.0",
        "uptime": "服务运行正常"
    })

@app.route('/api/v1/user/<user_id>/learning-history', methods=['GET'])
def get_learning_history(user_id: str):
    """获取用户学习历史"""
    try:
        history = learning_history.get(user_id, [])

        # 计算统计数据
        total_sessions = len(history)
        total_time = sum(session.get('duration', 0) for session in history)
        topics = list(set(session.get('topic', '') for session in history))

        # 计算学习连续天数（简化逻辑）
        learning_streak = min(total_sessions, 15)  # 模拟数据

        return jsonify({
            "success": True,
            "data": {
                "history": history,
                "stats": {
                    "totalStudyTime": total_time,
                    "completedSessions": total_sessions,
                    "favoriteTopics": topics,
                    "learningStreak": learning_streak,
                    "knowledgePoints": total_sessions * 50,  # 模拟积分
                    "conversationCount": len(conversation_history.get(user_id, []))
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/user/<user_id>/ai-analysis', methods=['POST'])
def generate_ai_analysis(user_id: str):
    """生成AI智能分析"""
    try:
        # 获取用户学习历史
        history = learning_history.get(user_id, [])

        # 执行AI分析
        analysis_result = AIAnalysisService.analyze_learning_patterns(user_id, history)

        # 生成周进度数据（模拟）
        weekly_progress = [
            {"week": "第1周", "study": 120, "conversation": 8},
            {"week": "第2周", "study": 150, "conversation": 12},
            {"week": "第3周", "study": 180, "conversation": 15},
            {"week": "第4周", "study": 200, "conversation": 18}
        ]

        return jsonify({
            "success": True,
            "data": {
                "insights": analysis_result["insights"],
                "analysisData": {
                    "weeklyProgress": weekly_progress,
                    "topicDistribution": [
                        {"topic": topic, "percentage": round(count/len(history)*100), "sessions": count}
                        for topic, count in analysis_result.get("topic_distribution", {}).items()
                    ]
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/user/<user_id>/recommendations', methods=['GET'])
def get_recommendations(user_id: str):
    """获取个性化推荐"""
    try:
        # 获取用户学习历史并分析
        history = learning_history.get(user_id, [])
        analysis_result = AIAnalysisService.analyze_learning_patterns(user_id, history)

        # 生成推荐
        recommendations = AIAnalysisService.generate_recommendations(user_id, analysis_result)

        return jsonify({
            "success": True,
            "data": {
                "recommendations": recommendations,
                "totalCount": len(recommendations),
                "averageRelevance": sum(r.get("relevanceScore", 0) for r in recommendations) / len(recommendations) if recommendations else 0
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/user/<user_id>/learning-paths', methods=['GET'])
def get_learning_paths(user_id: str):
    """获取学习路径规划"""
    try:
        # 获取用户当前水平和已完成主题
        history = learning_history.get(user_id, [])
        current_level = len(history) * 100  # 简化的等级计算
        completed_topics = list(set(session.get('topic', '') for session in history))

        # 生成学习路径
        paths = AIAnalysisService.plan_learning_path(user_id, current_level, completed_topics)

        return jsonify({
            "success": True,
            "data": {
                "paths": paths,
                "currentLevel": current_level,
                "completedTopics": completed_topics
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/user/<user_id>/conversation-summary', methods=['GET'])
def get_conversation_summary(user_id: str):
    """获取对话总结"""
    try:
        # 获取用户对话历史
        conversations = conversation_history.get(user_id, [])

        # 分析每个对话
        summaries = []
        for conv in conversations:
            summary = ConversationAnalyzer.analyze_conversation(conv)
            summaries.append(summary)

        return jsonify({
            "success": True,
            "data": {
                "summaries": summaries,
                "totalCount": len(summaries),
                "stats": {
                    "totalConversations": len(summaries),
                    "averageDuration": sum(s.get("duration", 0) for s in summaries) / len(summaries) if summaries else 0,
                    "averageSatisfaction": sum(s.get("satisfaction", 0) for s in summaries) / len(summaries) if summaries else 0
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/conversation/analyze', methods=['POST'])
def analyze_conversation():
    """分析单次对话"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供对话数据"
            }), 400

        # 分析对话
        summary = ConversationAnalyzer.analyze_conversation(data)

        return jsonify({
            "success": True,
            "data": summary
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/user/<user_id>/learning-session', methods=['POST'])
def record_learning_session(user_id: str):
    """记录学习会话"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供学习会话数据"
            }), 400

        # 创建学习会话记录
        session = {
            "id": str(uuid.uuid4()),
            "topic": data.get("topic", ""),
            "duration": data.get("duration", 0),
            "date": datetime.now().isoformat(),
            "type": data.get("type", "reading"),
            "completion": data.get("completion", 0)
        }

        # 保存到用户历史
        if user_id not in learning_history:
            learning_history[user_id] = []
        learning_history[user_id].append(session)

        return jsonify({
            "success": True,
            "data": session
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# OCR相关API接口

@app.route('/api/v1/ocr/modes', methods=['GET'])
def get_ocr_modes():
    """获取OCR模式列表"""
    try:
        modes = [
            {
                "id": "ancient",
                "name": "古籍识别",
                "description": "专门针对古籍文献的OCR识别，支持繁体字和异体字"
            },
            {
                "id": "handwriting",
                "name": "手写识别",
                "description": "识别手写的古文内容，适用于书法作品和手稿"
            },
            {
                "id": "printed",
                "name": "印刷体识别",
                "description": "识别现代印刷的古文内容，准确率更高"
            },
            {
                "id": "mixed",
                "name": "混合模式",
                "description": "自动识别文本类型，适用于复杂场景"
            }
        ]

        return jsonify({
            "success": True,
            "data": modes
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/ocr/analyze', methods=['POST'])
def ocr_analyze():
    """OCR识别分析"""
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "请上传图片文件"
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "请选择有效的图片文件"
            }), 400

        # 获取OCR参数
        mode = request.form.get('mode', 'ancient')
        enhance_image = request.form.get('enhance_image', 'true').lower() == 'true'
        detect_layout = request.form.get('detect_layout', 'true').lower() == 'true'
        recognize_variants = request.form.get('recognize_variants', 'true').lower() == 'true'

        # 模拟OCR处理过程
        import time
        time.sleep(2)  # 模拟处理时间

        # 模拟OCR识别结果
        mock_results = [
            {
                "text": "子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」",
                "confidence": 95.8,
                "variants": [
                    {"original": "说", "standard": "悦", "confidence": 92},
                    {"original": "愠", "standard": "愠", "confidence": 98}
                ]
            },
            {
                "text": "道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。",
                "confidence": 93.2,
                "variants": [
                    {"original": "無", "standard": "无", "confidence": 96}
                ]
            },
            {
                "text": "天行健，君子以自强不息；地势坤，君子以厚德载物。",
                "confidence": 97.1,
                "variants": []
            }
        ]

        # 随机选择一个结果
        import random
        result = random.choice(mock_results)

        # 添加处理时间
        result["processing_time"] = random.randint(1500, 3000)
        result["mode"] = mode
        result["enhance_image"] = enhance_image
        result["detect_layout"] = detect_layout
        result["recognize_variants"] = recognize_variants

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        logger.error(f"OCR识别失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/ocr/history/<user_id>', methods=['GET'])
def get_ocr_history(user_id: str):
    """获取OCR历史记录"""
    try:
        # 模拟历史记录数据
        history = [
            {
                "id": "ocr_001",
                "text": "子曰：「学而时习之，不亦说乎？」",
                "confidence": 95.8,
                "mode": "ancient",
                "timestamp": "2024-01-15T10:30:00Z",
                "processing_time": 2100
            },
            {
                "id": "ocr_002",
                "text": "道可道，非常道；名可名，非常名。",
                "confidence": 93.2,
                "mode": "ancient",
                "timestamp": "2024-01-14T15:20:00Z",
                "processing_time": 1800
            }
        ]

        return jsonify({
            "success": True,
            "data": history
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/ocr/save', methods=['POST'])
def save_ocr_result():
    """保存OCR结果"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供OCR结果数据"
            }), 400

        # 创建OCR结果记录
        ocr_result = {
            "id": str(uuid.uuid4()),
            "user_id": data.get("userId", "anonymous"),
            "text": data.get("text", ""),
            "confidence": data.get("confidence", 0),
            "mode": data.get("mode", "ancient"),
            "timestamp": datetime.now().isoformat(),
            "processing_time": data.get("processing_time", 0)
        }

        # 这里可以保存到数据库
        logger.info(f"保存OCR结果: {ocr_result['id']}")

        return jsonify({
            "success": True,
            "data": ocr_result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/ocr/interpret', methods=['POST'])
def interpret_ocr_text():
    """AI解读OCR识别的文本"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        mode = data.get('mode', 'ancient')

        if not text:
            return jsonify({
                'success': False,
                'error': '待解读文本不能为空'
            })

        # 构建解读提示词
        if mode == 'ancient':
            interpret_prompt = f"""请对以下古文进行深入解读和分析：

"{text}"

请从以下几个方面进行解读：
1. 【文本释义】：逐句解释文本的字面意思和深层含义
2. 【文化背景】：分析文本的历史文化背景和时代特征
3. 【思想内涵】：阐述文本蕴含的哲学思想和文化价值
4. 【现代启示】：结合现代生活，说明这段文字对当代人的启发意义
5. 【相关典故】：如果有相关的历史典故或文化故事，请简要介绍

请用通俗易懂的现代汉语进行解释，让现代读者能够理解古文的深层智慧。字数控制在300-600字之间。"""
        else:
            interpret_prompt = f"""请对以下文本进行分析和解读：

"{text}"

请从以下几个方面进行分析：
1. 【内容概要】：总结文本的主要内容和核心观点
2. 【语言特点】：分析文本的语言风格和表达特色
3. 【文化价值】：探讨文本的文化意义和价值
4. 【实用建议】：结合文本内容，给出实际的应用建议
5. 【延伸思考】：提出相关的思考问题或学习方向

请用清晰明了的语言进行分析，帮助读者更好地理解文本内容。字数控制在300-500字之间。"""

        # 调用AI服务进行解读
        messages = [
            {'role': 'system', 'content': '你是一位博学的文化学者，擅长解读和分析各种文本，特别是中国传统文化典籍。你的解读深入浅出，既有学术深度又通俗易懂。'},
            {'role': 'user', 'content': interpret_prompt}
        ]

        # 使用真实AI服务
        ai_result = RealAIService.call_deepseek_api(messages)

        if ai_result['success']:
            interpretation_result = {
                'text': text,
                'mode': mode,
                'interpretation': ai_result['content'],
                'confidence': random.uniform(0.88, 0.96),
                'timestamp': datetime.now().isoformat(),
                'source': 'deepseek_api',
                'response_time': ai_result.get('response_time', 0)
            }
        else:
            # 备用解读结果
            fallback_interpretations = {
                'ancient': f"""【文本释义】这段古文体现了中国传统文化的深厚底蕴，从字面意思来看，文本表达了深刻的人生哲理和处世智慧。

【文化背景】这类文字通常出现在经典著作中，反映了古代先贤对人生、社会、自然的深入思考，体现了中华文明的智慧传承。

【思想内涵】文本涉及修身养性、治国理政、人际关系等多个层面，体现了儒家、道家等传统思想的核心理念。

【现代启示】这些古老的智慧在现代社会仍然具有重要的指导意义，提醒我们在快节奏的现代生活中保持内心的宁静和思考，注重品德修养和精神追求。

【相关典故】这类思想在历史上有许多相关的典故和实践案例，体现了中华文化的连续性和生命力。""",

                'modern': f"""【内容概要】这段文本内容丰富，表达了重要的观点和思想，具有一定的文化价值和现实意义。

【语言特点】文字表达清晰，逻辑性强，体现了良好的语言功底和思维能力。

【文化价值】文本传承了优秀的思想传统，对于我们理解相关领域的知识具有重要意义，体现了文化的传承和发展。

【实用建议】建议读者可以结合自己的实际情况，将文本中的观点应用到日常生活和工作中，同时保持批判性思维。

【延伸思考】可以进一步阅读相关的经典著作，深化对这一主题的理解，并思考如何在现代社会中实践这些理念。"""
            }

            interpretation_result = {
                'text': text,
                'mode': mode,
                'interpretation': fallback_interpretations.get(mode, fallback_interpretations['modern']),
                'confidence': 0.75,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_interpretation'
            }

        return jsonify({
            'success': True,
            'data': interpretation_result
        })

    except Exception as e:
        logger.error(f"OCR文本解读失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'解读失败: {str(e)}'
        })

# AI对话相关API接口

# 存储对话数据
chat_conversations = {}
character_profiles = {
    "confucius": {
        "id": "confucius",
        "name": "孔子",
        "title": "至圣先师",
        "dynasty": "春秋",
        "personality": "温和、睿智、注重教育",
        "speaking_style": "古典文雅，常引用经典",
        "core_beliefs": ["仁爱", "礼制", "教育", "修身"],
        "typical_responses": [
            "学而时习之，不亦说乎？",
            "己所不欲，勿施于人。",
            "三人行，必有我师焉。"
        ]
    },
    "laozi": {
        "id": "laozi",
        "name": "老子",
        "title": "道德天尊",
        "dynasty": "春秋",
        "personality": "深邃、超脱、追求自然",
        "speaking_style": "简洁深刻，富含哲理",
        "core_beliefs": ["道法自然", "无为而治", "和谐", "智慧"],
        "typical_responses": [
            "道可道，非常道。",
            "无为而无不为。",
            "知者不言，言者不知。"
        ]
    },
    "mencius": {
        "id": "mencius",
        "name": "孟子",
        "title": "亚圣",
        "dynasty": "战国",
        "personality": "激昂、正直、富有理想",
        "speaking_style": "雄辩有力，逻辑清晰",
        "core_beliefs": ["性善论", "仁政", "民本", "浩然之气"],
        "typical_responses": [
            "人之初，性本善。",
            "民为贵，社稷次之，君为轻。",
            "富贵不能淫，贫贱不能移，威武不能屈。"
        ]
    },
    "zhuxi": {
        "id": "zhuxi",
        "name": "朱熹",
        "title": "理学大师",
        "dynasty": "南宋",
        "personality": "严谨、博学、注重实践",
        "speaking_style": "条理分明，注重论证",
        "core_beliefs": ["理学", "格物致知", "存天理", "去人欲"],
        "typical_responses": [
            "格物致知，诚意正心。",
            "存天理，去人欲。",
            "读书之法，在循序而渐进。"
        ]
    },
    "wangyangming": {
        "id": "wangyangming",
        "name": "王阳明",
        "title": "心学宗师",
        "dynasty": "明代",
        "personality": "直觉、实践、注重内心",
        "speaking_style": "直指人心，简明扼要",
        "core_beliefs": ["心学", "知行合一", "致良知", "心即理"],
        "typical_responses": [
            "心即理也。",
            "知行合一。",
            "致良知。"
        ]
    }
}

class AICharacterService:
    """AI人物对话服务"""

    @staticmethod
    def generate_response(character_id: str, user_message: str, conversation_history: list, settings: dict) -> dict:
        """生成AI人物回复"""
        character = character_profiles.get(character_id)
        if not character:
            raise ValueError(f"未知人物: {character_id}")

        # 分析用户消息
        message_analysis = AICharacterService._analyze_user_message(user_message)

        # 根据人物特点生成回复
        reply = AICharacterService._generate_character_reply(
            character, user_message, message_analysis, conversation_history, settings
        )

        # 生成思考过程（如果启用）
        thinking = None
        if settings.get('showThinking', True):
            thinking = AICharacterService._generate_thinking_process(
                character, user_message, message_analysis
            )

        return {
            "reply": reply,
            "thinking": thinking,
            "character_mood": "thoughtful",
            "confidence": random.uniform(0.85, 0.98)
        }

    @staticmethod
    def _analyze_user_message(message: str) -> dict:
        """分析用户消息"""
        # 简化的消息分析
        analysis = {
            "intent": "question",  # question, discussion, sharing, greeting
            "emotion": "neutral",  # positive, negative, neutral, confused
            "topics": [],
            "complexity": "medium"
        }

        # 检测问候
        greetings = ["你好", "您好", "老师好", "先生"]
        if any(greeting in message for greeting in greetings):
            analysis["intent"] = "greeting"

        # 检测疑问
        question_words = ["什么", "如何", "为什么", "怎么", "？"]
        if any(word in message for word in question_words):
            analysis["intent"] = "question"

        # 检测主题
        topics_map = {
            "仁": ["仁", "仁爱", "仁义"],
            "礼": ["礼", "礼制", "礼仪"],
            "道": ["道", "道德", "道理"],
            "学习": ["学习", "学", "教育", "读书"],
            "修身": ["修身", "修养", "品德"],
            "政治": ["政治", "治国", "仁政"]
        }

        for topic, keywords in topics_map.items():
            if any(keyword in message for keyword in keywords):
                analysis["topics"].append(topic)

        return analysis

    @staticmethod
    def _generate_character_reply(character: dict, user_message: str, analysis: dict, history: list, settings: dict) -> str:
        """生成人物回复"""
        reply_style = settings.get('replyStyle', 'classical')

        # 根据意图生成不同类型的回复
        if analysis["intent"] == "greeting":
            replies = [
                f"有朋自远方来，不亦乐乎？我是{character['name']}，很高兴与你交流。",
                f"欢迎来到{character['dynasty']}时代，我是{character['name']}，愿与你分享智慧。",
                f"施礼了，我是{character['name']}，请问有何指教？"
            ]
            base_reply = random.choice(replies)

        elif analysis["intent"] == "question":
            # 根据主题生成回复
            if "仁" in analysis["topics"]:
                replies = [
                    "仁者爱人，这是仁的核心含义。仁不仅是个人品德，更是社会和谐的基础。",
                    "仁，从人从二，意指人与人之间的关爱。己所不欲，勿施于人，这便是仁的体现。",
                    "仁是内心的善良本性，需要通过修身养性来培养和实践。"
                ]
            elif "道" in analysis["topics"]:
                replies = [
                    "道，是宇宙万物的根本规律，是自然和谐的体现。",
                    "道法自然，顺应天道，方能达到内心的平静与智慧。",
                    "道可道，非常道。真正的道是无法用言语完全表达的。"
                ]
            elif "学习" in analysis["topics"]:
                replies = [
                    "学而时习之，不亦说乎？学习贵在持之以恒，温故而知新。",
                    "三人行，必有我师焉。学习要保持谦逊的心态，向他人学习。",
                    "学而不思则罔，思而不学则殆。学习与思考要相结合。"
                ]
            else:
                replies = character["typical_responses"]

            base_reply = random.choice(replies)

        else:
            # 默认回复
            base_reply = random.choice(character["typical_responses"])

        # 根据回复风格调整
        if reply_style == 'modern':
            base_reply = AICharacterService._modernize_reply(base_reply)
        elif reply_style == 'mixed':
            base_reply = AICharacterService._mix_style_reply(base_reply)

        return base_reply

    @staticmethod
    def _generate_thinking_process(character: dict, user_message: str, analysis: dict) -> str:
        """生成思考过程"""
        thinking_templates = [
            f"这位朋友问及{analysis['topics'][0] if analysis['topics'] else '人生道理'}，让我想起{character['dynasty']}时代的一些思考...",
            f"从{character['core_beliefs'][0]}的角度来看，这个问题很有意思...",
            f"结合我在{character['dynasty']}时期的经历和思考，我认为...",
            f"这个问题触及了{character['core_beliefs'][0]}的核心，需要仔细思量..."
        ]

        return random.choice(thinking_templates)

    @staticmethod
    def _modernize_reply(reply: str) -> str:
        """现代化回复"""
        # 简化的现代化处理
        modern_map = {
            "不亦": "不是很",
            "乎": "吗",
            "焉": "",
            "矣": "了",
            "也": "",
            "者": "的人",
            "之": "的"
        }

        for old, new in modern_map.items():
            reply = reply.replace(old, new)

        return reply

    @staticmethod
    def _mix_style_reply(reply: str) -> str:
        """混合风格回复"""
        # 保留部分古文韵味，但增加现代解释
        if "。" in reply:
            parts = reply.split("。")
            if len(parts) > 1:
                return f"{parts[0]}。用现代话说，就是{AICharacterService._modernize_reply(parts[0])}。"

        return reply

# 学习中心相关API接口

# 存储学习数据
learning_data = {}
user_profiles = {}
study_plans = {}
achievements_data = {}
study_records = {}

class LearningService:
    """学习中心服务"""

    @staticmethod
    def get_user_study_stats(user_id: str) -> dict:
        """获取用户学习统计"""
        if user_id not in learning_data:
            learning_data[user_id] = {
                'totalDays': random.randint(10, 50),
                'totalHours': random.randint(20, 100),
                'totalPoints': random.randint(500, 2000),
                'weeklyHours': [2.5, 3.0, 1.5, 4.0, 2.0, 3.5, 2.8],
                'monthlyData': LearningService._generate_monthly_data()
            }

        return learning_data[user_id]

    @staticmethod
    def _generate_monthly_data() -> list:
        """生成月度学习数据"""
        data = []
        for day in range(1, 32):
            if random.random() > 0.3:  # 70%的天数有学习记录
                data.append({
                    'date': f"2024-01-{day:02d}",
                    'hours': round(random.uniform(0.5, 4.0), 1),
                    'sessions': random.randint(1, 5),
                    'points': random.randint(20, 150)
                })
        return data

    @staticmethod
    def get_progress_data(user_id: str) -> list:
        """获取学习进度数据"""
        return [
            {
                'id': 'classics',
                'icon': '📚',
                'title': '经典阅读',
                'subtitle': '论语·学而篇',
                'progress': random.randint(60, 90),
                'currentStep': random.randint(10, 18),
                'totalSteps': 20,
                'estimatedTime': f"{random.randint(1, 4)}小时"
            },
            {
                'id': 'dialogue',
                'icon': '💬',
                'title': 'AI对话',
                'subtitle': '与孔子对话',
                'progress': random.randint(50, 80),
                'currentStep': random.randint(8, 15),
                'totalSteps': 20,
                'estimatedTime': f"{random.randint(2, 5)}小时"
            },
            {
                'id': 'ocr',
                'icon': '🔍',
                'title': '古籍识别',
                'subtitle': '识别练习',
                'progress': random.randint(70, 95),
                'currentStep': random.randint(14, 19),
                'totalSteps': 20,
                'estimatedTime': f"{random.randint(1, 3)}小时"
            }
        ]

    @staticmethod
    def get_today_plans(user_id: str, date: str) -> list:
        """获取今日学习计划"""
        plan_key = f"{user_id}_{date}"

        if plan_key not in study_plans:
            study_plans[plan_key] = [
                {
                    'id': f'plan_{random.randint(1000, 9999)}',
                    'title': '阅读《论语》学而篇第三章',
                    'type': '经典阅读',
                    'duration': 30,
                    'difficulty': '中等',
                    'progress': random.randint(0, 100),
                    'completed': random.choice([True, False])
                },
                {
                    'id': f'plan_{random.randint(1000, 9999)}',
                    'title': '与孟子对话：性善论探讨',
                    'type': 'AI对话',
                    'duration': 45,
                    'difficulty': '困难',
                    'progress': random.randint(0, 100),
                    'completed': random.choice([True, False])
                }
            ]

        return study_plans[plan_key]

    @staticmethod
    def get_achievements(user_id: str) -> list:
        """获取用户成就"""
        if user_id not in achievements_data:
            achievements_data[user_id] = [
                {
                    'id': 'first_dialogue',
                    'icon': '🎭',
                    'title': '初次对话',
                    'description': '完成第一次AI对话',
                    'unlocked': True,
                    'unlockedDate': '2024-01-10',
                    'rewardPoints': 50
                },
                {
                    'id': 'reading_master',
                    'icon': '📖',
                    'title': '阅读达人',
                    'description': '累计阅读10小时',
                    'unlocked': True,
                    'unlockedDate': '2024-01-12',
                    'rewardPoints': 100
                },
                {
                    'id': 'ocr_expert',
                    'icon': '🔍',
                    'title': 'OCR专家',
                    'description': '完成100次OCR识别',
                    'unlocked': False,
                    'currentValue': random.randint(50, 95),
                    'targetValue': 100,
                    'tips': '继续使用OCR功能识别古籍文本'
                },
                {
                    'id': 'dialogue_master',
                    'icon': '💭',
                    'title': '对话大师',
                    'description': '与5位不同人物对话',
                    'unlocked': False,
                    'currentValue': random.randint(2, 4),
                    'targetValue': 5,
                    'tips': '尝试与更多历史人物对话'
                }
            ]

        return achievements_data[user_id]

    @staticmethod
    def create_study_plan(plan_data: dict) -> dict:
        """创建学习计划"""
        user_id = plan_data.get('userId')
        date = plan_data.get('date')
        plan_key = f"{user_id}_{date}"

        if plan_key not in study_plans:
            study_plans[plan_key] = []

        study_plans[plan_key].append(plan_data)

        return {
            'id': plan_data['id'],
            'created': True
        }

    @staticmethod
    def update_plan_status(user_id: str, plan_id: str, completed: bool) -> bool:
        """更新计划状态"""
        # 在实际应用中，这里会更新数据库
        # 这里只是模拟更新
        return True

    @staticmethod
    def get_day_study_records(user_id: str, date: str) -> list:
        """获取某日学习记录"""
        record_key = f"{user_id}_{date}"

        if record_key not in study_records:
            # 模拟生成学习记录
            if random.random() > 0.5:  # 50%概率有学习记录
                study_records[record_key] = [
                    {
                        'id': f'record_{random.randint(1000, 9999)}',
                        'time': f"{random.randint(9, 21)}:{random.randint(10, 59):02d}",
                        'title': '阅读《论语》',
                        'type': '经典阅读',
                        'duration': random.randint(20, 60),
                        'progress': random.randint(80, 100),
                        'score': random.randint(75, 95)
                    },
                    {
                        'id': f'record_{random.randint(1000, 9999)}',
                        'time': f"{random.randint(9, 21)}:{random.randint(10, 59):02d}",
                        'title': '与孔子对话',
                        'type': 'AI对话',
                        'duration': random.randint(15, 45),
                        'progress': random.randint(85, 100),
                        'score': random.randint(80, 98)
                    }
                ]
            else:
                study_records[record_key] = []

        return study_records[record_key]

@app.route('/api/v1/learning/stats/<user_id>', methods=['GET'])
def get_study_stats(user_id: str):
    """获取学习统计"""
    try:
        stats = LearningService.get_user_study_stats(user_id)

        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/progress/<user_id>', methods=['GET'])
def get_progress_data(user_id: str):
    """获取学习进度"""
    try:
        progress = LearningService.get_progress_data(user_id)

        return jsonify({
            "success": True,
            "data": progress
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/plans/<user_id>/<date>', methods=['GET'])
def get_today_plans(user_id: str, date: str):
    """获取今日计划"""
    try:
        plans = LearningService.get_today_plans(user_id, date)

        return jsonify({
            "success": True,
            "data": plans
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/achievements/<user_id>', methods=['GET'])
def get_achievements(user_id: str):
    """获取用户成就"""
    try:
        achievements = LearningService.get_achievements(user_id)

        return jsonify({
            "success": True,
            "data": achievements
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/plans', methods=['POST'])
def create_study_plan():
    """创建学习计划"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供计划数据"
            }), 400

        result = LearningService.create_study_plan(data)

        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/plans/<user_id>/<plan_id>/status', methods=['PUT'])
def update_plan_status(user_id: str, plan_id: str):
    """更新计划状态"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)

        success = LearningService.update_plan_status(user_id, plan_id, completed)

        return jsonify({
            "success": success,
            "message": "状态更新成功" if success else "状态更新失败"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/learning/records/<user_id>/<date>', methods=['GET'])
def get_day_study_records(user_id: str, date: str):
    """获取某日学习记录"""
    try:
        records = LearningService.get_day_study_records(user_id, date)

        return jsonify({
            "success": True,
            "data": records
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# 用户认证和授权系统

import hashlib
import jwt
from datetime import datetime, timedelta
from functools import wraps

# 用户数据存储
users_db = {}
user_sessions = {}

# JWT密钥（实际应用中应该使用环境变量）
JWT_SECRET = "ruzhi_secret_key_2024"
JWT_ALGORITHM = "HS256"

class AuthService:
    """用户认证服务"""

    @staticmethod
    def hash_password(password: str) -> str:
        """密码哈希"""
        return hashlib.sha256(password.encode()).hexdigest()

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """验证密码"""
        return AuthService.hash_password(password) == hashed

    @staticmethod
    def generate_token(user_id: str) -> str:
        """生成JWT令牌"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=7),  # 7天过期
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> dict:
        """验证JWT令牌"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return {'valid': True, 'user_id': payload['user_id']}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token已过期'}
        except jwt.InvalidTokenError:
            return {'valid': False, 'error': 'Token无效'}

    @staticmethod
    def create_user(user_data: dict) -> dict:
        """创建用户"""
        user_id = user_data.get('user_id')

        if user_id in users_db:
            return {'success': False, 'error': '用户已存在'}

        # 创建用户记录
        users_db[user_id] = {
            'user_id': user_id,
            'username': user_data.get('username', ''),
            'email': user_data.get('email', ''),
            'password_hash': AuthService.hash_password(user_data.get('password', '')),
            'name': user_data.get('name', '学习者'),
            'avatar': user_data.get('avatar', '/images/default-avatar.png'),
            'level': 'LV.1',
            'title': '初学者',
            'points': 0,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'is_active': True
        }

        return {'success': True, 'user_id': user_id}

    @staticmethod
    def authenticate_user(username: str, password: str) -> dict:
        """用户认证"""
        # 查找用户
        user = None
        for uid, user_data in users_db.items():
            if user_data.get('username') == username or user_data.get('email') == username:
                user = user_data
                break

        if not user:
            return {'success': False, 'error': '用户不存在'}

        if not user.get('is_active'):
            return {'success': False, 'error': '用户已被禁用'}

        if not AuthService.verify_password(password, user['password_hash']):
            return {'success': False, 'error': '密码错误'}

        # 更新最后登录时间
        user['last_login'] = datetime.now().isoformat()

        # 生成令牌
        token = AuthService.generate_token(user['user_id'])

        return {
            'success': True,
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'username': user['username'],
                'name': user['name'],
                'avatar': user['avatar'],
                'level': user['level'],
                'title': user['title'],
                'points': user['points']
            }
        }

    @staticmethod
    def get_user_profile(user_id: str) -> dict:
        """获取用户资料"""
        if user_id not in users_db:
            return {'success': False, 'error': '用户不存在'}

        user = users_db[user_id]
        return {
            'success': True,
            'data': {
                'user_id': user['user_id'],
                'username': user['username'],
                'email': user['email'],
                'name': user['name'],
                'avatar': user['avatar'],
                'level': user['level'],
                'title': user['title'],
                'points': user['points'],
                'created_at': user['created_at'],
                'last_login': user['last_login']
            }
        }

    @staticmethod
    def update_user_profile(user_id: str, update_data: dict) -> dict:
        """更新用户资料"""
        if user_id not in users_db:
            return {'success': False, 'error': '用户不存在'}

        user = users_db[user_id]

        # 允许更新的字段
        allowed_fields = ['name', 'avatar', 'email']

        for field in allowed_fields:
            if field in update_data:
                user[field] = update_data[field]

        return {'success': True, 'message': '资料更新成功'}

def require_auth(f):
    """认证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({
                'success': False,
                'error': '缺少认证令牌'
            }), 401

        # 移除 "Bearer " 前缀
        if token.startswith('Bearer '):
            token = token[7:]

        # 验证令牌
        result = AuthService.verify_token(token)

        if not result['valid']:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 401

        # 将用户ID添加到请求上下文
        request.current_user_id = result['user_id']

        return f(*args, **kwargs)

    return decorated_function

# 用户认证相关API

@app.route('/api/v1/auth/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供注册数据"
            }), 400

        required_fields = ['username', 'password', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"缺少必要字段: {field}"
                }), 400

        # 生成用户ID
        user_id = f"user_{int(datetime.now().timestamp())}"
        data['user_id'] = user_id

        result = AuthService.create_user(data)

        if result['success']:
            return jsonify({
                "success": True,
                "data": {
                    "user_id": result['user_id'],
                    "message": "注册成功"
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": result['error']
            }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供登录数据"
            }), 400

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({
                "success": False,
                "error": "用户名和密码不能为空"
            }), 400

        result = AuthService.authenticate_user(username, password)

        if result['success']:
            return jsonify({
                "success": True,
                "data": {
                    "token": result['token'],
                    "user": result['user']
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": result['error']
            }), 401

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/auth/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id: str):
    """获取用户资料"""
    try:
        result = AuthService.get_user_profile(user_id)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 404

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/auth/profile/<user_id>', methods=['PUT'])
@require_auth
def update_user_profile(user_id: str):
    """更新用户资料"""
    try:
        # 检查权限：只能更新自己的资料
        if request.current_user_id != user_id:
            return jsonify({
                "success": False,
                "error": "无权限更新其他用户资料"
            }), 403

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供更新数据"
            }), 400

        result = AuthService.update_user_profile(user_id, data)

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/auth/verify', methods=['POST'])
def verify_token():
    """验证令牌"""
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({
                "success": False,
                "error": "缺少令牌"
            }), 400

        result = AuthService.verify_token(token)

        if result['valid']:
            user_profile = AuthService.get_user_profile(result['user_id'])
            return jsonify({
                "success": True,
                "data": {
                    "valid": True,
                    "user": user_profile['data'] if user_profile['success'] else None
                }
            })
        else:
            return jsonify({
                "success": False,
                "error": result['error']
            }), 401

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/characters', methods=['GET'])
def get_characters():
    """获取可对话的人物列表"""
    try:
        characters = []
        for char_id, profile in character_profiles.items():
            characters.append({
                "id": profile["id"],
                "name": profile["name"],
                "title": profile["title"],
                "dynasty": profile["dynasty"],
                "description": f"{profile['dynasty']}时期的{profile['title']}，{profile['personality']}",
                "avatar": f"/images/characters/{char_id}.png",
                "tags": profile["core_beliefs"],
                "chatCount": random.randint(20, 200),
                "satisfaction": random.randint(90, 99)
            })

        return jsonify({
            "success": True,
            "data": characters
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/send', methods=['POST'])
def send_chat_message():
    """发送对话消息"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供消息数据"
            }), 400

        user_id = data.get("userId", "anonymous")
        character_id = data.get("characterId")
        message = data.get("message", "")
        conversation_history = data.get("conversationHistory", [])
        settings = data.get("settings", {})

        if not character_id or not message:
            return jsonify({
                "success": False,
                "error": "缺少必要参数"
            }), 400

        # 使用真实AI服务生成回复
        response = RealAIService.generate_character_response(
            message, character_id, conversation_history, settings
        )

        # 如果AI服务失败，回退到模拟服务
        if not response.get('success'):
            logger.warning(f"AI服务失败，使用备用服务: {response.get('error')}")
            response = AICharacterService.generate_response(
                character_id, message, conversation_history, settings
            )
            response['source'] = 'fallback_service'

        return jsonify({
            "success": True,
            "data": response
        })

    except Exception as e:
        logger.error(f"对话生成失败: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/conversations/<user_id>', methods=['GET'])
def get_conversation_history(user_id: str):
    """获取用户对话历史"""
    try:
        # 模拟对话历史数据
        conversations = [
            {
                "id": "conv_001",
                "character": "孔子",
                "characterAvatar": "/images/characters/confucius.png",
                "preview": "学而时习之，不亦说乎？有朋自远方来...",
                "lastMessage": "谢谢老师的指导，我会继续努力学习的。",
                "timestamp": "2024-01-15 14:30",
                "messageCount": 15,
                "messages": [
                    {
                        "id": 1,
                        "role": "assistant",
                        "content": "有朋自远方来，不亦乐乎？我是孔子，很高兴与你交流儒家思想。",
                        "timestamp": "14:25"
                    },
                    {
                        "id": 2,
                        "role": "user",
                        "content": "老师，什么是仁？",
                        "timestamp": "14:26"
                    }
                ]
            },
            {
                "id": "conv_002",
                "character": "老子",
                "characterAvatar": "/images/characters/laozi.png",
                "preview": "道可道，非常道；名可名，非常名...",
                "lastMessage": "感谢您的智慧分享。",
                "timestamp": "2024-01-14 16:20",
                "messageCount": 8,
                "messages": []
            }
        ]

        return jsonify({
            "success": True,
            "data": {
                "conversations": conversations,
                "total": len(conversations)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/character-history/<user_id>/<character_id>', methods=['GET'])
def get_character_history(user_id: str, character_id: str):
    """获取与特定人物的对话历史"""
    try:
        # 模拟返回该人物的对话历史
        messages = []

        # 如果是新对话，返回空消息列表
        if f"{user_id}_{character_id}" not in chat_conversations:
            chat_conversations[f"{user_id}_{character_id}"] = []

        messages = chat_conversations[f"{user_id}_{character_id}"]

        return jsonify({
            "success": True,
            "data": {
                "messages": messages,
                "characterId": character_id
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/save', methods=['POST'])
def save_conversation():
    """保存对话"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "请提供对话数据"
            }), 400

        user_id = data.get("userId", "anonymous")
        character_id = data.get("characterId")
        messages = data.get("messages", [])

        if not character_id:
            return jsonify({
                "success": False,
                "error": "缺少人物ID"
            }), 400

        # 保存对话到内存（实际应用中应保存到数据库）
        conversation_key = f"{user_id}_{character_id}"
        chat_conversations[conversation_key] = messages

        logger.info(f"保存对话: {conversation_key}, 消息数: {len(messages)}")

        return jsonify({
            "success": True,
            "data": {
                "conversationId": conversation_key,
                "messageCount": len(messages)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/v1/chat/delete/<conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id: str):
    """删除对话"""
    try:
        # 从存储中删除对话
        if conversation_id in chat_conversations:
            del chat_conversations[conversation_id]

        logger.info(f"删除对话: {conversation_id}")

        return jsonify({
            "success": True,
            "message": "对话已删除"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ================================
# 经典阅读相关API接口
# ================================

@app.route('/api/v1/classics/annotate', methods=['POST'])
def annotate_classic_text():
    """为经典文本生成AI注释"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        classic_name = data.get('classic', '论语')
        chapter = data.get('chapter', '')

        if not text:
            return jsonify({
                'success': False,
                'error': '待注释文本不能为空'
            })

        # 构建注释提示词
        annotation_prompt = f"""请为以下《{classic_name}》{chapter}中的文本提供详细的注释和解读：

原文："{text}"

请按照以下格式提供注释：

【原文注释】
- 逐字逐句解释文本的字面意思
- 解释重要词汇的含义和用法
- 说明句式结构和语法特点

【思想解读】
- 阐述文本蕴含的哲学思想
- 分析其在整部经典中的地位和作用
- 解释其对后世的影响

【现代理解】
- 用现代语言重新表述文本含义
- 结合现代生活场景举例说明
- 提供实践指导和人生启示

【相关链接】
- 引用相关的其他章节或典籍
- 提及历史上的相关典故或实例
- 推荐进一步阅读的内容

请确保注释准确、深入且易于理解，帮助现代读者更好地理解经典智慧。"""

        # 调用AI服务生成注释
        messages = [
            {'role': 'system', 'content': f'你是一位专门研究《{classic_name}》的国学大师，对经典文献有深入的理解和研究。你的注释既有学术深度又通俗易懂，能够帮助现代读者理解古代智慧。'},
            {'role': 'user', 'content': annotation_prompt}
        ]

        # 使用真实AI服务
        ai_result = RealAIService.call_deepseek_api(messages)

        if ai_result['success']:
            annotation_result = {
                'text': text,
                'classic': classic_name,
                'chapter': chapter,
                'annotation': ai_result['content'],
                'confidence': random.uniform(0.90, 0.98),
                'timestamp': datetime.now().isoformat(),
                'source': 'deepseek_api',
                'response_time': ai_result.get('response_time', 0)
            }
        else:
            # 备用注释
            fallback_annotation = f"""【原文注释】
这段文字出自《{classic_name}》，体现了深刻的人生智慧。从字面意思来看，文本表达了重要的道德理念和处世原则。

【思想解读】
这段话体现了中国传统文化的核心价值观，强调了品德修养、人际关系和社会责任的重要性。在整部经典中，这一思想贯穿始终，对后世产生了深远影响。

【现代理解】
用现代话来说，这段文字告诉我们要注重个人品德的培养，在与他人交往中要保持诚信和善意，同时承担起应有的社会责任。

【相关链接】
这一思想在《{classic_name}》的其他章节中也有体现，建议结合相关内容一起学习，以获得更全面的理解。"""

            annotation_result = {
                'text': text,
                'classic': classic_name,
                'chapter': chapter,
                'annotation': fallback_annotation,
                'confidence': 0.80,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_annotation'
            }

        return jsonify({
            'success': True,
            'data': annotation_result
        })

    except Exception as e:
        logger.error(f"经典文本注释失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'注释失败: {str(e)}'
        })

@app.route('/api/v1/classics/explain', methods=['POST'])
def explain_classic_concept():
    """解释经典中的概念"""
    try:
        data = request.get_json()
        concept = data.get('concept', '').strip()
        classic_name = data.get('classic', '论语')
        context = data.get('context', '')

        if not concept:
            return jsonify({
                'success': False,
                'error': '待解释概念不能为空'
            })

        # 构建概念解释提示词
        explain_prompt = f"""请详细解释《{classic_name}》中的概念"{concept}"：

{f'上下文：{context}' if context else ''}

请从以下几个方面进行解释：

【概念定义】
- 给出"{concept}"的准确定义
- 解释其在《{classic_name}》中的具体含义
- 说明其词源和演变过程

【思想内涵】
- 阐述"{concept}"蕴含的哲学思想
- 分析其在整个思想体系中的地位
- 解释其与其他相关概念的关系

【历史发展】
- 追溯"{concept}"在历史上的发展演变
- 介绍不同时期学者的理解和阐释
- 说明其对后世思想的影响

【现代价值】
- 分析"{concept}"在现代社会的意义
- 提供具体的实践指导
- 举例说明如何在现代生活中体现这一概念

请确保解释准确、全面且具有启发性。"""

        # 调用AI服务生成解释
        messages = [
            {'role': 'system', 'content': f'你是一位专门研究中国传统文化的学者，对《{classic_name}》有深入的研究。你能够准确解释经典中的各种概念，并将其与现代生活相结合。'},
            {'role': 'user', 'content': explain_prompt}
        ]

        # 使用真实AI服务
        ai_result = RealAIService.call_deepseek_api(messages)

        if ai_result['success']:
            explanation_result = {
                'concept': concept,
                'classic': classic_name,
                'context': context,
                'explanation': ai_result['content'],
                'confidence': random.uniform(0.88, 0.95),
                'timestamp': datetime.now().isoformat(),
                'source': 'deepseek_api',
                'response_time': ai_result.get('response_time', 0)
            }
        else:
            # 备用解释
            fallback_explanation = f"""【概念定义】
"{concept}"是《{classic_name}》中的重要概念，体现了深刻的文化内涵和思想价值。

【思想内涵】
这一概念在传统文化中占有重要地位，体现了古代先贤对人生、社会、道德的深入思考。

【历史发展】
"{concept}"的思想在历史上不断发展和完善，对中华文化的传承产生了重要影响。

【现代价值】
在现代社会，这一概念仍然具有重要的指导意义，可以帮助我们更好地理解传统文化的智慧。"""

            explanation_result = {
                'concept': concept,
                'classic': classic_name,
                'context': context,
                'explanation': fallback_explanation,
                'confidence': 0.75,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_explanation'
            }

        return jsonify({
            'success': True,
            'data': explanation_result
        })

    except Exception as e:
        logger.error(f"概念解释失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'解释失败: {str(e)}'
        })

# ================================
# 知识图谱相关API接口
# ================================

@app.route('/api/v1/knowledge/concept/<concept_name>', methods=['GET'])
def get_concept_details(concept_name: str):
    """获取知识图谱概念的详细信息"""
    try:
        # 构建概念详情提示词
        concept_prompt = f"""请详细介绍中国传统文化中的概念"{concept_name}"：

请从以下几个方面进行介绍：

【基本定义】
- 给出"{concept_name}"的准确定义和核心含义
- 解释其在传统文化中的地位和重要性

【历史渊源】
- 追溯"{concept_name}"的历史起源和发展脉络
- 介绍相关的历史人物和典籍

【思想内涵】
- 深入阐述"{concept_name}"的哲学思想和文化内涵
- 分析其与其他相关概念的关系

【实践应用】
- 说明"{concept_name}"在古代社会的实际应用
- 举例说明其在历史上的具体体现

【现代意义】
- 分析"{concept_name}"在现代社会的价值和意义
- 提供现代人如何理解和实践这一概念的建议

请确保内容准确、全面且具有启发性，字数控制在400-800字之间。"""

        # 调用AI服务生成概念详情
        messages = [
            {'role': 'system', 'content': '你是一位专门研究中国传统文化的学者，对各种文化概念有深入的理解和研究。你能够准确、全面地介绍传统文化概念，并将其与现代生活相结合。'},
            {'role': 'user', 'content': concept_prompt}
        ]

        # 使用真实AI服务
        ai_result = RealAIService.call_deepseek_api(messages)

        if ai_result['success']:
            concept_details = {
                'name': concept_name,
                'description': ai_result['content'],
                'confidence': random.uniform(0.88, 0.96),
                'timestamp': datetime.now().isoformat(),
                'source': 'deepseek_api',
                'response_time': ai_result.get('response_time', 0),
                'related_concepts': RealAIService._get_related_concepts(concept_name),
                'category': RealAIService._get_concept_category(concept_name)
            }
        else:
            # 备用概念详情
            fallback_descriptions = {
                '仁': '仁是儒家思想的核心概念，强调人与人之间的关爱和善意。孔子认为"仁者爱人"，这是做人的根本原则。在现代社会，仁的思想体现为同情心、责任感和社会关怀。',
                '义': '义是指道德上的正确行为和原则。它要求人们在面对选择时，要选择正确的、符合道德标准的行为，即使可能会带来个人损失。',
                '礼': '礼是规范人们行为的准则和仪式。它不仅是外在的行为规范，更是内在品德的体现。通过礼的实践，可以培养人的道德品质。',
                '智': '智是指智慧和知识。在传统文化中，智不仅指学问和技能，更重要的是指明辨是非、洞察事理的能力。',
                '信': '信是指诚信和信用。它是人际关系的基础，也是社会秩序的保障。孔子说"人而无信，不知其可也"。',
                '道': '道是道家哲学的核心概念，指宇宙万物的根本规律和本源。老子认为"道法自然"，强调顺应自然规律的重要性。'
            }

            concept_details = {
                'name': concept_name,
                'description': fallback_descriptions.get(concept_name, f'"{concept_name}"是中国传统文化中的重要概念，体现了深刻的文化内涵和思想价值。它在历史上对中华文明的发展产生了重要影响，在现代社会仍然具有重要的指导意义。'),
                'confidence': 0.80,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_description',
                'related_concepts': RealAIService._get_related_concepts(concept_name),
                'category': RealAIService._get_concept_category(concept_name)
            }

        return jsonify({
            'success': True,
            'data': concept_details
        })

    except Exception as e:
        logger.error(f"获取概念详情失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        })

@app.route('/api/v1/knowledge/relationships', methods=['GET'])
def get_concept_relationships():
    """获取知识图谱中概念之间的关系"""
    try:
        # 返回预定义的概念关系数据
        relationships = [
            {'source': '仁', 'target': '义', 'relation': '相辅相成', 'strength': 0.9},
            {'source': '仁', 'target': '礼', 'relation': '内外统一', 'strength': 0.8},
            {'source': '义', 'target': '礼', 'relation': '道德规范', 'strength': 0.7},
            {'source': '智', 'target': '仁', 'relation': '智仁结合', 'strength': 0.8},
            {'source': '信', 'target': '义', 'relation': '诚信正义', 'strength': 0.9},
            {'source': '道', 'target': '德', 'relation': '道德一体', 'strength': 0.95},
            {'source': '道', 'target': '自然', 'relation': '道法自然', 'strength': 0.9},
            {'source': '德', 'target': '仁', 'relation': '德仁并重', 'strength': 0.8}
        ]

        return jsonify({
            'success': True,
            'data': relationships
        })

    except Exception as e:
        logger.error(f"获取概念关系失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        })

# ================================
# API配置管理路由
# ================================

@app.route('/api/v1/config/test', methods=['POST'])
def test_api_config():
    """测试API配置连接"""
    try:
        data = request.get_json()
        api_key = data.get('apiKey', '').strip()
        base_url = data.get('baseUrl', '').strip()
        model = data.get('model', 'deepseek-chat')

        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API密钥不能为空'
            })

        if not base_url:
            return jsonify({
                'success': False,
                'error': 'API基础URL不能为空'
            })

        # 构建测试请求
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

        test_data = {
            'model': model,
            'messages': [
                {'role': 'user', 'content': '你好，这是一个连接测试。'}
            ],
            'max_tokens': 50,
            'temperature': 0.7
        }

        start_time = time.time()

        # 发送测试请求
        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=test_data,
            timeout=10
        )

        response_time = int((time.time() - start_time) * 1000)

        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'API连接测试成功',
                'responseTime': response_time,
                'model': model
            })
        else:
            return jsonify({
                'success': False,
                'error': f'API返回错误: {response.status_code} - {response.text[:200]}'
            })

    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'API请求超时，请检查网络连接'
        })
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'error': '无法连接到API服务器，请检查URL是否正确'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'测试失败: {str(e)}'
        })

@app.route('/api/v1/config/save', methods=['POST'])
def save_api_config():
    """保存API配置"""
    try:
        data = request.get_json()

        # 更新配置
        api_config_storage.update({
            'apiKey': data.get('apiKey', '').strip(),
            'baseUrl': data.get('baseUrl', '').strip(),
            'model': data.get('model', 'deepseek-chat'),
            'temperature': float(data.get('temperature', 0.7)),
            'maxTokens': int(data.get('maxTokens', 2000)),
            'timeout': int(data.get('timeout', 30))
        })

        # 更新全局AI配置
        AI_API_CONFIG['deepseek'].update({
            'api_key': api_config_storage['apiKey'],
            'base_url': api_config_storage['baseUrl'],
            'model': api_config_storage['model'],
            'max_tokens': api_config_storage['maxTokens'],
            'temperature': api_config_storage['temperature']
        })

        logger.info(f"API配置已更新: {api_config_storage['model']}")

        return jsonify({
            'success': True,
            'message': 'API配置保存成功'
        })

    except Exception as e:
        logger.error(f"保存API配置失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'保存失败: {str(e)}'
        })

@app.route('/api/v1/config/load', methods=['GET'])
def load_api_config():
    """加载API配置"""
    try:
        # 返回配置（隐藏API密钥的部分内容）
        config = api_config_storage.copy()
        if config['apiKey']:
            # 只显示前4位和后4位
            key = config['apiKey']
            if len(key) > 8:
                config['apiKey'] = key[:4] + '*' * (len(key) - 8) + key[-4:]

        return jsonify({
            'success': True,
            'config': config
        })

    except Exception as e:
        logger.error(f"加载API配置失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'加载失败: {str(e)}'
        })

@app.route('/api/v1/stats', methods=['GET'])
def get_api_stats():
    """获取API使用统计"""
    try:
        # 计算成功率
        total_requests = api_stats['totalRequests']
        success_rate = 0
        if total_requests > 0:
            success_rate = round((api_stats['successfulRequests'] / total_requests) * 100, 1)

        # 计算平均响应时间
        avg_response_time = 0
        if api_stats['successfulRequests'] > 0:
            avg_response_time = round(api_stats['totalResponseTime'] / api_stats['successfulRequests'])

        # 检查是否是今天的请求
        today = datetime.now().date()
        if api_stats['lastRequestDate'] != today:
            api_stats['todayRequests'] = 0

        return jsonify({
            'success': True,
            'stats': {
                'totalRequests': total_requests,
                'successRate': success_rate,
                'avgResponseTime': avg_response_time,
                'todayRequests': api_stats['todayRequests']
            }
        })

    except Exception as e:
        logger.error(f"获取API统计失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取统计失败: {str(e)}'
        })

@app.route('/api/v1/stats/clear', methods=['POST'])
def clear_api_stats():
    """清空API统计"""
    try:
        api_stats.update({
            'totalRequests': 0,
            'successfulRequests': 0,
            'failedRequests': 0,
            'totalResponseTime': 0,
            'todayRequests': 0,
            'lastRequestDate': None
        })

        logger.info("API统计数据已清空")

        return jsonify({
            'success': True,
            'message': '统计数据已清空'
        })

    except Exception as e:
        logger.error(f"清空API统计失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'清空失败: {str(e)}'
        })

if __name__ == '__main__':
    init_mock_data()
    app.run(debug=True, host='0.0.0.0', port=8000)
