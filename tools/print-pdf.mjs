// node tools/print-pdf.mjs <input.html> <output.pdf> <running header title>
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
const [, , input, output, title = ''] = process.argv
const b = await chromium.launch()
const p = await b.newPage()
await p.goto(pathToFileURL(input).href, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
await p.pdf({
  path: output, format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:7pt;color:#8a8478;width:100%;padding-left:16mm;font-family:sans-serif">${title}</div>`,
  footerTemplate: `<div style="font-size:7pt;color:#8a8478;width:100%;text-align:right;padding-right:16mm;font-family:sans-serif">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
})
await b.close()
