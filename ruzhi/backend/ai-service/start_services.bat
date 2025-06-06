@echo off
echo ==================================
echo       儒智APP后端服务启动脚本
echo ==================================
echo.

REM 检查Python是否安装
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到Python。请确保Python已安装并添加到PATH中。
    goto end
)

REM 检查uvicorn是否安装
python -c "import uvicorn" >nul 2>nul
if %errorlevel% neq 0 (
    echo [警告] 未找到uvicorn，将尝试安装...
    pip install uvicorn
    if %errorlevel% neq 0 (
        echo [错误] 安装uvicorn失败，请手动安装: pip install uvicorn
        goto end
    )
)

echo [信息] 启动简化版AI服务...
echo [信息] 服务将在 http://127.0.0.1:8003 上运行

REM 启动简化版服务
python -m uvicorn simple_app:app --host 127.0.0.1 --port 8003

:end
echo.
pause 