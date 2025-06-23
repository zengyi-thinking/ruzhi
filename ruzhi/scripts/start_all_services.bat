@echo off
echo 正在启动儒智项目服务...

REM 启动OCR服务
start cmd /k "cd ruzhi/backend/ocr-service && python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

REM 启动知识图谱服务
start cmd /k "cd ruzhi/backend/knowledge-graph && python -m uvicorn main:app --host 127.0.0.1 --port 8002 --reload"

REM 启动AI对话服务
start cmd /k "cd ruzhi/backend/ai-service && python -m uvicorn main:app --host 127.0.0.1 --port 8003 --reload"

REM 启动前端服务
start cmd /k "cd ruzhi/frontend && npm run dev"

echo 所有服务已经启动！
echo OCR服务: http://127.0.0.1:8001
echo 知识图谱服务: http://127.0.0.1:8002
echo AI对话服务: http://127.0.0.1:8003
echo 前端服务: http://127.0.0.1:3000

echo 按任意键关闭此窗口...
pause > nul 