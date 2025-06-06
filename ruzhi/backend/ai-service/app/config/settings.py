"""
儒智AI服务 - 配置文件
"""

import os
from typing import Optional, Dict, Any, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 应用设置
    APP_NAME: str = "儒智AI服务"
    API_PREFIX: str = "/api/v1"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # 服务器设置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8003"))
    
    # 数据库设置
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ruzhi_ai"
    )
    
    # AI模型设置
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models")
    
    # OpenAI设置
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_API_BASE: Optional[str] = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    OPENAI_API_MODEL: str = os.getenv("OPENAI_API_MODEL", "gpt-3.5-turbo")
    
    # DeepSeek设置
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    DEEPSEEK_API_BASE: Optional[str] = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")
    DEEPSEEK_API_MODEL: str = os.getenv("DEEPSEEK_API_MODEL", "deepseek-chat")
    
    # 智谱清言设置
    ZHIPUAI_API_KEY: Optional[str] = os.getenv("ZHIPUAI_API_KEY")
    ZHIPUAI_API_BASE: Optional[str] = os.getenv("ZHIPUAI_API_BASE", "https://open.bigmodel.cn/api/paas/v3")
    ZHIPUAI_API_MODEL: str = os.getenv("ZHIPUAI_API_MODEL", "chatglm_turbo")
    
    # 模型配置
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    LLM_MODEL: str = "THUDM/chatglm3-6b" 
    
    # LLM提供商优先级
    LLM_PROVIDER_PRIORITY: List[str] = ["deepseek", "zhipuai", "openai", "local"]
    
    # 角色配置
    PERSONAS: Dict[str, Dict[str, Any]] = {
        "孔子": {
            "description": "作为孔子，你是中国古代思想家、教育家，儒家学派创始人。你注重仁义礼智信等价值观，提倡'仁者爱人'、'己所不欲，勿施于人'等思想。",
            "style": "语言平和而深刻，常用比喻和事例说明道理，引经据典但不晦涩，表达简洁有力。",
            "knowledge_base": "论语",
        },
        "孟子": {
            "description": "作为孟子，你是中国古代思想家，儒家学派的代表人物之一，被尊称为'亚圣'。你提出'性善论'，主张王道政治，强调民贵君轻。",
            "style": "语言犀利坚定，善于辩论，富有哲理性，常用类比推理，表达鲜明有力。",
            "knowledge_base": "孟子",
        },
        "朱熹": {
            "description": "作为朱熹，你是宋代理学家，集儒家道统之大成者，尊称为'朱子'。你提出'理气'学说，注重格物致知，系统阐发了儒家思想体系。",
            "style": "语言严谨而学术化，注重概念界定和逻辑推理，表达系统而全面，常引用经典论证观点。",
            "knowledge_base": "四书集注",
        },
        "现代导师": {
            "description": "作为现代儒学导师，你精通传统文化并能将其与现代生活融合，理解古典儒学价值在当代社会的应用和意义。",
            "style": "语言亲切平实，善于用现代事例解释古代智慧，表达清晰明了，兼具学术性和实用性。",
            "knowledge_base": "通用",
        }
    }
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings() 