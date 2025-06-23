"""
学习效果评估服务
通过多维度数据分析评估用户学习效果，提供个性化学习建议
"""
import json
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from utils.logging_config import get_logger
from services.spaced_repetition_service import spaced_repetition_service

logger = get_logger('learning_assessment')

class LearningLevel(Enum):
    """学习水平枚举"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class AssessmentType(Enum):
    """评估类型枚举"""
    KNOWLEDGE_TEST = "knowledge_test"
    COMPREHENSION_CHECK = "comprehension_check"
    APPLICATION_TASK = "application_task"
    SYNTHESIS_CHALLENGE = "synthesis_challenge"

@dataclass
class LearningMetrics:
    """学习指标数据结构"""
    user_id: str
    
    # 基础指标
    total_study_time: int = 0  # 总学习时间（分钟）
    concepts_learned: int = 0  # 学习的概念数量
    concepts_mastered: int = 0  # 掌握的概念数量
    characters_interacted: int = 0  # 互动的人物数量
    
    # 参与度指标
    session_count: int = 0  # 学习会话数
    average_session_duration: float = 0.0  # 平均会话时长
    streak_days: int = 0  # 连续学习天数
    engagement_score: float = 0.0  # 参与度评分
    
    # 表现指标
    quiz_scores: List[float] = None  # 测试分数列表
    average_quiz_score: float = 0.0  # 平均测试分数
    improvement_rate: float = 0.0  # 进步率
    retention_rate: float = 0.0  # 知识保持率
    
    # 行为指标
    question_asking_frequency: float = 0.0  # 提问频率
    deep_thinking_indicators: int = 0  # 深度思考指标
    cross_domain_connections: int = 0  # 跨领域连接数
    
    def __post_init__(self):
        if self.quiz_scores is None:
            self.quiz_scores = []

class LearningAssessmentService:
    """学习效果评估服务"""
    
    def __init__(self):
        self.user_metrics = {}  # 存储用户学习指标
        self.assessment_history = {}  # 评估历史
        
    def collect_learning_data(self, user_id: str, activity_data: Dict[str, Any]):
        """收集学习数据"""
        try:
            if user_id not in self.user_metrics:
                self.user_metrics[user_id] = LearningMetrics(user_id=user_id)
            
            metrics = self.user_metrics[user_id]
            activity_type = activity_data.get('type')
            
            if activity_type == 'study_session':
                self._update_study_session_metrics(metrics, activity_data)
            elif activity_type == 'concept_learning':
                self._update_concept_metrics(metrics, activity_data)
            elif activity_type == 'character_interaction':
                self._update_interaction_metrics(metrics, activity_data)
            elif activity_type == 'quiz_completion':
                self._update_quiz_metrics(metrics, activity_data)
            elif activity_type == 'question_asking':
                self._update_question_metrics(metrics, activity_data)
            
            logger.info(f"更新用户 {user_id} 学习数据: {activity_type}")
            
        except Exception as e:
            logger.error(f"收集学习数据失败: {e}")
    
    def _update_study_session_metrics(self, metrics: LearningMetrics, data: Dict[str, Any]):
        """更新学习会话指标"""
        duration = data.get('duration', 0)  # 分钟
        
        metrics.total_study_time += duration
        metrics.session_count += 1
        
        # 更新平均会话时长
        metrics.average_session_duration = metrics.total_study_time / metrics.session_count
        
        # 更新参与度评分
        engagement = data.get('engagement_score', 0.5)
        metrics.engagement_score = (metrics.engagement_score + engagement) / 2
    
    def _update_concept_metrics(self, metrics: LearningMetrics, data: Dict[str, Any]):
        """更新概念学习指标"""
        if data.get('is_new_concept'):
            metrics.concepts_learned += 1
        
        if data.get('mastery_level', 0) >= 0.8:
            metrics.concepts_mastered += 1
        
        # 检查跨领域连接
        if data.get('cross_domain_connection'):
            metrics.cross_domain_connections += 1
    
    def _update_interaction_metrics(self, metrics: LearningMetrics, data: Dict[str, Any]):
        """更新互动指标"""
        character_id = data.get('character_id')
        if character_id:
            # 这里应该检查是否是新的人物互动
            metrics.characters_interacted += 1
        
        # 检查深度思考指标
        if data.get('deep_thinking_detected'):
            metrics.deep_thinking_indicators += 1
    
    def _update_quiz_metrics(self, metrics: LearningMetrics, data: Dict[str, Any]):
        """更新测试指标"""
        score = data.get('score', 0)
        metrics.quiz_scores.append(score)
        
        # 更新平均分数
        metrics.average_quiz_score = sum(metrics.quiz_scores) / len(metrics.quiz_scores)
        
        # 计算进步率
        if len(metrics.quiz_scores) >= 2:
            recent_scores = metrics.quiz_scores[-5:]  # 最近5次
            early_scores = metrics.quiz_scores[:5]    # 最早5次
            
            if len(early_scores) >= 2:
                recent_avg = sum(recent_scores) / len(recent_scores)
                early_avg = sum(early_scores) / len(early_scores)
                metrics.improvement_rate = (recent_avg - early_avg) / early_avg
    
    def _update_question_metrics(self, metrics: LearningMetrics, data: Dict[str, Any]):
        """更新提问指标"""
        # 计算提问频率（每小时提问次数）
        if metrics.total_study_time > 0:
            metrics.question_asking_frequency = (
                data.get('question_count', 1) / (metrics.total_study_time / 60)
            )
    
    def assess_learning_level(self, user_id: str) -> Dict[str, Any]:
        """评估用户学习水平"""
        try:
            if user_id not in self.user_metrics:
                return {
                    'level': LearningLevel.BEGINNER.value,
                    'confidence': 0.0,
                    'areas_of_strength': [],
                    'areas_for_improvement': [],
                    'recommendations': []
                }
            
            metrics = self.user_metrics[user_id]
            
            # 计算各维度得分
            knowledge_score = self._calculate_knowledge_score(metrics)
            engagement_score = self._calculate_engagement_score(metrics)
            performance_score = self._calculate_performance_score(metrics)
            consistency_score = self._calculate_consistency_score(metrics)
            
            # 综合评分
            overall_score = (
                knowledge_score * 0.3 +
                engagement_score * 0.2 +
                performance_score * 0.3 +
                consistency_score * 0.2
            )
            
            # 确定学习水平
            level = self._determine_learning_level(overall_score, metrics)
            
            # 分析优势和改进领域
            strengths, improvements = self._analyze_strengths_and_improvements(
                knowledge_score, engagement_score, performance_score, consistency_score
            )
            
            # 生成建议
            recommendations = self._generate_recommendations(metrics, level, improvements)
            
            assessment = {
                'level': level.value,
                'overall_score': round(overall_score, 2),
                'confidence': self._calculate_confidence(metrics),
                'dimension_scores': {
                    'knowledge': round(knowledge_score, 2),
                    'engagement': round(engagement_score, 2),
                    'performance': round(performance_score, 2),
                    'consistency': round(consistency_score, 2)
                },
                'areas_of_strength': strengths,
                'areas_for_improvement': improvements,
                'recommendations': recommendations,
                'assessment_date': datetime.now().isoformat()
            }
            
            # 保存评估历史
            if user_id not in self.assessment_history:
                self.assessment_history[user_id] = []
            self.assessment_history[user_id].append(assessment)
            
            return assessment
            
        except Exception as e:
            logger.error(f"评估学习水平失败: {e}")
            return {'error': str(e)}
    
    def _calculate_knowledge_score(self, metrics: LearningMetrics) -> float:
        """计算知识掌握得分"""
        if metrics.concepts_learned == 0:
            return 0.0
        
        # 基础知识量得分
        knowledge_breadth = min(metrics.concepts_learned / 50, 1.0)  # 50个概念为满分
        
        # 知识深度得分
        mastery_rate = metrics.concepts_mastered / metrics.concepts_learned
        knowledge_depth = mastery_rate
        
        # 跨领域连接得分
        connection_score = min(metrics.cross_domain_connections / 10, 1.0)
        
        return (knowledge_breadth * 0.4 + knowledge_depth * 0.4 + connection_score * 0.2) * 100
    
    def _calculate_engagement_score(self, metrics: LearningMetrics) -> float:
        """计算参与度得分"""
        # 学习时间得分
        time_score = min(metrics.total_study_time / 1200, 1.0)  # 1200分钟为满分
        
        # 会话质量得分
        session_quality = min(metrics.average_session_duration / 60, 1.0)  # 60分钟为满分
        
        # 互动多样性得分
        interaction_diversity = min(metrics.characters_interacted / 10, 1.0)
        
        # 参与度评分
        engagement = metrics.engagement_score
        
        return (time_score * 0.3 + session_quality * 0.2 + 
                interaction_diversity * 0.2 + engagement * 0.3) * 100
    
    def _calculate_performance_score(self, metrics: LearningMetrics) -> float:
        """计算表现得分"""
        if not metrics.quiz_scores:
            return 50.0  # 默认中等分数
        
        # 平均分数
        avg_score = metrics.average_quiz_score
        
        # 进步率加成
        improvement_bonus = max(0, metrics.improvement_rate * 20)
        
        # 深度思考加成
        thinking_bonus = min(metrics.deep_thinking_indicators * 2, 20)
        
        return min(avg_score + improvement_bonus + thinking_bonus, 100)
    
    def _calculate_consistency_score(self, metrics: LearningMetrics) -> float:
        """计算一致性得分"""
        # 连续学习天数得分
        streak_score = min(metrics.streak_days / 30, 1.0) * 50  # 30天为满分
        
        # 会话频率得分
        if metrics.session_count > 0:
            # 假设理想频率是每天一次会话
            ideal_sessions = metrics.streak_days if metrics.streak_days > 0 else 1
            frequency_score = min(metrics.session_count / ideal_sessions, 1.0) * 50
        else:
            frequency_score = 0
        
        return streak_score + frequency_score
    
    def _determine_learning_level(self, overall_score: float, metrics: LearningMetrics) -> LearningLevel:
        """确定学习水平"""
        # 基于综合得分和特定指标判断
        if overall_score >= 85 and metrics.concepts_mastered >= 30:
            return LearningLevel.EXPERT
        elif overall_score >= 70 and metrics.concepts_mastered >= 15:
            return LearningLevel.ADVANCED
        elif overall_score >= 50 and metrics.concepts_learned >= 10:
            return LearningLevel.INTERMEDIATE
        else:
            return LearningLevel.BEGINNER
    
    def _calculate_confidence(self, metrics: LearningMetrics) -> float:
        """计算评估置信度"""
        # 基于数据量和多样性计算置信度
        data_points = (
            metrics.session_count +
            len(metrics.quiz_scores) +
            metrics.characters_interacted +
            metrics.concepts_learned
        )
        
        return min(data_points / 50, 1.0)  # 50个数据点为满置信度
    
    def _analyze_strengths_and_improvements(self, knowledge: float, engagement: float,
                                          performance: float, consistency: float) -> Tuple[List[str], List[str]]:
        """分析优势和改进领域"""
        scores = {
            'knowledge': knowledge,
            'engagement': engagement,
            'performance': performance,
            'consistency': consistency
        }
        
        # 找出优势（得分>75）和需要改进的领域（得分<60）
        strengths = [area for area, score in scores.items() if score > 75]
        improvements = [area for area, score in scores.items() if score < 60]
        
        # 转换为中文描述
        area_names = {
            'knowledge': '知识掌握',
            'engagement': '学习参与度',
            'performance': '学习表现',
            'consistency': '学习一致性'
        }
        
        strengths = [area_names[area] for area in strengths]
        improvements = [area_names[area] for area in improvements]
        
        return strengths, improvements
    
    def _generate_recommendations(self, metrics: LearningMetrics, level: LearningLevel,
                                improvements: List[str]) -> List[str]:
        """生成个性化学习建议"""
        recommendations = []
        
        # 基于学习水平的建议
        if level == LearningLevel.BEGINNER:
            recommendations.extend([
                "建议从基础概念开始，循序渐进地学习",
                "多与不同的历史人物对话，了解多元观点",
                "保持每日学习习惯，建立学习节奏"
            ])
        elif level == LearningLevel.INTERMEDIATE:
            recommendations.extend([
                "尝试深入理解概念之间的联系",
                "挑战更复杂的学习内容",
                "参与讨论，分享学习心得"
            ])
        elif level == LearningLevel.ADVANCED:
            recommendations.extend([
                "探索传统文化在现代的应用",
                "尝试创造性地运用所学知识",
                "指导其他学习者，巩固自己的理解"
            ])
        
        # 基于改进领域的建议
        if '知识掌握' in improvements:
            recommendations.append("增加学习时间，扩大知识面")
        if '学习参与度' in improvements:
            recommendations.append("提高学习专注度，增加互动频率")
        if '学习表现' in improvements:
            recommendations.append("多做练习测试，巩固所学知识")
        if '学习一致性' in improvements:
            recommendations.append("建立固定的学习时间，保持学习连续性")
        
        # 基于具体指标的建议
        if metrics.question_asking_frequency < 0.5:
            recommendations.append("鼓励主动提问，加深理解")
        if metrics.cross_domain_connections < 3:
            recommendations.append("尝试将不同领域的知识联系起来")
        
        return recommendations[:5]  # 最多返回5个建议
    
    def generate_learning_report(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """生成学习报告"""
        try:
            assessment = self.assess_learning_level(user_id)
            metrics = self.user_metrics.get(user_id)
            
            if not metrics:
                return {'error': '用户学习数据不足'}
            
            # 获取复习统计
            review_stats = spaced_repetition_service.get_review_statistics(user_id)
            
            # 计算学习效率
            efficiency = self._calculate_learning_efficiency(metrics)
            
            # 生成趋势分析
            trends = self._analyze_learning_trends(user_id)
            
            report = {
                'user_id': user_id,
                'report_period': f"最近{period_days}天",
                'generated_at': datetime.now().isoformat(),
                
                # 总体评估
                'overall_assessment': assessment,
                
                # 学习统计
                'learning_statistics': {
                    'total_study_time': f"{metrics.total_study_time // 60}小时{metrics.total_study_time % 60}分钟",
                    'concepts_learned': metrics.concepts_learned,
                    'concepts_mastered': metrics.concepts_mastered,
                    'mastery_rate': f"{(metrics.concepts_mastered / max(metrics.concepts_learned, 1) * 100):.1f}%",
                    'average_session_duration': f"{metrics.average_session_duration:.1f}分钟",
                    'streak_days': metrics.streak_days,
                    'characters_interacted': metrics.characters_interacted
                },
                
                # 复习统计
                'review_statistics': review_stats,
                
                # 学习效率
                'learning_efficiency': efficiency,
                
                # 趋势分析
                'trends': trends,
                
                # 下一步建议
                'next_steps': self._generate_next_steps(metrics, assessment)
            }
            
            return report
            
        except Exception as e:
            logger.error(f"生成学习报告失败: {e}")
            return {'error': str(e)}
    
    def _calculate_learning_efficiency(self, metrics: LearningMetrics) -> Dict[str, float]:
        """计算学习效率"""
        if metrics.total_study_time == 0:
            return {'concepts_per_hour': 0, 'mastery_per_hour': 0}
        
        hours = metrics.total_study_time / 60
        
        return {
            'concepts_per_hour': round(metrics.concepts_learned / hours, 2),
            'mastery_per_hour': round(metrics.concepts_mastered / hours, 2),
            'efficiency_score': round((metrics.concepts_mastered / hours) * 10, 1)
        }
    
    def _analyze_learning_trends(self, user_id: str) -> Dict[str, Any]:
        """分析学习趋势"""
        if user_id not in self.assessment_history:
            return {'trend': 'insufficient_data'}
        
        history = self.assessment_history[user_id]
        if len(history) < 2:
            return {'trend': 'insufficient_data'}
        
        # 比较最近两次评估
        recent = history[-1]
        previous = history[-2]
        
        score_change = recent['overall_score'] - previous['overall_score']
        
        if score_change > 5:
            trend = 'improving'
        elif score_change < -5:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'score_change': round(score_change, 2),
            'assessment_count': len(history)
        }
    
    def _generate_next_steps(self, metrics: LearningMetrics, assessment: Dict[str, Any]) -> List[str]:
        """生成下一步建议"""
        next_steps = []
        
        level = assessment['level']
        improvements = assessment['areas_for_improvement']
        
        if level == 'beginner':
            next_steps.append("完成基础概念学习模块")
            next_steps.append("与至少3个不同的历史人物对话")
        elif level == 'intermediate':
            next_steps.append("挑战高级概念学习")
            next_steps.append("参与社区讨论")
        elif level == 'advanced':
            next_steps.append("探索跨领域知识连接")
            next_steps.append("创建学习内容分享")
        
        # 基于改进领域添加具体步骤
        if '学习一致性' in improvements:
            next_steps.append("设定每日学习目标并坚持执行")
        
        return next_steps[:3]  # 最多3个下一步建议

# 全局学习评估服务实例
learning_assessment_service = LearningAssessmentService()
