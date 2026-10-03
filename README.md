# 云游南疆

南疆文化导览与主题行程网站，面向文旅推广与创业试点。GitHub 仓库名沿用 **yunyou-nanjiang**，本地外层目录为 **云游南疆**。

当前版本：**0.1.0 · 内容整理与功能验证版**。游客可以直接浏览、按地区与主题搜索、收藏景点、记录私人旅行笔记，以及保存、分享、下载主题行程。天气和道路预览通过服务端查询高德；助手使用有来源的站内资料，未配置 AI 时进入明确标注的本地资料模式。

现有 12 个景点、3 条草稿线路，4 份基础介绍附公开来源。入口坐标、开放安排、图片授权和路线可执行性仍待核验，当前不提供交易或预订。

## 运行

使用 Node.js 24 LTS，在项目目录执行：

```powershell
cd my-travel
npm ci
# 可选：复制 .env.example 为 .env.local，再填写自己的服务配置
npm run dev
```

访问 http://localhost:5173 。Windows 也可双击 `scripts/start-dev.bat`，会同时启动网页与 API。没有服务 Key 也能浏览并使用本地收藏、笔记、行程及助手。

```powershell
npm test                  # 单元与 HTTP 接口验证
npx playwright install chromium firefox
npm run check             # 测试、构建、三组浏览器验收
npm run format:check
npm audit --audit-level=high
npm run build
npm start                 # 同源生产服务，默认 http://127.0.0.1:3001
```

## 项目目录

```text
云游南疆/
├── README.md
├── docs/                 规划、核验、开发、部署、验收与历史归档
├── scripts/              开发／生产启动入口
├── .github/workflows/    自动验收、手动构建发布包
├── webify.config.json    历史静态托管配置，注意 API 与深链接限制
└── my-travel/
    ├── src/
    │   ├── App.vue       应用页面与导航入口
    │   ├── router/       可刷新的网址与前进后退
    │   ├── data/         景点、来源状态、草稿线路
    │   ├── components/   天气、资料来源、私人笔记
    │   ├── composables/  地图生命周期、收藏
    │   ├── views/        行程、资料分布、助手
    │   ├── services/     地图 SDK、AI 请求
    │   ├── utils/        安全存储、行程导出、地图布局等纯函数
    │   └── assets/       公共样式与地图样式
    ├── server/           同源 API、可信资料、限流、静态文件服务
    ├── public/images/    现有图片及 WebP；授权状态待核验
    ├── test/             单元与 HTTP 测试
    ├── e2e/              浏览器行为及无障碍验收
    ├── .env.example      仅含占位配置
    └── package*.json     依赖与锁文件
```

## 说明与交付

- [项目规划与痛点分析](docs/PROJECT_PLAN.md)：政策、案例、商业验证与六周路线图。
- [本轮验收报告](docs/ACCEPTANCE.md)：通过项、真实服务验证范围、待人工核验项。
- [开发配置](docs/development.md)、[部署与回滚](docs/deployment.md)。
- [资料与授权清单](docs/data-sources.md)、[创业试点执行包](docs/PILOT.md)。
- [最初审查记录](docs/PROJECT_AUDIT.md)、[文档索引](docs/README.md)。

原版本已通过 Git 提交保全。过期说明移到 `docs/archive/`；未使用的固定账号登录页、轮播、增强主题和曲线路径模块已移除。个人 Word 脚本移出网站目录，原始图片与私有配置留在本地。
