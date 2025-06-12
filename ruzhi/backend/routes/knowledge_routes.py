"""
知识图谱相关路由
"""
from flask import Blueprint, request, jsonify
import logging
import random
from datetime import datetime

from services.ai_service import RealAIService
from services.knowledge_service import KnowledgeGraphService

logger = logging.getLogger(__name__)

knowledge_bp = Blueprint('knowledge', __name__, url_prefix='/api/v1/knowledge')

@knowledge_bp.route('/concept/<concept_name>', methods=['GET'])
def get_concept_details(concept_name: str):
    """获取知识图谱概念的详细信息（AI增强版）"""
    try:
        # 获取用户上下文（如果有的话）
        user_context = request.args.get('context', '')

        # 使用AI服务生成概念分析
        result = KnowledgeGraphService.generate_concept_analysis(concept_name, user_context)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify({
                'success': False,
                'error': '概念分析生成失败'
            }), 500

    except Exception as e:
        logger.error(f"获取概念详情失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@knowledge_bp.route('/concept/<concept_name>/stories', methods=['GET'])
def get_concept_stories(concept_name: str):
    """获取概念相关故事"""
    try:
        story_type = request.args.get('type', 'all')

        # 使用AI服务生成相关故事
        result = KnowledgeGraphService.generate_concept_stories(concept_name, story_type)

        return jsonify(result)

    except Exception as e:
        logger.error(f"获取概念故事失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@knowledge_bp.route('/concept/<concept_name>/expand', methods=['POST'])
def expand_concept(concept_name: str):
    """自动扩展知识图谱"""
    try:
        data = request.get_json() or {}
        expansion_type = data.get('type', 'related')  # related, historical, practical

        # 使用AI服务自动扩展概念
        result = KnowledgeGraphService.auto_expand_knowledge_graph(concept_name, expansion_type)

        return jsonify(result)

    except Exception as e:
        logger.error(f"扩展知识图谱失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'扩展失败: {str(e)}'
        }), 500

@knowledge_bp.route('/relationships', methods=['GET'])
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
        }), 500

@knowledge_bp.route('/graph', methods=['GET'])
def get_knowledge_graph():
    """获取完整的知识图谱数据"""
    try:
        # 返回知识图谱的节点和边数据
        graph_data = {
            'nodes': [
                {'id': '仁', 'name': '仁', 'category': '儒家核心概念', 'importance': 0.95},
                {'id': '义', 'name': '义', 'category': '儒家核心概念', 'importance': 0.90},
                {'id': '礼', 'name': '礼', 'category': '儒家核心概念', 'importance': 0.85},
                {'id': '智', 'name': '智', 'category': '儒家核心概念', 'importance': 0.80},
                {'id': '信', 'name': '信', 'category': '儒家核心概念', 'importance': 0.85},
                {'id': '道', 'name': '道', 'category': '道家核心概念', 'importance': 0.98},
                {'id': '德', 'name': '德', 'category': '道家核心概念', 'importance': 0.90},
                {'id': '自然', 'name': '自然', 'category': '道家核心概念', 'importance': 0.75},
                {'id': '无为', 'name': '无为', 'category': '道家核心概念', 'importance': 0.70}
            ],
            'edges': [
                {'source': '仁', 'target': '义', 'relation': '相辅相成', 'strength': 0.9},
                {'source': '仁', 'target': '礼', 'relation': '内外统一', 'strength': 0.8},
                {'source': '义', 'target': '礼', 'relation': '道德规范', 'strength': 0.7},
                {'source': '智', 'target': '仁', 'relation': '智仁结合', 'strength': 0.8},
                {'source': '信', 'target': '义', 'relation': '诚信正义', 'strength': 0.9},
                {'source': '道', 'target': '德', 'relation': '道德一体', 'strength': 0.95},
                {'source': '道', 'target': '自然', 'relation': '道法自然', 'strength': 0.9},
                {'source': '道', 'target': '无为', 'relation': '无为而治', 'strength': 0.85},
                {'source': '德', 'target': '仁', 'relation': '德仁并重', 'strength': 0.8}
            ]
        }
        
        return jsonify({
            'success': True,
            'data': graph_data
        })
        
    except Exception as e:
        logger.error(f"获取知识图谱失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@knowledge_bp.route('/search', methods=['GET'])
def search_concepts():
    """智能概念搜索（AI增强版）"""
    try:
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'fuzzy')

        if not query:
            return jsonify({
                'success': False,
                'error': '搜索关键词不能为空'
            }), 400

        # 使用AI智能搜索
        result = KnowledgeGraphService.intelligent_concept_search(query, search_type)

        return jsonify(result)

    except Exception as e:
        logger.error(f"搜索概念失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'搜索失败: {str(e)}'
        }), 500

@knowledge_bp.route('/learning-path', methods=['POST'])
def generate_learning_path():
    """生成个性化学习路径"""
    try:
        data = request.get_json()

        user_interests = data.get('interests', [])
        user_level = data.get('level', 'beginner')

        if not user_interests:
            return jsonify({
                'success': False,
                'error': '用户兴趣不能为空'
            }), 400

        # 使用AI生成学习路径
        result = KnowledgeGraphService.generate_learning_path(user_interests, user_level)

        return jsonify(result)

    except Exception as e:
        logger.error(f"生成学习路径失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'生成失败: {str(e)}'
        }), 500

@knowledge_bp.route('/recommend', methods=['POST'])
def get_concept_recommendations():
    """获取概念推荐"""
    try:
        data = request.get_json()

        current_concepts = data.get('current_concepts', [])
        user_preferences = data.get('preferences', {})
        recommendation_type = data.get('type', 'related')  # related, advanced, practical

        # 基于当前概念和用户偏好生成推荐
        recommendations = []

        for concept in current_concepts:
            # 获取相关概念
            related = RealAIService._get_related_concepts(concept)
            for related_concept in related[:2]:  # 每个概念推荐2个相关概念
                if related_concept not in current_concepts:
                    recommendations.append({
                        'concept': related_concept,
                        'reason': f'与{concept}相关',
                        'category': RealAIService._get_concept_category(related_concept),
                        'difficulty': random.choice(['初级', '中级', '高级']),
                        'estimated_time': f'{random.randint(1, 4)}小时'
                    })

        # 去重并限制数量
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec['concept'] not in seen:
                seen.add(rec['concept'])
                unique_recommendations.append(rec)
                if len(unique_recommendations) >= 8:
                    break

        return jsonify({
            'success': True,
            'data': {
                'recommendations': unique_recommendations,
                'total': len(unique_recommendations),
                'recommendation_type': recommendation_type,
                'timestamp': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"获取概念推荐失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500
