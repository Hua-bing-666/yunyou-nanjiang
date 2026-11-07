# 云游南疆

南疆文化导览与主题行程网站，面向文旅推广与创业试点。GitHub 仓库名沿用 **yunyou-nanjiang**，本地外层目录为 **云游南疆**。

当前版本：**0.3.0 · 喀什文化体验版**。优先服务想体验当地文化的游客：按手作、街巷、场馆、茶馆与演艺发现具体地点，查看参与方式、地址精度与行前确认事项，再收藏、分享或下载文化清单。新增9条地点／参与记录，其中7条位于老城片区、1条为市区场馆、1条为县域延伸；2条往期活动单独注明日期与核验状态。原8篇文化短文保留为背景阅读。[本轮改版、字段来源和验收](docs/CULTURE_REDESIGN_2026-11-07.md)。

首页 `/` 聚焦文化体验，完整列表 `/experiences`，详情 `/experience/:id`，清单 `/collection`。原目的地地图入口移至 `/destinations`。游客自愿资料、服务端主题行程、私人笔记和管理后台继续可用。天气和道路预览通过服务端查询高德；助手优先读取已发布审核的地点与参与资料，未配置AI时提供明确标注的本地资料模式。

现有 12 个景点、3 条草稿线路，12 份基础介绍附公开来源。3 个有疑点的旧点位暂停展示，其余 9 个仍为参考点位；帕米尔线路暂不提供地图连线。入口坐标、开放安排、图片授权和路线可执行性仍待核验，当前不提供交易或预订。

## 运行

使用 Node.js 24.5或更新的24 LTS版本，在项目目录执行：

```powershell
cd my-travel
npm ci
# 可选：复制 .env.example 为 .env.local，再填写自己的服务配置
npm run dev
```

访问 http://localhost:5173 。Windows 也可双击 `scripts/start-dev.bat`，会同时启动网页与 API。没有服务 Key 也能浏览并使用本地收藏、笔记、行程及助手。

管理入口为 `/admin`。首次启动创建SQLite数据库和随机管理员凭证，凭证只写入本机 `my-travel/data/admin-bootstrap.txt`。登录后可管理文化体验、目的地、路线、文化资料、游客自愿记录和AI设置；请在账号设置中修改初始密码。数据库、加密主密钥与凭证不提交到Git。[后台使用与备份](docs/BACKEND.md)。

```powershell
npm test                  # 单元与 HTTP 接口验证
npx playwright install chromium firefox
npm run check             # 测试、构建、三组浏览器验收
npm run format:check
npm audit --audit-level=high
npm run build
npm start                 # 同源生产服务，默认 http://127.0.0.1:3001
npm run db:backup         # 在线备份数据库及加密主密钥
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
    │   ├── data/         首次导入数据库的景点与草稿线路种子
    │   ├── components/   天气、资料来源、私人笔记
    │   ├── composables/  地图生命周期、收藏
    │   ├── views/        行程、资料分布、助手
    │   ├── services/     地图 SDK、AI 请求
    │   ├── utils/        安全存储、行程导出、地图布局等纯函数
    │   └── assets/       公共样式与地图样式
    ├── server/           同源 API、SQLite、管理认证、AI、可信资料及静态服务
    ├── data/             本地数据库、加密主密钥和初始凭证，不进 Git
    ├── public/images/    现有图片及 WebP；授权状态待核验
    ├── test/             单元与 HTTP 测试
    ├── e2e/              浏览器行为及无障碍验收
    ├── .env.example      仅含占位配置
    └── package*.json     依赖与锁文件
```

## 说明与交付

- [文化体验改版](docs/CULTURE_REDESIGN_2026-11-07.md)：当前0.3.0的游客任务、具体地点、来源、界面与验收。
- [数据库实施记录](docs/IMPLEMENTATION_2026-11-07.md)：此前0.2.0的后台、测试、AI实测与性能对比。
- [项目边界与数据补充](docs/SCOPE_AND_DATA.md)、[管理后台与部署配置](docs/BACKEND.md)。
- [2026-11-07 项目复查](docs/PROJECT_REVIEW_2026-11-07.md)：当前架构、仓库分支、重新验证结果与待修问题。
- [项目规划与痛点分析](docs/PROJECT_PLAN.md)：政策、案例、商业验证与六周路线图。
- [本轮验收报告](docs/ACCEPTANCE.md)：通过项、真实服务验证范围、待人工核验项。
- [开发配置](docs/development.md)、[部署与回滚](docs/deployment.md)。
- [资料与授权清单](docs/data-sources.md)、[创业试点执行包](docs/PILOT.md)。
- [无当地资源阶段的线上样品规划](docs/ONLINE_SAMPLE.md)：公开资料发现的问题、当前样品范围与下一步验证方法。
- [最初审查记录](docs/PROJECT_AUDIT.md)、[文档索引](docs/README.md)。

原版本已通过 Git 提交保全。过期说明移到 `docs/archive/`；未使用的固定账号登录页、轮播、增强主题和曲线路径模块已移除。个人 Word 脚本移出网站目录，原始图片与私有配置留在本地。
