"""
儒智AI服务 - API测试脚本
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base, get_db
from app.config.settings import settings

# 使用内存SQLite数据库进行测试
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 设置测试数据库
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# 测试客户端
client = TestClient(app)


@pytest.fixture(scope="function")
def setup_db():
    # 创建表
    Base.metadata.create_all(bind=engine)
    yield
    # 删除表
    Base.metadata.drop_all(bind=engine)


def test_read_root(setup_db):
    """测试根路径"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "online", "service": settings.APP_NAME}


def test_health_check(setup_db):
    """测试健康检查"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_conversation(setup_db):
    """测试创建对话"""
    # 模拟用户认证头
    headers = {"Authorization": "Bearer test_token"} if not settings.DEBUG else {}
    
    response = client.post(
        "/api/v1/conversations/",
        json={
            "persona": "孔子",
            "title": "测试对话",
            "first_message": "你好"
        },
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["persona"] == "孔子"
    assert data["title"] == "测试对话"
    assert len(data["messages"]) == 2  # 用户消息和AI回复
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][0]["content"] == "你好"
    assert data["messages"][1]["role"] == "assistant"


def test_get_conversations(setup_db):
    """测试获取对话列表"""
    # 先创建一个对话
    headers = {"Authorization": "Bearer test_token"} if not settings.DEBUG else {}
    
    client.post(
        "/api/v1/conversations/",
        json={
            "persona": "孔子",
            "title": "测试对话",
            "first_message": "你好"
        },
        headers=headers
    )
    
    # 测试获取对话列表
    response = client.get("/api/v1/conversations/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["persona"] == "孔子"
    assert data[0]["title"] == "测试对话"