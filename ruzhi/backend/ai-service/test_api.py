"""
DeepSeek API 测试脚本
"""

import requests
import json
import time

# DeepSeek API 配置
API_KEY = "sk-d624fca8134b4ecc84c178770118ffb8"
API_BASE = "https://api.deepseek.com/v1"

def test_deepseek_api():
    """测试DeepSeek API是否正常工作"""
    print("测试 DeepSeek API 连接...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是孔子，中国古代伟大的思想家、教育家。请用孔子的语言风格回答问题。"},
            {"role": "user", "content": "请简单介绍一下你自己。"}
        ],
        "temperature": 0.7,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/chat/completions",
            headers=headers,
            json=payload
        )
        
        response.raise_for_status()
        result = response.json()
        
        print("\n=== API 测试结果 ===")
        print(f"状态码: {response.status_code}")
        print(f"响应内容:")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # 提取回复内容
        if "choices" in result and len(result["choices"]) > 0:
            reply = result["choices"][0]["message"]["content"]
            print("\n=== 孔子的回复 ===")
            print(reply)
        
        return True
    except Exception as e:
        print(f"API 测试失败: {str(e)}")
        return False

def test_local_service():
    """测试本地AI对话服务"""
    print("\n测试本地AI对话服务...")
    
    try:
        # 测试健康检查
        health_response = requests.get("http://127.0.0.1:8003/api/v1/dialogue/health")
        health_response.raise_for_status()
        
        print(f"健康检查状态: {health_response.json()}")
        
        # 获取可用人物列表
        chars_response = requests.get("http://127.0.0.1:8003/api/v1/dialogue/characters")
        chars_response.raise_for_status()
        
        print(f"可用人物列表: {json.dumps(chars_response.json(), ensure_ascii=False, indent=2)}")
        
        # 发送聊天请求
        chat_payload = {
            "user_id": "test_user",
            "message": "请介绍一下你自己",
            "character": "confucius"
        }
        
        print("发送聊天请求...")
        chat_response = requests.post(
            "http://127.0.0.1:8003/api/v1/dialogue/chat",
            json=chat_payload
        )
        chat_response.raise_for_status()
        
        result = chat_response.json()
        print("\n=== 聊天回复 ===")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        return True
    except Exception as e:
        print(f"本地服务测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    # 先测试API直连
    api_result = test_deepseek_api()
    
    if api_result:
        print("\nDeepSeek API 测试成功！")
    else:
        print("\nDeepSeek API 测试失败，请检查API密钥和连接。")
    
    # 等待几秒，避免API频率限制
    time.sleep(2)
    
    # 再测试本地服务
    print("\n等待本地服务就绪...")
    time.sleep(3)  # 给服务启动一些时间
    
    service_result = test_local_service()
    
    if service_result:
        print("\n本地AI对话服务测试成功！")
    else:
        print("\n本地AI对话服务测试失败，请检查服务是否启动。") 