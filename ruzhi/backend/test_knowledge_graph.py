"""
测试知识图谱AI功能
"""
import requests
import json

def test_concept_analysis():
    """测试概念分析功能"""
    print("测试概念分析功能...")
    response = requests.get('http://localhost:8000/api/v1/knowledge/concept/仁')
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"概念: {result['data']['concept']}")
        print(f"分析长度: {len(result['data']['analysis'])} 字符")
        print(f"置信度: {result['data']['confidence']}")
        print(f"来源: {result['data']['source']}")
    print("-" * 50)

def test_concept_stories():
    """测试概念故事功能"""
    print("测试概念故事功能...")
    response = requests.get('http://localhost:8000/api/v1/knowledge/concept/仁/stories')
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"故事数量: {len(result['data']['stories'])}")
        for story in result['data']['stories'][:2]:  # 只显示前2个故事
            print(f"- {story['type']}: {story['title']}")
    print("-" * 50)

def test_concept_expansion():
    """测试概念扩展功能"""
    print("测试概念扩展功能...")
    data = {"type": "related"}
    response = requests.post(
        'http://localhost:8000/api/v1/knowledge/concept/仁/expand',
        json=data
    )
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"源概念: {result['data']['source_concept']}")
        print(f"扩展类型: {result['data']['expansion_type']}")
        print(f"扩展概念数量: {len(result['data']['expanded_concepts'])}")
        for concept in result['data']['expanded_concepts'][:3]:  # 只显示前3个
            print(f"- {concept['name']}: {concept['definition']}")
    print("-" * 50)

def test_intelligent_search():
    """测试智能搜索功能"""
    print("测试智能搜索功能...")
    response = requests.get('http://localhost:8000/api/v1/knowledge/search?q=道德修养')
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"搜索查询: {result['data']['query']}")
        print(f"结果数量: {result['data']['total']}")
        for res in result['data']['results'][:3]:  # 只显示前3个结果
            print(f"- {res['concept']}: {res['definition']}")
            print(f"  相关度: {res['relevance']} | 推荐理由: {res['reason']}")
    print("-" * 50)

def test_learning_path():
    """测试学习路径生成功能"""
    print("测试学习路径生成功能...")
    data = {
        "interests": ["儒家思想", "道德修养"],
        "level": "beginner"
    }
    response = requests.post(
        'http://localhost:8000/api/v1/knowledge/learning-path',
        json=data
    )
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"用户兴趣: {result['data']['user_interests']}")
        print(f"用户水平: {result['data']['user_level']}")
        print(f"学习阶段数: {result['data']['learning_path']['total_stages']}")
        for stage in result['data']['learning_path']['stages'][:2]:  # 只显示前2个阶段
            print(f"- {stage['stage_name']}: {stage['learning_goal']}")
            print(f"  预计时间: {stage['estimated_time']}")
    print("-" * 50)

def test_recommendations():
    """测试概念推荐功能"""
    print("测试概念推荐功能...")
    data = {
        "current_concepts": ["仁", "义"],
        "type": "related"
    }
    response = requests.post(
        'http://localhost:8000/api/v1/knowledge/recommend',
        json=data
    )
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"成功: {result.get('success')}")
    if result.get('success'):
        print(f"推荐数量: {result['data']['total']}")
        for rec in result['data']['recommendations'][:3]:  # 只显示前3个推荐
            print(f"- {rec['concept']}: {rec['reason']}")
            print(f"  难度: {rec['difficulty']} | 预计时间: {rec['estimated_time']}")
    print("-" * 50)

if __name__ == "__main__":
    print("🧠 测试知识图谱AI功能")
    print("=" * 50)
    
    test_concept_analysis()
    test_concept_stories()
    test_concept_expansion()
    test_intelligent_search()
    test_learning_path()
    test_recommendations()
    
    print("✅ 所有测试完成！")
