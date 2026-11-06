# 云游南疆：项目复查与接手说明

复查日期：2026-11-07（北京时间）。应用基线：`b44e64c`，版本 `0.1.0`。本次阅读了源码、配置、测试、规划和历史验收，并重新运行本地检查及查询 GitHub 状态；本次提交仅新增审阅记录与文档索引，问题尚未修复。

## 1. 当前结论

这是一个已有完整浏览与整理闭环的南疆文化导览样品。适合继续做小范围需求验证；正式发布前需要先处理本次发现的发布包缺文件、依赖审计失败和存储访问异常。

现有 12 个目的地的基础介绍均配置来源、3 条线路均为草稿。9 个地图点位为参考值，3 个点位已暂停；图片许可、实际入口和路线可执行性仍待核验。这里确认的是代码中的状态，本轮未重新核验全部外部来源或现场情况。

现有实现已经覆盖游客浏览、搜索、地区与主题筛选、收藏、私人笔记、行程保存／分享／文字下载、资料分布和助手。没有数据库、服务端用户账号、云同步、订单或预订流程。

## 2. GitHub 与版本关系

用户本轮确认继续使用现有公开仓库：[Hua-bing-666/yunyou-nanjiang](https://github.com/Hua-bing-666/yunyou-nanjiang)。无需另建重复仓库。

| 对象 | 本轮查询结果 |
| --- | --- |
| 远程默认分支 `main` | `1fe1eed`，仍是旧版本 |
| 实施分支 `codex/execute-plan-20261003` | `b44e64c`，与本地审阅基线一致，比远程 `main` 领先 5 个提交 |
| [PR #1](https://github.com/Hua-bing-666/yunyou-nanjiang/pull/1) | Open、Draft，尚未合并；此前的两项 verify 检查成功 |
| 本次审阅分支 | `codex/project-review-20261107`，从上述实施版本创建 |
| 开始检查时的工作区 | 干净，无待保全的未提交修改 |

GitHub 最初的连接失败由代理配置导致：Git 的配置指向未监听的旧端口，直接访问 GitHub 也失败。使用本机可用代理后，CLI 登录和远程读取均成功。因此最初的登录错误不能作为凭据已失效的结论。本次没有改写全局 Git 配置、合并 PR 或更改默认分支。

## 3. 代码结构与运行链路

技术栈为 Vue 3、Vue Router、Vant、Vite，服务端使用 Node 原生 HTTP。测试使用 Node Test Runner、Playwright 和 axe。当前依赖已不包含旧审查记录中的 ECharts。

```text
浏览器
  App.vue + Vue Router
  ├─ data/spots.js、data/routes.js：目的地与草稿线路
  ├─ useFavorites、TravelNotes、Routes：当前设备的数据保存
  ├─ useGuideMap → amapLoader：高德 JS 地图与路线展示
  └─ WeatherInfo、AIAssistant → /api/*
                                 ↓
                          server/deepseekProxy.js
                          ├─ /api/health：进程健康
                          ├─ /api/chat → knowledge.js → 本地资料或模型
                          ├─ /api/weather、/api/route → amap.js → 高德
                          └─ 生产模式：dist 静态资源与 SPA 路径回退
```

开发入口 `scripts/dev.mjs` 启动网页 `127.0.0.1:5173` 与 API `127.0.0.1:3001`，Vite 转发 `/api`。生产入口 `scripts/start-production.mjs` 设置生产模式，由同一个 Node 服务托管网页与接口。单独部署 `dist` 不会包含天气、道路或助手 API。

后续修改入口：

| 要修改的内容 | 首先阅读的文件 |
| --- | --- |
| 首页、详情、主导航 | `my-travel/src/App.vue`、`src/router/index.js` |
| 景点文字、来源、别名、点位状态 | `my-travel/src/data/spots.js` |
| 主题线路和逐日草稿 | `my-travel/src/data/routes.js`、`src/views/Routes.vue` |
| 地图初始化、标记与路线生命周期 | `my-travel/src/composables/useGuideMap.js` |
| 点位是否可用 | `my-travel/src/utils/mapAvailability.js`，前后端共用 |
| 保存、分享、下载 | `my-travel/src/utils/storage.js`、`src/utils/itinerary.js` |
| 助手知识与回答边界 | `my-travel/server/knowledge.js`、`server/deepseekProxy.js` |
| 天气与道路查询 | `my-travel/server/amap.js` |
| 自动检查与发布包 | `.github/workflows/ci.yml`、`release-package.yml` |

收藏、笔记和行程都写入浏览器存储。分享 URL 只包含预置路线 ID 和日期；下载是文字行程，没有离线地图或完整离线网站。

助手的文化资料由服务端构建，前端不能直接提交事实上下文。没有模型配置、询问实时出行信息或匹配站内功能帮助时，进入本地回复。当前没有向量库、联网检索、自动生成并保存新路线的能力。

## 4. 本次重新验证

环境：Windows，Node `v24.19.0`、npm `11.17.0`。使用当前已安装且与项目声明匹配的依赖；本轮未另外执行无缓存的干净安装。

| 检查 | 本次结果 |
| --- | --- |
| `npm test` | 84 项通过，0 失败 |
| `npm run format:check` | 通过 |
| `npm run build` | 通过 |
| Playwright | 补齐对应浏览器后，20 个场景 × 3 组，共 60 项通过 |
| 浏览器范围 | Chromium 桌面、Firefox 桌面、Pixel 5 模拟；包含既有导航、保存、分享、异常状态和所选 axe 检查 |
| `npm audit --audit-level=high` | 失败：2 个高危依赖，详见下节 |
| 发布包隔离导入 | 按清单复制运行模块后，服务端导入失败，`ERR_MODULE_NOT_FOUND` |
| 禁止读取 `localStorage` | 已复现读取／写入工具抛 `SecurityError`；Chromium 页面未渲染出应用内容 |
| 普通浏览器页面 | 本地生产服务可显示首页，并保存了截图；外部请求被拦截 |

浏览器验收使用本地回复与地图／接口夹具；不证明真实地图、天气或模型服务目前可用。本轮没有调用收费模型、查询真实道路或进行公网部署。初次浏览器检查因缺少可执行文件而失败，安装 Chromium 和 Firefox 后复测全部通过。

原始审计 JSON、浏览器日志和首页截图留在本地 `my-travel/artifacts/project-review-20261107/`，HTML 报告在 `my-travel/playwright-report/`。这些生成文件被 Git 忽略。

## 5. 已确认的问题

### P1：发布包缺少运行依赖，解包后服务端无法启动

位置：`.github/workflows/release-package.yml` 的上传清单，`my-travel/server/amap.js` 的导入。

发布清单包含 `server/`、`src/data/` 和 `src/data.js`，却缺少 `src/utils/mapAvailability.js`。`server/amap.js` 顶层导入这个文件，`deepseekProxy.js` 又导入 `amap.js`。因此即使关闭 AI 和地图服务，也无法绕过模块加载错误。

已在忽略的临时目录按发布清单复制这些模块，导入 `server/deepseekProxy.js` 得到 `ERR_MODULE_NOT_FOUND`，缺失路径为 `src/utils/mapAvailability.js`。正常源码目录内的构建和测试不会发现这个打包缺口。

建议补全发布包的运行依赖，并对下载／解压后的实际目录执行安装、启动、健康检查与详情深链接检查。

### P1：锁文件中的两个依赖被当前审计标记为高危

本次 npm 审计报告：

| 依赖 | 锁定版本 | 审计结论 |
| --- | --- | --- |
| `source-map-js` | `1.2.1`，间接依赖 | 高危；报告可修复。参考 [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| `vite` | `8.3.2`，直接开发依赖 | 高危；报告可修复，涉及多条公告。例如 [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) |

这是两个受影响的依赖条目，不是仅有两条公告。审计结果本身不证明生产站点已被攻击，也不证明所有触发条件都适用于当前部署。

`ci.yml` 明确运行 `npm audit --audit-level=high`；本次本地执行已失败，重新运行 CI 存在相同阻断。历史报告中的“0 项漏洞”和过去成功的 CI 只能按当时的状态阅读。

建议在修复分支更新依赖与锁文件，检查实际差异，再完成审计、单元、构建与浏览器回归。本轮没有执行 `npm audit fix` 或变更依赖。

### P2：浏览器禁止访问存储对象时，兜底逻辑失效

位置：`my-travel/src/utils/storage.js` 的 `readStored`、`writeStored` 和 `readText`。

三者都将 `globalThis.localStorage` 写在默认参数中。JavaScript 在进入函数体之前求值默认参数；当读取 `localStorage` 属性本身抛异常时，函数内的 `try/catch` 无法捕获。

已将全局属性替换为抛 `SecurityError` 的 getter，确认 `readStored('review-key', [])` 和 `writeStored('review-key', [])` 都向外抛错。另在 Chromium 新上下文注入同样的 getter 后加载生产构建，`#app` 内容为空、没有 `h1`；普通上下文可正常显示首页。

既有“denied storage”浏览器用例只让 `Storage.prototype.setItem` 抛错，因此 60 项通过没有覆盖这个情况。建议把默认存储对象的读取移到 `try` 内，并补充 getter 本身抛错的行为验证。

## 6. 内容与产品边界

以下是项目已有且仍未解决的事项，不将其重复计为本轮新发现的代码缺陷：

- 全部图片的 `imageLicense` 仍为 `pending`；来源、图文对应关系和许可需要逐张核对。
- 9 个参考点位均未升级为已核验入口，3 个暂停点位继续保留资料。帕米尔路线禁用地图连线，服务端返回 422。
- 三条路线仍是跨地区草稿；保存或下载成功不代表交通、开放、预约与每日安排已确认。
- 限流、缓存和模型日预算位于单进程内存中。反向代理共享 IP、多实例和重启后的预算行为已在部署文档中说明。
- 历史固定 Key 和旧工作流日志问题已有记录；本次没有核查账号侧轮换或历史日志清理情况。
- 当前没有新的用户访谈、合作方或付费试点证据。既有文档明确当时缺少当地资源，本轮未据此假定现在已有合作。

## 7. 建议推进顺序

1. 先修复发布包、依赖审计和存储异常，再重新完成自动检查；验证打包结果确实可以独立启动。
2. 复核实施 PR #1，再决定何时合并默认分支，避免访问 `main` 的人拿到过期代码。
3. 从现有内容中选一个可持续维护的小范围主题，完成图片和入口核验。
4. 按 [线上样品规划](ONLINE_SAMPLE.md)组织实际任务测试，观察查找、理解来源和保存行程的困难，再决定新增功能。

现在的数据量与功能规模仍适合结构化文件加 Git 审核。暂时没有证据要求先引入复杂后台、交易系统或大型检索架构。
