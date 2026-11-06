import { spots } from '../src/data/spots.js'
import { recommendedRoutes } from '../src/data/routes.js'

export function needsFreshVerification(message) {
  return /门票|票价|开放|预约|通行|路况|实时|名额|高原不舒服|医疗|今天|现在/.test(message)
}

export function productHelp(message) {
  if (!/怎么|如何|哪里|怎样/.test(message)) return ''
  if (/收藏/.test(message))
    return '在景点卡片或详情页点击“收藏”；首页选择“我的收藏”即可查看。收藏仅保存在当前设备，不会跨设备同步。'
  if (/分享/.test(message))
    return '进入“主题路线”，展开一条路线，选择“复制分享链接”。链接只包含预置路线和所选日期，不包含私人笔记。线路是草稿，出行安排仍待核验。'
  if (/下载/.test(message))
    return '进入“主题路线”，展开一条路线，点击“下载文字行程”。下载的文本可离线阅读；它是待核验草稿，不是已确认的出行安排。'
  if (/保存|行程/.test(message))
    return '进入“主题路线”，展开一条路线，可选择出发日期后点击“保存行程”；顶部“我的行程”可再次查看。这会保存在当前设备。也可先在“游客资料”自愿保存昵称与兴趣，再选择“保存到服务端”，在游客资料页查看或删除。线路仍是待核验草稿；也可以下载文本或复制分享链接。'
  if (/笔记/.test(message))
    return '进入景点详情，在“我的旅行笔记”输入内容并保存。笔记只属于当前设备和对应景点，不会发布成公众评论；清除浏览器数据会移除记录。'
  return ''
}

export function buildTrustedContext({
  spots: allSpots = spots,
  routes = recommendedRoutes,
  articles = [],
} = {}) {
  return [
    '云游南疆审核资料。门票、开放时间、点位与线路均待出行核验，不得编造实时信息。',
    ...allSpots
      .filter((spot) => spot.status === 'source-reviewed')
      .map(
        (spot) =>
          `${spot.name}：${spot.description}；来源：${spot.sources.map((source) => source.url).join(' ')}；基础介绍核对日期 ${spot.reviewedAt}`,
      ),
    ...articles
      .filter((article) => article.status === 'source-reviewed')
      .map(
        (article) =>
          `${article.title}：${article.summary} ${article.content}；来源：${article.sources.map((source) => source.url).join(' ')}；核对日期 ${article.reviewedAt}`,
      ),
    ...routes.map(
      (route) =>
        `${route.name}：${route.spotNames.join(' → ')}。方案草稿，未经现场复核，不得当作可执行推荐。`,
    ),
  ]
    .join('\n')
    .slice(0, 8500)
}

export function referenceSources(message, { spots: allSpots = spots, articles = [] } = {}) {
  const matched = allSpots.filter(
    (spot) =>
      spot.status === 'source-reviewed' &&
      [spot.name, ...(spot.aliases || [])].some((name) => message.includes(name)),
  )
  const extra = articles
    .filter(
      (article) =>
        article.status === 'source-reviewed' &&
        [article.title, ...article.keywords].some((word) => message.includes(word)),
    )
    .flatMap((article) =>
      article.sources.map((source) => ({ ...source, reviewedAt: article.reviewedAt })),
    )
  return [
    ...new Map(
      [
        ...matched.flatMap((spot) =>
          spot.sources.map((source) => ({ ...source, reviewedAt: spot.reviewedAt })),
        ),
        ...extra,
      ].map((source) => [source.url, source]),
    ).values(),
  ].slice(0, 4)
}

export function localGuideReply(message, catalog = {}) {
  const { spots: allSpots = spots, articles = [] } = catalog
  const sources = referenceSources(message, catalog)
  const help = productHelp(message)
  if (help && !needsFreshVerification(message))
    return { reply: help, sources: [], mode: 'local', notice: '本地功能说明，未调用生成式 AI' }
  const matched = allSpots.filter(
    (spot) =>
      spot.status === 'source-reviewed' &&
      sources.some((source) => spot.sources.some((item) => item.url === source.url)),
  )
  const matchingArticles = articles.filter(
    (article) =>
      article.status === 'source-reviewed' &&
      [article.title, ...article.keywords].some((word) => message.includes(word)),
  )
  const reply =
    matched.length || matchingArticles.length
      ? `${[...matched.map((spot) => `${spot.name}：${spot.description}`), ...matchingArticles.slice(0, 3).map((article) => `${article.title}：${article.summary} ${article.content}`)].join('\n\n')}\n\n门票、开放时间、交通与预约请核对官方最新信息。`
      : /路线|行程|几天|规划/.test(message)
        ? '可以先在“主题路线”选择方案草稿，设置出发日期，保存或下载行程。现有线路与点位尚待现场复核，请先确认每天交通、开放和预约安排。'
        : '我可以帮助你查找本站公开的文化资料，或说明如何收藏、保存与分享行程。试着问“喀什古城有什么文化特色？”；本站不提供未经核验的实时门票、通行或医疗建议。'
  return { reply, sources, mode: 'local', notice: '本地资料模式，未调用生成式 AI' }
}
