import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'

test('administrator can edit specific cultural participation data without losing provenance', async ({
  page,
}, info) => {
  await page.request.post('/api/admin/login', {
    data: { username: 'admin', password: 'acceptance-admin-pass-2026' },
  })
  const catalog = await (await page.request.get('/api/catalog')).json()
  const name = `文化体验编辑验收-${info.project.name}`
  const response = await page.request.post('/api/admin/experiences', {
    data: { ...catalog.experiences[0], id: undefined, version: undefined, name, published: false },
  })
  const created = await response.json()
  expect(response.status()).toBe(201)
  try {
    await page.goto('/admin')
    await page.getByRole('button', { name: '文化体验', exact: true }).click()
    await page
      .getByRole('row')
      .filter({ hasText: name })
      .getByRole('button', { name: '编辑', exact: true })
      .click()
    await page.getByLabel('具体参与方式', { exact: true }).fill('先向接待方确认当日工坊安排。')
    await page
      .getByLabel('支持的字段（每行一项）', { exact: true })
      .first()
      .fill('地点名称\n工坊参与方式')
    await page.getByRole('button', { name: '保存内容', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('内容已保存')
    const current = await (await page.request.get('/api/admin/experiences')).json()
    const updated = current.items.find((item) => item.id === created.id)
    expect(updated.participation).toBe('先向接待方确认当日工坊安排。')
    expect(updated.sources[0].fields).toEqual(['地点名称', '工坊参与方式'])
  } finally {
    await page.request.delete(`/api/admin/experiences/${created.id}`)
  }
})

test('culture discovery filters concrete venues and keeps scroll position', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /去街巷里/ })).toBeVisible()
  await expect(page.locator('.experience-card')).toHaveCount(6)
  await expect(page.locator('.map-container')).toHaveCount(0)
  await page.getByRole('button', { name: '非遗手作', exact: true }).click()
  await expect(page.locator('.experience-card')).toHaveCount(3)
  await expect(page.getByRole('status').filter({ hasText: '3 个文化体验' })).toBeVisible()
  const before = await page.evaluate(() => scrollY)
  await page.getByRole('combobox', { name: '选择体验区域' }).selectOption('oldtown')
  await expect(page.locator('.experience-card')).toHaveCount(2)
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before - 100)
  await page.getByLabel('搜索场馆、街区或手艺').fill('找不到的文化地点')
  await page.getByRole('button', { name: '寻找体验' }).click()
  await expect(page.getByRole('heading', { name: '这次没有找到合适的体验' })).toBeVisible()
  await page.getByRole('button', { name: '查看全部体验', exact: true }).click()
  await expect(page.locator('.experience-card')).toHaveCount(6)
})
test('visitor collects a place, reloads, exports and opens a shared collection', async ({
  page,
}) => {
  await page.goto('/experience/2')
  await expect(page.getByRole('heading', { level: 1, name: '高崖上的土陶人家' })).toBeVisible()
  await page.getByRole('button', { name: '加入文化清单' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: '已加入文化清单' })).toBeVisible()
  await page.getByRole('link', { name: /^我的清单/ }).click()
  await expect(page.locator('.experience-card')).toHaveCount(1)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '下载文字清单' }).click()
  const content = await readFile(await (await download).path(), 'utf8')
  expect(content).toContain('高崖上的土陶人家')
  expect(content).toContain('确认')
  expect(content).toContain('https://')
  await page.goto('/collection?places=2,3,999')
  await expect(page.getByRole('heading', { name: '朋友分享的文化清单' })).toBeVisible()
  await expect(page.locator('.experience-card')).toHaveCount(2)
  await page.getByRole('button', { name: '收藏这份清单' }).click()
  await page.goto('/collection')
  await expect(page.locator('.experience-card')).toHaveCount(2)
})
test('place details expose sources, and county travel is explicitly separate', async ({ page }) => {
  await page.goto('/experience/3')
  await expect(page.getByText('喀什市天山西路28号', { exact: true })).toBeVisible()
  await page.locator('.source-disclosure summary').click()
  await expect(page.locator('.source-disclosure').getByRole('link')).toHaveCount(2)
  await page.goto('/experience/9')
  await expect(page.locator('.county-advice')).toContainText('单独安排交通')
  await page.goto('/experiences?area=county')
  await expect(page.locator('.experience-card')).toHaveCount(1)
  await expect(page.locator('.experience-card')).toContainText('英吉沙土陶村')
  await page.goto('/experiences')
  await expect(page.locator('.culture-event-list')).toContainText('往期活动')
  await expect(page.locator('.event-date-notice')).toContainText('没有核实仍在进行')
})
test('core culture pages fit mobile, have named controls and pass selected accessibility rules', async ({
  page,
}) => {
  for (const url of ['/', '/experience/2', '/collection', '/culture']) {
    await page.goto(url)
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(
      await page
        .locator('main')
        .evaluate((el) => el.getBoundingClientRect().right <= innerWidth + 1),
    ).toBe(true)
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(result.violations).toEqual([])
  }
})
