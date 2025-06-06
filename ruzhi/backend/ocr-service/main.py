from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import uuid
import asyncio
from datetime import datetime
import cv2
import numpy as np
from PIL import Image
import io
import logging
from contextlib import asynccontextmanager

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 模拟OCR模型加载
ocr_model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时加载模型
    logger.info("正在加载OCR模型...")
    # 这里应该是实际的模型加载代码
    # global ocr_model
    # ocr_model = load_model()
    logger.info("OCR模型加载完成")
    yield
    # 关闭时的清理操作
    logger.info("正在关闭OCR服务...")

app = FastAPI(
    title="儒智OCR服务",
    description="古籍智能识别OCR服务API",
    version="0.1.0",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class OCRRequest(BaseModel):
    enhance_image: bool = True
    detect_layout: bool = True
    recognize_variants: bool = True

# 响应模型
class TextVariant(BaseModel):
    original: str
    modern: str
    position: List[int]

class Paragraph(BaseModel):
    text: str
    box: List[List[int]]
    confidence: float

class OCRResponse(BaseModel):
    text: str
    layout: Optional[Dict[str, Any]] = None
    variants: Optional[List[TextVariant]] = None
    processing_time: float

# 工具函数
def preprocess_image(image_bytes):
    """预处理图像，包括透视校正、光线优化等"""
    try:
        # 将字节转换为OpenCV格式
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 图像增强（示例）
        # 灰度转换
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # 自适应阈值处理
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # 返回处理后的图像
        return binary
    except Exception as e:
        logger.error(f"图像预处理失败: {e}")
        raise HTTPException(status_code=500, detail=f"图像预处理失败: {str(e)}")

def detect_layout(image):
    """检测页面布局，分离正文、批注等"""
    # 这里是布局检测的简化实现
    # 实际应用中应使用更复杂的算法
    try:
        # 模拟布局检测结果
        height, width = image.shape
        paragraphs = [
            {
                "text": "主文本区域",
                "box": [[50, 50], [width-50, 50], [width-50, height-50], [50, height-50]],
                "confidence": 0.95
            }
        ]
        return {"paragraphs": paragraphs, "annotations": []}
    except Exception as e:
        logger.error(f"布局检测失败: {e}")
        return {"paragraphs": [], "annotations": []}

def recognize_text(image, recognize_variants=True):
    """识别图像中的文字，包括异体字映射"""
    # 这里是OCR文本识别的简化实现
    # 实际应用中应使用训练好的模型
    try:
        # 模拟OCR结果
        text = "子曰：“学而时习之，不亦说乎？”"
        variants = []
        
        if recognize_variants:
            # 模拟异体字识别
            variants = [
                {"original": "说", "modern": "悦", "position": [10, 11]}
            ]
        
        return text, variants
    except Exception as e:
        logger.error(f"文本识别失败: {e}")
        return "", []

@app.get("/")
async def root():
    return {"message": "儒智OCR服务已启动"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/ocr/analyze", response_model=OCRResponse)
async def analyze_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    options: OCRRequest = Depends()
):
    """
    分析上传的图像并执行OCR识别
    """
    start_time = datetime.now()
    
    try:
        # 读取上传的图像
        contents = await file.read()
        
        # 图像预处理
        if options.enhance_image:
            processed_image = preprocess_image(contents)
        else:
            nparr = np.frombuffer(contents, np.uint8)
            processed_image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        # 布局检测
        layout = None
        if options.detect_layout:
            layout = detect_layout(processed_image)
        
        # 文本识别
        text, variants = recognize_text(processed_image, options.recognize_variants)
        
        # 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # 构建响应
        response = {
            "text": text,
            "layout": layout,
            "variants": variants,
            "processing_time": processing_time
        }
        
        # 后台任务：保存处理结果
        background_tasks.add_task(save_result, text, file.filename)
        
        return response
    
    except Exception as e:
        logger.error(f"OCR处理失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_result(text: str, filename: str):
    """保存OCR结果到数据库（模拟）"""
    # 这里应该是实际的数据库保存代码
    logger.info(f"保存OCR结果: {filename}")
    await asyncio.sleep(1)  # 模拟异步操作
    logger.info(f"OCR结果已保存: {filename}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 