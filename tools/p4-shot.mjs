// Screenshot helper: node tools/p4-shot.mjs <out.png> [width] [height]  (opens Case 1 with the first Messages thread)
import { chromium } from 'playwright'
const [,, out = 'p4.png', w = '1280', h = '800'] = process.argv
const b = await chromium.launch({ channel: process.env.BROWSER ?? 'msedge' })
const page = await (await b.newContext({ viewport: { width: +w, height: +h }, serviceWorkers: 'block' })).newPage()
await page.addInitScript(() => {
  localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'school', startAmount: 1500, goalAmount: 12000, savedAmount: 1500, completedPillars: [], storySeen: true, celebrated: false, liteMode: true }, version: 0 }))
  localStorage.setItem('p4.v1', JSON.stringify({ state: { profile: { avatar: 'male', level: 'confident', nickname: '', installId: 't', classCode: null, introSeen: true }, completed: ['TUT', 'C1', 'C2'] }, version: 1 }))
})
await page.goto((process.env.URL ?? 'http://localhost:5173') + '/play/safe', { waitUntil: 'networkidle' })
await page.locator('[data-case="C3"]').click()
await page.getByRole('button', { name: 'Open the device' }).click()
await page.locator('[data-app="chatup"]').click()
await page.getByRole('tab', { name: 'Calls' }).click()
await page.getByRole('button', { name: /call highlights/i }).click()
await page.screenshot({ path: out })
await b.close()
