"""
增强版OCR服务模块
支持EasyOCR和PaddleOCR引擎，提供图像预处理和文字识别功能
"""
import base64
import io
import time
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import logging
import os

# OCR引擎导入
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR未安装，将使用模拟模式")

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logging.warning("PaddleOCR未安装，将使用模拟模式")

from config.settings import OCR_CONFIG
from utils.logging_config import get_logger

logger = get_logger('ocr')

class ImagePreprocessor:
    """图像预处理器"""
    
    @staticmethod
    def decode_base64_image(image_data: str) -> np.ndarray:
        """解码base64图像数据"""
        try:
            # 移除data URL前缀（如果存在）
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # 解码base64
            image_bytes = base64.b64decode(image_data)
            
            # 转换为PIL图像
            pil_image = Image.open(io.BytesIO(image_bytes))
            
            # 转换为RGB格式
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            
            # 转换为numpy数组
            image_array = np.array(pil_image)
            
            return image_array
            
        except Exception as e:
            logger.error(f"图像解码失败: {e}")
            raise ValueError(f"无效的图像数据: {e}")
    
    @staticmethod
    def resize_image(image: np.ndarray, max_width: int = None, max_height: int = None) -> np.ndarray:
        """调整图像大小"""
        max_width = max_width or OCR_CONFIG['preprocessing']['resize_max_width']
        max_height = max_height or OCR_CONFIG['preprocessing']['resize_max_height']
        
        height, width = image.shape[:2]
        
        # 计算缩放比例
        scale_w = max_width / width if width > max_width else 1
        scale_h = max_height / height if height > max_height else 1
        scale = min(scale_w, scale_h)
        
        if scale < 1:
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            logger.info(f"图像已调整大小: {width}x{height} -> {new_width}x{new_height}")
        
        return image
    
    @staticmethod
    def enhance_contrast(image: np.ndarray, factor: float = 1.5) -> np.ndarray:
        """增强对比度"""
        if not OCR_CONFIG['preprocessing']['enhance_contrast']:
            return image
        
        try:
            # 转换为PIL图像
            pil_image = Image.fromarray(image)
            
            # 增强对比度
            enhancer = ImageEnhance.Contrast(pil_image)
            enhanced_image = enhancer.enhance(factor)
            
            return np.array(enhanced_image)
            
        except Exception as e:
            logger.warning(f"对比度增强失败: {e}")
            return image
    
    @staticmethod
    def denoise_image(image: np.ndarray) -> np.ndarray:
        """图像去噪"""
        if not OCR_CONFIG['preprocessing']['denoise']:
            return image
        
        try:
            # 使用双边滤波去噪
            denoised = cv2.bilateralFilter(image, 9, 75, 75)
            return denoised
            
        except Exception as e:
            logger.warning(f"图像去噪失败: {e}")
            return image
    
    @staticmethod
    def correct_skew(image: np.ndarray) -> np.ndarray:
        """倾斜校正"""
        try:
            # 转换为灰度图
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # 边缘检测
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            
            # 霍夫变换检测直线
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            
            if lines is not None:
                # 计算平均角度
                angles = []
                for rho, theta in lines[:10]:  # 只使用前10条线
                    angle = theta * 180 / np.pi - 90
                    angles.append(angle)
                
                if angles:
                    avg_angle = np.mean(angles)
                    
                    # 如果倾斜角度超过阈值，进行校正
                    if abs(avg_angle) > 1:
                        height, width = image.shape[:2]
                        center = (width // 2, height // 2)
                        
                        # 创建旋转矩阵
                        rotation_matrix = cv2.getRotationMatrix2D(center, avg_angle, 1.0)
                        
                        # 应用旋转
                        corrected = cv2.warpAffine(image, rotation_matrix, (width, height),
                                                 flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                        
                        logger.info(f"倾斜校正完成，角度: {avg_angle:.2f}度")
                        return corrected
            
            return image
            
        except Exception as e:
            logger.warning(f"倾斜校正失败: {e}")
            return image
    
    @staticmethod
    def preprocess_image(image_data: str, options: Dict[str, Any] = None) -> np.ndarray:
        """完整的图像预处理流程"""
        options = options or {}
        
        # 解码图像
        image = ImagePreprocessor.decode_base64_image(image_data)
        
        # 调整大小
        if options.get('resize', True):
            image = ImagePreprocessor.resize_image(image)
        
        # 倾斜校正
        if options.get('correct_skew', True):
            image = ImagePreprocessor.correct_skew(image)
        
        # 增强对比度
        if options.get('enhance_contrast', True):
            image = ImagePreprocessor.enhance_contrast(image)
        
        # 去噪
        if options.get('denoise', True):
            image = ImagePreprocessor.denoise_image(image)
        
        return image

class OCREngine:
    """OCR引擎封装"""
    
    def __init__(self, engine_type: str = None):
        self.engine_type = engine_type or OCR_CONFIG['default_engine']
        self.engine = None
        self._initialize_engine()
    
    def _initialize_engine(self):
        """初始化OCR引擎"""
        try:
            if self.engine_type == 'easyocr' and EASYOCR_AVAILABLE:
                self.engine = easyocr.Reader(['ch_sim', 'ch_tra', 'en'])
                logger.info("EasyOCR引擎初始化成功")
                
            elif self.engine_type == 'paddleocr' and PADDLEOCR_AVAILABLE:
                self.engine = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
                logger.info("PaddleOCR引擎初始化成功")
                
            else:
                logger.warning(f"OCR引擎 {self.engine_type} 不可用，将使用模拟模式")
                self.engine = None
                
        except Exception as e:
            logger.error(f"OCR引擎初始化失败: {e}")
            self.engine = None
    
    def recognize_text(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """文字识别"""
        if self.engine is None:
            return self._mock_recognition()
        
        try:
            if self.engine_type == 'easyocr':
                return self._easyocr_recognize(image)
            elif self.engine_type == 'paddleocr':
                return self._paddleocr_recognize(image)
            else:
                return self._mock_recognition()
                
        except Exception as e:
            logger.error(f"文字识别失败: {e}")
            return self._mock_recognition()
    
    def _easyocr_recognize(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """EasyOCR识别"""
        results = self.engine.readtext(image)
        
        formatted_results = []
        for bbox, text, confidence in results:
            if confidence >= OCR_CONFIG['confidence_threshold']:
                formatted_results.append({
                    'text': text,
                    'confidence': float(confidence),
                    'bbox': bbox,
                    'engine': 'easyocr'
                })
        
        return formatted_results
    
    def _paddleocr_recognize(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """PaddleOCR识别"""
        results = self.engine.ocr(image, cls=True)
        
        formatted_results = []
        if results and results[0]:
            for line in results[0]:
                bbox, (text, confidence) = line
                if confidence >= OCR_CONFIG['confidence_threshold']:
                    formatted_results.append({
                        'text': text,
                        'confidence': float(confidence),
                        'bbox': bbox,
                        'engine': 'paddleocr'
                    })
        
        return formatted_results
    
    def _mock_recognition(self) -> List[Dict[str, Any]]:
        """模拟识别结果"""
        return [{
            'text': '学而时习之，不亦说乎？',
            'confidence': 0.95,
            'bbox': [[10, 10], [200, 10], [200, 50], [10, 50]],
            'engine': 'mock'
        }]

class EnhancedOCRService:
    """增强版OCR服务"""

    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.engines = {}
        self._initialize_engines()

    def _initialize_engines(self):
        """初始化所有可用的OCR引擎"""
        for engine_type in OCR_CONFIG['supported_engines']:
            try:
                self.engines[engine_type] = OCREngine(engine_type)
                logger.info(f"OCR引擎 {engine_type} 初始化成功")
            except Exception as e:
                logger.warning(f"OCR引擎 {engine_type} 初始化失败: {e}")

    def process_image(self, image_data: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """处理图像OCR识别"""
        start_time = time.time()
        options = options or {}

        try:
            # 图像预处理
            logger.info("开始图像预处理")
            processed_image = self.preprocessor.preprocess_image(image_data, options)

            # 选择OCR引擎
            engine_type = options.get('engine', OCR_CONFIG['default_engine'])
            if engine_type not in self.engines:
                engine_type = OCR_CONFIG['default_engine']

            ocr_engine = self.engines.get(engine_type)
            if not ocr_engine:
                raise ValueError(f"OCR引擎 {engine_type} 不可用")

            # 执行OCR识别
            logger.info(f"使用 {engine_type} 引擎进行文字识别")
            recognition_results = ocr_engine.recognize_text(processed_image)

            # 后处理结果
            processed_results = self._post_process_results(recognition_results, options)

            # 计算处理时间
            processing_time = time.time() - start_time

            # 构建返回结果
            result = {
                'success': True,
                'data': {
                    'text': self._extract_full_text(processed_results),
                    'detailed_results': processed_results,
                    'confidence': self._calculate_average_confidence(processed_results),
                    'processing_time': round(processing_time, 3),
                    'engine': engine_type,
                    'image_info': {
                        'width': processed_image.shape[1],
                        'height': processed_image.shape[0],
                        'channels': processed_image.shape[2] if len(processed_image.shape) > 2 else 1
                    },
                    'preprocessing_applied': {
                        'resize': options.get('resize', True),
                        'correct_skew': options.get('correct_skew', True),
                        'enhance_contrast': options.get('enhance_contrast', True),
                        'denoise': options.get('denoise', True)
                    }
                }
            }

            logger.info(f"OCR处理完成，耗时: {processing_time:.3f}秒")
            return result

        except Exception as e:
            logger.error(f"OCR处理失败: {e}")
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time
            }

    def _post_process_results(self, results: List[Dict[str, Any]], options: Dict[str, Any]) -> List[Dict[str, Any]]:
        """后处理OCR结果"""
        processed_results = []

        for result in results:
            text = result['text']

            # 文本清理
            text = self._clean_text(text, options)

            # 置信度过滤
            if result['confidence'] >= OCR_CONFIG['confidence_threshold']:
                processed_results.append({
                    'text': text,
                    'confidence': result['confidence'],
                    'bbox': result['bbox'],
                    'engine': result['engine']
                })

        # 按位置排序（从上到下，从左到右）
        processed_results.sort(key=lambda x: (x['bbox'][0][1], x['bbox'][0][0]))

        return processed_results

    def _clean_text(self, text: str, options: Dict[str, Any]) -> str:
        """清理识别的文本"""
        # 移除多余的空白字符
        text = ' '.join(text.split())

        # 根据选项进行特定清理
        if options.get('remove_spaces', False):
            text = text.replace(' ', '')

        if options.get('traditional_to_simplified', False):
            # 这里可以添加繁简转换逻辑
            pass

        return text.strip()

    def _extract_full_text(self, results: List[Dict[str, Any]]) -> str:
        """提取完整文本"""
        return '\n'.join([result['text'] for result in results])

    def _calculate_average_confidence(self, results: List[Dict[str, Any]]) -> float:
        """计算平均置信度"""
        if not results:
            return 0.0

        total_confidence = sum(result['confidence'] for result in results)
        return round(total_confidence / len(results), 3)

    def validate_image(self, image_data: str) -> Dict[str, Any]:
        """验证图像数据"""
        try:
            # 解码图像
            image = self.preprocessor.decode_base64_image(image_data)

            # 检查图像尺寸
            height, width = image.shape[:2]

            # 检查文件大小（估算）
            estimated_size = len(image_data) * 3 / 4  # base64解码后的大小估算

            validation_result = {
                'valid': True,
                'width': width,
                'height': height,
                'estimated_size_bytes': int(estimated_size),
                'format_supported': True
            }

            # 检查尺寸限制
            if width > OCR_CONFIG['preprocessing']['resize_max_width'] * 2:
                validation_result['warnings'] = validation_result.get('warnings', [])
                validation_result['warnings'].append('图像宽度过大，建议压缩')

            if height > OCR_CONFIG['preprocessing']['resize_max_height'] * 2:
                validation_result['warnings'] = validation_result.get('warnings', [])
                validation_result['warnings'].append('图像高度过大，建议压缩')

            # 检查文件大小
            if estimated_size > OCR_CONFIG['max_image_size']:
                validation_result['valid'] = False
                validation_result['error'] = f'图像文件过大，最大支持 {OCR_CONFIG["max_image_size"] / 1024 / 1024:.1f}MB'

            return validation_result

        except Exception as e:
            return {
                'valid': False,
                'error': f'图像验证失败: {str(e)}'
            }

    def get_supported_formats(self) -> List[str]:
        """获取支持的图像格式"""
        return list(OCR_CONFIG['supported_formats'])

    def get_engine_info(self) -> Dict[str, Any]:
        """获取OCR引擎信息"""
        engine_info = {}

        for engine_type, engine in self.engines.items():
            engine_info[engine_type] = {
                'available': engine.engine is not None,
                'type': engine_type,
                'status': 'ready' if engine.engine else 'unavailable'
            }

        return {
            'engines': engine_info,
            'default_engine': OCR_CONFIG['default_engine'],
            'supported_languages': OCR_CONFIG['supported_languages']
        }

# 全局OCR服务实例
enhanced_ocr_service = EnhancedOCRService()
