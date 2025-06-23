"""
AI对话API
提供Web端和小程序端的AI对话接口
"""
import asyncio
import json
from flask import Blueprint, request, jsonify, Response, stream_template
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Dict, Any, Optional

from services.advanced_ai_service import advanced_ai_service
from services.character_service import character_service
from utils.logging_config import get_logger, business_logger
from utils.response_utils import success_response, error_response
from middleware.rate_limiter import rate_limit

logger = get_logger('ai_chat_api')

ai_chat_bp = Blueprint('ai_chat', __name__, url_prefix='/api/ai-chat')

@ai_chat_bp.route('/characters', methods=['GET'])
@jwt_required(optional=True)
def get_available_characters():
    """获取可用的对话人物列表"""
    try:
        characters = character_service.get_all_characters()
        
        # 格式化人物信息用于对话选择
        character_list = []
        for char_id, char_data in characters.items():
            character_list.append({
                'id': char_id,
                'name': char_data['name'],
                'title': char_data.get('title', ''),
                'description': char_data.get('description', ''),
                'avatar': char_data.get('avatar', ''),
                'dynasty': char_data.get('dynasty', ''),
                'specialties': char_data.get('key_thoughts', [])[:3],
                'dialogue_style': char_data.get('dialogue_style', ''),
                'difficulty_level': char_data.get('difficulty_level', 'medium')
            })
        
        # 按影响力排序
        character_list.sort(key=lambda x: x.get('influence_score', 0), reverse=True)
        
        return success_response(
            data={
                'characters': character_list,
                'total': len(character_list)
            },
            message="获取对话人物列表成功"
        )
        
    except Exception as e:
        logger.error(f"获取对话人物列表失败: {e}")
        return error_response(message="获取人物列表失败", error=str(e))

@ai_chat_bp.route('/chat', methods=['POST'])
@jwt_required(optional=True)
@rate_limit(max_requests=30, window=60)  # 每分钟最多30次请求
def chat_with_character():
    """与历史人物对话"""
    try:
        data = request.get_json()
        
        # 验证必需参数
        required_fields = ['message', 'character_id']
        for field in required_fields:
            if field not in data:
                return error_response(message=f"缺少必需参数: {field}")
        
        user_message = data['message'].strip()
        character_id = data['character_id']
        
        if not user_message:
            return error_response(message="消息内容不能为空")
        
        if len(user_message) > 1000:
            return error_response(message="消息内容过长，请控制在1000字符以内")
        
        # 获取用户ID（如果已登录）
        user_id = get_jwt_identity()
        
        # 构建用户上下文
        user_context = {
            'user_level': data.get('user_level', 'beginner'),
            'user_interests': data.get('user_interests', []),
            'conversation_mode': data.get('conversation_mode', 'learning'),
            'user_message': user_message
        }
        
        # 异步调用AI服务
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                advanced_ai_service.generate_advanced_response(
                    user_message=user_message,
                    character_id=character_id,
                    user_id=user_id,
                    user_context=user_context,
                    stream=False
                )
            )
        finally:
            loop.close()
        
        if result['success']:
            # 记录成功的对话
            business_logger.log_user_action(
                user_id or 'anonymous',
                'ai_chat',
                {
                    'character_id': character_id,
                    'message_length': len(user_message),
                    'response_length': len(result['data']['response']),
                    'quality_score': result['data']['quality_assessment']['quality_score']
                }
            )
            
            return success_response(
                data=result['data'],
                message="对话生成成功"
            )
        else:
            return error_response(
                message="对话生成失败",
                error=result.get('error', '未知错误')
            )
            
    except Exception as e:
        logger.error(f"AI对话失败: {e}")
        return error_response(message="对话服务暂时不可用", error=str(e))

@ai_chat_bp.route('/chat/stream', methods=['POST'])
@jwt_required(optional=True)
@rate_limit(max_requests=10, window=60)  # 流式对话限制更严格
def chat_with_character_stream():
    """流式对话接口"""
    try:
        data = request.get_json()
        
        # 验证参数
        required_fields = ['message', 'character_id']
        for field in required_fields:
            if field not in data:
                return error_response(message=f"缺少必需参数: {field}")
        
        user_message = data['message'].strip()
        character_id = data['character_id']
        user_id = get_jwt_identity()
        
        # 构建用户上下文
        user_context = {
            'user_level': data.get('user_level', 'beginner'),
            'user_interests': data.get('user_interests', []),
            'conversation_mode': data.get('conversation_mode', 'learning'),
            'user_message': user_message
        }
        
        def generate_stream():
            """生成流式响应"""
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                async def stream_generator():
                    async for chunk in advanced_ai_service.generate_advanced_response(
                        user_message=user_message,
                        character_id=character_id,
                        user_id=user_id,
                        user_context=user_context,
                        stream=True
                    ):
                        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                
                # 运行异步生成器
                async_gen = stream_generator()
                while True:
                    try:
                        chunk = loop.run_until_complete(async_gen.__anext__())
                        yield chunk
                    except StopAsyncIteration:
                        break
                        
            except Exception as e:
                logger.error(f"流式对话生成失败: {e}")
                yield f"data: {json.dumps({'type': 'error', 'data': {'error': str(e)}}, ensure_ascii=False)}\n\n"
            finally:
                loop.close()
        
        return Response(
            generate_stream(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        logger.error(f"流式对话初始化失败: {e}")
        return error_response(message="流式对话服务不可用", error=str(e))

@ai_chat_bp.route('/conversation/history', methods=['GET'])
@jwt_required()
def get_conversation_history():
    """获取对话历史"""
    try:
        user_id = get_jwt_identity()
        character_id = request.args.get('character_id')
        
        if not character_id:
            return error_response(message="缺少character_id参数")
        
        # 获取对话摘要
        memory = advanced_ai_service._get_or_create_memory(user_id, character_id)
        summary = advanced_ai_service._get_memory_summary(memory) if memory else None
        
        return success_response(
            data={
                'conversation_summary': summary,
                'character_id': character_id
            },
            message="获取对话历史成功"
        )
        
    except Exception as e:
        logger.error(f"获取对话历史失败: {e}")
        return error_response(message="获取对话历史失败", error=str(e))

@ai_chat_bp.route('/conversation/clear', methods=['POST'])
@jwt_required()
def clear_conversation():
    """清除对话历史"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        character_id = data.get('character_id')
        
        if not character_id:
            return error_response(message="缺少character_id参数")
        
        # 清除对话记忆
        memory_key = f"{user_id}_{character_id}"
        if memory_key in advanced_ai_service.conversation_memories:
            del advanced_ai_service.conversation_memories[memory_key]
        
        # 清除最近回复记录
        if memory_key in advanced_ai_service.recent_responses:
            del advanced_ai_service.recent_responses[memory_key]
        
        business_logger.log_user_action(
            user_id,
            'clear_conversation',
            {'character_id': character_id}
        )
        
        return success_response(message="对话历史已清除")
        
    except Exception as e:
        logger.error(f"清除对话历史失败: {e}")
        return error_response(message="清除对话历史失败", error=str(e))

@ai_chat_bp.route('/feedback', methods=['POST'])
@jwt_required(optional=True)
def submit_feedback():
    """提交对话反馈"""
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        required_fields = ['character_id', 'rating', 'feedback_type']
        for field in required_fields:
            if field not in data:
                return error_response(message=f"缺少必需参数: {field}")
        
        feedback_data = {
            'user_id': user_id or 'anonymous',
            'character_id': data['character_id'],
            'rating': data['rating'],  # 1-5分
            'feedback_type': data['feedback_type'],  # 'helpful', 'accurate', 'engaging', etc.
            'comment': data.get('comment', ''),
            'conversation_context': data.get('conversation_context', {})
        }
        
        # 记录反馈
        business_logger.log_user_feedback(
            user_id or 'anonymous',
            'ai_chat_feedback',
            feedback_data
        )
        
        return success_response(message="反馈提交成功")
        
    except Exception as e:
        logger.error(f"提交反馈失败: {e}")
        return error_response(message="提交反馈失败", error=str(e))

@ai_chat_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_chat_statistics():
    """获取对话统计信息"""
    try:
        user_id = get_jwt_identity()
        
        # 统计用户的对话数据
        user_memories = {
            key: memory for key, memory in advanced_ai_service.conversation_memories.items()
            if key.startswith(f"{user_id}_")
        }
        
        statistics = {
            'total_conversations': len(user_memories),
            'characters_chatted': len(set(key.split('_')[1] for key in user_memories.keys())),
            'total_messages': sum(
                len(memory.short_term_memory) + len(memory.long_term_memory)
                for memory in user_memories.values()
            ),
            'favorite_characters': [],  # 可以基于对话频率计算
            'conversation_themes': []   # 可以基于对话主题统计
        }
        
        # 计算最常对话的人物
        character_counts = {}
        for key in user_memories.keys():
            character_id = key.split('_')[1]
            character_counts[character_id] = character_counts.get(character_id, 0) + 1
        
        if character_counts:
            sorted_characters = sorted(character_counts.items(), key=lambda x: x[1], reverse=True)
            for char_id, count in sorted_characters[:3]:
                character = character_service.get_character(char_id)
                if character:
                    statistics['favorite_characters'].append({
                        'id': char_id,
                        'name': character['name'],
                        'conversation_count': count
                    })
        
        return success_response(
            data=statistics,
            message="获取对话统计成功"
        )
        
    except Exception as e:
        logger.error(f"获取对话统计失败: {e}")
        return error_response(message="获取对话统计失败", error=str(e))

@ai_chat_bp.route('/health', methods=['GET'])
def health_check():
    """AI对话服务健康检查"""
    try:
        # 检查各个服务组件的状态
        health_status = {
            'ai_service': 'healthy',
            'character_service': 'healthy',
            'rag_service': 'healthy',
            'memory_service': 'healthy'
        }
        
        # 检查AI服务提供者
        try:
            providers = advanced_ai_service.real_ai_service.get_available_providers()
            health_status['available_ai_providers'] = providers
        except Exception as e:
            health_status['ai_service'] = f'degraded: {str(e)}'
        
        # 检查知识库
        try:
            stats = character_service.get_character_statistics()
            health_status['knowledge_base'] = {
                'characters': stats['total_characters'],
                'status': 'healthy'
            }
        except Exception as e:
            health_status['knowledge_base'] = f'error: {str(e)}'
        
        return success_response(
            data=health_status,
            message="AI对话服务运行正常"
        )
        
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return error_response(message="服务健康检查失败", error=str(e))
