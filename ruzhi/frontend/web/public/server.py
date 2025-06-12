#!/usr/bin/env python3
"""
简单的HTTP服务器，支持index.html作为默认首页
用于儒智项目Web端演示
"""

import http.server
import socketserver
import os
import urllib.parse
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义HTTP请求处理器，支持默认首页"""
    
    def end_headers(self):
        # 添加CORS头，允许跨域请求
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        """处理GET请求"""
        # 解析URL路径
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # 如果请求根路径，重定向到index.html
        if path == '/' or path == '':
            self.path = '/index.html'
        
        # 调用父类方法处理请求
        return super().do_GET()
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_response(200)
        self.end_headers()

def start_server(port=3000):
    """启动HTTP服务器"""
    try:
        # 确保在正确的目录中
        script_dir = Path(__file__).parent
        os.chdir(script_dir)
        
        # 创建服务器
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"🌐 儒智Web服务器启动成功!")
            print(f"📍 服务地址: http://localhost:{port}")
            print(f"📁 服务目录: {os.getcwd()}")
            print(f"🎭 主页面: http://localhost:{port}/")
            print(f"💬 对话测试: http://localhost:{port}/dialogue-test.html")
            print(f"📚 学习中心: http://localhost:{port}/learning-test.html")
            print("=" * 50)
            print("按 Ctrl+C 停止服务器")
            print("=" * 50)
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except OSError as e:
        if e.errno == 10048:  # 端口被占用
            print(f"❌ 端口 {port} 已被占用，请尝试其他端口")
            print(f"💡 建议使用: python server.py --port 3001")
        else:
            print(f"❌ 启动服务器时出错: {e}")
    except Exception as e:
        print(f"❌ 未知错误: {e}")

if __name__ == "__main__":
    import sys
    
    # 解析命令行参数
    port = 3000
    if len(sys.argv) > 1:
        try:
            if sys.argv[1] == '--port' and len(sys.argv) > 2:
                port = int(sys.argv[2])
            else:
                port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号，使用默认端口 3000")
            port = 3000
    
    start_server(port)
