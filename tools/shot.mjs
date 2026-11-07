// usage: node tools/shot.mjs <url-path> <out-name> [setupJson]
import { chromium } from 'playwright'
const [,, path = '/', name = 'shot', setup = '{}'] = process.argv
const cfg = JSON.parse(setup)
const OUT = process.env.SHOT_DIR
const sizes = cfg.sizes ?? [[390, 844, 'phone'], [1440, 900, 'desk']]
const browser = await chromium.launch()
for (const [w, h, tag] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 600 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
  await page.addInitScript((state) => { if (state) localStorage.setItem('money-mohalla-v1', JSON.stringify(state)) }, cfg.state ?? null)
  await page.goto('http://localhost:5173/' + path.replace(/^\/+/, ''), { waitUntil: 'networkidle' })
  await page.waitForTimeout(cfg.wait ?? 1200)
  for (const a of cfg.actions ?? []) {
    if (a.click) await page.click(a.click)
    if (a.tap) await page.mouse.click(a.tap[0], a.tap[1])
    if (a.key) await page.keyboard.press(a.key)
    if (a.hold) { await page.keyboard.down(a.hold[0]); await page.waitForTimeout(a.hold[1]); await page.keyboard.up(a.hold[0]) }
    if (a.hover) await page.hover(a.hover)
    if (a.focus) await page.focus(a.focus)
    if (a.eval) await page.evaluate(a.eval)
    if (a.wait) await page.waitForTimeout(a.wait)
    if (a.shot) await page.screenshot({ path: `${OUT}/${a.shot}-${tag}.png` })
    if (a.text) await page.getByText(a.text, { exact: false }).first().click()
    if (a.btn) await page.getByRole('button', { name: new RegExp(a.btn) }).first().click()
  }
  await page.screenshot({ path: `${OUT}/${name}-${tag}.png` })
  await ctx.close()
}
await browser.close()
