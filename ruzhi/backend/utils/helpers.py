"""
工具函数模块
"""
import logging
import time
from datetime import datetime
from functools import wraps
from flask import jsonify

logger = logging.getLogger(__name__)

def handle_errors(f):
    """错误处理装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"API错误 {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'服务器内部错误: {str(e)}'
            }), 500
    return decorated_function

def log_api_call(f):
    """API调用日志装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        logger.info(f"API调用开始: {f.__name__}")
        
        result = f(*args, **kwargs)
        
        end_time = time.time()
        duration = round((end_time - start_time) * 1000, 2)
        logger.info(f"API调用完成: {f.__name__}, 耗时: {duration}ms")
        
        return result
    return decorated_function

def validate_required_fields(required_fields):
    """验证必需字段装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            
            if request.is_json:
                data = request.get_json()
                missing_fields = []
                
                for field in required_fields:
                    if field not in data or not data[field]:
                        missing_fields.append(field)
                
                if missing_fields:
                    return jsonify({
                        'success': False,
                        'error': f'缺少必需字段: {", ".join(missing_fields)}'
                    }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def format_timestamp(timestamp=None):
    """格式化时间戳"""
    if timestamp is None:
        timestamp = datetime.now()
    
    if isinstance(timestamp, str):
        return timestamp
    
    return timestamp.isoformat()

def sanitize_text(text):
    """清理文本内容"""
    if not text:
        return ""
    
    # 移除多余的空白字符
    text = ' '.join(text.split())
    
    # 移除特殊字符（保留中文、英文、数字和基本标点）
    import re
    text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s\.,;:!?()（）。，；：！？]', '', text)
    
    return text.strip()

def calculate_confidence(text_length, processing_time, error_count=0):
    """计算置信度"""
    base_confidence = 0.8
    
    # 根据文本长度调整
    if text_length > 100:
        base_confidence += 0.1
    elif text_length < 20:
        base_confidence -= 0.1
    
    # 根据处理时间调整
    if processing_time < 1000:  # 小于1秒
        base_confidence += 0.05
    elif processing_time > 5000:  # 大于5秒
        base_confidence -= 0.05
    
    # 根据错误数量调整
    base_confidence -= error_count * 0.1
    
    # 确保在合理范围内
    return max(0.5, min(0.99, base_confidence))

def paginate_results(data, page=1, per_page=10):
    """分页处理"""
    try:
        page = int(page)
        per_page = int(per_page)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10
        
        total = len(data)
        start = (page - 1) * per_page
        end = start + per_page
        
        items = data[start:end]
        
        return {
            'items': items,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
                'has_prev': page > 1,
                'has_next': end < total
            }
        }
    except (ValueError, TypeError):
        return {
            'items': data[:10],
            'pagination': {
                'page': 1,
                'per_page': 10,
                'total': len(data),
                'pages': 1,
                'has_prev': False,
                'has_next': False
            }
        }

def generate_response_id():
    """生成响应ID"""
    import uuid
    return str(uuid.uuid4())

def mask_sensitive_data(data, sensitive_keys=['apiKey', 'password', 'token']):
    """遮蔽敏感数据"""
    if isinstance(data, dict):
        masked_data = {}
        for key, value in data.items():
            if key in sensitive_keys:
                masked_data[key] = '*' * 8 if value else ''
            elif isinstance(value, (dict, list)):
                masked_data[key] = mask_sensitive_data(value, sensitive_keys)
            else:
                masked_data[key] = value
        return masked_data
    elif isinstance(data, list):
        return [mask_sensitive_data(item, sensitive_keys) for item in data]
    else:
        return data

def validate_file_upload(file, allowed_extensions=None, max_size=None):
    """验证文件上传"""
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    
    if max_size is None:
        max_size = 10 * 1024 * 1024  # 10MB
    
    errors = []
    
    # 检查文件是否存在
    if not file or file.filename == '':
        errors.append('没有选择文件')
        return False, errors
    
    # 检查文件扩展名
    if '.' not in file.filename:
        errors.append('文件没有扩展名')
    else:
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            errors.append(f'不支持的文件类型: {ext}')
    
    # 检查文件大小（如果可能的话）
    try:
        file.seek(0, 2)  # 移动到文件末尾
        size = file.tell()
        file.seek(0)  # 重置到文件开头
        
        if size > max_size:
            errors.append(f'文件太大: {size} bytes (最大: {max_size} bytes)')
    except:
        pass  # 无法获取文件大小时忽略
    
    return len(errors) == 0, errors

def create_success_response(data=None, message=None):
    """创建成功响应"""
    response = {'success': True}
    
    if data is not None:
        response['data'] = data
    
    if message:
        response['message'] = message
    
    return jsonify(response)

def create_error_response(error, status_code=400):
    """创建错误响应"""
    return jsonify({
        'success': False,
        'error': error
    }), status_code

def setup_logging():
    """设置日志配置"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('app.log', encoding='utf-8')
        ]
    )
    
    # 设置第三方库的日志级别
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
