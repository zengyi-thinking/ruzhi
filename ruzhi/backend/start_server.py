#!/usr/bin/env python3
"""
儒智后端服务启动脚本
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("错误: 需要Python 3.8或更高版本")
        sys.exit(1)
    print(f"✓ Python版本: {sys.version}")

def install_dependencies():
    """安装依赖包"""
    print("正在安装依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ 依赖包安装完成")
    except subprocess.CalledProcessError as e:
        print(f"错误: 依赖包安装失败 - {e}")
        print("请手动运行: pip install -r requirements.txt")
        return False
    return True

def start_server():
    """启动Flask服务器"""
    print("正在启动儒智后端服务...")
    print("服务地址: http://localhost:8000")
    print("API文档: 请查看 API_DOCUMENTATION.md")
    print("按 Ctrl+C 停止服务")
    print("-" * 50)
    
    try:
        # 设置环境变量
        os.environ['FLASK_APP'] = 'app.py'
        os.environ['FLASK_ENV'] = 'development'
        
        # 启动Flask应用
        from app import app
        app.run(debug=True, host='0.0.0.0', port=8000)
    except KeyboardInterrupt:
        print("\n服务已停止")
    except Exception as e:
        print(f"错误: 服务启动失败 - {e}")

def main():
    """主函数"""
    print("=" * 50)
    print("儒智后端服务启动器")
    print("=" * 50)
    
    # 检查Python版本
    check_python_version()
    
    # 检查是否在正确的目录
    if not Path("app.py").exists():
        print("错误: 请在包含app.py的目录中运行此脚本")
        sys.exit(1)
    
    # 询问是否安装依赖
    install_deps = input("是否需要安装/更新依赖包? (y/n): ").lower().strip()
    if install_deps in ['y', 'yes', '']:
        if not install_dependencies():
            sys.exit(1)
    
    # 启动服务器
    start_server()

if __name__ == "__main__":
    main()
