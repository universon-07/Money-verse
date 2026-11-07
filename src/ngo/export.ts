/** downloads made on the facilitator's device; nothing is sent anywhere */

export function downloadText(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v)
  // quote when needed, and stop spreadsheet formula injection from a class or label name
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
export const toCsvText = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\n')

/** a chart (an <svg>) as a PNG in the current theme, with a title line, at 2x for sharp slides */
export async function downloadSvgPng(svg: SVGSVGElement, name: string, title: string) {
  const box = svg.viewBox.baseVal
  const w = box?.width || svg.clientWidth
  const h = box?.height || svg.clientHeight
  const pad = 24
  const head = 34
  // charts use theme variables; an image cannot see the page's CSS, so copy each element's real colour onto the clone
  const clone = svg.cloneNode(true) as SVGSVGElement
  const src = [svg, ...svg.querySelectorAll('*')]
  const dst = [clone, ...clone.querySelectorAll('*')]
  src.forEach((el, k) => {
    const cs = getComputedStyle(el)
    for (const attr of ['fill', 'stroke'] as const) {
      if (dst[k].getAttribute(attr)?.includes('var(')) dst[k].setAttribute(attr, cs.getPropertyValue(attr))
    }
  })
  const root = getComputedStyle(svg)
  const bg = root.getPropertyValue('--card').trim() || '#ffffff'
  const ink = root.getPropertyValue('--ink').trim() || '#1F2430'
  const muted = root.getPropertyValue('--muted').trim() || '#6B6F7A'
  const inner = new XMLSerializer().serializeToString(clone).replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] as string)
  const W = w + pad * 2
  const H = h + pad * 2 + head
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Noto Sans, Segoe UI, system-ui, sans-serif">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="${pad}" y="${pad + 14}" font-size="16" font-weight="700" fill="${ink}">${esc(title)}</text>
    <text x="${W - pad}" y="${pad + 14}" font-size="11" fill="${muted}" text-anchor="end">Minar Insights · ${esc(new Date().toLocaleDateString())} · made-up in-game money</text>
    <g transform="translate(${pad} ${pad + head})"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg></g>
  </svg>`
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(doc)
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(2, 2)
  ctx.drawImage(img, 0, 0)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name.endsWith('.png') ? name : `${name}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
