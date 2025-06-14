#!/usr/bin/env python3
"""
儒智小程序网络连接设置和测试脚本
第二阶段：网络功能优先开发
"""

import os
import sys
import json
import time
import requests
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple

class NetworkSetup:
    """网络连接设置和测试类"""
    
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.services = {
            'main': {'port': 8000, 'path': 'app.py'},
            'ai': {'port': 8001, 'path': 'ai-service/main.py'},
            'ocr': {'port': 8002, 'path': 'ocr-service/main.py'},
            'knowledge': {'port': 8003, 'path': 'knowledge-graph/main.py'}
        }
        self.test_results = {}
        
    def check_dependencies(self) -> bool:
        """检查Python依赖是否安装"""
        print("🔍 检查Python依赖...")
        
        required_packages = [
            'flask', 'flask-cors', 'requests', 'python-dotenv',
            'openai', 'pillow', 'pytesseract', 'networkx'
        ]
        
        missing_packages = []
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
                print(f"  ✅ {package}")
            except ImportError:
                missing_packages.append(package)
                print(f"  ❌ {package}")
        
        if missing_packages:
            print(f"\n⚠️  缺少依赖包: {', '.join(missing_packages)}")
            print("请运行: pip install " + " ".join(missing_packages))
            return False
        
        print("✅ 所有依赖检查通过")
        return True
    
    def setup_environment(self) -> bool:
        """设置环境变量"""
        print("\n🔧 设置环境变量...")
        
        env_vars = {
            'DEEPSEEK_API_KEY': 'sk-d624fca8134b4ecc84c178770118ffb8',
            'FLASK_ENV': 'development',
            'FLASK_DEBUG': '1',
            'DATABASE_URL': 'sqlite:///ruzhi.db'
        }
        
        env_file = os.path.join(self.base_dir, '.env')
        with open(env_file, 'w', encoding='utf-8') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
                os.environ[key] = value
                print(f"  ✅ {key}=***")
        
        print(f"✅ 环境变量已保存到 {env_file}")
        return True
    
    def test_deepseek_api(self) -> bool:
        """测试DeepSeek API连接"""
        print("\n🤖 测试DeepSeek API连接...")
        
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key or api_key == 'sk-your-api-key-here':
            print("❌ DeepSeek API密钥未配置")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            # 测试模型列表接口
            response = requests.get(
                'https://api.deepseek.com/v1/models',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                models = response.json()
                print(f"  ✅ API连接成功，可用模型数: {len(models.get('data', []))}")
                
                # 测试简单对话
                chat_data = {
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "user", "content": "你好，请简单介绍一下孔子"}
                    ],
                    "max_tokens": 100
                }
                
                chat_response = requests.post(
                    'https://api.deepseek.com/v1/chat/completions',
                    headers=headers,
                    json=chat_data,
                    timeout=30
                )
                
                if chat_response.status_code == 200:
                    result = chat_response.json()
                    content = result['choices'][0]['message']['content']
                    print(f"  ✅ 对话测试成功: {content[:50]}...")
                    return True
                else:
                    print(f"  ❌ 对话测试失败: {chat_response.status_code}")
                    return False
            else:
                print(f"  ❌ API连接失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"  ❌ API测试异常: {str(e)}")
            return False
    
    def start_service(self, service_name: str) -> bool:
        """启动单个服务"""
        service = self.services[service_name]
        service_path = os.path.join(self.base_dir, service['path'])
        
        if not os.path.exists(service_path):
            print(f"  ❌ 服务文件不存在: {service_path}")
            return False
        
        try:
            # 检查端口是否被占用
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', service['port']))
            sock.close()
            
            if result == 0:
                print(f"  ⚠️  端口 {service['port']} 已被占用")
                return True  # 假设服务已经在运行
            
            # 启动服务
            cmd = [sys.executable, service_path]
            if service_name == 'main':
                # 主服务需要特殊处理
                process = subprocess.Popen(
                    cmd,
                    cwd=self.base_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            else:
                # 其他服务
                service_dir = os.path.dirname(service_path)
                process = subprocess.Popen(
                    cmd,
                    cwd=service_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            
            # 等待服务启动
            time.sleep(3)
            
            # 检查服务是否启动成功
            if process.poll() is None:
                print(f"  ✅ {service_name} 服务启动成功 (PID: {process.pid})")
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"  ❌ {service_name} 服务启动失败")
                print(f"     错误: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"  ❌ 启动 {service_name} 服务异常: {str(e)}")
            return False
    
    def test_service_health(self, service_name: str) -> bool:
        """测试服务健康状态"""
        service = self.services[service_name]
        port = service['port']
        
        health_urls = {
            'main': f'http://localhost:{port}/api/v1/health',
            'ai': f'http://localhost:{port}/health',
            'ocr': f'http://localhost:{port}/health',
            'knowledge': f'http://localhost:{port}/health'
        }
        
        url = health_urls.get(service_name, f'http://localhost:{port}/health')
        
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {service_name} 服务健康检查通过")
                return True
            else:
                print(f"  ❌ {service_name} 服务健康检查失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"  ❌ {service_name} 服务连接失败: {str(e)}")
            return False
    
    def test_api_endpoints(self) -> Dict[str, bool]:
        """测试主要API端点"""
        print("\n🔗 测试API端点...")
        
        endpoints = {
            'health': 'http://localhost:8000/api/v1/health',
            'info': 'http://localhost:8000/api/v1/info',
            'ocr': 'http://localhost:8000/api/v1/ocr/recognize',
            'dialogue': 'http://localhost:8000/api/v1/dialogue/chat',
            'classics': 'http://localhost:8000/api/v1/classics/list',
            'knowledge': 'http://localhost:8000/api/v1/knowledge/concepts'
        }
        
        results = {}
        for name, url in endpoints.items():
            try:
                if name in ['ocr', 'dialogue']:
                    # POST请求测试
                    test_data = {
                        'ocr': {'image': 'test_image_data', 'mode': 'ancient'},
                        'dialogue': {'character': 'confucius', 'message': '你好'}
                    }
                    response = requests.post(url, json=test_data[name], timeout=10)
                else:
                    # GET请求测试
                    response = requests.get(url, timeout=10)
                
                if response.status_code in [200, 201]:
                    print(f"  ✅ {name}: {response.status_code}")
                    results[name] = True
                else:
                    print(f"  ❌ {name}: {response.status_code}")
                    results[name] = False
                    
            except Exception as e:
                print(f"  ❌ {name}: 连接失败 - {str(e)}")
                results[name] = False
        
        return results
    
    def create_frontend_config(self) -> bool:
        """创建前端网络配置文件"""
        print("\n📱 创建前端网络配置...")
        
        config = {
            "baseUrl": "http://localhost:8000",
            "apiVersion": "v1",
            "timeout": 30000,
            "retryCount": 3,
            "endpoints": {
                "health": "/api/v1/health",
                "ocr": "/api/v1/ocr",
                "dialogue": "/api/v1/dialogue",
                "learning": "/api/v1/learning",
                "classics": "/api/v1/classics",
                "knowledge": "/api/v1/knowledge",
                "config": "/api/v1/config"
            },
            "ai": {
                "enabled": True,
                "fallbackToMock": True,
                "maxRetries": 2
            }
        }
        
        # 保存到小程序配置文件
        frontend_dir = os.path.join(os.path.dirname(self.base_dir), 'frontend', 'miniprogram')
        config_file = os.path.join(frontend_dir, 'config', 'network.js')
        
        # 确保目录存在
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        
        # 生成JavaScript配置文件
        js_content = f"""// 网络配置文件 - 自动生成于 {datetime.now()}
const networkConfig = {json.dumps(config, indent=2, ensure_ascii=False)};

module.exports = networkConfig;
"""
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        
        print(f"  ✅ 前端配置已保存到: {config_file}")
        return True
    
    def run_full_setup(self) -> bool:
        """运行完整的网络设置流程"""
        print("🚀 开始儒智小程序网络连接设置")
        print("=" * 60)
        
        # 步骤1: 检查依赖
        if not self.check_dependencies():
            return False
        
        # 步骤2: 设置环境
        if not self.setup_environment():
            return False
        
        # 步骤3: 测试AI API
        ai_test = self.test_deepseek_api()
        
        # 步骤4: 启动主服务
        print("\n🔄 启动后端服务...")
        main_service = self.start_service('main')
        
        if main_service:
            # 等待服务完全启动
            time.sleep(5)
            
            # 步骤5: 测试服务健康
            print("\n🏥 测试服务健康状态...")
            health_check = self.test_service_health('main')
            
            # 步骤6: 测试API端点
            api_results = self.test_api_endpoints()
            
            # 步骤7: 创建前端配置
            frontend_config = self.create_frontend_config()
            
            # 生成测试报告
            self.generate_report(ai_test, health_check, api_results, frontend_config)
            
            return True
        else:
            print("❌ 主服务启动失败，无法继续")
            return False
    
    def generate_report(self, ai_test: bool, health_check: bool, 
                       api_results: Dict[str, bool], frontend_config: bool):
        """生成测试报告"""
        print("\n📊 网络连接设置报告")
        print("=" * 60)
        
        total_tests = 1 + 1 + len(api_results) + 1  # AI + 健康检查 + API端点 + 前端配置
        passed_tests = sum([ai_test, health_check, frontend_config]) + sum(api_results.values())
        
        print(f"总测试项: {total_tests}")
        print(f"通过测试: {passed_tests}")
        print(f"成功率: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        print("详细结果:")
        print(f"  DeepSeek AI API: {'✅' if ai_test else '❌'}")
        print(f"  服务健康检查: {'✅' if health_check else '❌'}")
        print(f"  前端配置生成: {'✅' if frontend_config else '❌'}")
        print("  API端点测试:")
        for endpoint, result in api_results.items():
            print(f"    {endpoint}: {'✅' if result else '❌'}")
        
        if passed_tests == total_tests:
            print("\n🎉 网络连接设置完成！小程序现在可以连接后端服务。")
        else:
            print(f"\n⚠️  部分功能可能无法正常工作，请检查失败的项目。")
        
        # 保存报告到文件
        report_file = os.path.join(self.base_dir, 'network_setup_report.json')
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': {
                'ai_api': ai_test,
                'health_check': health_check,
                'frontend_config': frontend_config,
                'api_endpoints': api_results
            }
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 详细报告已保存到: {report_file}")

if __name__ == '__main__':
    setup = NetworkSetup()
    success = setup.run_full_setup()
    sys.exit(0 if success else 1)
