"""
AI对话相关路由
"""
from flask import Blueprint, request, jsonify
import logging
from datetime import datetime

from services.ai_service import RealAIService
from models.data_storage import character_profiles, chat_conversations

logger = logging.getLogger(__name__)

dialogue_bp = Blueprint('dialogue', __name__, url_prefix='/api/v1/dialogue')

@dialogue_bp.route('/characters', methods=['GET'])
def get_characters():
    """获取可对话的历史人物列表"""
    try:
        characters = []
        for char_id, profile in character_profiles.items():
            characters.append({
                'id': char_id,
                'name': profile['name'],
                'title': profile['title'],
                'dynasty': profile['dynasty'],
                'personality': profile['personality'],
                'core_beliefs': profile['core_beliefs']
            })
        
        return jsonify({
            "success": True,
            "data": characters
        })
    except Exception as e:
        logger.error(f"获取人物列表失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@dialogue_bp.route('/chat', methods=['POST'])
def chat_with_character():
    """与AI人物对话"""
    try:
        data = request.get_json()
        
        message = data.get('message', '').strip()
        character_id = data.get('character', 'confucius')
        conversation_id = data.get('conversationId', 'default')
        settings = data.get('settings', {})
        
        if not message:
            return jsonify({
                'success': False,
                'error': '消息内容不能为空'
            }), 400
        
        # 获取对话历史
        conversation_history = chat_conversations.get(conversation_id, [])
        
        # 使用真实AI服务生成回复
        response = RealAIService.generate_character_response(
            message, character_id, conversation_history, settings
        )
        
        if response.get('success'):
            # 保存对话记录
            user_message = {
                'role': 'user',
                'content': message,
                'timestamp': datetime.now().isoformat()
            }
            
            ai_message = {
                'role': 'assistant',
                'content': response['reply'],
                'character': response['character'],
                'timestamp': datetime.now().isoformat()
            }
            
            if conversation_id not in chat_conversations:
                chat_conversations[conversation_id] = []
            
            chat_conversations[conversation_id].extend([user_message, ai_message])
            
            # 限制对话历史长度
            if len(chat_conversations[conversation_id]) > 20:
                chat_conversations[conversation_id] = chat_conversations[conversation_id][-20:]
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"对话处理失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'对话失败: {str(e)}'
        }), 500

@dialogue_bp.route('/history/<conversation_id>', methods=['GET'])
def get_conversation_history(conversation_id: str):
    """获取对话历史"""
    try:
        history = chat_conversations.get(conversation_id, [])
        
        return jsonify({
            'success': True,
            'data': history
        })
        
    except Exception as e:
        logger.error(f"获取对话历史失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@dialogue_bp.route('/conversations', methods=['GET'])
def get_user_conversations():
    """获取用户的所有对话"""
    try:
        user_id = request.args.get('userId', 'anonymous')
        
        # 模拟返回用户的对话列表
        conversations = []
        for conv_id, messages in chat_conversations.items():
            if messages:
                last_message = messages[-1]
                conversations.append({
                    'id': conv_id,
                    'title': f"与{last_message.get('character', '未知人物')}的对话",
                    'lastMessage': last_message.get('content', '')[:50] + '...',
                    'lastTime': last_message.get('timestamp', ''),
                    'messageCount': len(messages)
                })
        
        return jsonify({
            'success': True,
            'data': conversations
        })
        
    except Exception as e:
        logger.error(f"获取对话列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@dialogue_bp.route('/character/<character_id>', methods=['GET'])
def get_character_info(character_id: str):
    """获取人物详细信息"""
    try:
        if character_id not in character_profiles:
            return jsonify({
                'success': False,
                'error': '人物不存在'
            }), 404
        
        character = character_profiles[character_id]
        
        return jsonify({
            'success': True,
            'data': character
        })
        
    except Exception as e:
        logger.error(f"获取人物信息失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@dialogue_bp.route('/clear/<conversation_id>', methods=['DELETE'])
def clear_conversation(conversation_id: str):
    """清空对话记录"""
    try:
        if conversation_id in chat_conversations:
            del chat_conversations[conversation_id]
        
        return jsonify({
            'success': True,
            'message': '对话记录已清空'
        })
        
    except Exception as e:
        logger.error(f"清空对话失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'清空失败: {str(e)}'
        }), 500
