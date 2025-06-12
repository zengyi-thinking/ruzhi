"""
API配置管理相关路由
"""
from flask import Blueprint, request, jsonify
import logging
import requests
from datetime import datetime

from models.data_storage import api_config_storage, api_stats, api_cache

logger = logging.getLogger(__name__)

config_bp = Blueprint('config', __name__, url_prefix='/api/v1/config')

@config_bp.route('/api', methods=['GET'])
def get_api_config():
    """获取API配置"""
    try:
        # 返回配置（隐藏敏感信息）
        safe_config = {
            'baseUrl': api_config_storage.get('baseUrl', ''),
            'model': api_config_storage.get('model', 'deepseek-chat'),
            'temperature': api_config_storage.get('temperature', 0.7),
            'maxTokens': api_config_storage.get('maxTokens', 2000),
            'timeout': api_config_storage.get('timeout', 30),
            'hasApiKey': bool(api_config_storage.get('apiKey', ''))
        }
        
        return jsonify({
            'success': True,
            'data': safe_config
        })
        
    except Exception as e:
        logger.error(f"获取API配置失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@config_bp.route('/api', methods=['POST'])
def update_api_config():
    """更新API配置"""
    try:
        data = request.get_json()
        
        # 更新配置
        if 'apiKey' in data:
            api_config_storage['apiKey'] = data['apiKey']
        if 'baseUrl' in data:
            api_config_storage['baseUrl'] = data['baseUrl']
        if 'model' in data:
            api_config_storage['model'] = data['model']
        if 'temperature' in data:
            api_config_storage['temperature'] = float(data['temperature'])
        if 'maxTokens' in data:
            api_config_storage['maxTokens'] = int(data['maxTokens'])
        if 'timeout' in data:
            api_config_storage['timeout'] = int(data['timeout'])
        
        return jsonify({
            'success': True,
            'message': 'API配置已更新'
        })
        
    except Exception as e:
        logger.error(f"更新API配置失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'更新失败: {str(e)}'
        }), 500

@config_bp.route('/api/test', methods=['POST'])
def test_api_connection():
    """测试API连接"""
    try:
        # 构建测试请求
        headers = {
            'Authorization': f'Bearer {api_config_storage.get("apiKey", "")}',
            'Content-Type': 'application/json'
        }
        
        test_data = {
            'model': api_config_storage.get('model', 'deepseek-chat'),
            'messages': [
                {'role': 'user', 'content': '你好，请回复"连接测试成功"'}
            ],
            'max_tokens': 50,
            'temperature': 0.1
        }
        
        base_url = api_config_storage.get('baseUrl', 'https://api.deepseek.com/v1')
        timeout = api_config_storage.get('timeout', 30)
        
        # 发送测试请求
        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json=test_data,
            timeout=timeout
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                'success': True,
                'message': 'API连接测试成功',
                'response': result.get('choices', [{}])[0].get('message', {}).get('content', ''),
                'model': result.get('model', ''),
                'usage': result.get('usage', {})
            })
        else:
            return jsonify({
                'success': False,
                'error': f'API连接失败: {response.status_code} - {response.text}'
            })
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'API连接超时'
        })
    except Exception as e:
        logger.error(f"API连接测试失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'连接测试失败: {str(e)}'
        })

@config_bp.route('/stats', methods=['GET'])
def get_api_stats():
    """获取API使用统计"""
    try:
        # 计算成功率
        total_requests = api_stats['totalRequests']
        success_rate = 0
        avg_response_time = 0
        
        if total_requests > 0:
            success_rate = (api_stats['successfulRequests'] / total_requests) * 100
            
            if api_stats['successfulRequests'] > 0:
                avg_response_time = api_stats['totalResponseTime'] / api_stats['successfulRequests']
        
        stats_data = {
            'totalRequests': total_requests,
            'successfulRequests': api_stats['successfulRequests'],
            'failedRequests': api_stats['failedRequests'],
            'successRate': round(success_rate, 2),
            'averageResponseTime': round(avg_response_time, 2),
            'todayRequests': api_stats['todayRequests'],
            'lastRequestDate': api_stats['lastRequestDate'].isoformat() if api_stats['lastRequestDate'] else None,
            'cacheSize': len(api_cache)
        }
        
        return jsonify({
            'success': True,
            'data': stats_data
        })
        
    except Exception as e:
        logger.error(f"获取API统计失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500

@config_bp.route('/stats/reset', methods=['POST'])
def reset_api_stats():
    """重置API统计数据"""
    try:
        api_stats['totalRequests'] = 0
        api_stats['successfulRequests'] = 0
        api_stats['failedRequests'] = 0
        api_stats['totalResponseTime'] = 0
        api_stats['todayRequests'] = 0
        api_stats['lastRequestDate'] = None
        
        return jsonify({
            'success': True,
            'message': 'API统计数据已重置'
        })
        
    except Exception as e:
        logger.error(f"重置API统计失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'重置失败: {str(e)}'
        }), 500

@config_bp.route('/cache/clear', methods=['POST'])
def clear_api_cache():
    """清空API缓存"""
    try:
        api_cache.clear()
        
        return jsonify({
            'success': True,
            'message': 'API缓存已清空'
        })
        
    except Exception as e:
        logger.error(f"清空API缓存失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'清空失败: {str(e)}'
        }), 500

@config_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """获取缓存统计"""
    try:
        cache_stats = {
            'size': len(api_cache),
            'maxSize': 1000,  # 从配置中获取
            'hitRate': 0,  # 可以添加命中率统计
            'entries': []
        }
        
        # 获取最近的缓存条目（用于调试）
        for key, value in list(api_cache.items())[:10]:
            cache_stats['entries'].append({
                'key': key[:20] + '...' if len(key) > 20 else key,
                'timestamp': datetime.fromtimestamp(value['timestamp']).isoformat(),
                'size': len(str(value['data']))
            })
        
        return jsonify({
            'success': True,
            'data': cache_stats
        })
        
    except Exception as e:
        logger.error(f"获取缓存统计失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'获取失败: {str(e)}'
        }), 500
