// Prints every zone of every case with its role (clue + tactic, herring, context, ordinary) so a human can audit them.
//   node --experimental-strip-types --no-warnings tools/p4-audit.mjs [CASE_ID]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexCase, normalizeCase, zoneTextKey } from '../src/pillar4/engine/case.ts'
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const en = Object.assign({}, ...fs.readdirSync(path.join(dir, 'strings/en')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, 'strings/en', f), 'utf8'))))
const only = process.argv[2]
for (const f of fs.readdirSync(path.join(dir, 'cases'))) {
  const def = normalizeCase(JSON.parse(fs.readFileSync(path.join(dir, 'cases', f), 'utf8')))
  if (only && def.id !== only) continue
  const idx = indexCase(def)
  console.log(`\n===== ${def.id} =====`)
  for (const item of def.items) for (const z of item.zones) {
    const c = idx.zoneClue.get(z.id)
    const tag = c ? `CLUE ${c.id} [${c.reason}] S${c.step}` : (z.role ?? 'ordinary').toUpperCase()
    console.log(`${tag.padEnd(26)} ${z.id.padEnd(18)} ${(en[zoneTextKey(z)] ?? '').replace(/\n/g, ' / ').slice(0, 95)}`)
  }
}
