"""
测试OCR文件上传功能
"""
import requests
import json
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    """创建测试图片"""
    # 创建一个白色背景的图片
    img = Image.new('RGB', (400, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # 添加中文文本
    text = "学而时习之，不亦说乎？"
    
    try:
        # 尝试使用系统字体
        font = ImageFont.truetype("simhei.ttf", 24)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
    
    # 在图片上绘制文本
    draw.text((50, 80), text, fill='black', font=font)
    
    # 保存为字节流
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def test_ocr_upload():
    """测试OCR文件上传"""
    print("创建测试图片...")
    image_data = create_test_image()
    
    print("测试OCR文件上传...")
    
    # 准备文件数据
    files = {
        'file': ('test_image.png', image_data, 'image/png')
    }
    
    data = {
        'mode': 'ancient'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/v1/ocr/analyze',
            files=files,
            data=data,
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        result = response.json()
        print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        if result.get('success'):
            print("✅ OCR上传测试成功！")
            return result['data']
        else:
            print("❌ OCR上传测试失败")
            return None
            
    except Exception as e:
        print(f"❌ 测试异常: {str(e)}")
        return None

if __name__ == "__main__":
    test_ocr_upload()
