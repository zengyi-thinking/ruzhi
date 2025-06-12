"""
测试OCR功能
"""
import requests
import json

def test_ocr_modes():
    """测试OCR模式获取"""
    print("测试OCR模式获取...")
    response = requests.get('http://localhost:8000/api/v1/ocr/modes')
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print("-" * 50)

def test_ocr_history():
    """测试OCR历史记录"""
    print("测试OCR历史记录...")
    response = requests.get('http://localhost:8000/api/v1/ocr/history?userId=test_user')
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print("-" * 50)

def test_ocr_interpret():
    """测试OCR文本解读"""
    print("测试OCR文本解读...")
    data = {
        "text": "学而时习之，不亦说乎？",
        "mode": "ancient"
    }
    response = requests.post('http://localhost:8000/api/v1/ocr/interpret', json=data)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print("-" * 50)

if __name__ == "__main__":
    test_ocr_modes()
    test_ocr_history()
    test_ocr_interpret()
