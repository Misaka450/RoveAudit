#!/bin/bash
# RoveAudit 后端启动脚本
cd /opt/RoveAudit/backend

# 读取 .env 中的值（跳过空值和注释）
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  export "$key"="$value"
done < .env

exec node dist/main.js
