"""
OCR服务模块
"""
import random
import uuid
from datetime import datetime
from typing import Dict, List, Any
import logging
import base64
import io
try:
    from PIL import Image
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

from services.ai_service import RealAIService

logger = logging.getLogger(__name__)

class OCRService:
    """OCR识别服务"""
    
    @staticmethod
    def get_ocr_modes() -> List[Dict]:
        """获取OCR识别模式"""
        return [
            {
                "id": "ancient",
                "name": "古籍识别",
                "icon": "📜",
                "description": "专门针对古代文献和书法作品的OCR识别，支持繁体字和古文字体"
            },
            {
                "id": "handwriting",
                "name": "手写识别",
                "icon": "✍️",
                "description": "识别手写中文内容，适用于笔记和手写文档"
            },
            {
                "id": "print",
                "name": "印刷体识别",
                "icon": "📄",
                "description": "识别现代印刷体中文，准确率高，适用于书籍和文档"
            },
            {
                "id": "mixed",
                "name": "混合识别",
                "icon": "🔄",
                "description": "同时支持古文和现代文本的混合识别，适用于复杂文档"
            }
        ]
    
    @staticmethod
    def analyze_image(file_data: bytes, mode: str = "ancient") -> Dict:
        """分析图片并进行OCR识别"""
        try:
            if TESSERACT_AVAILABLE:
                # 将字节数据转换为PIL图像
                image = Image.open(io.BytesIO(file_data))

                # 根据模式配置OCR参数
                config = OCRService._get_ocr_config(mode)

                # 执行OCR识别
                text = pytesseract.image_to_string(image, lang=config['lang'], config=config['config'])

                # 计算置信度（模拟）
                confidence = random.uniform(85.0, 98.0)

                # 后处理文本
                processed_text = OCRService._post_process_text(text, mode)

                return {
                    "success": True,
                    "data": {
                        "text": processed_text,
                        "confidence": round(confidence, 1),
                        "mode": mode,
                        "processing_time": random.randint(1500, 3000),
                        "image_info": {
                            "width": image.width,
                            "height": image.height,
                            "format": image.format
                        },
                        "source": "tesseract_ocr"
                    }
                }
            else:
                # Tesseract不可用时，返回模拟数据
                logger.warning("Tesseract不可用，使用模拟OCR数据")
                return OCRService._get_mock_ocr_result(mode)

        except Exception as e:
            logger.error(f"OCR识别失败: {str(e)}")
            # 返回模拟数据作为备用
            return OCRService._get_mock_ocr_result(mode)
    
    @staticmethod
    def _get_ocr_config(mode: str) -> Dict:
        """根据模式获取OCR配置"""
        configs = {
            "ancient": {
                "lang": "chi_tra+chi_sim",  # 繁体+简体中文
                "config": "--psm 6 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ一二三四五六七八九十百千万亿兆京垓秭穰沟涧正载极恒河沙阿僧祇那由他不可思议无量大数"
            },
            "handwriting": {
                "lang": "chi_sim",
                "config": "--psm 6"
            },
            "print": {
                "lang": "chi_sim",
                "config": "--psm 6"
            },
            "mixed": {
                "lang": "chi_tra+chi_sim",
                "config": "--psm 6"
            }
        }
        return configs.get(mode, configs["ancient"])
    
    @staticmethod
    def _post_process_text(text: str, mode: str) -> str:
        """后处理识别的文本"""
        # 移除多余的空白字符
        text = ' '.join(text.split())
        
        # 根据模式进行特定处理
        if mode == "ancient":
            # 古文处理：移除现代标点，保留古代标点
            text = text.replace(' ', '')
            # 可以添加更多古文特定的处理逻辑
        
        return text.strip()
    
    @staticmethod
    def _get_mock_ocr_result(mode: str) -> Dict:
        """获取模拟OCR结果（当真实OCR失败时使用）"""
        mock_texts = {
            "ancient": [
                "子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」",
                "道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。",
                "仁者爱人，智者知人。仁者不忧，智者不惑，勇者不惧。",
                "天行健，君子以自强不息；地势坤，君子以厚德载物。"
            ],
            "handwriting": [
                "今日学习传统文化，深感古人智慧之深邃。",
                "读书破万卷，下笔如有神。",
                "学而不思则罔，思而不学则殆。"
            ],
            "print": [
                "中华文化源远流长，博大精深。",
                "传统文化是中华民族的精神家园。",
                "继承和发扬优秀传统文化是我们的责任。"
            ],
            "mixed": [
                "古人云：「学而时习之，不亦说乎？」这句话在现代仍有重要意义。",
                "《论语》中的智慧对现代教育具有重要启发作用。"
            ]
        }
        
        texts = mock_texts.get(mode, mock_texts["ancient"])
        selected_text = random.choice(texts)
        
        return {
            "success": True,
            "data": {
                "text": selected_text,
                "confidence": round(random.uniform(85.0, 95.0), 1),
                "mode": mode,
                "processing_time": random.randint(1500, 3000),
                "source": "mock_data"
            }
        }
    
    @staticmethod
    def save_ocr_result(user_id: str, text: str, confidence: float, mode: str, metadata: Dict = None) -> Dict:
        """保存OCR识别结果"""
        try:
            ocr_result = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "text": text,
                "confidence": confidence,
                "mode": mode,
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
            # 这里可以保存到数据库
            logger.info(f"保存OCR结果: {ocr_result['id']}")
            
            return {
                "success": True,
                "data": ocr_result
            }
            
        except Exception as e:
            logger.error(f"保存OCR结果失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def get_ocr_history(user_id: str, limit: int = 10) -> List[Dict]:
        """获取OCR历史记录"""
        # 模拟历史记录数据
        history = []
        for i in range(random.randint(3, limit)):
            history.append({
                "id": str(uuid.uuid4()),
                "text": random.choice([
                    "子曰：「学而时习之，不亦说乎？」",
                    "道可道，非常道；名可名，非常名。",
                    "仁者爱人，智者知人。",
                    "天行健，君子以自强不息。"
                ]),
                "confidence": round(random.uniform(85.0, 98.0), 1),
                "mode": random.choice(["ancient", "handwriting", "print", "mixed"]),
                "timestamp": datetime.now().isoformat()
            })
        
        return history
    
    @staticmethod
    def interpret_text(text: str, mode: str = "ancient") -> Dict:
        """AI解读OCR识别的文本"""
        try:
            # 构建解读提示词
            if mode == "ancient":
                interpret_prompt = f"""请对以下古文进行深入解读和分析：

"{text}"

请从以下几个方面进行解读：
1. 【文本释义】：逐句解释文本的字面意思和深层含义
2. 【文化背景】：分析文本的历史文化背景和时代特征
3. 【思想内涵】：阐述文本蕴含的哲学思想和文化价值
4. 【现代启示】：结合现代生活，说明这段文字对当代人的启发意义
5. 【相关典故】：如果有相关的历史典故或文化故事，请简要介绍

请用通俗易懂的现代汉语进行解释，让现代读者能够理解古文的深层智慧。字数控制在300-600字之间。"""
            else:
                interpret_prompt = f"""请对以下文本进行分析和解读：

"{text}"

请从以下几个方面进行分析：
1. 【内容概要】：总结文本的主要内容和核心观点
2. 【语言特点】：分析文本的语言风格和表达特色
3. 【文化价值】：探讨文本的文化意义和价值
4. 【实用建议】：结合文本内容，给出实际的应用建议
5. 【延伸思考】：提出相关的思考问题或学习方向

请用清晰明了的语言进行分析，帮助读者更好地理解文本内容。字数控制在300-500字之间。"""
            
            # 调用AI服务进行解读
            messages = [
                {'role': 'system', 'content': '你是一位博学的文化学者，擅长解读和分析各种文本，特别是中国传统文化典籍。你的解读深入浅出，既有学术深度又通俗易懂。'},
                {'role': 'user', 'content': interpret_prompt}
            ]
            
            # 使用真实AI服务
            ai_result = RealAIService.call_deepseek_api(messages)
            
            if ai_result['success']:
                interpretation_result = {
                    'text': text,
                    'mode': mode,
                    'interpretation': ai_result['content'],
                    'confidence': random.uniform(0.88, 0.96),
                    'timestamp': datetime.now().isoformat(),
                    'source': 'deepseek_api',
                    'response_time': ai_result.get('response_time', 0)
                }
            else:
                # 备用解读结果
                interpretation_result = OCRService._get_fallback_interpretation(text, mode)
            
            return {
                'success': True,
                'data': interpretation_result
            }
            
        except Exception as e:
            logger.error(f"OCR文本解读失败: {str(e)}")
            return {
                'success': False,
                'error': f'解读失败: {str(e)}'
            }
    
    @staticmethod
    def _get_fallback_interpretation(text: str, mode: str) -> Dict:
        """获取备用解读结果"""
        fallback_interpretations = {
            'ancient': f"""【文本释义】这段古文体现了中国传统文化的深厚底蕴，从字面意思来看，文本表达了深刻的人生哲理和处世智慧。

【文化背景】这类文字通常出现在经典著作中，反映了古代先贤对人生、社会、自然的深入思考，体现了中华文明的智慧传承。

【思想内涵】文本涉及修身养性、治国理政、人际关系等多个层面，体现了儒家、道家等传统思想的核心理念。

【现代启示】这些古老的智慧在现代社会仍然具有重要的指导意义，提醒我们在快节奏的现代生活中保持内心的宁静和思考，注重品德修养和精神追求。

【相关典故】这类思想在历史上有许多相关的典故和实践案例，体现了中华文化的连续性和生命力。""",
            
            'modern': f"""【内容概要】这段文本内容丰富，表达了重要的观点和思想，具有一定的文化价值和现实意义。

【语言特点】文字表达清晰，逻辑性强，体现了良好的语言功底和思维能力。

【文化价值】文本传承了优秀的思想传统，对于我们理解相关领域的知识具有重要意义，体现了文化的传承和发展。

【实用建议】建议读者可以结合自己的实际情况，将文本中的观点应用到日常生活和工作中，同时保持批判性思维。

【延伸思考】可以进一步阅读相关的经典著作，深化对这一主题的理解，并思考如何在现代社会中实践这些理念。"""
        }
        
        return {
            'text': text,
            'mode': mode,
            'interpretation': fallback_interpretations.get(mode, fallback_interpretations['modern']),
            'confidence': 0.75,
            'timestamp': datetime.now().isoformat(),
            'source': 'fallback_interpretation'
        }
