// Pillar 4 content validator (spec 11.12). Run with:  npm run p4:validate
//   --strict-te   treat missing Telugu strings as errors (default: warnings, English fallback is used)
//   --emit-te     write src/pillar4/content/strings/te/_template.json with every key (value "") for translators
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCase } from '../src/pillar4/engine/case.ts'
import { requiredKeys, validateCase } from '../src/pillar4/engine/validator.ts'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const readDir = (dir) =>
  Object.assign({}, ...fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))))

const en = readDir(path.join(root, 'strings/en'))
const te = readDir(path.join(root, 'strings/te'))
const strict = process.argv.includes('--strict-te')
const cases = fs.readdirSync(path.join(root, 'cases')).filter((f) => f.endsWith('.json'))

let errors = 0
let teMissing = 0
const template = {}
for (const f of cases) {
  const def = normalizeCase(JSON.parse(fs.readFileSync(path.join(root, 'cases', f), 'utf8')))
  const issues = validateCase(def, en, te, { strictTe: strict })
  for (const k of requiredKeys(def)) if (!te[k]) template[k] = ''
  for (const i of issues) {
    if (i.level === 'warn' && i.msg.startsWith('missing Telugu string')) { teMissing++; continue }
    if (i.level === 'error') errors++
    console.log(`${i.level === 'error' ? 'ERROR' : 'warn '} [${i.caseId}] ${i.msg}`)
  }
}
// shared interface and Chacha strings need Telugu too
const common = JSON.parse(fs.readFileSync(path.join(root, 'strings/en/common.json'), 'utf8'))
for (const k of Object.keys(common)) if (!te[k]) { template[k] = ''; teMissing++ }

if (process.argv.includes('--emit-te')) {
  fs.writeFileSync(path.join(root, 'strings/te/_template.json'), JSON.stringify(template, null, 2) + '\n')
  console.log(`wrote te/_template.json with ${Object.keys(template).length} keys`)
}
console.log(`p4:validate: ${cases.length} cases, ${errors} errors, ${teMissing} Telugu strings still to translate (English fallback)`)
process.exit(errors ? 1 : 0)
