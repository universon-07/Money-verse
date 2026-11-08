// Validate the English-only Case Files content.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeCase } from '../src/pillar4/engine/case.ts'
import { validateCase } from '../src/pillar4/engine/validator.ts'
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pillar4/content')
const readDir = dir => Object.assign({}, ...fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_')).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))))
const en = readDir(path.join(root, 'strings/en'))
const cases = fs.readdirSync(path.join(root, 'cases')).filter(f => f.endsWith('.json'))
let errors = 0
for (const f of cases) {
  const def = normalizeCase(JSON.parse(fs.readFileSync(path.join(root, 'cases', f), 'utf8')))
  for (const issue of validateCase(def, en)) {
    if (issue.level === 'error') errors++
    console.log(`${issue.level} [${issue.caseId}] ${issue.msg}`)
  }
}
console.log(`p4:validate: ${cases.length} cases, ${errors} errors`)
process.exit(errors ? 1 : 0)
