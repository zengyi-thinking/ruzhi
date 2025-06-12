"""
学习中心服务模块
"""
import random
import uuid
from datetime import datetime
from typing import Dict, List, Any
import logging

from models.data_storage import learning_data, user_profiles, study_plans, achievements_data, study_records

logger = logging.getLogger(__name__)

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

    @staticmethod
    def get_user_recommendations(user_id: str) -> List[Dict]:
        """获取用户个性化推荐"""
        recommendations = [
            {
                'id': 'rec_001',
                'type': 'classic',
                'title': '推荐阅读《道德经》',
                'description': '基于您对哲学思想的兴趣，推荐深入学习老子的道家思想',
                'priority': 'high',
                'estimatedTime': '2小时',
                'difficulty': '中等'
            },
            {
                'id': 'rec_002',
                'type': 'dialogue',
                'title': '与朱熹对话',
                'description': '探讨理学思想，了解宋代哲学的发展',
                'priority': 'medium',
                'estimatedTime': '30分钟',
                'difficulty': '困难'
            },
            {
                'id': 'rec_003',
                'type': 'practice',
                'title': 'OCR练习：识别古籍',
                'description': '通过实际练习提高古籍识别能力',
                'priority': 'low',
                'estimatedTime': '15分钟',
                'difficulty': '简单'
            }
        ]
        
        return recommendations

    @staticmethod
    def get_learning_paths(user_id: str) -> List[Dict]:
        """获取学习路径"""
        paths = [
            {
                'id': 'path_confucian',
                'title': '儒家思想学习路径',
                'description': '系统学习儒家经典，从论语到孟子再到朱熹理学',
                'steps': [
                    {'title': '《论语》基础', 'completed': True},
                    {'title': '孔子思想深度解读', 'completed': True},
                    {'title': '《孟子》学习', 'completed': False},
                    {'title': '朱熹理学', 'completed': False}
                ],
                'progress': 50,
                'estimatedTime': '20小时'
            },
            {
                'id': 'path_taoist',
                'title': '道家思想学习路径',
                'description': '深入理解道家哲学，从老子到庄子的思想演进',
                'steps': [
                    {'title': '《道德经》入门', 'completed': False},
                    {'title': '老子哲学思想', 'completed': False},
                    {'title': '《庄子》选读', 'completed': False},
                    {'title': '道家文化实践', 'completed': False}
                ],
                'progress': 0,
                'estimatedTime': '25小时'
            }
        ]
        
        return paths

    @staticmethod
    def get_conversation_summary(user_id: str) -> Dict:
        """获取对话总结"""
        return {
            'totalConversations': random.randint(15, 50),
            'favoriteCharacter': random.choice(['孔子', '老子', '孟子']),
            'totalMessages': random.randint(100, 300),
            'averageLength': random.randint(50, 150),
            'topTopics': ['仁爱', '道德', '教育', '修身', '治国'],
            'recentActivity': [
                {
                    'date': '2024-01-15',
                    'character': '孔子',
                    'topic': '教育理念',
                    'messages': 8
                },
                {
                    'date': '2024-01-14',
                    'character': '老子',
                    'topic': '道法自然',
                    'messages': 12
                }
            ]
        }

    @staticmethod
    def analyze_learning_data(user_id: str, data: Dict) -> Dict:
        """分析学习数据"""
        # 模拟AI分析结果
        analysis = {
            'strengths': ['古文理解能力强', '对哲学思想有深入思考', '学习持续性好'],
            'improvements': ['可以增加实践应用', '建议多样化学习内容', '加强与不同人物的对话'],
            'recommendations': [
                '建议每日保持30分钟的经典阅读',
                '尝试与更多历史人物对话，拓展视野',
                '结合现代生活实践传统文化智慧'
            ],
            'nextSteps': [
                '完成《论语》全篇阅读',
                '开始《道德经》的学习',
                '参与更多OCR识别练习'
            ],
            'confidence': random.uniform(0.85, 0.95)
        }
        
        return analysis

    @staticmethod
    def record_learning_session(user_id: str, session_data: Dict) -> Dict:
        """记录学习会话"""
        session = {
            'id': str(uuid.uuid4()),
            'user_id': user_id,
            'type': session_data.get('type', 'general'),
            'duration': session_data.get('duration', 0),
            'content': session_data.get('content', ''),
            'score': session_data.get('score', 0),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"记录学习会话: {session['id']}")
        
        return {
            'success': True,
            'session_id': session['id']
        }
