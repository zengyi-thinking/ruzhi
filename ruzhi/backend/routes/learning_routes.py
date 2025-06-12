"""
学习中心相关路由
"""
from flask import Blueprint, request, jsonify
import logging

from services.learning_service import LearningService

logger = logging.getLogger(__name__)

learning_bp = Blueprint('learning', __name__, url_prefix='/api/v1/learning')

@learning_bp.route('/stats/<user_id>', methods=['GET'])
def get_user_stats(user_id: str):
    """获取用户学习统计"""
    try:
        stats = LearningService.get_user_study_stats(user_id)
        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        logger.error(f"获取用户统计失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/progress/<user_id>', methods=['GET'])
def get_progress(user_id: str):
    """获取学习进度"""
    try:
        progress = LearningService.get_progress_data(user_id)
        return jsonify({
            "success": True,
            "data": progress
        })
    except Exception as e:
        logger.error(f"获取学习进度失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/plans/<user_id>/<date>', methods=['GET'])
def get_today_plans(user_id: str, date: str):
    """获取今日学习计划"""
    try:
        plans = LearningService.get_today_plans(user_id, date)
        return jsonify({
            "success": True,
            "data": plans
        })
    except Exception as e:
        logger.error(f"获取学习计划失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/achievements/<user_id>', methods=['GET'])
def get_achievements(user_id: str):
    """获取用户成就"""
    try:
        achievements = LearningService.get_achievements(user_id)
        return jsonify({
            "success": True,
            "data": achievements
        })
    except Exception as e:
        logger.error(f"获取用户成就失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/plans', methods=['POST'])
def create_study_plan():
    """创建学习计划"""
    try:
        plan_data = request.get_json()
        result = LearningService.create_study_plan(plan_data)
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        logger.error(f"创建学习计划失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/plans/<user_id>/<plan_id>', methods=['PUT'])
def update_plan_status(user_id: str, plan_id: str):
    """更新计划状态"""
    try:
        data = request.get_json()
        completed = data.get('completed', False)
        
        success = LearningService.update_plan_status(user_id, plan_id, completed)
        
        return jsonify({
            "success": success,
            "message": "计划状态已更新" if success else "更新失败"
        })
    except Exception as e:
        logger.error(f"更新计划状态失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/records/<user_id>/<date>', methods=['GET'])
def get_day_records(user_id: str, date: str):
    """获取某日学习记录"""
    try:
        records = LearningService.get_day_study_records(user_id, date)
        return jsonify({
            "success": True,
            "data": records
        })
    except Exception as e:
        logger.error(f"获取学习记录失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id: str):
    """获取个性化推荐"""
    try:
        recommendations = LearningService.get_user_recommendations(user_id)
        return jsonify({
            "success": True,
            "data": recommendations
        })
    except Exception as e:
        logger.error(f"获取推荐失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/paths/<user_id>', methods=['GET'])
def get_learning_paths(user_id: str):
    """获取学习路径"""
    try:
        paths = LearningService.get_learning_paths(user_id)
        return jsonify({
            "success": True,
            "data": paths
        })
    except Exception as e:
        logger.error(f"获取学习路径失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/conversation-summary/<user_id>', methods=['GET'])
def get_conversation_summary(user_id: str):
    """获取对话总结"""
    try:
        summary = LearningService.get_conversation_summary(user_id)
        return jsonify({
            "success": True,
            "data": summary
        })
    except Exception as e:
        logger.error(f"获取对话总结失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/analyze', methods=['POST'])
def analyze_learning_data():
    """分析学习数据"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        learning_data = data.get('data', {})
        
        analysis = LearningService.analyze_learning_data(user_id, learning_data)
        
        return jsonify({
            "success": True,
            "data": analysis
        })
    except Exception as e:
        logger.error(f"分析学习数据失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@learning_bp.route('/session', methods=['POST'])
def record_learning_session():
    """记录学习会话"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        session_data = data.get('sessionData', {})
        
        result = LearningService.record_learning_session(user_id, session_data)
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"记录学习会话失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
