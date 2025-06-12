"""
OCR相关路由
"""
from flask import Blueprint, request, jsonify
import logging

from services.ocr_service import OCRService

logger = logging.getLogger(__name__)

ocr_bp = Blueprint('ocr', __name__, url_prefix='/api/v1/ocr')

@ocr_bp.route('/modes', methods=['GET'])
def get_ocr_modes():
    """获取OCR识别模式"""
    try:
        modes = OCRService.get_ocr_modes()
        return jsonify({
            "success": True,
            "data": modes
        })
    except Exception as e:
        logger.error(f"获取OCR模式失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ocr_bp.route('/analyze', methods=['POST'])
def analyze_image():
    """分析图片并进行OCR识别"""
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "没有上传文件"
            }), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "没有选择文件"
            }), 400

        # 获取识别模式
        mode = request.form.get('mode', 'ancient')

        # 读取文件数据
        file_data = file.read()

        # 执行OCR分析
        result = OCRService.analyze_image(file_data, mode)

        return jsonify(result)

    except Exception as e:
        logger.error(f"OCR分析失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"分析失败: {str(e)}"
        }), 500

@ocr_bp.route('/save', methods=['POST'])
def save_ocr_result():
    """保存OCR识别结果"""
    try:
        data = request.get_json()
        
        user_id = data.get('userId', 'anonymous')
        text = data.get('text', '')
        confidence = data.get('confidence', 0.0)
        mode = data.get('mode', 'ancient')
        metadata = data.get('metadata', {})

        if not text:
            return jsonify({
                "success": False,
                "error": "文本内容不能为空"
            }), 400

        result = OCRService.save_ocr_result(user_id, text, confidence, mode, metadata)
        return jsonify(result)

    except Exception as e:
        logger.error(f"保存OCR结果失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"保存失败: {str(e)}"
        }), 500

@ocr_bp.route('/history', methods=['GET'])
def get_ocr_history():
    """获取OCR历史记录"""
    try:
        user_id = request.args.get('userId', 'anonymous')
        limit = int(request.args.get('limit', 10))

        history = OCRService.get_ocr_history(user_id, limit)

        return jsonify({
            "success": True,
            "data": history
        })

    except Exception as e:
        logger.error(f"获取OCR历史失败: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"获取失败: {str(e)}"
        }), 500

@ocr_bp.route('/interpret', methods=['POST'])
def interpret_ocr_text():
    """AI解读OCR识别的文本"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        mode = data.get('mode', 'ancient')
        
        if not text:
            return jsonify({
                'success': False,
                'error': '待解读文本不能为空'
            }), 400
        
        result = OCRService.interpret_text(text, mode)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"OCR文本解读失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'解读失败: {str(e)}'
        }), 500
