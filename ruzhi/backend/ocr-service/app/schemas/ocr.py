from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class OCRMode(str, Enum):
    """OCR识别模式"""
    STANDARD = "standard"      # 标准模式
    ANCIENT_TEXT = "ancient"   # 古籍模式
    HANDWRITING = "handwriting" # 手写体模式


class ImageEnhanceOptions(BaseModel):
    """图像增强选项"""
    denoise: bool = Field(default=True, description="去噪")
    contrast_enhance: bool = Field(default=True, description="对比度增强")
    perspective_correction: bool = Field(default=True, description="透视校正")
    binarization: bool = Field(default=True, description="二值化处理")


class OCRRequest(BaseModel):
    """OCR识别请求参数"""
    enhance_image: bool = Field(default=True, description="是否进行图像增强")
    enhance_options: Optional[ImageEnhanceOptions] = Field(default=None, description="图像增强选项")
    detect_layout: bool = Field(default=True, description="是否检测页面布局")
    recognize_variants: bool = Field(default=True, description="是否识别异体字")
    mode: OCRMode = Field(default=OCRMode.ANCIENT_TEXT, description="OCR识别模式")


class TextVariant(BaseModel):
    """文本异体字信息"""
    original: str = Field(..., description="原始字符")
    modern: str = Field(..., description="现代通用字")
    position: List[int] = Field(..., description="在文本中的位置[起始索引, 结束索引]")
    confidence: float = Field(..., description="识别置信度")


class TextBox(BaseModel):
    """文本框信息"""
    text: str = Field(..., description="文本内容")
    box: List[List[int]] = Field(..., description="边界框坐标[[x1,y1], [x2,y2], ...]")
    confidence: float = Field(..., description="识别置信度")
    type: str = Field(default="text", description="文本类型：正文/标题/批注等")


class LayoutInfo(BaseModel):
    """布局信息"""
    paragraphs: List[TextBox] = Field(default_factory=list, description="段落")
    annotations: List[TextBox] = Field(default_factory=list, description="批注")
    headers: List[TextBox] = Field(default_factory=list, description="标题")
    images: List[Dict[str, Any]] = Field(default_factory=list, description="图像区域")


class OCRResponse(BaseModel):
    """OCR识别响应"""
    text: str = Field(..., description="识别文本")
    layout: Optional[LayoutInfo] = Field(default=None, description="布局信息")
    variants: Optional[List[TextVariant]] = Field(default=None, description="异体字信息")
    processing_time: float = Field(..., description="处理时间(秒)")
    confidence: float = Field(..., description="整体置信度")


class OCRHistoryRecord(BaseModel):
    """OCR历史记录"""
    id: str = Field(..., description="记录ID")
    filename: str = Field(..., description="文件名")
    text: str = Field(..., description="识别文本")
    created_at: str = Field(..., description="创建时间")
    user_id: Optional[str] = Field(default=None, description="用户ID")
    thumbnail: Optional[str] = Field(default=None, description="缩略图URL") 