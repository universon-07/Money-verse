// Opens each pillar's play page with the real games and reports console errors and the visible text. Needs the dev server on :5173.
import { chromium } from 'playwright'
const b = await chromium.launch()
for (const id of ['plan', 'save', 'invest', 'safe']) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.addInitScript(() => sessionStorage.setItem('mm-entered', '1')) // skip the home screen
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)))
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
  await p.goto('http://localhost:5173/?dev=1&real=1')
  await p.evaluate(() => { const k = 'money-mohalla-v2'; const s = JSON.parse(localStorage.getItem(k) || '{"state":{},"version":2}'); s.state = { ...s.state, storySeen: true, persona: s.state.persona || 'college' }; localStorage.setItem(k, JSON.stringify(s)) })
  await p.goto(`http://localhost:5173/play/${id}?dev=1&real=1`)
  await p.waitForTimeout(1500)
  await p.getByRole('button', { name: /^Play$/ }).first().click()
  await p.waitForTimeout(3000)
  const text = (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 200)
  console.log(id, '| errors:', errs.length ? errs : 'none', '|', text)
  await p.close()
}
await b.close()
