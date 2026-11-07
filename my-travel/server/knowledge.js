import { spots } from '../src/data/spots.js'
import { recommendedRoutes } from '../src/data/routes.js'

export function needsFreshVerification(message) {
  return /门票|票价|开放|预约|通行|路况|实时|名额|几点|多少钱|收费|营业|场次|高原不舒服|医疗|今天|现在/.test(
    message,
  )
}

export function productHelp(message) {
  if (!/怎么|如何|哪里|怎样/.test(message)) return ''
  if (/文化清单|体验清单/.test(message))
    return '在文化体验卡片或详情点击“加入文化清单”，再打开页头“我的清单”。清单保存在当前设备，可下载文字或复制仅含地点编号的分享链接；它不是已确认的预约或道路路线。'
  if (/收藏/.test(message))
    return '文化体验卡片和详情可加入文化清单，点击页头“我的清单”查看。南疆目的地里的景点仍可点“收藏”，并在该页面选择“我的收藏”查看。两类收藏均保存在当前设备。'
  if (/分享/.test(message))
    return '文化体验可以先加入文化清单，再打开“我的清单”复制分享链接，仅分享所选地点。主题路线也可展开后“复制分享链接”，包含预置路线与日期，不包含私人笔记；线路仍是草稿。'
  if (/下载/.test(message))
    return '在“我的清单”点击“下载文字清单”，可离线查看地点、参与方式和行前确认事项。主题路线展开后可“下载文字行程”；它是待核验草稿。'
  if (/保存|行程/.test(message))
    return '进入“主题路线”，展开一条路线，可选择出发日期后点击“保存行程”；页脚“我的行程”可再次查看。这会保存在当前设备。也可先在“游客资料”自愿保存昵称与兴趣，再选择“保存到服务端”，在游客资料页查看或删除。线路仍是待核验草稿；也可以下载文本或复制分享链接。'
  if (/笔记/.test(message))
    return '进入景点详情，在“我的旅行笔记”输入内容并保存。笔记只属于当前设备和对应景点，不会发布成公众评论；清除浏览器数据会移除记录。'
  return ''
}

export function buildTrustedContext({
  spots: allSpots = spots,
  routes = recommendedRoutes,
  articles = [],
  experiences = [],
} = {}) {
  return [
    '云游南疆审核资料。门票、开放时间、点位与线路均待出行核验，不得编造实时信息。',
    ...experiences
      .filter((item) => item.status === 'source-reviewed')
      .map(
        (item) =>
          `${item.name}：${item.summary}；地点：${item.address}（${item.addressLevel}）；${item.participation}；需确认：${item.confirm.join('、')}；${item.duration}是编辑建议，非官方时间。来源：${item.sources.map((source) => source.url).join(' ')}；核对日期${item.reviewedAt}`,
      ),
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

export function referenceSources(
  message,
  { spots: allSpots = spots, articles = [], experiences = [] } = {},
) {
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
        ...matchExperiences(message, experiences).flatMap((item) =>
          item.sources.map((source) => ({ ...source, reviewedAt: item.reviewedAt })),
        ),
        ...matched.flatMap((spot) =>
          spot.sources.map((source) => ({ ...source, reviewedAt: spot.reviewedAt })),
        ),
        ...extra,
      ].map((source) => [source.url, source]),
    ).values(),
  ].slice(0, 4)
}

export function localGuideReply(message, catalog = {}) {
  const { spots: allSpots = spots, articles = [], experiences = [] } = catalog
  const sources = referenceSources(message, catalog)
  const help = productHelp(message)
  if (help && !needsFreshVerification(message))
    return { reply: help, sources: [], mode: 'local', notice: '本地功能说明，未调用生成式 AI' }
  const places = matchExperiences(message, experiences).slice(0, 3)
  if (places.length)
    return {
      reply: places
        .map(
          (item) =>
            `${item.name}\n地点：${item.address}\n可以了解：${item.highlights.join('、')}\n参与：${item.participation}\n出发前确认：${item.confirm.join('；')}${item.scope === 'county' ? '\n这是县域延伸，不属于老城步行范围。' : ''}`,
        )
        .join('\n\n'),
      sources,
      mode: 'local',
      notice: '基于具体地点的公开资料；当天接待与场次请向实际接待方确认',
    }
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
function matchExperiences(message, items) {
  return items.filter(
    (item) =>
      item.status === 'source-reviewed' &&
      ([item.name, ...item.tags].some((word) => message.includes(word)) ||
        (/手作|工坊/.test(message) && item.category === 'craft') ||
        (/演出|演艺/.test(message) && item.category === 'show')),
  )
}
