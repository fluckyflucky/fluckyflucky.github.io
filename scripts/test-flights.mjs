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
    const liveParallel = process.env.FLIGHTS_LIVE_PARALLEL === '1', starts = [], finishes = []
    page.on('request', request => { if (request.url().includes('content-alkalimatrix-pa.googleapis.com')) starts.push(Date.now()) })
    page.on('response', response => { if (response.url().includes('content-alkalimatrix-pa.googleapis.com')) finishes.push(Date.now()) })
    await page.goto(url)
    await page.getByLabel('出发城市 / 机场').fill('PVG')
    await page.getByLabel('目的城市 / 机场').fill(liveParallel ? 'NRT, KIX' : 'NRT')
    await page.getByLabel('开始日期').fill('2026-11-10')
    await page.getByLabel('结束日期').fill('2026-11-10')
    if (liveParallel) {
      await page.locator('.advanced summary').click()
      await page.getByLabel('最短请求间隔（秒）').fill('1')
      await page.getByLabel('最长请求间隔（秒）').fill('1')
      await page.getByLabel('最多同时查询').fill('2')
    }
    await page.getByLabel('重新打开时自动刷新上次的查询').uncheck()
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByText(`扫描完成：${liveParallel ? 2 : 1} 项成功，0 项失败。`, { exact: true }).waitFor({ timeout: 100000 })
    const cache = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), cacheKey)
    const result = cache['2026-11-10:PVG:NRT']
    assert(result && result.price > 0, JSON.stringify(cache))
    assert.deepEqual(errors, [])
    console.log('LIVE browser fetch + cache passed:', JSON.stringify(result))
    if (liveParallel) {
      assert.equal(Object.keys(cache).length, 2)
      assert.equal(starts.length, 2)
      assert(starts[1] < finishes[0], 'second real request must start before first completes')
      console.log('LIVE parallel starts passed:', JSON.stringify({startIntervalMs: starts[1] - starts[0], firstResponseMs: finishes[0] - starts[0], prices: Object.values(cache).map(value => ({to: value.to, price: value.price}))}))
    }
    await page.reload()
    await page.getByText('本地缓存', { exact: true }).first().waitFor()
    assert((await page.locator('.result-list').innerText()).includes(result.price.toLocaleString('zh-CN')), 'formatted cached price should survive reload')
    await page.screenshot({ path: '/tmp/flight-feasibility/flights-live-desktop.png', fullPage: true, style: 'canvas { visibility: hidden !important; }' })
    await page.setViewportSize({ width: 375, height: 900 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile overflow')
    await page.screenshot({ path: '/tmp/flight-feasibility/flights-live-mobile.png', fullPage: true, style: 'canvas { visibility: hidden !important; }' })
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
    await page.getByLabel('筛选航线', { exact: true }).selectOption('PVG:NRT')
    assert.equal(await page.locator('.result-row').count(), 2)
    await page.getByLabel('预算上限（¥）').fill('1299')
    await page.locator('.empty-results').waitFor()
    assert.equal(await page.locator('.result-row').count(), 0)
    await page.getByRole('button', { name: '清除筛选', exact: true }).click()
    assert.equal(await page.locator('.result-row').count(), 4)
    await page.getByRole('button', { name: '查看这张票 ↓', exact: true }).click()
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'flight-2026-11-10:PVG:NRT')
    assert.match(await page.locator('.result-row').first().innerText(), /上海浦东 → 东京成田/)
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
    mode = 'success'
    await page.getByRole('button', { name: /继续未完成 \/ 重试失败/ }).click()
    await page.getByText('扫描完成：4 项成功，0 项失败。', { exact: true }).waitFor()
    assert.equal(calls.length, 12, 'retry should only dispatch failed entries')
    await page.getByLabel('只看有报价').check()
    assert.equal(await page.locator('.result-row').count(), 2)
    await page.getByLabel('只看有报价').uncheck()
    await page.getByLabel('排序', { exact: true }).selectOption('date')
    assert.match(await page.locator('.result-row').first().innerText(), /PVG → KIX/)
    mode = 'wait'
    await page.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await page.getByRole('button', { name: '停止', exact: true }).click()
    await page.getByText('已停止，已完成的结果已保存，可继续未完成项。', { exact: true }).waitFor()
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
    assert.equal(await page.locator('.advanced').getAttribute('open'), null, 'request settings should start collapsed')
    await page.locator('.city-shortcuts').nth(1).getByRole('button', { name: '东京', exact: true }).click()
    assert.equal(await page.getByLabel('目的城市 / 机场').inputValue(), '大阪')
    await page.locator('.city-shortcuts').nth(1).getByRole('button', { name: '东京', exact: true }).click()
    assert.equal(await page.locator('.city-shortcuts').nth(1).getByRole('button', { name: '东京', exact: true }).getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: '7 天', exact: true }).click()
    assert.equal(await page.getByLabel('结束日期').inputValue(), '2026-11-16')
    await page.getByLabel('开始日期').fill('2026-11-18')
    assert.equal(await page.getByLabel('结束日期').inputValue(), '2026-11-18', 'moving start after end should keep a valid date interval')
    await page.getByRole('button', { name: '交换出发 / 目的地', exact: true }).click()
    assert.equal(await page.getByLabel('目的城市 / 机场').inputValue(), '上海')
    await page.getByRole('button', { name: '交换出发 / 目的地', exact: true }).click()
    await page.getByLabel('开始日期').fill('2026-11-10')
    await page.getByLabel('结束日期').fill('2026-11-30')
    assert.equal(await page.locator('.result-row').count(), 30, 'long lists should initially show 30 rows')
    await page.getByRole('button', { name: /再显示 12 项/ }).click()
    assert.equal(await page.locator('.result-row').count(), 42)
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`)
    }
    assert.deepEqual(errors, [])
    console.log('PASS: city shortcuts, date presets/alignment, swap, route/budget filters, clear filters, best-price focus, pagination, collapsed settings.');
    console.log('PASS: task combinations, scan progress, empty quotes, persistence, failure retention, stop, reopen refresh, Chinese aliases, mobile layout.')
    await context.close()

    // Hold responses to prove dispatch spacing, overlap, capacity and cancellation.
    const parallelContext = await browser.newContext(), parallelPage = await parallelContext.newPage()
    parallelPage.on('pageerror', error => errors.push(error.message))
    await parallelPage.goto(url)
    await parallelPage.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: settingsKey, value: { ...settings, minDelay: 0.2, maxDelay: 0.2, concurrency: 2 },
    })
    await parallelPage.reload()
    const held = []
    await parallelPage.route('https://content-alkalimatrix-pa.googleapis.com/**', async route => {
      const body = route.request().postData()
      const payload = JSON.parse(body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1))
      let release
      const ready = new Promise(resolve => { release = resolve })
      const request = { time: Date.now(), task: payload.inputs.slices[0], release, price: 1300 }
      held.push(request)
      await ready
      const reply = structuredClone(fixture)
      reply.solutionList.minPrice = `CNY ${request.price}`
      try { await route.fulfill({ status: 200, contentType: 'multipart/mixed', body: `--test\r\n\r\n${JSON.stringify(reply)}\r\n--test--` }) } catch {}
    })
    async function dispatched(count) {
      for (let attempt = 0; held.length < count && attempt < 100; attempt++) await parallelPage.waitForTimeout(50)
      assert.equal(held.length, count)
    }
    await parallelPage.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await dispatched(2)
    assert(held[1].time - held[0].time >= 150, 'starts should respect the 200 ms interval')
    assert.equal(await parallelPage.locator('.querying').count(), 2, 'slow requests must overlap')
    await parallelPage.setViewportSize({ width: 375, height: 900 })
    await parallelPage.locator('.result-row').last().scrollIntoViewIfNeeded()
    assert.equal(await parallelPage.locator('.scan-summary').evaluate(el => getComputedStyle(el).position), 'sticky')
    const sticky = await parallelPage.locator('.scan-summary').boundingBox()
    assert(sticky.y >= 60 && sticky.y <= 80, `mobile status should remain below navigation: ${sticky.y}`)
    await parallelPage.screenshot({path:'/tmp/flight-feasibility/flights-v3-mobile-running.png', style:'canvas { visibility: hidden !important; }'})
    await parallelPage.waitForTimeout(350)
    assert.equal(held.length, 2, 'do not exceed two concurrent requests')
    held[1].release(); await dispatched(3)
    held[2].release(); await dispatched(4)
    assert(held[3].time - held[2].time >= 150, 'interval also applies when capacity opens')
    held[3].release(); held[0].price = 990; held[0].release()
    await parallelPage.getByText('扫描完成：4 项成功，0 项失败。', { exact: true }).waitFor()
    const parallelCache = await parallelPage.evaluate(key => JSON.parse(localStorage.getItem(key)), cacheKey)
    assert.equal(Object.keys(parallelCache).length, 4)
    assert.equal(parallelCache['2026-11-10:PVG:NRT'].price, 990, 'out-of-order response must belong to its own task')
    const stableCache = JSON.stringify(parallelCache)
    await parallelPage.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await dispatched(6)
    await parallelPage.getByRole('button', { name: '停止', exact: true }).click()
    await parallelPage.getByText('已停止，已完成的结果已保存，可继续未完成项。', { exact: true }).waitFor()
    held[4].price = 1; held[4].release(); held[5].release()
    await parallelPage.waitForTimeout(500)
    assert.equal(held.length, 6, 'stop must cancel queued dispatches')
    assert.equal(await parallelPage.evaluate(key => localStorage.getItem(key), cacheKey), stableCache, 'aborted responses must not overwrite cache')
    await parallelPage.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    await dispatched(8)
    held[6].release()
    await parallelPage.locator('.summary-line strong').filter({ hasText: '1 / 4' }).waitFor()
    await parallelPage.getByRole('button', { name: '停止', exact: true }).click()
    await parallelPage.getByText('已停止，已完成的结果已保存，可继续未完成项。', { exact: true }).waitFor()
    held[7].release()
    await parallelPage.getByRole('button', { name: /继续未完成 \/ 重试失败（3）/ }).click()
    await dispatched(10)
    held[8].release(); held[9].release()
    await dispatched(11)
    held[10].release()
    await parallelPage.getByText('扫描完成：4 项成功，0 项失败。', { exact: true }).waitFor()
    assert.equal(held.length, 11, 'resume must skip the completed task')
    await parallelPage.evaluate(() => scrollTo(0, 0))
    await parallelPage.screenshot({path:'/tmp/flight-feasibility/flights-v3-mobile.png', fullPage:true, style:'canvas { visibility: hidden !important; }'})
    await parallelPage.setViewportSize({ width: 1280, height: 900 })
    await parallelPage.evaluate(() => scrollTo(0, 0))
    await parallelPage.screenshot({path:'/tmp/flight-feasibility/flights-v3-desktop.png', fullPage:true, style:'canvas { visibility: hidden !important; }'})
    await parallelPage.locator('.advanced summary').click()
    await parallelPage.getByLabel('最多同时查询').fill('0')
    await parallelPage.locator('.advanced summary').click()
    await parallelPage.getByRole('button', { name: '扫描 / 刷新全部', exact: true }).click()
    assert.equal(await parallelPage.locator('.advanced').evaluate(el => el.open), true)
    assert.equal(held.length, 11, 'invalid settings must not start a scan')
    assert.deepEqual(errors, [])
    console.log('PASS: spaced overlapping starts, concurrency cap, out-of-order cache, abort with queued tasks, resume only unfinished, retry, filtering and sorting.')
    await parallelContext.close()
  }
} finally { await browser.close() }
