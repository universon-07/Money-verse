// Flags ORDINARY zones whose text contains attack language, so mislabelled evidence is caught.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexCase, normalizeCase, zoneTextKey } from '../src/pillar4/engine/case.ts'
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const en = Object.assign({}, ...fs.readdirSync(path.join(dir, 'strings/en')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, 'strings/en', f), 'utf8'))))
const RX = /\b(otp|pin|password|code|deposit|fee|tax|urgent|hurry|quick(ly)?|expires?|cancel(l)?ed|do not tell|confidential|arrest|warrant|install|screen|safe account|selected|shortlisted|free|per day|guaranteed|limited|only \d+|seats|verify|verification|congratulations|reward|officer|inspector|official|blocked|switched off|deleted|unavailable|no longer)\b/i
let n = 0
for (const f of fs.readdirSync(path.join(dir, 'cases'))) {
  const def = normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, 'cases', f), 'utf8')))
  const idx = indexCase(def)
  for (const item of def.items) for (const z of item.zones) {
    if (idx.zoneClue.has(z.id) || (z.role ?? 'ordinary') !== 'ordinary') continue
    const txt = en[zoneTextKey(z)] ?? ''
    if (RX.test(txt)) { n++; console.log(`${def.id} ${z.id.padEnd(16)} ${txt.replace(/\n/g, ' / ').slice(0, 110)}`) }
  }
}
console.log(`${n} ordinary zones contain attack-like language`)
