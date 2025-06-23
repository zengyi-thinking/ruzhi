#!/usr/bin/env python3
"""
调试AI服务问题
"""
import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

async def debug_advanced_ai_service():
    """调试高级AI服务"""
    try:
        print("🔍 调试高级AI服务...")
        
        from services.advanced_ai_service import advanced_ai_service
        print("✅ 成功导入高级AI服务")
        
        # 测试简单调用
        result = await advanced_ai_service.generate_advanced_response(
            user_message="你好",
            character_id="confucius",
            user_id="debug_user",
            user_context={'user_level': 'beginner'},
            stream=False
        )
        
        print(f"✅ 调用成功: {result['success']}")
        if result['success']:
            print(f"📝 回复: {result['data']['response'][:50]}...")
        else:
            print(f"❌ 错误: {result.get('error', '未知错误')}")
            
    except Exception as e:
        print(f"❌ 调试失败: {e}")
        import traceback
        traceback.print_exc()

def main():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(debug_advanced_ai_service())
    finally:
        loop.close()

if __name__ == '__main__':
    main()
