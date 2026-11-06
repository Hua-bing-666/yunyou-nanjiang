// Brief editorial summaries, not copied articles or current operating promises.
const craft = {
  title: '喀什古城景区：“非遗+旅游”为文旅融合注入活力',
  url: 'https://www.kashi.gov.cn/ksdqxzgs/c106707/202201/8b6c53a56fd44dcf9ca7c00e9a77a25c.shtml',
  publishedAt: '2022-01-13',
  publisher: '喀什地区行政公署（喀什日报）',
}
const city = {
  title: '千年古城焕新颜',
  url: 'https://www.kashi.gov.cn/ksdqxzgs/c106707/202402/762f2b49c49340df89aefab050735139.shtml',
  publishedAt: '2024-02-08',
  publisher: '喀什地区行政公署（新疆日报）',
}
export const researchArticles = [
  {
    id: 1,
    title: '在古城认识铜器制作',
    topic: '传统手工艺',
    spotIds: [1],
    keywords: ['铜器', '铜匠'],
    summary: '公开报道记录了喀什古城铜器制作与游客了解制作过程的场景。',
    content:
      '可以把铜器制作作为阅读古城文化的一个切口。报道中的参与场景发生于当时的店铺；是否能体验、如何预约与费用，需要另行向经营者确认。',
    sources: [craft],
  },
  {
    id: 2,
    title: '土陶：从器物认识地方生活',
    topic: '传统手工艺',
    spotIds: [1],
    keywords: ['土陶', '陶器'],
    summary: '土陶烧制被当地报道列为古城展示的非遗技艺之一。',
    content:
      '先了解器物与地方生活的联系，再查找有明确接待安排的展示点。本文未核实具体工坊、课程或营业时间。',
    sources: [craft],
  },
  {
    id: 3,
    title: '乐器制作的文化线索',
    topic: '传统手工艺',
    spotIds: [1],
    keywords: ['乐器', '音乐'],
    summary: '民族乐器制作是喀什古城公开报道介绍的文化内容之一。',
    content: '制作技艺和舞台演出是不同的参观主题。本文提供阅读线索，不保证现场有演奏或制作体验。',
    sources: [craft],
  },
  {
    id: 4,
    title: '木器制作与古城手工艺',
    topic: '传统手工艺',
    spotIds: [1],
    keywords: ['木器', '木工'],
    summary: '古城手工艺主题还包括木器制作技艺。',
    content: '可与铜器、土陶等主题一同阅读。具体传承人、展示空间及参与方式仍需独立确认。',
    sources: [craft],
  },
  {
    id: 5,
    title: '高台民居：先理解建筑，再确认入口',
    topic: '街巷与建筑',
    spotIds: [1],
    keywords: ['高台民居', '建筑'],
    summary: '喀什经济开发区的历史介绍将高台民居作为了解传统居住建筑的线索。',
    content:
      '这份资料发表于2013年，仅用于建筑文化背景。不能用历史介绍确认今天的开放范围，也不能据此推定某处民居可进入参观。',
    sources: [
      {
        title: '喀什高台民居',
        url: 'https://www.kstq.gov.cn/kashi/lyjd/201302/2bb8eff29b494b5f9f4bd9eedad21a52.shtml',
        publisher: '喀什经济开发区',
        publishedAt: '2013-02-27',
      },
    ],
  },
  {
    id: 6,
    title: '从博物馆认识喀什历史',
    topic: '博物馆',
    spotIds: [1],
    keywords: ['博物馆', '历史', '喀什'],
    summary: '地方公开报道通过喀什地区博物馆的展品介绍区域历史文化。',
    content:
      '博物馆资料可与古城街巷阅读互相补充。本文不采纳旧地址或历史开放安排；参观前请核对博物馆当期通知。',
    sources: [city],
  },
  {
    id: 7,
    title: '库车王府与龟兹文化阅读',
    topic: '博物馆',
    spotIds: [2, 7],
    keywords: ['库车王府', '龟兹', '库车'],
    summary: '自治区人社厅2023年的活动记录提及库车王府、龟兹博物馆和古城墙等展区。',
    content:
      '可将这些展陈作为了解库车历史的阅读线索。该文是历史活动记录，不代表现有展区安排、门票或预约条件。',
    sources: [
      {
        title: '观名城古迹 赏文旅美景 看发展变化',
        url: 'https://rst.xinjiang.gov.cn/xjrst/c112869/202305/8915bc09fce14c3ab40b8036af342d6e.shtml',
        publisher: '新疆维吾尔自治区人力资源和社会保障厅',
        publishedAt: '2023-05-04',
      },
    ],
  },
  {
    id: 8,
    title: '和田团城的街巷与阿依旺民居',
    topic: '街巷与建筑',
    spotIds: [3],
    keywords: ['和田', '团城', '阿依旺'],
    summary: '2026年的公开报道介绍了和田团城街巷改造及阿依旺式民居。',
    content:
      '可沿着街巷与居住建筑的关系认识团城。报道中的商户、活动和经营数据只属于报道语境，本文不把它们转为当前可预约的产品。',
    sources: [
      {
        title: '千里援疆 古邑新生',
        url: 'https://fgw.beijing.gov.cn/fzggzl/zyhz/gzdt/yj/xggz/202604/t20260416_4584521.htm',
        publisher: '北京市发展和改革委员会（北京日报）',
        publishedAt: '2026-04-16',
      },
    ],
  },
].map((item) => ({
  ...item,
  status: 'source-reviewed',
  reviewedAt: '2026-11-07',
  published: true,
  notice: '基础文化资料；实际开放、接待、入口和图片许可另行核验。',
}))
