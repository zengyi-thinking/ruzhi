"""
间隔重复学习服务
基于遗忘曲线和SuperMemo算法实现智能复习提醒
"""
import math
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

from utils.logging_config import get_logger
from services.enhanced_knowledge_service import enhanced_knowledge_service

logger = get_logger('spaced_repetition')

class ReviewResult(Enum):
    """复习结果枚举"""
    AGAIN = 0      # 完全不记得，需要重新学习
    HARD = 1       # 记得但很困难
    GOOD = 2       # 记得，正常难度
    EASY = 3       # 很容易记得

@dataclass
class ReviewCard:
    """复习卡片数据结构"""
    id: str
    user_id: str
    content_id: str
    content_type: str  # 'concept', 'quote', 'story', 'character'
    content_title: str
    content_data: Dict[str, Any]
    
    # SuperMemo算法参数
    easiness_factor: float = 2.5  # 难度因子 (1.3-2.5)
    interval: int = 1             # 复习间隔（天）
    repetitions: int = 0          # 重复次数
    
    # 时间信息
    created_at: datetime = None
    last_reviewed: Optional[datetime] = None
    next_review: datetime = None
    
    # 统计信息
    total_reviews: int = 0
    correct_reviews: int = 0
    average_response_time: float = 0.0
    difficulty_rating: float = 0.5  # 0-1，用户主观难度评分
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.next_review is None:
            self.next_review = datetime.now()

class SpacedRepetitionService:
    """间隔重复学习服务"""
    
    def __init__(self):
        self.cards = {}  # 存储所有复习卡片
        self.user_settings = {}  # 用户个性化设置
        
    def create_review_card(self, user_id: str, content_id: str, 
                          content_type: str, content_data: Dict[str, Any]) -> ReviewCard:
        """创建新的复习卡片"""
        try:
            card_id = f"{user_id}_{content_type}_{content_id}"
            
            # 检查是否已存在
            if card_id in self.cards:
                return self.cards[card_id]
            
            # 创建新卡片
            card = ReviewCard(
                id=card_id,
                user_id=user_id,
                content_id=content_id,
                content_type=content_type,
                content_title=content_data.get('title', ''),
                content_data=content_data,
                next_review=datetime.now() + timedelta(days=1)  # 第一次复习在1天后
            )
            
            self.cards[card_id] = card
            
            logger.info(f"创建复习卡片: {card_id}")
            return card
            
        except Exception as e:
            logger.error(f"创建复习卡片失败: {e}")
            raise
    
    def review_card(self, card_id: str, result: ReviewResult, 
                   response_time: float = None, difficulty_rating: float = None) -> ReviewCard:
        """处理卡片复习结果"""
        try:
            if card_id not in self.cards:
                raise ValueError(f"卡片不存在: {card_id}")
            
            card = self.cards[card_id]
            now = datetime.now()
            
            # 更新统计信息
            card.last_reviewed = now
            card.total_reviews += 1
            
            if result in [ReviewResult.GOOD, ReviewResult.EASY]:
                card.correct_reviews += 1
            
            # 更新平均响应时间
            if response_time is not None:
                if card.average_response_time == 0:
                    card.average_response_time = response_time
                else:
                    card.average_response_time = (card.average_response_time + response_time) / 2
            
            # 更新难度评分
            if difficulty_rating is not None:
                card.difficulty_rating = difficulty_rating
            
            # 应用SuperMemo算法
            self._apply_supermemo_algorithm(card, result)
            
            # 计算下次复习时间
            card.next_review = now + timedelta(days=card.interval)
            
            logger.info(f"复习卡片 {card_id}: 结果={result.name}, 下次复习={card.next_review}")
            return card
            
        except Exception as e:
            logger.error(f"处理复习结果失败: {e}")
            raise
    
    def _apply_supermemo_algorithm(self, card: ReviewCard, result: ReviewResult):
        """应用SuperMemo算法计算下次复习间隔"""
        if result == ReviewResult.AGAIN:
            # 完全不记得，重置
            card.repetitions = 0
            card.interval = 1
            card.easiness_factor = max(1.3, card.easiness_factor - 0.2)
            
        elif result == ReviewResult.HARD:
            # 困难，稍微增加间隔
            card.repetitions += 1
            card.interval = max(1, int(card.interval * 1.2))
            card.easiness_factor = max(1.3, card.easiness_factor - 0.15)
            
        elif result == ReviewResult.GOOD:
            # 正常，按标准算法
            card.repetitions += 1
            if card.repetitions == 1:
                card.interval = 1
            elif card.repetitions == 2:
                card.interval = 6
            else:
                card.interval = int(card.interval * card.easiness_factor)
                
        elif result == ReviewResult.EASY:
            # 简单，大幅增加间隔
            card.repetitions += 1
            if card.repetitions == 1:
                card.interval = 4
            elif card.repetitions == 2:
                card.interval = 10
            else:
                card.interval = int(card.interval * card.easiness_factor * 1.3)
            
            card.easiness_factor = min(2.5, card.easiness_factor + 0.1)
        
        # 应用个性化调整
        card.interval = self._apply_personalization(card)
        
        # 限制最大间隔
        card.interval = min(card.interval, 365)  # 最长一年
    
    def _apply_personalization(self, card: ReviewCard) -> int:
        """应用个性化调整"""
        interval = card.interval
        
        # 基于用户历史表现调整
        if card.total_reviews > 0:
            accuracy = card.correct_reviews / card.total_reviews
            if accuracy < 0.6:  # 准确率低，缩短间隔
                interval = int(interval * 0.8)
            elif accuracy > 0.9:  # 准确率高，延长间隔
                interval = int(interval * 1.2)
        
        # 基于响应时间调整
        if card.average_response_time > 0:
            if card.average_response_time > 10:  # 响应时间长，缩短间隔
                interval = int(interval * 0.9)
            elif card.average_response_time < 3:  # 响应时间短，延长间隔
                interval = int(interval * 1.1)
        
        # 基于主观难度调整
        if card.difficulty_rating > 0.7:  # 主观感觉困难
            interval = int(interval * 0.8)
        elif card.difficulty_rating < 0.3:  # 主观感觉简单
            interval = int(interval * 1.2)
        
        return max(1, interval)
    
    def get_due_cards(self, user_id: str, limit: int = 20) -> List[ReviewCard]:
        """获取需要复习的卡片"""
        try:
            now = datetime.now()
            due_cards = []
            
            for card in self.cards.values():
                if (card.user_id == user_id and 
                    card.next_review <= now):
                    due_cards.append(card)
            
            # 按优先级排序
            due_cards.sort(key=self._calculate_priority, reverse=True)
            
            return due_cards[:limit]
            
        except Exception as e:
            logger.error(f"获取待复习卡片失败: {e}")
            return []
    
    def _calculate_priority(self, card: ReviewCard) -> float:
        """计算卡片复习优先级"""
        now = datetime.now()
        
        # 基础优先级：逾期时间
        overdue_days = (now - card.next_review).days
        priority = overdue_days * 10
        
        # 难度调整：困难的内容优先级更高
        priority += card.difficulty_rating * 5
        
        # 准确率调整：准确率低的优先级更高
        if card.total_reviews > 0:
            accuracy = card.correct_reviews / card.total_reviews
            priority += (1 - accuracy) * 10
        
        # 重要性调整：某些类型的内容优先级更高
        if card.content_type == 'concept':
            priority += 3
        elif card.content_type == 'character':
            priority += 2
        
        return priority
    
    def get_review_statistics(self, user_id: str) -> Dict[str, Any]:
        """获取复习统计信息"""
        try:
            user_cards = [card for card in self.cards.values() if card.user_id == user_id]
            
            if not user_cards:
                return {
                    'total_cards': 0,
                    'due_today': 0,
                    'overdue': 0,
                    'accuracy': 0,
                    'streak_days': 0,
                    'total_reviews': 0
                }
            
            now = datetime.now()
            today = now.date()
            
            # 基础统计
            total_cards = len(user_cards)
            due_today = len([c for c in user_cards if c.next_review.date() == today])
            overdue = len([c for c in user_cards if c.next_review < now])
            
            # 准确率统计
            total_reviews = sum(c.total_reviews for c in user_cards)
            correct_reviews = sum(c.correct_reviews for c in user_cards)
            accuracy = (correct_reviews / total_reviews * 100) if total_reviews > 0 else 0
            
            # 连续学习天数
            streak_days = self._calculate_streak_days(user_id)
            
            # 按类型分组统计
            by_type = {}
            for card in user_cards:
                content_type = card.content_type
                if content_type not in by_type:
                    by_type[content_type] = {
                        'count': 0,
                        'due': 0,
                        'accuracy': 0,
                        'total_reviews': 0,
                        'correct_reviews': 0
                    }
                
                by_type[content_type]['count'] += 1
                if card.next_review <= now:
                    by_type[content_type]['due'] += 1
                by_type[content_type]['total_reviews'] += card.total_reviews
                by_type[content_type]['correct_reviews'] += card.correct_reviews
            
            # 计算各类型准确率
            for type_stats in by_type.values():
                if type_stats['total_reviews'] > 0:
                    type_stats['accuracy'] = (
                        type_stats['correct_reviews'] / type_stats['total_reviews'] * 100
                    )
            
            return {
                'total_cards': total_cards,
                'due_today': due_today,
                'overdue': overdue,
                'accuracy': round(accuracy, 1),
                'streak_days': streak_days,
                'total_reviews': total_reviews,
                'by_type': by_type,
                'next_review_time': self._get_next_review_time(user_cards)
            }
            
        except Exception as e:
            logger.error(f"获取复习统计失败: {e}")
            return {}
    
    def _calculate_streak_days(self, user_id: str) -> int:
        """计算连续学习天数"""
        try:
            user_cards = [card for card in self.cards.values() if card.user_id == user_id]
            
            # 获取所有复习日期
            review_dates = set()
            for card in user_cards:
                if card.last_reviewed:
                    review_dates.add(card.last_reviewed.date())
            
            if not review_dates:
                return 0
            
            # 计算连续天数
            sorted_dates = sorted(review_dates, reverse=True)
            streak = 0
            current_date = datetime.now().date()
            
            for date in sorted_dates:
                if date == current_date or date == current_date - timedelta(days=streak):
                    streak += 1
                    current_date = date
                else:
                    break
            
            return streak
            
        except Exception as e:
            logger.error(f"计算连续学习天数失败: {e}")
            return 0
    
    def _get_next_review_time(self, cards: List[ReviewCard]) -> Optional[datetime]:
        """获取下次复习时间"""
        if not cards:
            return None
        
        future_cards = [c for c in cards if c.next_review > datetime.now()]
        if not future_cards:
            return None
        
        return min(c.next_review for c in future_cards)
    
    def generate_review_content(self, card: ReviewCard) -> Dict[str, Any]:
        """生成复习内容"""
        try:
            content_type = card.content_type
            content_data = card.content_data
            
            if content_type == 'concept':
                return self._generate_concept_review(content_data)
            elif content_type == 'character':
                return self._generate_character_review(content_data)
            elif content_type == 'quote':
                return self._generate_quote_review(content_data)
            else:
                return self._generate_general_review(content_data)
                
        except Exception as e:
            logger.error(f"生成复习内容失败: {e}")
            return {'error': str(e)}
    
    def _generate_concept_review(self, concept_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成概念复习内容"""
        return {
            'type': 'concept',
            'question': f"请解释"{concept_data.get('name', '')}"的含义",
            'hint': concept_data.get('category', ''),
            'answer': concept_data.get('definition', ''),
            'examples': concept_data.get('examples', []),
            'related_concepts': concept_data.get('related_concepts', [])
        }
    
    def _generate_character_review(self, character_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成人物复习内容"""
        return {
            'type': 'character',
            'question': f"请介绍{character_data.get('name', '')}的主要思想",
            'hint': character_data.get('dynasty', ''),
            'answer': character_data.get('description', ''),
            'key_thoughts': character_data.get('key_thoughts', []),
            'famous_quotes': character_data.get('famous_quotes', [])
        }
    
    def _generate_quote_review(self, quote_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成名言复习内容"""
        return {
            'type': 'quote',
            'question': f"这句话的含义是什么："{quote_data.get('text', '')}"",
            'hint': quote_data.get('author', ''),
            'answer': quote_data.get('explanation', ''),
            'context': quote_data.get('context', ''),
            'modern_relevance': quote_data.get('modern_relevance', '')
        }
    
    def _generate_general_review(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成通用复习内容"""
        return {
            'type': 'general',
            'question': f"请回忆关于"{content_data.get('title', '')}"的内容",
            'answer': content_data.get('description', ''),
            'details': content_data
        }
    
    def schedule_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        """安排复习提醒通知"""
        try:
            due_cards = self.get_due_cards(user_id)
            notifications = []
            
            if due_cards:
                notifications.append({
                    'type': 'review_due',
                    'title': '复习提醒',
                    'message': f'您有 {len(due_cards)} 个内容需要复习',
                    'data': {
                        'user_id': user_id,
                        'card_count': len(due_cards),
                        'cards': [card.id for card in due_cards[:5]]  # 只包含前5个
                    },
                    'schedule_time': datetime.now()
                })
            
            # 检查是否需要鼓励通知
            stats = self.get_review_statistics(user_id)
            if stats.get('streak_days', 0) >= 7:
                notifications.append({
                    'type': 'streak_achievement',
                    'title': '学习成就',
                    'message': f'恭喜！您已连续学习 {stats["streak_days"]} 天',
                    'data': {
                        'user_id': user_id,
                        'streak_days': stats['streak_days']
                    },
                    'schedule_time': datetime.now()
                })
            
            return notifications
            
        except Exception as e:
            logger.error(f"安排复习通知失败: {e}")
            return []

# 全局间隔重复服务实例
spaced_repetition_service = SpacedRepetitionService()
