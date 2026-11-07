// Measures how much of the screen the phone uses at several device sizes and checks for horizontal overflow.
//   node tools/p4-responsive.mjs [outPrefix]
import { chromium } from 'playwright'
const out = process.argv[2]
const sizes = [[360, 640], [360, 740], [390, 844], [412, 915], [768, 1024], [1280, 800]]
const b = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
let bad = 0
for (const [w, h] of sizes) {
  const page = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, serviceWorkers: 'block' })).newPage()
  await page.addInitScript(() => {
    localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', gender: 'girl', storySeen: true, completedPillars: [], liteMode: true }, version: 0 }))
    localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'male', level: 'confident', nickname: '', installId: 't', classCode: null, introSeen: true }, completed: ['TUT', 'C1', 'C2'] }, version: 1 }))
  })
  await page.goto((process.env.URL ?? 'http://localhost:5173') + '/play/safe', { waitUntil: 'networkidle' })
  const screens = {}
  const overflow = async (name) => {
    const o = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.p4-root *')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 2 && !e.closest('[style*="overflow"], .overflow-x-auto, .overflow-y-auto, .os-grid') && getComputedStyle(e).position !== 'fixed' && !e.closest('.sr-only') })
    )
    if (o) { bad++; console.log(`  OVERFLOW at ${w}x${h} on ${name}`) }
  }
  await overflow('map')
  await page.locator('[data-case="C3"]').click()
  await page.getByRole('button', { name: 'Open the device' }).click()
  const frame = await page.locator('.os-frame').boundingBox()
  console.log(`${w}x${h}: phone ${Math.round(frame.width)}x${Math.round(frame.height)} = ${Math.round((frame.width * frame.height) / (w * h) * 100)}% of the screen`)
  if (out) await page.screenshot({ path: `${out}-${w}x${h}.png` })
  await overflow('device')
  await page.locator('[data-app="paynow"]').click()
  await overflow('paynow')
  await page.close()
}
await b.close()
process.exit(bad ? 1 : 0)
