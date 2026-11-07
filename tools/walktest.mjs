import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.addInitScript(() => localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: null }, version: 0 })))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const pos = () => p.evaluate(() => { const m = document.querySelector('img[src*="/art/avatar/"]:not([src*="face"])').parentElement.parentElement.parentElement.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/); return [Math.round(+m[1] + 75), Math.round(+m[2] + 190)] })
const pct = ([x, y]) => `${(x / 24).toFixed(0)}%, ${(y / 20.4).toFixed(0)}%`
console.log('start', pct(await pos()))
// click-to-walk to every place, check she arrives and a card opens
for (const n of ['Plan', 'Understand', 'Stay', 'Save', 'College']) {
  await p.evaluate((n) => document.querySelector(`button[aria-label^='${n}']`).click(), n)
  await p.waitForTimeout(9000)
  console.log(n, '->', pct(await pos()), (await p.getByRole('dialog').count()) ? 'card' : 'NO CARD')
  if (await p.getByRole('button', { name: /^Back$/ }).count()) await p.getByRole('button', { name: /^Back$/ }).click()
}
// free movement up through the Charminar arches
await p.evaluate(() => document.querySelector("button[aria-label^='Understand']").click()); await p.waitForTimeout(9000)
await p.getByRole('button', { name: /^Back$/ }).click().catch(() => {})
for (const [k, ms] of [['ArrowRight', 2500], ['ArrowUp', 2500], ['ArrowUp', 2500]]) { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); console.log(k, '->', pct(await pos())) }
await b.close()
