// Isolated Chrome contexts: does not touch the user's browser/profile or storage.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
const fixture = JSON.parse(readFileSync(new URL('./fixtures/matrix-flight.json', import.meta.url), 'utf8'))
const url = process.env.FLIGHTS_TEST_URL ?? 'http://127.0.0.1:4187/#/tools/flights'
const browser = await chromium.launch({ headless: true, executablePath: existsSync(chromium.executablePath()) ? chromium.executablePath() : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const settings = { from: 'PVG', to: 'NRT, KIX', start: '2026-11-10', end: '2026-11-11', minDelay: 0, maxDelay: 0, autoRefresh: false }
const settingsKey = 'aoinatsu:flights:settings:v1', cacheKey = 'aoinatsu:flights:cache:v1'
try {
  if (process.env.FLIGHTS_LIVE === '1') {
    const context = await browser.newContext(), page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    await page.getByLabel('出发城市 / 机场').fill('PVG')
    await page.getByLabel('目的城市 / 机场').fill('NRT')
    await page.getByLabel('开始日期').fill('2026-11-10')
    await page.getByLabel('结束日期').fill('2026-11-10')
    await page.getByLabel('重新打开时自动刷新上次的查询').uncheck()
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByText('扫描完成：1 项成功，0 项失败。', { exact: true }).waitFor({ timeout: 100000 })
    const cache = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), cacheKey)
    const result = cache['2026-11-10:PVG:NRT']
    assert(result && result.price > 0, JSON.stringify(cache))
    assert.deepEqual(errors, [])
    console.log('LIVE browser fetch + cache passed:', JSON.stringify(result))
    await page.reload()
    await page.getByText('本地缓存', { exact: true }).first().waitFor()
    assert((await page.locator('.price-detail').innerText()).includes(result.price.toLocaleString('zh-CN')), 'formatted cached price should survive reload')
    await page.screenshot({ path: '/tmp/flight-feasibility/flights-live-desktop.png', fullPage: true })
    await page.setViewportSize({ width: 375, height: 900 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow')
    await page.screenshot({ path: '/tmp/flight-feasibility/flights-live-mobile.png', fullPage: true })
    await context.close()
  } else {
    const context = await browser.newContext(), page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: settingsKey, value: settings })
    await page.reload()
    let calls = [], mode = 'success'
    await page.route('https://content-alkalimatrix-pa.googleapis.com/**', async route => {
      const body = route.request().postData()
      const payload = JSON.parse(body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1))
      calls.push(payload.inputs.slices[0])
      if (mode === 'wait') { await new Promise(resolve => setTimeout(resolve, 1000)) }
      const reply = mode === 'error' ? { error: { message: '测试：刷新失败' } }
        : payload.inputs.slices[0].destinations[0] === 'KIX' ? { solutionList: { solutions: [], minPrice: '' } } : fixture
      try { await route.fulfill({ status: 200, contentType: 'multipart/mixed', body: `--test\r\n\r\n${JSON.stringify(reply)}\r\n--test--` }) } catch {}
    })
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByText('扫描完成：4 项成功，0 项失败。', { exact: true }).waitFor()
    assert.equal(calls.length, 4)
    assert.deepEqual(calls.map(call => `${call.date}:${call.origins[0]}:${call.destinations[0]}`), ['2026-11-10:PVG:NRT', '2026-11-10:PVG:KIX', '2026-11-11:PVG:NRT', '2026-11-11:PVG:KIX'])
    assert.equal(await page.locator('.result-row').count(), 4)
    assert.equal(await page.getByText('无报价', { exact: true }).count(), 2)
    const cacheBefore = await page.evaluate(key => localStorage.getItem(key), cacheKey)
    assert.equal(Object.keys(JSON.parse(cacheBefore)).length, 4)
    await page.reload()
    await page.getByText('本地缓存', { exact: true }).first().waitFor()
    assert.equal(calls.length, 4, 'auto-refresh disabled should not request on reopen')
    mode = 'error'
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByText('扫描完成：0 项成功，4 项失败。', { exact: true }).waitFor()
    assert.equal(await page.evaluate(key => localStorage.getItem(key), cacheKey), cacheBefore, 'failure must retain previous successful cache')
    assert.equal(await page.getByText('刷新失败', { exact: true }).count(), 4)
    mode = 'wait'
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByRole('button', { name: '停止', exact: true }).click()
    await page.getByText('已停止，已完成的结果已保存。', { exact: true }).waitFor()
    mode = 'success'
    await page.getByLabel('重新打开时自动刷新上次的查询').check()
    await page.reload()
    await page.getByText('扫描完成：4 项成功，0 项失败。', { exact: true }).waitFor()
    await page.getByLabel('重新打开时自动刷新上次的查询').uncheck()
    await page.getByLabel('目的城市 / 机场').fill('不存在的城市')
    await page.getByRole('alert').waitFor()
    assert(await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).isDisabled())
    await page.getByLabel('目的城市 / 机场').fill('东京, 大阪')
    await page.getByLabel('出发城市 / 机场').fill('上海')
    assert.match(await page.locator('.actions').innerText(), /4 个日期与城市组合/)
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`)
    }
    assert.deepEqual(errors, [])
    console.log('PASS: task combinations, scan progress, empty quotes, persistence, failure retention, stop, reopen refresh, Chinese aliases, mobile layout.')
    await context.close()
  }
} finally { await browser.close() }
