FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY ./requirements.txt /app/requirements.txt

# 安装Python依赖
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# 复制应用代码
COPY . /app/

# 设置环境变量
ENV PYTHONPATH=/app

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"] 