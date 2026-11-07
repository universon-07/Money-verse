import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.addInitScript(() => !sessionStorage.getItem('seeded') && (sessionStorage.setItem('seeded', '1'), localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: null }, version: 0 }))))
const pos = () => p.evaluate(() => { const m = document.querySelector('img[src*="/art/avatar/"]').parentElement.parentElement.parentElement.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/); return [Math.round((+m[1] + 75) / 24), Math.round((+m[2] + 190) / 20.4)] })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
// CLOSED: walk to the gate, then keep pushing up
await p.evaluate(() => document.querySelector("button[aria-label='College gate']").click()); await p.waitForTimeout(9000)
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(3000); await p.keyboard.up('ArrowUp')
const closed = await pos(); console.log('closed gate: stopped at', closed, closed[1] >= 12 ? 'OK (blocked)' : 'WALKED THROUGH'); console.log('url', p.url().slice(-10))
// OPEN
for (const id of ['plan', 'save', 'invest', 'safe']) { await p.goto(`http://localhost:5173/play/${id}`, { waitUntil: 'networkidle' }); await p.getByRole('button', { name: /Mark as complete/ }).click() }
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
console.log('far from gate, all done:', await (async () => p.evaluate(() => [...document.querySelectorAll('img[src*="gate-"]')].map((i) => i.src.split('/').pop() + '=' + getComputedStyle(i).opacity).join(' ')))())
await p.evaluate(() => document.querySelector("button[aria-label='College gate']").click()); await p.waitForTimeout(9000)
const op = () => p.evaluate(() => [...document.querySelectorAll('img[src*="gate-"]')].map((i) => i.src.split('/').pop() + '=' + getComputedStyle(i).opacity).join(' '))
console.log('at gate (circle shown):', await op())
await p.getByRole('button', { name: /^Back$/ }).click().catch(() => {})
await p.keyboard.down('ArrowUp'); await p.waitForTimeout(3000); await p.keyboard.up('ArrowUp')
await p.waitForTimeout(800)
console.log('open gate: url', p.url().slice(-10), p.url().includes('dashboard') ? 'OK (went through)' : 'DID NOT OPEN')
await b.close()
