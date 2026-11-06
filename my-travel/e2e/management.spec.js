import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function login(page) {
  await page.goto('/admin')
  await page.getByLabel('用户名', { exact: true }).fill('admin')
  await page.getByLabel('密码', { exact: true }).fill('acceptance-admin-pass-2026')
  await page.getByRole('button', { name: '登录工作台' }).click()
  await expect(page.getByRole('heading', { name: '工作概览', exact: true })).toBeVisible()
}

test('admin publishes a sourced article, visitors read it and it can be removed', async ({
  page,
}, info) => {
  const title = `验收文化资料-${info.project.name}`
  await login(page)
  await page.getByRole('button', { name: '文化资料', exact: true }).click()
  await page.getByRole('button', { name: '新建文化资料' }).click()
  await page.getByLabel('标题', { exact: true }).fill(title)
  await page.getByLabel('主题', { exact: true }).fill('文化阅读')
  await page.getByLabel('摘要', { exact: true }).fill('用于验证内容发布链路的测试条目')
  await page.getByLabel('正文', { exact: true }).fill('喀什古城公开资料介绍了铜器等传统手工艺。')
  await page.getByLabel('审核状态').selectOption('source-reviewed')
  await page.getByLabel('发布到游客网站').check()
  await page.getByRole('button', { name: '添加来源' }).click()
  await page.getByLabel('来源标题', { exact: true }).fill('喀什古城非遗介绍')
  await page
    .getByLabel('原文网址')
    .fill('https://www.kashi.gov.cn/ksdqxzgs/c106707/202201/8b6c53a56fd44dcf9ca7c00e9a77a25c.shtml')
  await page.getByRole('button', { name: '保存内容', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('内容已保存')
  await page.goto('/culture')
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await page.goto('/admin')
  await page.getByRole('button', { name: '文化资料', exact: true }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('row')
    .filter({ hasText: title })
    .getByRole('button', { name: '删除', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('记录已删除')
})

test('visitor opts in, saves a server itinerary, appears to admin and erases their data', async ({
  page,
}, info) => {
  const nickname = `自愿游客-${info.project.name}`
  await page.goto('/profile')
  await page.getByLabel('称呼或昵称').fill(nickname)
  await page.getByLabel('出发城市').fill('成都')
  await page.getByLabel('感兴趣的主题').fill('手工艺，建筑')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '自愿保存资料' }).click()
  await expect(page.getByRole('status')).toContainText('资料已保存')
  await page.goto('/routes?route=1')
  await page.getByRole('button', { name: '保存到服务端', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('已保存到服务端')
  await login(page)
  await page.getByRole('button', { name: '游客与行程', exact: true }).click()
  const row = page.getByRole('row').filter({ hasText: nickname })
  await expect(row).toContainText('南疆人文经典线')
  await page.goto('/profile')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '删除我的服务端资料与行程' }).click()
  await expect(page.getByRole('status')).toContainText('服务端资料与行程已删除')
  const response = await page.request.get('/api/visitor')
  expect((await response.json()).profile).toBeNull()
})

test('admin assistant uses sourced database content and core screens are accessible', async ({
  page,
}) => {
  await login(page)
  const overview = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(overview.violations).toEqual([])
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true)
  expect(
    await page
      .locator('.admin-main')
      .evaluate((el) => el.getBoundingClientRect().right <= window.innerWidth + 1),
  ).toBe(true)
  await page.getByRole('button', { name: 'AI 导览助手', exact: true }).click()
  await page.getByLabel('向助手提问').fill('铜器')
  await page.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(page.getByText('本地资料回复', { exact: true })).toBeVisible()
  await expect(page.locator('.admin-ai-reply')).toContainText('铜器')
  await page.goto('/culture')
  const culture = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(culture.violations).toEqual([])
})

test('site still renders when the localStorage getter itself throws', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    }),
  )
  await page.goto('/routes?route=1')
  await expect(page.getByRole('heading', { name: '南疆主题路线', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存行程', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('保存失败')
})
