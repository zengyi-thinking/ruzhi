"""
儒智AI服务 - 简化版演示应用
"""

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
import os

# 创建FastAPI应用
app = FastAPI(
    title="儒智AI服务 (演示版)",
    description="儒智APP AI服务演示版，提供基础的对话和API配置功能",
    version="0.1.0",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模拟数据存储
active_provider = {
    "provider": "mock",
    "name": "模拟模式",
    "model": "mock",
    "status": "fallback"
}

api_settings = {
    "deepseek": {
        "api_key": None,
        "api_base": "https://api.deepseek.com/v1",
        "model_name": "deepseek-chat"
    },
    "zhipuai": {
        "api_key": None, 
        "api_base": "https://open.bigmodel.cn/api/paas/v3",
        "model_name": "chatglm_turbo"
    },
    "openai": {
        "api_key": None,
        "api_base": "https://api.openai.com/v1",
        "model_name": "gpt-3.5-turbo"
    }
}

# 模拟对话存储
conversations = []
next_conversation_id = 1
next_message_id = 1


@app.get("/")
def read_root():
    """获取API状态"""
    return {"status": "online", "service": "儒智AI服务 (演示版)"}


@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy"}


@app.get("/api/v1/api-settings/current")
async def get_current_api_provider():
    """获取当前使用的API提供商信息"""
    return active_provider


@app.get("/api/v1/api-settings/providers")
async def get_supported_providers():
    """获取支持的API提供商列表"""
    return [
        {
            "provider": "deepseek",
            "name": "DeepSeek AI",
            "description": "DeepSeek大语言模型服务",
            "url": "https://www.deepseek.com/",
            "default_model": "deepseek-chat",
            "default_api_base": "https://api.deepseek.com/v1"
        },
        {
            "provider": "zhipuai",
            "name": "智谱清言",
            "description": "智谱AI大语言模型服务",
            "url": "https://open.bigmodel.cn/",
            "default_model": "chatglm_turbo",
            "default_api_base": "https://open.bigmodel.cn/api/paas/v3"
        },
        {
            "provider": "openai",
            "name": "OpenAI",
            "description": "OpenAI大语言模型服务",
            "url": "https://platform.openai.com/",
            "default_model": "gpt-3.5-turbo",
            "default_api_base": "https://api.openai.com/v1"
        }
    ]


@app.put("/api/v1/api-settings/update")
async def update_api_settings(settings_update: Dict[str, Any] = Body(...)):
    """更新API设置"""
    global active_provider, api_settings
    
    provider = settings_update.get("provider")
    api_key = settings_update.get("api_key")
    api_base = settings_update.get("api_base")
    model_name = settings_update.get("model_name")
    
    if provider not in ["deepseek", "zhipuai", "openai"]:
        raise HTTPException(status_code=400, detail=f"不支持的API提供商: {provider}")
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API密钥不能为空")
    
    # 更新设置
    api_settings[provider]["api_key"] = api_key
    if api_base:
        api_settings[provider]["api_base"] = api_base
    if model_name:
        api_settings[provider]["model_name"] = model_name
    
    # 更新当前提供商
    active_provider = {
        "provider": provider,
        "name": {
            "deepseek": "DeepSeek AI",
            "zhipuai": "智谱清言",
            "openai": "OpenAI"
        }.get(provider),
        "model": api_settings[provider]["model_name"],
        "status": "active"
    }
    
    return {
        "success": True,
        "message": f"成功更新 {provider} API设置",
        "provider": active_provider
    }


@app.post("/api/v1/conversations/")
async def create_conversation(data: Dict[str, Any] = Body(...)):
    """创建新对话"""
    global next_conversation_id, next_message_id, conversations
    
    persona = data.get("persona", "现代导师")
    title = data.get("title", f"与{persona}的对话")
    first_message = data.get("first_message", "")
    
    if not first_message:
        raise HTTPException(status_code=400, detail="初始消息不能为空")
    
    # 模拟AI响应
    ai_response = f"您好，我是{persona}。{generate_mock_response(first_message, persona)}"
    
    # 创建对话
    conversation = {
        "id": next_conversation_id,
        "user_id": "demo-user",
        "persona": persona,
        "title": title,
        "messages": [
            {
                "id": next_message_id,
                "role": "user",
                "content": first_message
            },
            {
                "id": next_message_id + 1,
                "role": "assistant",
                "content": ai_response
            }
        ],
        "created_at": "2023-12-01T12:00:00",
        "updated_at": "2023-12-01T12:00:00"
    }
    
    next_conversation_id += 1
    next_message_id += 2
    
    conversations.append(conversation)
    
    return conversation


@app.post("/api/v1/conversations/{conversation_id}/messages")
async def add_message(conversation_id: int, data: Dict[str, Any] = Body(...)):
    """向对话添加消息"""
    global next_message_id
    
    message = data.get("message", "")
    
    if not message:
        raise HTTPException(status_code=400, detail="消息内容不能为空")
    
    # 查找对话
    conversation = None
    for conv in conversations:
        if conv["id"] == conversation_id:
            conversation = conv
            break
    
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")
    
    # 获取角色
    persona = conversation["persona"]
    
    # 添加用户消息
    user_message = {
        "id": next_message_id,
        "role": "user",
        "content": message
    }
    next_message_id += 1
    conversation["messages"].append(user_message)
    
    # 模拟AI响应
    ai_response = generate_mock_response(message, persona)
    
    # 添加AI消息
    ai_message = {
        "id": next_message_id,
        "role": "assistant",
        "content": ai_response
    }
    next_message_id += 1
    conversation["messages"].append(ai_message)
    
    # 更新对话时间
    conversation["updated_at"] = "2023-12-01T12:05:00"
    
    return conversation


@app.get("/api/v1/conversations/")
async def get_conversations():
    """获取所有对话"""
    return [
        {
            "id": conv["id"],
            "title": conv["title"],
            "persona": conv["persona"],
            "message_count": len(conv["messages"]),
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"]
        }
        for conv in conversations
    ]


@app.get("/api/v1/conversations/{conversation_id}")
async def get_conversation(conversation_id: int):
    """获取特定对话"""
    for conv in conversations:
        if conv["id"] == conversation_id:
            return conv
    
    raise HTTPException(status_code=404, detail="对话不存在")


def generate_mock_response(message: str, persona: str) -> str:
    """生成模拟AI回复"""
    if "仁" in message:
        return "仁是儒家思想的核心概念，代表着对他人的关爱和道德的完善。孔子认为'仁者爱人'，即具有仁德的人会关爱他人，推己及人。仁不仅是一种情感，更是一种道德规范和行为准则。"
    elif "礼" in message:
        return "礼在儒家思想中指的是一套行为规范和社会秩序，包括社会制度、风俗习惯和道德标准等。孔子认为'不学礼，无以立'，礼是维护社会秩序的重要工具。"
    elif "智" in message:
        return "智在儒家思想中指的是明辨是非、善恶的能力，即智慧。儒家认为'智者不惑'，有智慧的人能够明辨事物的本质，做出正确的判断。"
    elif "义" in message:
        return "义是儒家思想中的重要概念，指合宜、正当的行为和道义。孟子特别重视义，提出'舍生取义'的思想，认为道义比生命更重要。"
    elif "信" in message:
        return "信在儒家思想中指的是诚实守信，言行一致。孔子说'人而无信，不知其可也'，强调诚信的重要性。"
    elif "道" in message:
        return "道在儒家思想中指的是宇宙运行的规律和人应遵循的准则。孔子说'朝闻道，夕死可矣'，形容对道的追求是一生的目标。"
    else:
        return f"作为{persona}，我很高兴回答您的问题。您问的是关于'{message}'的问题。在儒家经典中，这个问题涉及到修身、齐家、治国、平天下的核心理念。简单来说，儒家思想强调通过个人修养、家庭和谐、社会治理来实现世界和平。"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)