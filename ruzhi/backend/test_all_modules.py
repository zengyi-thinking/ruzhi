"""
儒智项目 - 全模块功能测试
验证重构后的所有功能模块
"""
import requests
import json
import time
from datetime import datetime

class RuzhiTester:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.test_results = []
    
    def log_test(self, module, test_name, success, details=""):
        """记录测试结果"""
        result = {
            'module': module,
            'test_name': test_name,
            'success': success,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {module} - {test_name}: {details}")
    
    def test_health_check(self):
        """测试健康检查"""
        try:
            response = requests.get(f'{self.base_url}/api/v1/health', timeout=5)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('系统', '健康检查', success, f"状态码: {response.status_code}")
        except Exception as e:
            self.log_test('系统', '健康检查', False, f"异常: {str(e)}")
    
    def test_ocr_module(self):
        """测试OCR模块"""
        print("\n🔍 测试OCR模块...")
        
        # 测试获取OCR模式
        try:
            response = requests.get(f'{self.base_url}/api/v1/ocr/modes')
            success = response.status_code == 200 and len(response.json().get('data', [])) > 0
            self.log_test('OCR', '获取识别模式', success, f"模式数量: {len(response.json().get('data', []))}")
        except Exception as e:
            self.log_test('OCR', '获取识别模式', False, str(e))
        
        # 测试OCR历史记录
        try:
            response = requests.get(f'{self.base_url}/api/v1/ocr/history?userId=test_user')
            success = response.status_code == 200
            self.log_test('OCR', '获取历史记录', success, f"状态码: {response.status_code}")
        except Exception as e:
            self.log_test('OCR', '获取历史记录', False, str(e))
        
        # 测试OCR文本解读
        try:
            data = {"text": "学而时习之，不亦说乎？", "mode": "ancient"}
            response = requests.post(f'{self.base_url}/api/v1/ocr/interpret', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('OCR', 'AI文本解读', success, f"解读成功: {success}")
        except Exception as e:
            self.log_test('OCR', 'AI文本解读', False, str(e))
    
    def test_dialogue_module(self):
        """测试AI对话模块"""
        print("\n💬 测试AI对话模块...")
        
        # 测试获取人物列表
        try:
            response = requests.get(f'{self.base_url}/api/v1/dialogue/characters')
            success = response.status_code == 200 and len(response.json().get('data', [])) > 0
            self.log_test('对话', '获取人物列表', success, f"人物数量: {len(response.json().get('data', []))}")
        except Exception as e:
            self.log_test('对话', '获取人物列表', False, str(e))
        
        # 测试AI对话
        try:
            data = {
                "message": "什么是仁？",
                "character": "confucius",
                "conversationId": "test_conversation"
            }
            response = requests.post(f'{self.base_url}/api/v1/dialogue/chat', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('对话', 'AI人物对话', success, f"对话成功: {success}")
        except Exception as e:
            self.log_test('对话', 'AI人物对话', False, str(e))
        
        # 测试获取对话历史
        try:
            response = requests.get(f'{self.base_url}/api/v1/dialogue/history/test_conversation')
            success = response.status_code == 200
            self.log_test('对话', '获取对话历史', success, f"状态码: {response.status_code}")
        except Exception as e:
            self.log_test('对话', '获取对话历史', False, str(e))
    
    def test_learning_module(self):
        """测试学习中心模块"""
        print("\n📚 测试学习中心模块...")
        
        # 测试获取用户统计
        try:
            response = requests.get(f'{self.base_url}/api/v1/learning/stats/test_user')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('学习', '获取用户统计', success, f"统计获取: {success}")
        except Exception as e:
            self.log_test('学习', '获取用户统计', False, str(e))
        
        # 测试获取学习进度
        try:
            response = requests.get(f'{self.base_url}/api/v1/learning/progress/test_user')
            success = response.status_code == 200 and len(response.json().get('data', [])) > 0
            self.log_test('学习', '获取学习进度', success, f"进度项目数: {len(response.json().get('data', []))}")
        except Exception as e:
            self.log_test('学习', '获取学习进度', False, str(e))
        
        # 测试获取成就
        try:
            response = requests.get(f'{self.base_url}/api/v1/learning/achievements/test_user')
            success = response.status_code == 200 and len(response.json().get('data', [])) > 0
            self.log_test('学习', '获取用户成就', success, f"成就数量: {len(response.json().get('data', []))}")
        except Exception as e:
            self.log_test('学习', '获取用户成就', False, str(e))
    
    def test_classics_module(self):
        """测试经典阅读模块"""
        print("\n📖 测试经典阅读模块...")
        
        # 测试获取经典列表
        try:
            response = requests.get(f'{self.base_url}/api/v1/classics/list')
            success = response.status_code == 200 and len(response.json().get('data', [])) > 0
            self.log_test('经典', '获取经典列表', success, f"经典数量: {len(response.json().get('data', []))}")
        except Exception as e:
            self.log_test('经典', '获取经典列表', False, str(e))
        
        # 测试经典文本注释
        try:
            data = {
                "text": "学而时习之，不亦说乎？",
                "classic": "论语",
                "chapter": "学而篇"
            }
            response = requests.post(f'{self.base_url}/api/v1/classics/annotate', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('经典', 'AI文本注释', success, f"注释成功: {success}")
        except Exception as e:
            self.log_test('经典', 'AI文本注释', False, str(e))
        
        # 测试概念解释
        try:
            data = {
                "concept": "仁",
                "classic": "论语"
            }
            response = requests.post(f'{self.base_url}/api/v1/classics/explain', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('经典', '概念解释', success, f"解释成功: {success}")
        except Exception as e:
            self.log_test('经典', '概念解释', False, str(e))
    
    def test_knowledge_graph_module(self):
        """测试知识图谱模块"""
        print("\n🧠 测试知识图谱模块...")
        
        # 测试概念详情
        try:
            response = requests.get(f'{self.base_url}/api/v1/knowledge/concept/仁')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('知识图谱', '概念详情分析', success, f"分析成功: {success}")
        except Exception as e:
            self.log_test('知识图谱', '概念详情分析', False, str(e))
        
        # 测试概念故事
        try:
            response = requests.get(f'{self.base_url}/api/v1/knowledge/concept/仁/stories')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('知识图谱', '概念故事生成', success, f"故事生成: {success}")
        except Exception as e:
            self.log_test('知识图谱', '概念故事生成', False, str(e))
        
        # 测试概念扩展
        try:
            data = {"type": "related"}
            response = requests.post(f'{self.base_url}/api/v1/knowledge/concept/仁/expand', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('知识图谱', '自动概念扩展', success, f"扩展成功: {success}")
        except Exception as e:
            self.log_test('知识图谱', '自动概念扩展', False, str(e))
        
        # 测试智能搜索
        try:
            response = requests.get(f'{self.base_url}/api/v1/knowledge/search?q=道德')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('知识图谱', '智能搜索', success, f"搜索成功: {success}")
        except Exception as e:
            self.log_test('知识图谱', '智能搜索', False, str(e))
        
        # 测试学习路径生成
        try:
            data = {"interests": ["儒家思想"], "level": "beginner"}
            response = requests.post(f'{self.base_url}/api/v1/knowledge/learning-path', json=data)
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('知识图谱', '学习路径生成', success, f"路径生成: {success}")
        except Exception as e:
            self.log_test('知识图谱', '学习路径生成', False, str(e))
    
    def test_config_module(self):
        """测试配置管理模块"""
        print("\n⚙️ 测试配置管理模块...")
        
        # 测试获取API配置
        try:
            response = requests.get(f'{self.base_url}/api/v1/config/api')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('配置', '获取API配置', success, f"配置获取: {success}")
        except Exception as e:
            self.log_test('配置', '获取API配置', False, str(e))
        
        # 测试获取API统计
        try:
            response = requests.get(f'{self.base_url}/api/v1/config/stats')
            success = response.status_code == 200 and response.json().get('success')
            self.log_test('配置', '获取API统计', success, f"统计获取: {success}")
        except Exception as e:
            self.log_test('配置', '获取API统计', False, str(e))
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🏛️ 儒智项目 - 全模块功能测试")
        print("=" * 60)
        
        start_time = time.time()
        
        # 运行各模块测试
        self.test_health_check()
        self.test_ocr_module()
        self.test_dialogue_module()
        self.test_learning_module()
        self.test_classics_module()
        self.test_knowledge_graph_module()
        self.test_config_module()
        
        end_time = time.time()
        
        # 生成测试报告
        self.generate_report(end_time - start_time)
    
    def generate_report(self, total_time):
        """生成测试报告"""
        print("\n" + "=" * 60)
        print("📊 测试报告")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests} ✅")
        print(f"失败测试: {failed_tests} ❌")
        print(f"成功率: {(passed_tests/total_tests*100):.1f}%")
        print(f"总耗时: {total_time:.2f}秒")
        
        # 按模块统计
        print("\n📋 模块测试统计:")
        modules = {}
        for result in self.test_results:
            module = result['module']
            if module not in modules:
                modules[module] = {'total': 0, 'passed': 0}
            modules[module]['total'] += 1
            if result['success']:
                modules[module]['passed'] += 1
        
        for module, stats in modules.items():
            success_rate = (stats['passed'] / stats['total'] * 100)
            status = "✅" if success_rate == 100 else "⚠️" if success_rate >= 50 else "❌"
            print(f"{status} {module}: {stats['passed']}/{stats['total']} ({success_rate:.1f}%)")
        
        # 失败的测试
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"- {result['module']} - {result['test_name']}: {result['details']}")
        
        print("\n🎉 测试完成！")
        
        # 保存测试结果到文件
        with open('test_results.json', 'w', encoding='utf-8') as f:
            json.dump({
                'summary': {
                    'total_tests': total_tests,
                    'passed_tests': passed_tests,
                    'failed_tests': failed_tests,
                    'success_rate': passed_tests/total_tests*100,
                    'total_time': total_time,
                    'timestamp': datetime.now().isoformat()
                },
                'results': self.test_results
            }, f, ensure_ascii=False, indent=2)
        
        print(f"📄 详细测试结果已保存到: test_results.json")

if __name__ == "__main__":
    tester = RuzhiTester()
    tester.run_all_tests()
