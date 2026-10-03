# 前端部署指南

## 概述

本文档说明如何将"云游南疆"前端项目部署到静态网站托管平台。当前版本为纯前端展示版，无需后端服务即可部署运行。

## 本地构建

```bash
# 进入项目目录
cd my-travel

# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，`my-travel/dist/` 目录即为待部署的静态文件。

## 部署到 Webify

1. 登录 [Webify 控制台](https://webify.cloudbase.net/)
2. 点击「新建应用」→「导入已有项目」
3. 关联你的 GitHub 仓库
4. 构建配置如下（项目根目录已有 `webify.config.json`，会自动读取）：

| 配置项 | 值 |
|--------|-----|
| 项目路径 | `my-travel` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |

5. 确认后点击「开始部署」

## 部署到 Vercel

1. 登录 [Vercel](https://vercel.com/)
2. 点击「New Project」→ 导入你的 GitHub 仓库
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Root Directory | `my-travel` |
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. 点击「Deploy」

## 部署到静态文件托管（如阿里云OSS、腾讯云COS）

```bash
# 构建
cd my-travel
npm install
npm run build

# 将 dist 目录下所有文件上传到你的静态托管服务
```

## 常见问题

### Q: 部署后页面白屏或路由异常？
A: 确保构建配置的输出目录为 `dist`，且静态托管平台支持 SPA 路由转发（将所有路由指向 `index.html`）。

### Q: 地图加载失败？
A: 高德地图 API Key 可能受域名限制，请在 [高德开放平台](https://lbs.amap.com/) 将你的部署域名加入安全域名白名单。

### Q: 页面样式错乱？
A: 确认部署平台是否正确设置了资源基础路径，Vite 默认使用相对路径，通常无需额外配置。

### Q: 部署后 AI 助手无响应？
A: 此为正常现象，当前版本 AI 助手使用本地模拟回复，不依赖后端服务。如遇无响应，请检查浏览器控制台是否有报错。
