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
from typing import Dict, List, Any

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置日志
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

        # 生成AI回复
        response = AICharacterService.generate_response(
            character_id, message, conversation_history, settings
        )

        # 模拟处理时间
        import time
        time.sleep(random.uniform(1, 3))

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

if __name__ == '__main__':
    init_mock_data()
    app.run(debug=True, host='0.0.0.0', port=8000)
