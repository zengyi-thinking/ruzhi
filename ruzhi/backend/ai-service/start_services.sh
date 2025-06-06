#!/bin/bash

echo "=================================="
echo "      儒智APP后端服务启动脚本"
echo "=================================="
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到Python。请确保Python已安装。"
    exit 1
fi

# 检查uvicorn是否安装
if ! python3 -c "import uvicorn" &> /dev/null; then
    echo "[警告] 未找到uvicorn，将尝试安装..."
    pip3 install uvicorn || {
        echo "[错误] 安装uvicorn失败，请手动安装: pip3 install uvicorn"
        exit 1
    }
fi

echo "[信息] 启动简化版AI服务..."
echo "[信息] 服务将在 http://127.0.0.1:8003 上运行"

# 启动简化版服务
python3 -m uvicorn simple_app:app --host 127.0.0.1 --port 8003 