// node tools/p4-shot-small.mjs <prefix> [width] [height]: Case 1 home screen, an app and the case map on a small phone
import { chromium } from 'playwright'
const [,, out = 'small', w = '360', h = '740'] = process.argv
const b = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const page = await (await b.newContext({ viewport: { width: +w, height: +h }, hasTouch: true, serviceWorkers: 'block' })).newPage()
await page.addInitScript(() => {
  localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', gender: 'girl', storySeen: true, completedPillars: [], liteMode: true }, version: 0 }))
  localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'male', level: 'confident', nickname: '', installId: 't', classCode: null, introSeen: true }, completed: ['TUT', 'C1', 'C2'] }, version: 1 }))
})
await page.goto((process.env.URL ?? 'http://localhost:5173') + '/play/safe', { waitUntil: 'networkidle' })
await page.screenshot({ path: `${out}-map.png` })
await page.locator('[data-case="C3"]').click()
await page.getByRole('button', { name: 'Open the device' }).click()
await page.screenshot({ path: `${out}-home.png` })
await page.locator('[data-app="paynow"]').click()
await page.getByRole('tab', { name: 'History' }).click()
await page.screenshot({ path: `${out}-paynow.png` })
await b.close()
