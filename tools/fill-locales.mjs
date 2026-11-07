// Lists en keys missing in hi and te and fills them with the English text (so nothing renders as a raw key).
// Filled keys are appended to docs/TRANSLATION_REVIEW.md. Run: node tools/fill-locales.mjs
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'

const load = (l) => JSON.parse(readFileSync(`src/locales/${l}.json`, 'utf8'))
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]))
const put = (o, path, v) => {
  const parts = path.split('.')
  let cur = o
  parts.slice(0, -1).forEach((k) => { cur = cur[k] && typeof cur[k] === 'object' ? cur[k] : (cur[k] = {}) })
  cur[parts.at(-1)] = v
}

const en = load('en')
for (const l of ['hi', 'te']) {
  const d = load(l)
  const have = new Set(flat(d).map(([k]) => k))
  const missing = flat(en).filter(([k]) => !have.has(k))
  if (!missing.length) { console.log(`${l}: complete`); continue }
  missing.forEach(([k, v]) => put(d, k, v))
  writeFileSync(`src/locales/${l}.json`, JSON.stringify(d, null, 2) + '\n')
  appendFileSync('docs/TRANSLATION_REVIEW.md', `\n## ${l}: filled with English (translate these)\n${missing.map(([k]) => k).join(', ')}\n`)
  console.log(`${l}: filled ${missing.length}`, missing.map(([k]) => k).join(', '))
}
