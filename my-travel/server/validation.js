import { ServiceError } from './errors.js'
import { existsSync } from 'node:fs'
const fail = (message) => {
  throw new ServiceError(400, message)
}
export const text = (value, max = 2000) =>
  typeof value === 'string' && value.length <= max ? value.trim() : fail('文本类型或长度无效')
const ids = (value) =>
  Array.isArray(value) && value.length <= 30 && value.every((id) => Number.isInteger(id) && id > 0)
    ? value
    : fail('关联条目无效')
const strings = (value, maxItems, maxLength) =>
  Array.isArray(value) && value.length <= maxItems
    ? value.map((item) => text(item, maxLength))
    : fail('列表格式无效')
export const validDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value
export function sources(value) {
  if (!Array.isArray(value) || value.length > 12) fail('来源格式无效')
  return value.map((item) => {
    if (!item || typeof item !== 'object') fail('来源格式无效')
    const url = text(item.url, 1500)
    try {
      if (new URL(url).protocol !== 'https:') fail('来源必须使用HTTPS')
    } catch {
      fail('来源网址无效')
    }
    return {
      title: text(item.title, 200),
      url,
      publisher: text(item.publisher || '', 200),
      publishedAt: text(item.publishedAt || '', 10),
      fields: strings(item.fields || [], 12, 120),
    }
  })
}
export function validateContent(kind, value, store) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('内容格式无效')
  const body = { published: value.published === true }
  if (value.id !== undefined) {
    if (!Number.isInteger(value.id) || value.id < 1) fail('编号无效')
    body.id = value.id
  }
  if (kind === 'routes') {
    Object.assign(body, {
      name: text(value.name, 100),
      desc: text(value.desc, 1000),
      spotIds: ids(value.spotIds),
      status: 'draft',
      mode: 'driving',
      reviewedAt: null,
      notice: '行程草稿：点位、交通、开放与可执行性待核验。',
    })
    const all = store.list('spots')
    if (!body.name) fail('路线名称不能为空')
    if (body.spotIds.length < 2 || body.spotIds.some((id) => !all.some((spot) => spot.id === id)))
      fail('路线需关联至少两个已存在景点')
    if (!Array.isArray(value.schedule) || !value.schedule.length || value.schedule.length > 30)
      fail('逐日安排无效')
    body.schedule = value.schedule.map((day, index) => ({
      day: index + 1,
      title: text(day.title, 100),
      spotIds: ids(day.spotIds),
      note: text(day.note, 1000),
    }))
    if (
      JSON.stringify(body.schedule.flatMap((day) => day.spotIds)) !== JSON.stringify(body.spotIds)
    )
      fail('逐日安排与景点顺序不一致')
    body.days = body.schedule.length
    body.spotNames = body.spotIds.map((id) => all.find((spot) => spot.id === id).name)
  } else {
    body.status = ['draft', 'source-reviewed'].includes(value.status)
      ? value.status
      : fail('审核状态无效')
    body.sources = sources(value.sources)
    body.reviewedAt = text(value.reviewedAt || '', 10)
    if (body.status === 'source-reviewed' && (!body.sources.length || !validDate(body.reviewedAt)))
      fail('审核资料必须有来源和有效核对日期')
    if (kind === 'experiences') {
      if (
        body.status === 'source-reviewed' &&
        body.sources.some(
          (source) => !source.fields.length || source.fields.some((field) => !field),
        )
      )
        fail('已核对的文化体验需注明每份来源支持的字段')
      for (const key of [
        'name',
        'subtitle',
        'area',
        'address',
        'addressLevel',
        'summary',
        'participation',
        'duration',
        'opening',
        'reservation',
        'fee',
        'visual',
        'serviceStatus',
      ])
        body[key] = text(value[key] || '', key === 'participation' ? 1200 : 800)
      if (!body.name || !body.address || !body.participation)
        fail('体验名称、地点与参与方式不能为空')
      if (
        !['street', 'craft', 'museum', 'tea', 'show'].includes(value.category) ||
        !['oldtown', 'city', 'county'].includes(value.scope)
      )
        fail('体验类型或区域无效')
      body.category = value.category
      body.scope = value.scope
      body.minutes = Number(value.minutes)
      if (!Number.isInteger(body.minutes) || body.minutes < 15 || body.minutes > 720)
        fail('建议预留时间无效')
      body.highlights = strings(value.highlights || [], 8, 200)
      body.tags = strings(value.tags || [], 8, 40)
      body.confirm = strings(value.confirm || [], 10, 250)
      body.durationBasis = '编辑建议，非官方游览时长'
      body.featured = value.featured === true
    } else if (kind === 'articles') {
      Object.assign(body, {
        title: text(value.title, 100),
        topic: text(value.topic, 40),
        summary: text(value.summary, 500),
        content: text(value.content, 5000),
        spotIds: ids(value.spotIds || []),
        keywords: strings(value.keywords || [], 12, 40),
        notice: text(value.notice || '基础文化资料；出行信息另行核验。', 300),
      })
      if (!body.title || !body.content) fail('标题和正文不能为空')
      if (body.spotIds.some((id) => !store.list('spots').some((spot) => spot.id === id)))
        fail('文化资料关联的景点不存在')
    } else {
      for (const key of [
        'name',
        'shortDesc',
        'address',
        'description',
        'adcode',
        'type',
        'region',
        'image',
        'coordinateStatus',
        'coordinateSource',
        'coordinateNote',
        'visitNote',
        'maintainer',
        'imageLicense',
      ])
        body[key] = text(value[key] || '', key === 'description' ? 3000 : 500)
      if (
        !body.name ||
        !body.description ||
        !['cultural', 'natural', 'village'].includes(body.type) ||
        !['kashgar', 'aksu', 'hotan', 'pamirs', 'bayingolin'].includes(body.region)
      )
        fail('景点名称、介绍、地区或分类无效')
      if (
        !/^\d{6}$/.test(body.adcode) ||
        !/^\/images\/[\p{L}\p{N}_ .-]+\.(webp|png|jpg|jpeg)$/u.test(body.image)
      )
        fail('地区代码或图片路径无效')
      if (
        !existsSync(new URL(`../public${body.image}`, import.meta.url)) &&
        !existsSync(new URL(`../dist${body.image}`, import.meta.url))
      )
        fail('图片文件不存在，请选择已有图片')
      if (!['reference', 'suspended', 'verified'].includes(body.coordinateStatus))
        fail('点位状态无效')
      body.lng = value.lng
      body.lat = value.lat
      if (body.coordinateStatus === 'suspended') {
        body.lng = null
        body.lat = null
        if (!body.coordinateNote) fail('暂停点位需说明原因')
      } else if (
        !Number.isFinite(body.lng) ||
        !Number.isFinite(body.lat) ||
        Math.abs(body.lng) > 180 ||
        Math.abs(body.lat) > 90
      )
        fail('坐标无效')
      body.aliases = strings(value.aliases || [], 20, 60)
      body.ticket = '待核验，请查询官方信息'
      body.opening = '待核验，请查询官方信息'
      body.story = ''
    }
  }
  return body
}
export function validateProfile(body) {
  if (body?.consent !== true) fail('请先同意保存自愿提交的资料')
  const profile = {
    nickname: text(body.nickname, 40),
    city: text(body.city || '', 80),
    interests: strings(body.interests || [], 8, 30),
    consentAt: new Date().toISOString(),
  }
  if (!profile.nickname) fail('请填写称呼或昵称')
  return profile
}
