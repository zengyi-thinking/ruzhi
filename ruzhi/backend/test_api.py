#!/usr/bin/env python3
"""
儒智后端API测试脚本
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"
TEST_USER_ID = "user_001"

def test_root_endpoint():
    """测试根路径接口"""
    print("测试根路径接口...")
    try:
        # 测试JSON响应
        response = requests.get(f"{BASE_URL}/", headers={'Accept': 'application/json'})
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 根路径JSON响应正常: {data['service']}")

            # 测试HTML响应
            html_response = requests.get(f"{BASE_URL}/", headers={'Accept': 'text/html'})
            if html_response.status_code == 200 and 'html' in html_response.text.lower():
                print("✓ 根路径HTML响应正常")
                return True
            else:
                print("✗ 根路径HTML响应异常")
                return False
        else:
            print(f"✗ 根路径访问失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 根路径访问异常: {e}")
        return False

def test_health_check():
    """测试健康检查接口"""
    print("测试健康检查接口...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 健康检查通过: {data['status']} (版本: {data.get('version', 'N/A')})")
            return True
        else:
            print(f"✗ 健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 健康检查异常: {e}")
        return False

def test_learning_history():
    """测试学习历史接口"""
    print("测试学习历史接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/learning-history")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                stats = data['data']['stats']
                print(f"✓ 学习历史获取成功:")
                print(f"  - 总学习时长: {stats['totalStudyTime']}分钟")
                print(f"  - 完成会话: {stats['completedSessions']}次")
                print(f"  - 学习连续天数: {stats['learningStreak']}天")
                return True
            else:
                print(f"✗ 学习历史获取失败: {data['error']}")
                return False
        else:
            print(f"✗ 学习历史请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 学习历史异常: {e}")
        return False

def test_ai_analysis():
    """测试AI分析接口"""
    print("测试AI分析接口...")
    try:
        response = requests.post(f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/ai-analysis")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                insights = data['data']['insights']
                print(f"✓ AI分析成功，生成{len(insights)}条洞察:")
                for insight in insights[:2]:  # 只显示前2条
                    print(f"  - {insight['type']}: {insight['title']}")
                return True
            else:
                print(f"✗ AI分析失败: {data['error']}")
                return False
        else:
            print(f"✗ AI分析请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ AI分析异常: {e}")
        return False

def test_recommendations():
    """测试推荐接口"""
    print("测试个性化推荐接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/recommendations")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                recommendations = data['data']['recommendations']
                print(f"✓ 推荐生成成功，共{len(recommendations)}条推荐:")
                for rec in recommendations[:2]:  # 只显示前2条
                    print(f"  - {rec['type']}: {rec['title']} (匹配度: {rec['relevanceScore']:.2f})")
                return True
            else:
                print(f"✗ 推荐生成失败: {data['error']}")
                return False
        else:
            print(f"✗ 推荐请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 推荐异常: {e}")
        return False

def test_learning_paths():
    """测试学习路径接口"""
    print("测试学习路径接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/learning-paths")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                paths = data['data']['paths']
                print(f"✓ 学习路径生成成功，共{len(paths)}条路径:")
                for path in paths:
                    print(f"  - {path['title']} ({path['difficulty']}, {path['estimatedWeeks']}周)")
                return True
            else:
                print(f"✗ 学习路径生成失败: {data['error']}")
                return False
        else:
            print(f"✗ 学习路径请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 学习路径异常: {e}")
        return False

def test_conversation_summary():
    """测试对话总结接口"""
    print("测试对话总结接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/conversation-summary")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                summaries = data['data']['summaries']
                stats = data['data']['stats']
                print(f"✓ 对话总结获取成功:")
                print(f"  - 总对话数: {stats['totalConversations']}")
                print(f"  - 平均时长: {stats['averageDuration']:.1f}分钟")
                print(f"  - 平均满意度: {stats['averageSatisfaction']:.1f}/10")
                return True
            else:
                print(f"✗ 对话总结获取失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话总结请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话总结异常: {e}")
        return False

def test_conversation_analyze():
    """测试对话分析接口"""
    print("测试对话分析接口...")
    try:
        test_conversation = {
            "id": "test_conv",
            "character": "孔子",
            "topic": "仁爱思想",
            "messages": [
                {"role": "user", "content": "老师，什么是仁？"},
                {"role": "assistant", "content": "仁者爱人，这是仁的核心含义。仁不仅是个人品德，更是社会和谐的基础。"},
                {"role": "user", "content": "如何在现代社会实践仁爱？"},
                {"role": "assistant", "content": "在现代社会，仁爱体现在关心他人、承担社会责任、促进公平正义等方面。"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/v1/conversation/analyze",
            json=test_conversation,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                result = data['data']
                print(f"✓ 对话分析成功:")
                print(f"  - 主题: {result['topic']}")
                print(f"  - 情感倾向: {result['emotionalTone']}")
                print(f"  - 知识点: {', '.join(result['knowledgePoints'])}")
                print(f"  - 难度: {result['difficulty']}/5")
                return True
            else:
                print(f"✗ 对话分析失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话分析请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话分析异常: {e}")
        return False

def test_record_session():
    """测试记录学习会话接口"""
    print("测试记录学习会话接口...")
    try:
        session_data = {
            "topic": "测试主题",
            "duration": 30,
            "type": "reading",
            "completion": 90
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/user/{TEST_USER_ID}/learning-session",
            json=session_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                session = data['data']
                print(f"✓ 学习会话记录成功:")
                print(f"  - 会话ID: {session['id']}")
                print(f"  - 主题: {session['topic']}")
                print(f"  - 时长: {session['duration']}分钟")
                return True
            else:
                print(f"✗ 学习会话记录失败: {data['error']}")
                return False
        else:
            print(f"✗ 学习会话记录请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 学习会话记录异常: {e}")
        return False

def test_ocr_modes():
    """测试OCR模式接口"""
    print("测试OCR模式接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/ocr/modes")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                modes = data['data']
                print(f"✓ OCR模式获取成功，共{len(modes)}种模式:")
                for mode in modes:
                    print(f"  - {mode['name']}: {mode['description']}")
                return True
            else:
                print(f"✗ OCR模式获取失败: {data['error']}")
                return False
        else:
            print(f"✗ OCR模式请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ OCR模式异常: {e}")
        return False

def test_ocr_history():
    """测试OCR历史记录接口"""
    print("测试OCR历史记录接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/ocr/history/{TEST_USER_ID}")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                history = data['data']
                print(f"✓ OCR历史记录获取成功，共{len(history)}条记录:")
                for record in history[:2]:  # 只显示前2条
                    print(f"  - {record['text'][:20]}... (置信度: {record['confidence']}%)")
                return True
            else:
                print(f"✗ OCR历史记录获取失败: {data['error']}")
                return False
        else:
            print(f"✗ OCR历史记录请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ OCR历史记录异常: {e}")
        return False

def test_ocr_save():
    """测试OCR结果保存接口"""
    print("测试OCR结果保存接口...")
    try:
        ocr_data = {
            "userId": TEST_USER_ID,
            "text": "测试OCR识别文本",
            "confidence": 95.5,
            "mode": "ancient",
            "processing_time": 2000
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/ocr/save",
            json=ocr_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                result = data['data']
                print(f"✓ OCR结果保存成功:")
                print(f"  - 结果ID: {result['id']}")
                print(f"  - 文本: {result['text']}")
                print(f"  - 置信度: {result['confidence']}%")
                return True
            else:
                print(f"✗ OCR结果保存失败: {data['error']}")
                return False
        else:
            print(f"✗ OCR结果保存请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ OCR结果保存异常: {e}")
        return False

def test_chat_characters():
    """测试获取对话人物列表接口"""
    print("测试获取对话人物列表接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/chat/characters")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                characters = data['data']
                print(f"✓ 对话人物列表获取成功，共{len(characters)}位人物:")
                for char in characters[:3]:  # 只显示前3位
                    print(f"  - {char['name']} ({char['dynasty']}): {char['title']}")
                return True
            else:
                print(f"✗ 对话人物列表获取失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话人物列表请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话人物列表异常: {e}")
        return False

def test_chat_send_message():
    """测试发送对话消息接口"""
    print("测试发送对话消息接口...")
    try:
        message_data = {
            "userId": TEST_USER_ID,
            "characterId": "confucius",
            "message": "老师，什么是仁？",
            "conversationHistory": [],
            "settings": {
                "replyStyle": "classical",
                "showThinking": True
            }
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/chat/send",
            json=message_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                result = data['data']
                print(f"✓ 对话消息发送成功:")
                print(f"  - 回复: {result['reply'][:50]}...")
                print(f"  - 思考过程: {result.get('thinking', '无')[:30]}...")
                print(f"  - 置信度: {result.get('confidence', 0):.2f}")
                return True
            else:
                print(f"✗ 对话消息发送失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话消息发送请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话消息发送异常: {e}")
        return False

def test_chat_conversation_history():
    """测试获取对话历史接口"""
    print("测试获取对话历史接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/chat/conversations/{TEST_USER_ID}")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                conversations = data['data']['conversations']
                total = data['data']['total']
                print(f"✓ 对话历史获取成功，共{total}条对话:")
                for conv in conversations[:2]:  # 只显示前2条
                    print(f"  - 与{conv['character']}的对话: {conv['preview'][:30]}...")
                return True
            else:
                print(f"✗ 对话历史获取失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话历史请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话历史异常: {e}")
        return False

def test_chat_character_history():
    """测试获取人物对话历史接口"""
    print("测试获取人物对话历史接口...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/chat/character-history/{TEST_USER_ID}/confucius")
        if response.status_code == 200:
            data = response.json()
            if data['success']:
                messages = data['data']['messages']
                character_id = data['data']['characterId']
                print(f"✓ 人物对话历史获取成功:")
                print(f"  - 人物ID: {character_id}")
                print(f"  - 消息数量: {len(messages)}")
                return True
            else:
                print(f"✗ 人物对话历史获取失败: {data['error']}")
                return False
        else:
            print(f"✗ 人物对话历史请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 人物对话历史异常: {e}")
        return False

def test_chat_save_conversation():
    """测试保存对话接口"""
    print("测试保存对话接口...")
    try:
        conversation_data = {
            "userId": TEST_USER_ID,
            "characterId": "confucius",
            "character": "孔子",
            "messages": [
                {
                    "id": 1,
                    "role": "user",
                    "content": "老师好",
                    "timestamp": "14:30"
                },
                {
                    "id": 2,
                    "role": "assistant",
                    "content": "有朋自远方来，不亦乐乎？",
                    "timestamp": "14:31"
                }
            ],
            "timestamp": "2024-01-15T14:30:00Z",
            "settings": {}
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/chat/save",
            json=conversation_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            if data['success']:
                result = data['data']
                print(f"✓ 对话保存成功:")
                print(f"  - 对话ID: {result['conversationId']}")
                print(f"  - 消息数量: {result['messageCount']}")
                return True
            else:
                print(f"✗ 对话保存失败: {data['error']}")
                return False
        else:
            print(f"✗ 对话保存请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 对话保存异常: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("儒智后端API测试")
    print("=" * 60)
    print(f"测试目标: {BASE_URL}")
    print(f"测试用户: {TEST_USER_ID}")
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    # 等待服务启动
    print("等待服务启动...")
    time.sleep(2)
    
    # 执行测试
    tests = [
        ("根路径访问", test_root_endpoint),
        ("健康检查", test_health_check),
        ("学习历史", test_learning_history),
        ("AI分析", test_ai_analysis),
        ("个性化推荐", test_recommendations),
        ("学习路径", test_learning_paths),
        ("对话总结", test_conversation_summary),
        ("对话分析", test_conversation_analyze),
        ("记录会话", test_record_session),
        ("OCR模式", test_ocr_modes),
        ("OCR历史", test_ocr_history),
        ("OCR保存", test_ocr_save),
        ("对话人物列表", test_chat_characters),
        ("发送对话消息", test_chat_send_message),
        ("对话历史", test_chat_conversation_history),
        ("人物对话历史", test_chat_character_history),
        ("保存对话", test_chat_save_conversation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n[{passed + 1}/{total}] {test_name}")
        if test_func():
            passed += 1
        time.sleep(1)  # 避免请求过快
    
    print("\n" + "=" * 60)
    print(f"测试完成: {passed}/{total} 通过")
    if passed == total:
        print("🎉 所有测试通过！")
    else:
        print(f"⚠️  {total - passed} 个测试失败")
    print("=" * 60)

if __name__ == "__main__":
    main()
