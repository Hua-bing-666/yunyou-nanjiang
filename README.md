# 云游南疆 / 南疆旅游AI助手

## 项目简介

"云游南疆"是一个面向南疆旅游导览的交互式Web应用，展示新疆南部地区丰富的文旅资源、民族团结故事和自然风光。项目以"丝路秘境·石榴花开"为主题，融合景点地图、路线推荐、数据看板、AI智能问答等功能，提供沉浸式的南疆旅游体验。

## 当前项目状态

**版本：前端展示版**（暂不包含真实后端服务）

当前版本为纯前端展示版，所有数据均为本地静态数据，AI助手使用本地模拟回复。项目重点展示前端界面、交互设计、地图展示和数据可视化能力，无需后端服务即可完整运行。

> 后续如需接入后端AI服务，请参考 `AIAssistant.vue` 中的注释说明恢复接口请求。

## 项目目录结构

```
项目根目录/
├── my-travel/                    # 前端 Vue 3 项目
│   ├── src/
│   │   ├── App.vue               # 主入口组件
│   │   ├── main.js               # Vue 应用入口
│   │   ├── data.js               # 景点静态数据
│   │   ├── assets/               # 样式文件
│   │   ├── components/           # 通用组件
│   │   └── views/                # 页面视图
│   │       ├── Login.vue         # 登录页
│   │       ├── AIAssistant.vue   # AI助手（模拟回复）
│   │       ├── Routes.vue        # 路线推荐
│   │       └── Statistics.vue    # 数据看板
│   ├── public/                   # 静态资源
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── README.md                     # 项目说明（本文件）
├── FRONTEND_DEPLOYMENT_GUIDE.md  # 前端部署指南
├── LOCAL_DEMO_GUIDE.md           # 本地演示指南
├── UI_PERFORMANCE_OPTIMIZATION.md # 界面与性能优化建议
├── PROJECT_CLEANUP_LOG.md        # 项目清理记录
├── webify.config.json            # Webify 前端部署配置
├── start-frontend-demo.bat       # 前端启动脚本
└── .gitignore
```

## 本地运行方式

```bash
# 1. 进入前端项目目录
cd my-travel

# 2. 安装依赖（首次运行）
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173` 即可查看。

## 前端部署方式

支持部署到 Webify、Vercel 等静态网站托管平台，详情请参阅 `FRONTEND_DEPLOYMENT_GUIDE.md`。

## 本地演示备用方案

演示前请确保：
- 电脑已安装 Node.js（>= 18.0.0）
- 手机和电脑连接同一Wi-Fi网络
- 关闭电脑防火墙或开放 5173 端口

详情请参阅 `LOCAL_DEMO_GUIDE.md`。

## 注意事项

- 当前版本为纯前端展示版，AI助手使用本地模拟回复，不请求后端接口
- 项目使用高德地图 API（Web端），需联网加载地图
- 天气组件调用高德地图天气API，需联网使用
- 如需接入后端，请自行部署后端服务并修改前端配置
