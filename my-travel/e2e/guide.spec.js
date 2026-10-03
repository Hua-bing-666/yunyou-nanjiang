import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { recommendedRoutes } from '../src/data/routes.js'
import { spots } from '../src/data/spots.js'

test.beforeEach(async ({ page }) => {
  page.__errors = []
  page.on('pageerror', (error) => page.__errors.push(error.message))
  await page.route('https://webapi.amap.com/**', (route) => route.abort())
  await page.route('**/api/weather?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: '天气暂不可用' }),
    }),
  )
})
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([])
})

test('visitor can browse without a login and find map fallback', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '看见风景，也读懂地方。' })).toBeVisible()
  await expect(page.locator('.spot-card')).toHaveCount(12)
  await expect(page.getByText('地图暂不可用，请重试；你仍可浏览景点与保存行程')).toBeVisible()
  await expect(page.getByText('请输入用户名')).toHaveCount(0)
})

test('detail deep links, reload, back and forward restore the right content', async ({ page }) => {
  await page.goto('/detail/1')
  await expect(page.getByRole('heading', { name: '喀什古城', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '喀什古城', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '主题路线', exact: true }).click()
  await expect(page.getByRole('heading', { name: '南疆主题路线' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '喀什古城', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: '南疆主题路线' })).toBeVisible()
  await page.goto('/detail/99999')
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/does-not-exist')
  await expect(page).toHaveURL(/\/$/)
})

test('search includes regions and routes and explains no results', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('搜索景点、地区或主题路线').fill('南疆人文')
  await page.getByRole('button', { name: '南疆人文经典线 主题路线 · 草稿' }).click()
  await expect(page).toHaveURL(/routes\?route=1/)
  await expect(page.getByLabel('出发日期（可选）')).toBeVisible()
  await page.getByRole('button', { name: '景点导览', exact: true }).click()
  await page.getByLabel('搜索景点、地区或主题路线').fill('不存在的词语abc')
  await expect(page.getByText('没有找到相关内容，试试地区名或其他关键词。')).toBeVisible()
})

test('regions, favorites and reload retain correct records', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '喀什', exact: true }).click()
  await expect(page.locator('.spot-card')).toHaveCount(1)
  await page.getByRole('button', { name: '收藏喀什古城', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '我的收藏', exact: true }).click()
  await expect(page.locator('.spot-card')).toHaveCount(1)
  await page.getByRole('button', { name: '取消收藏喀什古城', exact: true }).click()
  await expect(page.getByText('还没有收藏。浏览景点后点击收藏，便能在这里找到它。')).toBeVisible()
})

test('corrupt cache does not block guide, notes or itineraries', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('favoriteSpots', '{broken')
    localStorage.setItem('yunyou_itineraries', '{}')
    localStorage.setItem('yunyou_notes_1', 'not-json')
    localStorage.setItem('ai-assistant-theme', '{broken')
  })
  await page.goto('/detail/1')
  await expect(page.getByRole('heading', { name: '喀什古城', exact: true })).toBeVisible()
  await expect(page.getByText('还没有笔记，记下你想体验的事吧。')).toBeVisible()
  await page.getByRole('button', { name: '我的行程', exact: true }).click()
  await expect(page.getByText('还没有保存行程。先浏览主题路线，再选择“保存行程”。')).toBeVisible()
})

test('denied storage displays a failure without pretending to save', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('denied', 'SecurityError')
    }
  })
  await page.goto('/routes?route=1')
  await page.getByRole('button', { name: '保存行程', exact: true }).click()
  await expect(page.getByText('保存失败，当前浏览器无法写入存储')).toBeVisible()
  await page.goto('/detail/1')
  await page.getByLabel('旅行笔记', { exact: true }).fill('保存受限')
  await page.getByRole('button', { name: '保存笔记', exact: true }).click()
  await expect(page.getByText('保存失败，当前浏览器无法写入存储')).toBeVisible()
})

test('personal notes persist on their own spot and can be deleted', async ({ page }) => {
  await page.goto('/detail/1')
  await page.getByLabel('旅行笔记', { exact: true }).fill('想了解铜器制作')
  await page.getByRole('button', { name: '保存笔记', exact: true }).click()
  await page.reload()
  await expect(page.locator('.notes-list').getByText('想了解铜器制作')).toBeVisible()
  await page.goto('/detail/2')
  await expect(page.locator('.notes-list')).toHaveCount(0)
  await page.goto('/detail/1')
  await page.getByRole('button', { name: '删除这条笔记' }).click()
  await expect(page.getByText('还没有笔记，记下你想体验的事吧。')).toBeVisible()
})

test('saved date survives reload, downloads text and creates a shareable deep link', async ({
  page,
}) => {
  await page.goto('/routes?route=1&date=2026-10-20')
  await expect(page.getByLabel('出发日期（可选）')).toHaveValue('2026-10-20')
  await page.getByRole('button', { name: '保存行程', exact: true }).click()
  await page.getByRole('button', { name: '我的行程', exact: true }).click()
  await page.reload()
  await expect(page.locator('.route-card')).toHaveCount(1)
  await page.getByRole('button', { name: /南疆人文经典线/ }).click()
  await expect(page.getByLabel('出发日期（可选）')).toHaveValue('2026-10-20')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载文字行程' }).click()
  const download = await downloadPromise
  const contents = await readFile(await download.path(), 'utf8')
  expect(contents).toContain('2026-10-20')
  expect(contents).toContain('方案草稿')
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.copiedShare = text
        },
      },
    }),
  )
  await page.getByRole('button', { name: '复制分享链接' }).click()
  const shared = await page.evaluate(() => window.copiedShare)
  expect(shared).toContain('/routes?route=1&date=2026-10-20')
  await page.goto(shared)
  await expect(page.getByLabel('出发日期（可选）')).toHaveValue('2026-10-20')
})

test('local assistant shows its mode, source links and no fabricated ticket price', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '打开旅游助手' }).click()
  await page.getByLabel('向旅游助手提问').fill('喀什古城有什么文化特色？')
  await page.getByRole('button', { name: '发送问题' }).click()
  await expect(page.getByText('本地资料模式，未调用生成式 AI')).toBeVisible()
  await expect(page.getByRole('link', { name: '喀什古城景区：非遗与旅游' })).toBeVisible()
  await page.getByRole('button', { name: '关闭旅游助手' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('assistant errors are visible and navigation remains usable', async ({ page }) => {
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"rate limit"}' }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: '打开旅游助手' }).click()
  await page.getByLabel('向旅游助手提问').fill('测试')
  await page.getByRole('button', { name: '发送问题' }).click()
  await expect(
    page.locator('.bubble').getByText('请求频繁或今日额度已用完，请稍后再试'),
  ).toBeVisible()
  await page.getByRole('button', { name: '关闭旅游助手' }).click()
  await page.getByRole('button', { name: '主题路线', exact: true }).click()
  await expect(page.getByRole('heading', { name: '南疆主题路线' })).toBeVisible()
})

test('weather success and failed retry are labelled', async ({ page }) => {
  await page.unroute('**/api/weather?*')
  await page.route('**/api/weather?*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: '{"temperature":"22","weather":"晴","reportTime":"2026-10-03 10:00:00"}',
    }),
  )
  await page.goto('/detail/1')
  await expect(page.getByText('🌤️ 22°C · 晴')).toBeVisible()
  await page.unroute('**/api/weather?*')
  await page.route('**/api/weather?*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  )
  await page.goto('/detail/2')
  await expect(page.getByText('天气暂不可用', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '重试天气' }).click()
  await expect(page.getByText('天气暂不可用', { exact: true })).toBeVisible()
})

test('mobile layout has no overflow and core pages pass accessibility checks', async ({ page }) => {
  for (const url of ['/', '/detail/1', '/routes?route=1', '/stats']) {
    await page.goto(url)
    await expect(page.locator('h1')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([])
  }
})

// This SDK fixture checks our integration contract, not provider availability or coordinates.
function installMapFixture() {
  const state = (window.__mapFixture = { created: 0, destroyed: 0, markers: [], centers: [] })
  class Map {
    constructor(id) {
      this.container = document.getElementById(id)
      this.zoom = 8
      state.created++
    }
    getContainer() {
      return this.container
    }
    destroy() {
      state.destroyed++
    }
    setLimitBounds() {}
    setBounds(bounds) {
      this.bounds = bounds
    }
    setCenter(position) {
      state.centers.push(position)
    }
    setZoom(value) {
      this.zoom = value
    }
    getZoom() {
      return this.zoom
    }
    setFitView() {}
    add() {}
    on() {}
    off() {}
    lngLatToContainer([lng, lat]) {
      const [sw, ne] = this.bounds?.points || [
        [73, 35],
        [88, 43],
      ]
      return {
        x:
          ((lng - sw[0]) / Math.max(ne[0] - sw[0], 0.01)) * (this.container.clientWidth - 120) + 60,
        y:
          ((ne[1] - lat) / Math.max(ne[1] - sw[1], 0.01)) * (this.container.clientHeight - 120) +
          60,
      }
    }
  }
  class Marker {
    constructor(options) {
      this.options = options
      this.events = {}
      state.markers.push(this)
    }
    setMap() {}
    on(name, handler) {
      this.events[name] = handler
    }
    getPosition() {
      return this.options.position
    }
  }
  class Value {
    constructor(...points) {
      this.points = points
    }
  }
  class InfoWindow {
    constructor(options) {
      this.content = options.content
    }
    open(map) {
      map.getContainer().appendChild(this.content)
    }
    close() {
      this.content.remove()
    }
  }
  window.AMap = {
    InfoWindow,
    Map,
    Marker,
    Icon: Value,
    Pixel: Value,
    Size: Value,
    Bounds: Value,
    Polygon: Value,
  }
}

test('map can retry after SDK failure and release instances during navigation', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '重试地图' })).toBeVisible()
  await page.evaluate(installMapFixture)
  await page.getByRole('button', { name: '重试地图' }).click()
  await expect(page.locator('.home-spot-label')).toHaveCount(9)
  await page.locator('.spot-card').first().getByRole('link').click()
  await page.getByRole('button', { name: '在导览地图查看' }).click()
  await expect(page.locator('#fullscreen-map')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__mapFixture.created)).toBe(2)
  await page.getByRole('button', { name: '返回景点导览' }).click()
  await expect(page.locator('.home-spot-label')).toHaveCount(9)
  await expect.poll(() => page.evaluate(() => window.__mapFixture.destroyed)).toBe(2)
})

test('route fallback is labelled, styled and navigates to the correct spot', async ({ page }) => {
  await page.goto('/routes?route=1')
  await page.evaluate(installMapFixture)
  await page.route('**/api/route?*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  )
  await page.getByRole('button', { name: '查看路线示意' }).click()
  await expect(page.getByText('路线示意：点位和行程待核验，不能用于道路导航')).toBeVisible()
  await expect(page.locator('.route-overlay-marker')).toHaveCount(4)
  await expect
    .poll(() =>
      page.locator('.route-overlay-layer').evaluate((node) => getComputedStyle(node).position),
    )
    .toBe('absolute')
  await page.locator('.route-overlay-marker').first().click()
  await expect(page).toHaveURL(new RegExp(`detail/${recommendedRoutes[0].spotIds[0]}$`))
  await page.getByRole('button', { name: '返回景点导览' }).click()
  await expect(page.locator('.route-overlay-marker')).toHaveCount(0)
  await expect(page.locator('.home-spot-label')).toHaveCount(9)
})

test('late road response cannot restore a cleared route preview', async ({ page }) => {
  await page.goto('/routes?route=1')
  await page.evaluate(installMapFixture)
  let release
  const waiting = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/route?*', async (route) => {
    await waiting
    await route
      .fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          path: [
            [75, 39],
            [76, 40],
          ],
          notice: '道路预览；参考点位待核验',
        }),
      })
      .catch(() => {})
  })
  await page.getByRole('button', { name: '查看路线示意' }).click()
  await expect(page.locator('.route-overlay-marker')).toHaveCount(4)
  await page.getByRole('button', { name: '清除路线' }).click()
  release()
  await expect(page.locator('.route-overlay-marker')).toHaveCount(0)
  await expect(page.locator('.home-spot-label')).toHaveCount(9)
})

test('assistant can be opened and closed using a keyboard and has accessible controls', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: '打开旅游助手' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('向旅游助手提问')).toBeFocused()
  await page.locator('.chat-window').evaluate(async (node) => {
    await Promise.all(
      node
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    )
  })
  const results = await new AxeBuilder({ page })
    .include('.chat-window')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(
    results.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    })),
  ).toEqual([])
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '打开旅游助手' })).toBeFocused()
})

test('map information actions open the full map and correct detail without delayed handlers', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(installMapFixture)
  await page.getByRole('button', { name: '重试地图' }).click()
  await page.evaluate(() =>
    window.__mapFixture.markers
      .find((marker) => marker.options.title === '喀什古城')
      .events.click(),
  )
  await page.getByRole('button', { name: '在大地图查看' }).click()
  await expect(page).toHaveURL(/map\/1$/)
  await expect.poll(() => page.evaluate(() => window.__mapFixture.created)).toBe(2)
  await page.evaluate(() => window.__mapFixture.markers.at(-1).events.click())
  await page.getByRole('button', { name: '查看景点详情' }).click()
  await expect(page).toHaveURL(/detail\/11$/)
})

test('suspended points stay available as content without invalid map markers or map centering', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(installMapFixture)
  await page.getByRole('button', { name: '重试地图' }).click()
  await expect(page.locator('.spot-card')).toHaveCount(12)
  await expect(page.locator('.home-spot-label')).toHaveCount(9)
  for (const id of [5, 6, 12])
    await expect(page.locator(`.home-spot-label[data-spot-id="${id}"]`)).toHaveCount(0)
  await page.locator('.spot-card a[href="/detail/5"]').click()
  await expect(page.locator('.source-card')).toContainText('暂停展示')
  await page.getByRole('button', { name: '在导览地图查看' }).click()
  await expect(page).toHaveURL(/map\/5$/)
  await expect(page.getByRole('status').filter({ hasText: '当前显示区域导览' })).toBeVisible()
  expect(await page.evaluate(() => window.__mapFixture.centers)).toEqual([])
  expect(
    await page.evaluate(() =>
      window.__mapFixture.markers.every((marker) => marker.options.position.every(Number.isFinite)),
    ),
  ).toBe(true)
})

test('blocked route remains savable and exportable but makes no road request', async ({ page }) => {
  let requests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/route') requests++
  })
  await page.goto('/routes?route=2')
  await expect(page.getByText(/白沙湖.*慕士塔格峰.*暂不提供地图连线/)).toBeVisible()
  await expect(page.getByRole('button', { name: '查看路线示意' })).toHaveCount(0)
  await page.getByRole('button', { name: '保存行程', exact: true }).click()
  await expect(page.getByText('已保存到当前设备，可在“我的行程”查看')).toBeVisible()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载文字行程' }).click()
  const download = await downloadEvent
  const text = await readFile(await download.path(), 'utf8')
  expect(text).toContain('地图状态：')
  expect(text).toContain('暂不提供地图连线')
  expect(requests).toBe(0)
  await page.reload()
  await expect(page.getByRole('button', { name: '移除保存' })).toBeVisible()
})

test('every introduction has sources and legacy search names still find the correct destination', async ({
  page,
}) => {
  for (const spot of spots) {
    await page.goto(`/detail/${spot.id}`)
    await expect(page.locator('.source-card')).toContainText(spot.reviewedAt)
    for (const source of spot.sources)
      await expect(
        page.locator('.source-card a').filter({ hasText: source.title }),
      ).toHaveAttribute('href', source.url)
  }
  for (const [keyword, id] of [
    ['轮台胡杨林', 8],
    ['喀什帕米尔白沙湖', 5],
  ]) {
    await page.goto('/')
    await page.getByLabel('搜索景点、地区或主题路线').fill(keyword)
    await page.locator('.search-results').getByRole('button').first().click()
    await expect(page).toHaveURL(new RegExp(`/detail/${id}$`))
  }
})
