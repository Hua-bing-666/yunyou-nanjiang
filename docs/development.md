# 开发与配置

本地外层名称为 **云游南疆**；保留 `my-travel/` 子目录，避免同时改变部署和源码路径。Node.js 24 LTS、npm、Vue 3、Vite 8、Vant 4、Vue Router，服务端为原生 Node HTTP。

## 首次运行

在 `my-travel/` 执行 `npm ci`、`npm run dev`。统一入口会启动 `127.0.0.1:3001` API 和 `localhost:5173` 网页；Vite 代理 `/api`。端口被占用会明确失败，不能把错误端口当成项目已启动。Ctrl+C 关闭两个进程。单独调试可用 `npm run dev:api`、`npm run dev:web`。

不配置外部服务时：地图和天气显示可重试的失败状态，浏览、收藏、笔记及行程保存正常；助手使用有来源的本地介绍，不生成猜测。演示前可设置 `AI_MODE=local` 保证不发生模型调用。

## 环境配置

复制 `.env.example` 到 `.env.local`。dotenv 按 `.env.local`、`.env` 顺序读取，已有进程环境优先；文件位置依据应用目录计算，不依赖启动终端的当前目录。Vite 的 `VITE_*` 值进入浏览器构建产物，因此仅放公开配置。

| 配置 | 用途 |
| --- | --- |
| `VITE_AMAP_KEY` | 高德 Web JS 地图 Key；在控制台限制允许域名 |
| `VITE_AMAP_SERVICE_HOST` | 地图安全代理地址，以 `/_AMapService` 结尾；安全密钥保存在该代理服务 |
| `AMAP_WEBSERVICE_KEY` | 仅服务端读取的高德天气／道路 Web Service Key |
| `DEEPSEEK_API_KEY` | 仅服务端读取的模型 Key；缺失时为本地资料模式 |
| `DEEPSEEK_MODEL` | 模型名称，支持覆盖；示例沿用原项目配置 |
| `DEEPSEEK_BASE_URL` | 模型服务地址，不从浏览器提交 |
| `AI_MODE=local` | 即使有模型 Key 也强制本地资料模式 |
| `AI_DAILY_LIMIT` | 单个进程每天的模型请求上限，默认 200，允许 0–10000 |
| `PORT` / `DEEPSEEK_PROXY_PORT` | API 端口，默认 3001；PORT 优先 |
| `HOST` | 默认 127.0.0.1；容器需要 0.0.0.0 |
| `ALLOWED_ORIGINS` | 额外允许的精确来源列表；同源始终支持 |

不要提交 `.env`、`.env.local` 或秘密到 Git；示例仅含占位符。原源码曾含固定高德 Key，Git 历史仍保留，应在控制台限制并轮换相关旧 Key。旧云工作流曾输出密钥片段，历史日志也需要账号持有人核查；本次不重写远程历史。

高德 JS 安全代理按[官方安全配置](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode)实施。服务端查询按[天气接口](https://lbs.amap.com/api/webservice/guide/api/weatherinfo)及[道路规划接口](https://lbs.amap.com/api/webservice/guide/api/direction)维护。模型名和计费以 [DeepSeek 官方文档](https://api-docs.deepseek.com/zh-cn/)为准；原模型别名可能被服务商映射到更新模型。

## 开发规则

- 景点资料改 `src/data/spots.js`；只有附来源且 `source-reviewed` 的基础介绍进入助手上下文。更新具体出行信息需独立核验。
- 草稿路线改 `src/data/routes.js`；保留景点顺序，实际道路几何由 `/api/route` 获取。全部点位可显示时，接口失败保留带标识的连线；存在暂停／缺失点位时，整条线路不绘制、不查询道路，API 返回 422。
- 地图可用性统一在 `src/utils/mapAvailability.js` 判断；不能直接把 `null` 转为零、跳过缺失站点或将山峰位置当作入口。旧名称放入 `aliases`，便于搜索及助手识别。
- 收藏和笔记仅在浏览器保存；分享仅含预置路线 ID 与日期。不对外声称云同步、公众评论或真实经营统计。
- 错误不能输出上游秘密；天气、路线、助手失败不阻断主要内容。
- `npm run format:check`、`npm test`、`npm run test:e2e` 为提交前检查。浏览器首次安装 `npx playwright install chromium firefox`。

`npm run test:e2e` 使用固定本地资料模式与接口／地图夹具，稳定验证我们的行为；夹具结果不能代替真实服务与实地坐标验收。完整证据见 [验收报告](ACCEPTANCE.md)。
