# 南疆旅游AI助手后端部署指南

## 项目概述

这是一个为南疆旅游网站提供AI对话功能的后端服务，基于Node.js + Express + DeepSeek API构建。

## 环境要求

- Node.js 18.x 或更高版本
- npm 8.x 或更高版本
- DeepSeek API账户（注册：https://platform.deepseek.com）

## 部署步骤

### 1. 环境配置

```bash
# 进入后端目录
cd backend

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量配置
nano .env  # 或使用其他编辑器
```

### 2. 配置DeepSeek API

1. 访问 https://platform.deepseek.com 注册/登录
2. 在控制台创建API Key
3. 将API Key填入`.env`文件：
   ```
   DEEPSEEK_API_KEY=你的_DeepSeek_API_Key
   ```

### 3. 安装依赖

```bash
# 安装项目依赖
npm install

# 开发依赖（可选）
npm install -g nodemon
```

### 4. 启动服务

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

### 5. PM2进程管理（推荐生产环境）

```bash
# 全局安装PM2
npm install -g pm2

# 使用PM2启动服务
pm2 start server.js --name "travel-ai-backend"

# 设置开机自启
pm2 startup
pm2 save

# 常用PM2命令
pm2 status              # 查看状态
pm2 logs travel-ai-backend  # 查看日志
pm2 restart travel-ai-backend # 重启服务
pm2 stop travel-ai-backend    # 停止服务
```

### 6. Nginx反向代理配置（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 前端配置

### 开发环境
修改`my-travel/.env`文件（如果不存在则创建）：

```env
VITE_API_URL=http://localhost:3000
```

### 生产环境
根据实际部署地址修改API地址：

```env
VITE_API_URL=https://your-domain.com/api
```

## 环境变量说明

### 后端环境变量（.env）

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| DEEPSEEK_API_KEY | - | DeepSeek API密钥（必需） |
| DEEPSEEK_API_URL | https://api.deepseek.com/v1/chat/completions | DeepSeek API地址 |
| PORT | 3000 | 服务器监听端口 |
| NODE_ENV | development | 运行环境 |
| SESSION_TIMEOUT_MINUTES | 30 | 会话超时时间（分钟） |
| MAX_CONTEXT_MESSAGES | 10 | 最大上下文消息数 |
| RATE_LIMIT_WINDOW_MS | 60000 | 速率限制窗口（毫秒） |
| RATE_LIMIT_MAX_REQUESTS | 60 | 每分钟最大请求数 |
| CORS_ORIGIN | http://localhost:5173 | CORS允许的源 |

### 前端环境变量（Vite）

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| VITE_API_URL | http://localhost:3000 | 后端API地址 |

## 健康检查

服务启动后，可以通过以下端点检查状态：

- `GET /` - 欢迎页面
- `GET /api/health` - 健康检查
- `GET /api/status` - 服务状态（包含API连接状态）

## 故障排除

### 1. API连接失败
- 检查DeepSeek API Key是否正确配置
- 确认网络连接正常
- 查看服务器日志获取详细错误信息

### 2. CORS错误
- 确认`CORS_ORIGIN`配置正确
- 前端调用地址与CORS配置匹配

### 3. 内存泄漏
- 会话管理使用内存存储，长时间运行可能占用内存
- 建议定期重启或配置会话过期时间

### 4. 性能问题
- 配置适当的速率限制防止滥用
- 考虑使用Redis替代内存会话存储
- 监控API调用频率和响应时间

## 监控与维护

### 日志查看
```bash
# 查看PM2日志
pm2 logs travel-ai-backend

# 查看系统日志
journalctl -u travel-ai-backend -f
```

### 性能监控
```bash
# 查看进程资源使用
pm2 monit

# 查看系统资源
htop  # 或 top
```

### 备份建议
- 定期备份`.env`文件（包含API密钥）
- 监控API使用量和费用

## 安全建议

1. **API密钥保护**
   - 不要将`.env`文件提交到版本控制
   - 在生产环境使用环境变量而非文件

2. **访问控制**
   - 配置防火墙规则，只允许必要端口
   - 使用HTTPS加密传输

3. **速率限制**
   - 根据实际需求调整速率限制参数
   - 监控异常访问模式

## 更新部署

```bash
# 拉取最新代码
git pull

# 更新依赖
npm install

# 重启服务
pm2 restart travel-ai-backend
```

## 支持与联系

如有问题，请检查：
1. 服务器日志：`pm2 logs travel-ai-backend`
2. API状态：`GET /api/status`
3. 网络连接：确保端口可访问

---

**注意**：这是一个演示版本，生产环境建议：
- 使用数据库替代内存会话存储
- 配置更严格的安全策略
- 实现API请求的审计日志
- 考虑负载均衡和集群部署