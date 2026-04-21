# 云游南疆 - 免费公网部署指南（大学生竞赛版）

## 项目概述

这是一个为"中国大学生计算机设计大赛"准备的南疆旅游导览网站，包含前端Vue应用和后端Node.js AI服务。

## 📋 部署前准备

### 1. 注册免费服务账号
1. **GitHub账号**（如果还没有）：[https://github.com](https://github.com)
2. **Vercel账号**（前端部署）：[https://vercel.com](https://vercel.com) - 使用GitHub登录
3. **Render账号**（后端部署）：[https://render.com](https://render.com) - 使用GitHub登录
4. **UptimeRobot账号**（服务监控）：[https://uptimerobot.com](https://uptimerobot.com) - 可选，防止休眠

### 2. 本地项目准备
确保项目包含以下文件：
```
MY-FIRST/
├── my-travel/          # 前端Vue项目
├── backend/            # 后端Node.js项目
├── DEPLOYMENT_GUIDE.md # 本指南
└── .gitignore         # Git忽略文件
```

## 🚀 第一步：初始化Git仓库

1. 打开命令行，进入项目目录：
   ```bash
   cd "c:\Users\Lenovo\Desktop\比赛\计算机设计大赛\MY-FIRST"
   ```

2. 初始化Git仓库：
   ```bash
   git init
   git add .
   git commit -m "初始提交：南疆旅游网站项目"
   ```

3. 在GitHub上创建新仓库（名称如`yunyou-nanjiang`）

4. 将本地仓库推送到GitHub：
   ```bash
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git branch -M main
   git push -u origin main
   ```

## 🌐 第二步：部署后端到Render（免费）

### 1. 登录Render控制台
1. 访问 [https://dashboard.render.com](https://dashboard.render.com)
2. 点击"New +" → "Web Service"

### 2. 连接GitHub仓库
1. 选择"Connect to GitHub"
2. 授权并选择你的仓库
3. 选择要部署的目录：`/backend`

### 3. 配置Web Service
- **Name**: `travel-ai-backend`（或其他名称）
- **Environment**: `Node`
- **Region**: 选择`Singapore`（离中国较近）
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: 选择**Free**

### 4. 设置环境变量
点击"Advanced" → "Environment Variables"，添加：
```
DEEPSEEK_API_KEY=你的DeepSeek_API密钥（必需）
NODE_ENV=production
CORS_ORIGIN=https://你的前端域名.vercel.app
PORT=10000
```

> **注意**：如果没有DeepSeek API密钥，可以使用演示模式（后端会使用模拟回复）

### 5. 创建服务
点击"Create Web Service"，等待部署完成（约5-10分钟）

### 6. 获取后端地址
部署完成后，获得类似地址：`https://travel-ai-backend.onrender.com`

## 🎨 第三步：部署前端到Vercel（免费）

### 1. 登录Vercel控制台
1. 访问 [https://vercel.com](https://vercel.com)
2. 点击"Add New..." → "Project"

### 2. 导入GitHub仓库
1. 选择你的GitHub仓库
2. 点击"Import"

### 3. 配置项目
- **Framework Preset**: `Vue`
- **Build and Output Settings**:
  - Build Command: `cd my-travel && npm run build`
  - Output Directory: `my-travel/dist`
  - Install Command: `cd my-travel && npm install`

### 4. 设置环境变量
点击"Environment Variables"，添加：
```
VITE_API_URL=https://你的Render后端地址
```
例如：`VITE_API_URL=https://travel-ai-backend.onrender.com`

### 5. 部署
点击"Deploy"，等待部署完成（约2-3分钟）

### 6. 获取前端地址
部署完成后，获得类似地址：`https://yunyou-nanjiang.vercel.app`

## 🔧 第四步：配置连接和优化

### 1. 更新后端CORS设置
1. 回到Render控制台，编辑后端的环境变量：
   ```
   CORS_ORIGIN=https://你的前端域名.vercel.app
   ```
2. 重启后端服务

### 2. 测试连接
1. 访问前端地址
2. 尝试登录和使用AI助手功能
3. 如果AI助手无法工作，检查浏览器控制台错误

### 3. 防止Render休眠（重要！）
Render免费服务在15分钟无请求后会休眠，唤醒需要30秒。

**解决方案**：设置UptimeRobot监控
1. 注册 [UptimeRobot](https://uptimerobot.com)
2. 添加监控：
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `旅行后端监控`
   - URL: `https://你的Render后端地址/api/health`
   - Monitoring Interval: `5 minutes`
3. 这样每5分钟会ping一次后端，防止休眠

## 🧪 第五步：本地测试与演示准备

### 1. 本地构建测试
```bash
# 前端构建测试
cd my-travel
npm run build

# 后端启动测试
cd ../backend
npm start
```

### 2. 演示前检查清单
- [ ] 前端网站可以正常访问
- [ ] 登录功能正常
- [ ] 地图加载正常
- [ ] AI助手可以回复
- [ ] 移动端适配正常

### 3. 演示日应急方案
如果云服务出现问题，可以快速切换本地演示：

**本地运行步骤**：
1. 启动后端：
   ```bash
   cd backend
   npm start
   ```
   后端运行在：`http://localhost:3000`

2. 修改前端配置：
   编辑 `my-travel/.env` 文件：
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. 启动前端：
   ```bash
   cd my-travel
   npm run dev
   ```
   前端运行在：`http://localhost:5173`

4. 用手机连接同一Wi-Fi，通过IP地址访问

## 📊 性能优化建议

### 1. 图片优化（已自动处理）
- Vercel会自动将图片转换为WebP格式
- 图片通过全球CDN加速

### 2. 代码分割（已配置）
- Vant UI、ECharts、高德地图已单独打包
- 按需加载，减少首包体积

### 3. 缓存策略
- 静态资源设置长期缓存
- API响应适当缓存

### 4. 演示前预热
在演示开始前15分钟：
1. 访问前端网站
2. 使用AI助手功能
3. 确保后端服务已唤醒

## 🚨 常见问题解决

### Q1: AI助手无法回复
**可能原因**：
1. DeepSeek API密钥未配置或错误
2. 后端服务已休眠
3. CORS配置错误

**解决方法**：
1. 检查Render环境变量中的`DEEPSEEK_API_KEY`
2. 访问后端健康检查端点：`/api/health`
3. 检查浏览器控制台CORS错误

### Q2: 地图无法加载
**可能原因**：
1. 高德地图API密钥问题（当前使用公开密钥）
2. 网络限制

**解决方法**：
1. 确保网络可以访问高德地图服务
2. 检查浏览器控制台错误

### Q3: 访问速度慢
**可能原因**：
1. 首次访问需要加载资源
2. 后端服务从休眠中唤醒

**解决方法**：
1. 演示前预热访问
2. 使用UptimeRobot保持唤醒

### Q4: 手机无法访问
**可能原因**：
1. 网络限制
2. 浏览器兼容性

**解决方法**：
1. 使用Chrome或Safari浏览器
2. 确保Wi-Fi网络正常

## 📱 演示技巧

### 1. 生成访问二维码
使用二维码生成工具，将网站地址转换为二维码，方便评委手机扫描。

### 2. 准备演示脚本
1. **开场**：介绍项目背景和意义（30秒）
2. **核心功能演示**（3-4分钟）：
   - 登录体验
   - 景点地图浏览
   - AI助手问答
   - 民族团结故事展示
3. **技术亮点**（1-2分钟）：
   - Vue 3 + Vite现代前端架构
   - 响应式设计和移动端适配
   - AI智能对话集成
   - 免费云部署方案

### 3. 备用方案准备
1. 笔记本电脑已安装Node.js和npm
2. 准备好本地运行命令
3. 手机热点作为备用网络

## 📞 技术支持

如果部署过程中遇到问题：

1. **检查日志**：
   - Vercel部署日志
   - Render服务日志
   - 浏览器开发者工具Console

2. **关键检查点**：
   - 环境变量是否正确
   - 服务是否正常运行
   - 网络连接是否正常

3. **应急联系方式**：
   - 项目文档和代码仓库
   - 本地备用演示环境

## 🎯 部署完成标志

成功部署后，您将获得：

1. ✅ **前端生产地址**：`https://你的项目.vercel.app`
2. ✅ **后端API地址**：`https://你的后端.onrender.com`
3. ✅ **完整功能测试**：所有功能正常运行
4. ✅ **演示准备就绪**：应急方案和演示脚本

---

**祝您在"中国大学生计算机设计大赛"中取得优异成绩！** 🏆