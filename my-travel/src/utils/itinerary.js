import { recommendedRoutes } from '../data/routes.js'
import { spots } from '../data.js'

// Share only a known route and a validated date, never notes or identity.
export function validTravelDate(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  )
}

export function validateSavedRoute(value) {
  return (
    value &&
    Number.isInteger(value.routeId) &&
    recommendedRoutes.some((route) => route.id === value.routeId) &&
    (value.startDate === '' || validTravelDate(value.startDate))
  )
}

export function itineraryText(route, startDate = '') {
  const lines = [
    '云游南疆 · 我的行程',
    route.name,
    `出发日期：${startDate || '未设置'}`,
    '方案草稿；车程、开放信息及现场安排请在出发前核验。',
  ]
  for (const day of route.schedule) {
    lines.push(
      `\n第 ${day.day} 天 · ${day.title}`,
      day.spotIds
        .map((id) => spots.find((spot) => spot.id === id)?.name)
        .filter(Boolean)
        .join(' → '),
      day.note,
    )
  }
  lines.push('\n地图连线为路线示意，不代表道路导航。资料与个人收藏保存在当前设备。')
  return lines.join('\n')
}

export function sharePath(routeId, startDate = '') {
  if (!recommendedRoutes.some((route) => route.id === routeId)) throw new Error('无效路线')
  const query = new URLSearchParams({ route: String(routeId) })
  if (validTravelDate(startDate)) query.set('date', startDate)
  return `/routes?${query}`
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('请使用下载行程保存内容')
}

export function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
