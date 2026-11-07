// Smoke test of the core loop. Run with the dev server up: node tools/e2e.mjs
import { chromium } from 'playwright'
const OUT = process.env.SHOT_DIR
const browser = await chromium.launch()
const errors = []
const fail = (m) => { console.log('FAIL', m); process.exitCode = 1 }
const ok = (m) => console.log('ok  ', m)

for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desk']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600 })
  const page = await ctx.newPage()
  await page.addInitScript(() => sessionStorage.setItem('mm-entered', '1')) // skip the home screen
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('http://localhost:5173/?dev=1', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  page.url().endsWith('/story') ? ok(`${tag}: first visit -> /story`) : fail(`${tag}: no story redirect`)
  await page.getByText('College student').first().click()
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.getByRole('button', { name: /^Next/ }).click()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^Next/ }).click() // places, flags, stay happy
  await page.getByRole('button', { name: /Let's go/ }).click()
  await page.waitForTimeout(1200)
  page.url().endsWith('/') ? ok(`${tag}: story end -> island`) : fail(`${tag}: story did not finish`)
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v2')).state)
  st.storySeen && st.persona === 'college' && st.goalAmount === 30000 ? ok(`${tag}: persona + goal saved`) : fail(`${tag}: state`)
  // free movement: arrow keys move the hero (and collision stops it at the water)
  const hero = () => page.evaluate(() => document.querySelector('img[src*="/art/avatar/"]:not([src*="face"])').parentElement.parentElement.parentElement.style.transform)
  const h0 = await hero()
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight')
  const h1 = await hero()
  h0 !== h1 ? ok(`${tag}: arrow keys walk freely`) : fail(`${tag}: keys did not move the hero`)
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(3500); await page.keyboard.up('ArrowDown')
  const ph = await page.evaluate(() => { const m = document.querySelector('img[src*="/art/avatar/"]:not([src*="face"])').parentElement.parentElement.parentElement.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/); return [+m[1] + 70, +m[2] + 175] })
  ph[1] < 2040 * 0.9 && ph[0] > 0 && ph[0] < 2400 ? ok(`${tag}: collision keeps the hero on the island`) : fail(`${tag}: walked off the island`)
  if (w < 600) {
    const box = await page.locator('[role=application]').boundingBox()
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2
    const a = await hero()
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx - 40, cy - 10, { steps: 4 }); await page.waitForTimeout(700); await page.mouse.up()
    ;(await hero()) !== a ? ok(`${tag}: joystick moves the hero`) : fail(`${tag}: joystick`)
  }
  // tap a pillar: hero walks (A*), card appears, Enter goes in
  await page.evaluate(() => document.querySelector("button[aria-label^='Understand']").click())
  await page.waitForTimeout(6500)
  ;(await page.getByRole('dialog').count()) ? ok(`${tag}: token walked, card opened`) : fail(`${tag}: no card`)
  await page.getByRole('button', { name: /^(Enter|Play|Continue|Replay)/ }).click()
  await page.waitForTimeout(800)
  page.url().includes('/play/invest') ? ok(`${tag}: Enter -> pillar screen`) : fail(`${tag}: enter failed`)
  // the pillar screen is the game host: entry panel -> placeholder game -> result -> back to the island
  // the intro page is gone: the game starts by itself
  await page.getByTestId('placeholder-great').click()
  ;(await page.getByTestId('result-title').textContent()) === 'Cleared' ? ok(`${tag}: placeholder game cleared`) : fail(`${tag}: result`)
  await page.getByTestId('result-back').click()
  await page.waitForTimeout(1200)
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v2')).state)
  st2.pillars.invest.status === 'complete' && st2.pillars.invest.brightness === 'bright' ? ok(`${tag}: pillar complete and bright`) : fail(`${tag}: completion`)
  // locked gate message, then all four -> gate opens
  await page.evaluate(() => document.querySelector("button[aria-label='College gate']").click())
  await page.waitForTimeout(7000)
  ;(await page.getByText(/opens when all four/).count()) ? ok(`${tag}: gate locked until all four`) : fail(`${tag}: gate lock message`)
  // gear menu: language + lite
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'తె' }).click()
  ;(await page.evaluate(() => document.documentElement.lang)) === 'te' ? ok(`${tag}: language -> te`) : fail(`${tag}: lang`)
  await page.getByRole('menuitemcheckbox').click()
  ;(await page.evaluate(() => document.documentElement.dataset.lite)) === 'true' ? ok(`${tag}: lite mode on`) : fail(`${tag}: lite`)
  await page.screenshot({ path: `${OUT}/e2e-${tag}.png` })
  await ctx.close()
}
await browser.close()
errors.length ? (console.log('CONSOLE ERRORS:\n' + errors.join('\n')), (process.exitCode = 1)) : ok('no console/page errors')
