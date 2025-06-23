"""
AI服务单元测试
测试AI相关服务的功能和性能
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.real_ai_service import real_ai_service
from services.prompt_builder import prompt_builder
from services.rag_service import rag_service
from services.advanced_ai_service import advanced_ai_service
from services.spaced_repetition_service import spaced_repetition_service, ReviewResult
from services.learning_assessment_service import learning_assessment_service

class TestRealAIService:
    """真实AI服务测试"""
    
    def test_get_available_providers(self):
        """测试获取可用提供者"""
        providers = real_ai_service.get_available_providers()
        assert isinstance(providers, list)
        assert len(providers) > 0
    
    def test_get_provider_info(self):
        """测试获取提供者信息"""
        info = real_ai_service.get_provider_info()
        assert isinstance(info, dict)
        assert 'default_provider' in info
        assert 'available_providers' in info
    
    @pytest.mark.asyncio
    async def test_generate_response_success(self):
        """测试成功生成回复"""
        messages = [
            {"role": "user", "content": "请简单介绍一下儒家思想"}
        ]
        
        # 模拟成功的API响应
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={
                'choices': [{'message': {'content': '儒家思想是中国传统文化的重要组成部分...'}}],
                'usage': {'total_tokens': 100}
            })
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await real_ai_service.generate_response(messages)
            
            assert result['success'] is True
            assert 'content' in result
            assert len(result['content']) > 0
    
    @pytest.mark.asyncio
    async def test_generate_response_fallback(self):
        """测试降级机制"""
        messages = [
            {"role": "user", "content": "测试消息"}
        ]
        
        # 模拟API失败
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_post.side_effect = Exception("API调用失败")
            
            result = await real_ai_service.generate_response(messages)
            
            # 应该降级到模拟AI
            assert result['success'] is True
            assert result.get('provider') == 'fallback'

class TestPromptBuilder:
    """提示词构建器测试"""
    
    def test_analyze_question_type(self):
        """测试问题类型分析"""
        test_cases = [
            ("我学习古文很困难", "learning_difficulty"),
            ("人生的意义是什么？", "philosophical_inquiry"),
            ("如何在工作中应用儒家思想？", "practical_guidance"),
            ("今天心情很不好", "emotional_support")
        ]
        
        for message, expected_type in test_cases:
            result = prompt_builder.analyze_question_type(message)
            assert result == expected_type
    
    def test_build_character_prompt(self):
        """测试人物提示词构建"""
        character_data = {
            'name': '孔子',
            'title': '至圣先师',
            'personality': '温和、睿智',
            'key_thoughts': ['仁爱', '礼制', '教育'],
            'dialogue_style': '循循善诱'
        }
        
        user_context = {
            'emotion_analysis': {
                'primary_emotion': 'sadness',
                'emotion_label': '悲伤'
            },
            'user_level': 'beginner',
            'response_strategy': {
                'tone': 'gentle',
                'empathy_level': 0.8
            }
        }
        
        prompt = prompt_builder.build_character_prompt(
            character_data, user_context, []
        )
        
        assert isinstance(prompt, str)
        assert len(prompt) > 100
        assert '孔子' in prompt
        assert '仁爱' in prompt
    
    def test_build_rag_enhanced_prompt(self):
        """测试RAG增强提示词"""
        base_prompt = "你是孔子，请回答用户问题。"
        knowledge_items = [
            {
                'title': '仁的概念',
                'content': '仁是儒家思想的核心概念...',
                'relevance_score': 0.9
            }
        ]
        
        enhanced_prompt = prompt_builder.build_rag_enhanced_prompt(
            base_prompt, knowledge_items
        )
        
        assert len(enhanced_prompt) > len(base_prompt)
        assert '仁的概念' in enhanced_prompt

class TestRAGService:
    """RAG服务测试"""
    
    def test_enhance_query_with_knowledge(self):
        """测试知识增强查询"""
        query = "什么是仁？"
        character_id = "confucius"
        
        result = rag_service.enhance_query_with_knowledge(query, character_id)
        
        assert isinstance(result, dict)
        assert 'knowledge_count' in result
        assert 'knowledge_summary' in result
        assert 'relevant_knowledge' in result
        assert 'knowledge_context' in result
    
    def test_get_knowledge_statistics(self):
        """测试知识库统计"""
        stats = rag_service.get_knowledge_statistics()
        
        assert isinstance(stats, dict)
        assert 'total_knowledge_items' in stats
        assert 'characters' in stats
        assert 'classics' in stats
        assert 'concepts' in stats

class TestAdvancedAIService:
    """高级AI服务测试"""
    
    @pytest.mark.asyncio
    async def test_generate_advanced_response(self):
        """测试高级AI回复生成"""
        user_message = "我在学习《论语》时感到困惑"
        character_id = "confucius"
        user_id = "test_user"
        user_context = {'user_level': 'beginner'}
        
        # 模拟依赖服务
        with patch.object(real_ai_service, 'generate_response') as mock_ai:
            mock_ai.return_value = {
                'success': True,
                'content': '学习《论语》确实需要循序渐进...',
                'provider': 'test',
                'usage': {}
            }
            
            result = await advanced_ai_service.generate_advanced_response(
                user_message=user_message,
                character_id=character_id,
                user_id=user_id,
                user_context=user_context,
                stream=False
            )
            
            assert result['success'] is True
            assert 'data' in result
            assert 'response' in result['data']
            assert 'emotion_analysis' in result['data']
            assert 'quality_assessment' in result['data']

class TestSpacedRepetitionService:
    """间隔重复服务测试"""
    
    def test_create_review_card(self):
        """测试创建复习卡片"""
        user_id = "test_user"
        content_id = "concept_ren"
        content_type = "concept"
        content_data = {
            'title': '仁的概念',
            'definition': '仁是儒家思想的核心...'
        }
        
        card = spaced_repetition_service.create_review_card(
            user_id, content_id, content_type, content_data
        )
        
        assert card.user_id == user_id
        assert card.content_id == content_id
        assert card.content_type == content_type
        assert card.easiness_factor == 2.5
        assert card.interval == 1
        assert card.repetitions == 0
    
    def test_review_card_good_result(self):
        """测试良好复习结果"""
        # 创建测试卡片
        card = spaced_repetition_service.create_review_card(
            "test_user", "test_concept", "concept", {'title': '测试概念'}
        )
        
        # 模拟良好复习结果
        updated_card = spaced_repetition_service.review_card(
            card.id, ReviewResult.GOOD, response_time=5.0
        )
        
        assert updated_card.repetitions == 1
        assert updated_card.interval == 1  # 第一次复习间隔为1天
        assert updated_card.last_reviewed is not None
        assert updated_card.total_reviews == 1
        assert updated_card.correct_reviews == 1
    
    def test_review_card_again_result(self):
        """测试重新学习结果"""
        # 创建并复习几次的卡片
        card = spaced_repetition_service.create_review_card(
            "test_user", "test_concept", "concept", {'title': '测试概念'}
        )
        card.repetitions = 3
        card.interval = 10
        
        # 模拟忘记的结果
        updated_card = spaced_repetition_service.review_card(
            card.id, ReviewResult.AGAIN
        )
        
        assert updated_card.repetitions == 0  # 重置
        assert updated_card.interval == 1     # 重新开始
        assert updated_card.easiness_factor < 2.5  # 难度因子降低
    
    def test_get_due_cards(self):
        """测试获取待复习卡片"""
        user_id = "test_user"
        
        # 创建一些测试卡片
        for i in range(5):
            card = spaced_repetition_service.create_review_card(
                user_id, f"concept_{i}", "concept", {'title': f'概念{i}'}
            )
            # 设置为需要复习
            card.next_review = datetime.now() - timedelta(days=1)
        
        due_cards = spaced_repetition_service.get_due_cards(user_id, limit=3)
        
        assert len(due_cards) <= 3
        for card in due_cards:
            assert card.user_id == user_id
            assert card.next_review <= datetime.now()
    
    def test_get_review_statistics(self):
        """测试复习统计"""
        user_id = "test_user"
        
        # 创建测试数据
        card = spaced_repetition_service.create_review_card(
            user_id, "test_concept", "concept", {'title': '测试概念'}
        )
        spaced_repetition_service.review_card(card.id, ReviewResult.GOOD)
        
        stats = spaced_repetition_service.get_review_statistics(user_id)
        
        assert isinstance(stats, dict)
        assert 'total_cards' in stats
        assert 'due_today' in stats
        assert 'accuracy' in stats
        assert 'total_reviews' in stats

class TestLearningAssessmentService:
    """学习评估服务测试"""
    
    def test_collect_learning_data(self):
        """测试收集学习数据"""
        user_id = "test_user"
        
        # 模拟学习会话数据
        session_data = {
            'type': 'study_session',
            'duration': 60,  # 60分钟
            'engagement_score': 0.8
        }
        
        learning_assessment_service.collect_learning_data(user_id, session_data)
        
        assert user_id in learning_assessment_service.user_metrics
        metrics = learning_assessment_service.user_metrics[user_id]
        assert metrics.total_study_time == 60
        assert metrics.session_count == 1
    
    def test_assess_learning_level(self):
        """测试学习水平评估"""
        user_id = "test_user"
        
        # 模拟一些学习数据
        learning_data = [
            {'type': 'study_session', 'duration': 60, 'engagement_score': 0.8},
            {'type': 'concept_learning', 'is_new_concept': True, 'mastery_level': 0.9},
            {'type': 'quiz_completion', 'score': 85},
            {'type': 'character_interaction', 'character_id': 'confucius'}
        ]
        
        for data in learning_data:
            learning_assessment_service.collect_learning_data(user_id, data)
        
        assessment = learning_assessment_service.assess_learning_level(user_id)
        
        assert isinstance(assessment, dict)
        assert 'level' in assessment
        assert 'overall_score' in assessment
        assert 'dimension_scores' in assessment
        assert 'areas_of_strength' in assessment
        assert 'areas_for_improvement' in assessment
        assert 'recommendations' in assessment
    
    def test_generate_learning_report(self):
        """测试生成学习报告"""
        user_id = "test_user"
        
        # 先收集一些数据
        learning_data = [
            {'type': 'study_session', 'duration': 120, 'engagement_score': 0.7},
            {'type': 'concept_learning', 'is_new_concept': True, 'mastery_level': 0.8},
            {'type': 'quiz_completion', 'score': 90}
        ]
        
        for data in learning_data:
            learning_assessment_service.collect_learning_data(user_id, data)
        
        report = learning_assessment_service.generate_learning_report(user_id)
        
        assert isinstance(report, dict)
        assert 'overall_assessment' in report
        assert 'learning_statistics' in report
        assert 'learning_efficiency' in report
        assert 'next_steps' in report

class TestIntegration:
    """集成测试"""
    
    @pytest.mark.asyncio
    async def test_full_learning_flow(self):
        """测试完整学习流程"""
        user_id = "integration_test_user"
        
        # 1. 用户开始学习会话
        session_data = {
            'type': 'study_session',
            'duration': 45,
            'engagement_score': 0.8
        }
        learning_assessment_service.collect_learning_data(user_id, session_data)
        
        # 2. 学习新概念
        concept_data = {
            'type': 'concept_learning',
            'is_new_concept': True,
            'mastery_level': 0.7
        }
        learning_assessment_service.collect_learning_data(user_id, concept_data)
        
        # 3. 创建复习卡片
        card = spaced_repetition_service.create_review_card(
            user_id, "ren_concept", "concept",
            {'title': '仁的概念', 'definition': '仁是儒家核心思想...'}
        )
        
        # 4. 进行AI对话
        with patch.object(real_ai_service, 'generate_response') as mock_ai:
            mock_ai.return_value = {
                'success': True,
                'content': '关于仁的理解，我认为...',
                'provider': 'test'
            }
            
            ai_result = await advanced_ai_service.generate_advanced_response(
                user_message="请解释什么是仁",
                character_id="confucius",
                user_id=user_id,
                user_context={'user_level': 'beginner'},
                stream=False
            )
            
            assert ai_result['success'] is True
        
        # 5. 复习卡片
        spaced_repetition_service.review_card(card.id, ReviewResult.GOOD)
        
        # 6. 生成学习评估
        assessment = learning_assessment_service.assess_learning_level(user_id)
        assert assessment['level'] in ['beginner', 'intermediate', 'advanced', 'expert']
        
        # 7. 获取复习统计
        review_stats = spaced_repetition_service.get_review_statistics(user_id)
        assert review_stats['total_cards'] >= 1

# 性能测试
class TestPerformance:
    """性能测试"""
    
    @pytest.mark.asyncio
    async def test_ai_response_time(self):
        """测试AI响应时间"""
        start_time = datetime.now()
        
        with patch.object(real_ai_service, 'generate_response') as mock_ai:
            mock_ai.return_value = {
                'success': True,
                'content': '测试回复',
                'provider': 'test'
            }
            
            result = await advanced_ai_service.generate_advanced_response(
                user_message="测试消息",
                character_id="confucius",
                user_id="perf_test_user",
                user_context={'user_level': 'beginner'},
                stream=False
            )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        # 响应时间应该小于5秒
        assert response_time < 5.0
        assert result['success'] is True
    
    def test_large_dataset_performance(self):
        """测试大数据集性能"""
        user_id = "perf_test_user"
        
        # 创建大量复习卡片
        start_time = datetime.now()
        
        for i in range(100):
            spaced_repetition_service.create_review_card(
                user_id, f"concept_{i}", "concept",
                {'title': f'概念{i}', 'definition': f'定义{i}'}
            )
        
        end_time = datetime.now()
        creation_time = (end_time - start_time).total_seconds()
        
        # 创建100个卡片应该在1秒内完成
        assert creation_time < 1.0
        
        # 测试查询性能
        start_time = datetime.now()
        due_cards = spaced_repetition_service.get_due_cards(user_id, limit=50)
        end_time = datetime.now()
        query_time = (end_time - start_time).total_seconds()
        
        # 查询应该在0.1秒内完成
        assert query_time < 0.1

if __name__ == '__main__':
    pytest.main([__file__, '-v'])
