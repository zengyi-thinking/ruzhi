"""
儒智OCR服务 - API端点
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
from datetime import datetime
import io

from ..schemas.ocr import OCRRequest, OCRResponse, OCRMode, ImageEnhanceOptions
from ..services.recognition import EnhancedOCRService

router = APIRouter()
ocr_service = EnhancedOCRService()

@router.post("/analyze", response_model=OCRResponse)
async def analyze_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    options: OCRRequest = Depends()
):
    """
    分析上传的图像并执行OCR识别
    """
    try:
        # 读取上传的图像
        contents = await file.read()
        
        # 调用OCR服务处理图像
        text, processing_time, layout, variants, confidence = ocr_service.process_image(
            image_data=contents,
            mode=options.mode,
            enhance_image=options.enhance_image,
            enhance_options=options.enhance_options,
            detect_layout=options.detect_layout,
            recognize_variants=options.recognize_variants
        )
        
        # 构建响应
        response = OCRResponse(
            text=text,
            layout=layout,
            variants=variants,
            processing_time=processing_time,
            confidence=confidence
        )
        
        # 后台任务：保存处理结果
        background_tasks.add_task(save_result, text, file.filename)
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR处理失败: {str(e)}")

@router.get("/modes")
async def get_available_modes():
    """
    获取可用的OCR模式
    """
    return {
        "modes": [
            {"id": OCRMode.STANDARD, "name": "标准模式", "description": "通用文本识别"},
            {"id": OCRMode.ANCIENT_TEXT, "name": "古籍模式", "description": "优化识别繁体字与古籍排版"},
            {"id": OCRMode.HANDWRITING, "name": "手写体模式", "description": "识别中文手写文本"}
        ]
    }

@router.get("/history/{user_id}")
async def get_user_history(user_id: str):
    """
    获取用户的OCR历史记录
    """
    # 这里应该从数据库中检索用户的OCR历史
    # 模拟返回数据
    return {
        "history": [
            {
                "id": "1",
                "filename": "古籍图片1.jpg",
                "text": "子曰:\"学而时习之，不亦说乎?\"",
                "created_at": "2023-08-14T10:30:00Z",
                "thumbnail": "https://example.com/thumbnails/1.jpg"
            },
            {
                "id": "2",
                "filename": "古籍图片2.jpg",
                "text": "敏而好学，不耻下问。",
                "created_at": "2023-08-15T14:20:00Z",
                "thumbnail": "https://example.com/thumbnails/2.jpg"
            },
            {
                "id": "3",
                "filename": "古籍图片3.jpg",
                "text": "敏而好学，不耻下问。",
                "created_at": "2023-08-15T14:20:00Z",
                "thumbnail": "https://example.com/thumbnails/3.jpg"
            }
        ]
    }

async def save_result(text: str, filename: str):
    """
    保存OCR结果到数据库（模拟）
    
    在实际项目中，这里应该将结果保存到数据库
    """
    # 模拟保存操作
    print(f"保存OCR结果: {filename}, 文本长度: {len(text)}")
    
    # 在实际项目中可以添加如下代码：
    # record = OCRHistoryModel(
    #     id=str(uuid.uuid4()),
    #     filename=filename,
    #     text=text,
    #     created_at=datetime.now().isoformat(),
    # )
    # await db.save(record) 