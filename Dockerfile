# 个人工作台 · 部署镜像
# server.js 仅使用 Node 内置模块（http/https/fs/path/os），无需 npm install
FROM node:22-alpine
WORKDIR /app
COPY . .
# 云平台通过环境变量注入端口（如 Railway/Render 自动设置 PORT）
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "server.js"]
