// Verifies the TypeScript tokens (src/art/palette.ts) and the CSS tokens (src/index.css) have not drifted apart,
// and that no hard-coded hex colours have crept back into shell files. Run: npm run check:tokens
import fs from 'node:fs'
import path from 'node:path'

const css = fs.readFileSync('src/index.css', 'utf8')
const pal = fs.readFileSync('src/art/palette.ts', 'utf8')
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
const block = pal.split('export const C = {')[1].split('} as const')[0]
const colours = [...block.matchAll(/^\s*([A-Za-z0-9]+):\s*'(#[0-9A-Fa-f]{6})'/gm)].map((m) => [m[1], m[2].toLowerCase()])
let bad = 0
for (const [name, hex] of colours) {
  const m = css.match(new RegExp(`--color-${kebab(name)}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) { console.log(`MISSING in index.css: --color-${kebab(name)}`); bad++ }
  else if (m[1].toLowerCase() !== hex) { console.log(`MISMATCH ${name}: palette.ts ${hex} vs index.css ${m[1]}`); bad++ }
}
const z = [...pal.split('export const Z = {')[1].split('} as const')[0].matchAll(/^\s*([a-z]+):\s*(\d+)/gm)]
for (const [, name, val] of z) {
  const m = css.match(new RegExp(`--z-${name}:\\s*(\\d+)`))
  if (!m || m[1] !== val) { console.log(`Z mismatch ${name}: palette.ts ${val} vs index.css ${m?.[1]}`); bad++ }
}

// no raw hex colours in shell files (art files keep their own painted/procedural colours)
// the island UI files from main keep their own painted-palette hex; only the shell's own folders are held to "no raw hex"
const SHELL = ['src/ui', 'src/host', 'src/features', 'src/happy', 'src/progress', 'src/store', 'src/lib']
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
for (const dir of SHELL) {
  for (const f of walk(dir).filter((p) => /\.(tsx?|css)$/.test(p))) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/#[0-9A-Fa-f]{3,8}\b/.test(line) && !/^\s*(\/\/|\*)/.test(line)) { console.log(`HEX in ${f}:${i + 1}: ${line.trim().slice(0, 100)}`); bad++ }
    })
  }
}
console.log(bad ? `FAIL: ${bad} problem(s)` : `ok: ${colours.length} colours and ${z.length} z-levels in sync, no raw hex in shell files`)
process.exit(bad ? 1 : 0)
