// Facilitator desk: demo class, every tab, and a real student -> facilitator round trip. Run with the dev server up: node tools/e2e-ngo.mjs
import { chromium } from 'playwright'
const SHOT = process.env.SHOT_DIR
const b = await chromium.launch()
const ok = (m) => console.log('ok  ', m)
const fail = (m) => { console.log('FAIL', m); process.exitCode = 1 }
const errors = []
for (const [tag, w, h] of [['phone', 390, 844], ['desk', 1280, 800]]) {
  const page = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600 })).newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  const tabBtn = (n) => (w >= 1024 ? page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: n }) : page.getByRole('tab', { name: n }))
  // a student plays a little and shares progress
  await page.goto('http://localhost:5173/'); await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() }); await page.goto('http://localhost:5173/'); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /^New game/ }).click()
  await page.getByLabel('Name this game').fill('Priya')
  await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: /^Start/ }).click()])
  await page.waitForTimeout(600)
  await page.getByText('College student').first().click()
  await page.getByRole('button', { name: /^Skip/ }).click(); await page.waitForTimeout(800)
  await page.waitForTimeout(4500)
  await page.getByRole('button', { name: 'Settings' }).first().click()
  await Promise.all([page.waitForNavigation(), page.getByRole('menuitem', { name: /Home/ }).click()]); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /^Load game/ }).click()
  await page.getByRole('button', { name: 'Share progress' }).click()
  const code = await page.locator('textarea[aria-label="Share my progress"]').inputValue()
  code.startsWith('MM1.') && !code.includes('Priya') ? ok(`${tag}: student share code made (${code.length} chars, no name)`) : fail(`${tag}: share code`)
  // facilitator side
  await page.goto('http://localhost:5173/ngo'); await page.waitForTimeout(800)
  ;(await page.getByText('Facilitator desk').count()) ? ok(`${tag}: /ngo opens without starting a game`) : fail(`${tag}: /ngo gate`)
  await page.getByRole('button', { name: 'Load demo class' }).first().click(); await page.waitForTimeout(500)
  ;(await page.getByText('The four places').count()) ? ok(`${tag}: demo overview`) : fail(`${tag}: overview`)
  for (const [tabName, probe] of [['Skills & mistakes', 'Mistake finder'], ['Next lesson', 'Next lesson planner'], ['Wellbeing', 'How the class is feeling'], ['Students', 'Students (anonymous)'], ['Report', 'Impact report'], ['Rollout', 'Classes and codes']]) {
    await tabBtn(tabName).click(); await page.waitForTimeout(250)
    ;(await page.getByText(probe).first().isVisible()) ? ok(`${tag}: ${tabName}`) : fail(`${tag}: ${tabName}`)
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.ngo-root *')].some((e) => e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('[role=tablist]')))
    over ? fail(`${tag}: ${tabName} overflows sideways`) : ok(`${tag}: ${tabName} fits the width`)
  }
  // create a class, import the student's code into it
  await page.getByPlaceholder(/Class name/).fill('Class 11 B')
  await page.getByRole('button', { name: 'Create class' }).click()
  await page.getByLabel('Progress codes').fill(`from Priya: ${code}`)
  await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300)
  ;(await page.getByText('1 added in Class 11 B').count()) && !(await page.getByText('UNASSIGNED').count()) ? ok(`${tag}: import put the student in the chosen class`) : fail(`${tag}: import went to the wrong class`)
  ;(await page.locator('li', { hasText: 'Class 11 B' }).getByText('1 students').count()) ? ok(`${tag}: the class shows 1 student`) : fail(`${tag}: class count`)
  await page.getByLabel('Progress codes').fill('hello there'); await page.getByRole('button', { name: 'Add', exact: true }).click()
  ;(await page.getByText('No progress codes found').count()) ? ok(`${tag}: text without a code explains itself`) : fail(`${tag}: no-code message`)
  await page.getByLabel('Progress codes').fill(code); await page.getByRole('button', { name: 'Add', exact: true }).click(); await page.waitForTimeout(300)
  ;(await page.getByText(/1 skipped/).count()) ? ok(`${tag}: same code twice is not double counted`) : fail(`${tag}: duplicate`)
  if (SHOT) { await tabBtn('Overview').click(); await page.screenshot({ path: `${SHOT}/ngo-${tag}.png` }) }
  await page.context().close()
}
errors.length ? fail('errors: ' + [...new Set(errors)].join(' | ')) : ok('no console or page errors')
await b.close()
