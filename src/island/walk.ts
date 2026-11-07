import EasyStar from 'easystarjs'
import raw from '../content/island.json'
import { WORLD } from './data'
import maskData from '../content/walkmask.json'

/**
 * How the hero moves (see MOVEMENT.md):
 *  - the island has a WALKABLE MASK built from the road network (edges with a half-width), a few open
 *    areas (plaza ring, landing, shop fronts) and BLOCKERS (the monument).
 *  - free movement: joystick / arrow keys / WASD step the hero, sliding along walls (axis-separated collision).
 *  - tap / drag: A* over the mask (EasyStar), then the hero follows the path.
 */
export const T = 24
export const COLS = Math.ceil(WORLD.w / T)
export const ROWS = Math.ceil(WORLD.h / T)

const wp = (id: string) => {
  const n = [...raw.nodes, ...raw.waypoints].find((q) => q.id === id)!
  return [(n.x / 100) * WORLD.w, (n.y / 100) * WORLD.h]
}
const dSeg = (px: number, py: number, a: number[], b: number[]) => {
  const vx = b[0] - a[0], vy = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy || 1)))
  return Math.hypot(px - (a[0] + t * vx), py - (a[1] + t * vy))
}
const roadR = (raw.roadHalfWidth / 100) * WORLD.w
const segs = (raw.edges as string[][]).map(([a, b]) => [wp(a), wp(b)])
const ell = (e: number[]) => ({ cx: (e[0] / 100) * WORLD.w, cy: (e[1] / 100) * WORLD.h, rx: (e[2] / 100) * WORLD.w, ry: (e[3] / 100) * WORLD.h })
const areas = raw.areas.map(ell)
const blockers = [...raw.blockers, ...raw.decor.filter((q) => q.solid).map((q) => [q.x, q.y - 0.4, q.solid![0], q.solid![1]])].map(ell)
const inEll = (x: number, y: number, e: { cx: number; cy: number; rx: number; ry: number }) => ((x - e.cx) / e.rx) ** 2 + ((y - e.cy) / e.ry) ** 2 <= 1

const MT = maskData.t
const painted = (x: number, y: number) => maskData.rows[Math.floor(y / MT)]?.[Math.floor(x / MT)] === '1'
/** walkable = anywhere the painting shows sand, stone or grass (tools/make_mask.py), plus the road network
 *  (bridges, stairs, dock) and open areas, minus a few small blockers. The Charminar itself is walkable. */
export const walkableAt = (x: number, y: number) => {
  if (x < 0 || y < 0 || x >= WORLD.w || y >= WORLD.h) return false
  if (blockers.some((b) => inEll(x, y, b))) return false
  return painted(x, y) || areas.some((a) => inEll(x, y, a)) || segs.some(([a, b]) => dSeg(x, y, a, b) <= roadR)
}

export const grid: number[][] = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (walkableAt(c * T + T / 2, r * T + T / 2) ? 0 : 1)))
// keep only the area connected to the dock, so stray painted speckles on rocks or islets are never walkable
{
  const dock = raw.nodes.find((n) => n.id === 'dock')!
  const sr = Math.floor(((dock.y / 100) * WORLD.h) / T), sc = Math.floor(((dock.x / 100) * WORLD.w) / T)
  const seen = new Set<number>([sr * COLS + sc])
  const q = [[sr, sc]]
  while (q.length) {
    const [r, c] = q.pop()!
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = r + dr, b = c + dc
      if (a < 0 || b < 0 || a >= ROWS || b >= COLS || grid[a][b] !== 0 || seen.has(a * COLS + b)) continue
      seen.add(a * COLS + b); q.push([a, b])
    }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] === 0 && !seen.has(r * COLS + c)) grid[r][c] = 1
}
const cellOpen = (x: number, y: number) => grid[Math.floor(y / T)]?.[Math.floor(x / T)] === 0
/** feet footprint test used for free movement */
export const canStand = (x: number, y: number) => cellOpen(x, y) && cellOpen(x - 14, y) && cellOpen(x + 14, y) && cellOpen(x, y - 8)

export const cellOf = (x: number, y: number) => ({ c: Math.max(0, Math.min(COLS - 1, Math.floor(x / T))), r: Math.max(0, Math.min(ROWS - 1, Math.floor(y / T))) })
export function nearestWalkable(x: number, y: number) {
  const s = cellOf(x, y)
  if (grid[s.r][s.c] === 0) return s
  const seen = new Set<number>([s.r * COLS + s.c])
  const q = [s]
  while (q.length) {
    const cur = q.shift()!
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = cur.c + dc, r = cur.r + dr
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS || seen.has(r * COLS + c)) continue
      seen.add(r * COLS + c)
      if (grid[r][c] === 0) return { c, r }
      q.push({ c, r })
    }
  }
  return s
}

const es = new EasyStar.js()
es.setGrid(grid)
es.setAcceptableTiles([0])
es.enableDiagonals()
es.disableCornerCutting()
es.enableSync()

export const pathTo = (sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] => {
  const s = nearestWalkable(sx, sy), e = nearestWalkable(tx, ty)
  let out: { x: number; y: number }[] = []
  es.findPath(s.c, s.r, e.c, e.r, (p) => { if (p) out = p.slice(1).map((n) => ({ x: n.x * T + T / 2, y: n.y * T + T / 2 })) })
  es.calculate()
  if (out.length && walkableAt(tx, ty)) out[out.length - 1] = { x: tx, y: ty }
  return out
}

/** The college gate is solid while closed. Opening it frees the doorway cells. */
const gateRect = { x0: (raw.gateBlock[0] / 100) * WORLD.w, y0: (raw.gateBlock[1] / 100) * WORLD.h, x1: (raw.gateBlock[2] / 100) * WORLD.w, y1: (raw.gateBlock[3] / 100) * WORLD.h }
const gateCells: [number, number][] = []
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = c * T + T / 2, y = r * T + T / 2; if (grid[r][c] === 0 && x >= gateRect.x0 && x <= gateRect.x1 && y >= gateRect.y0 && y <= gateRect.y1) gateCells.push([r, c]) }
export const setGateOpen = (open: boolean) => {
  for (const [r, c] of gateCells) grid[r][c] = open ? 0 : 1
  es.setGrid(grid)
}
export const gateEntry = { x: (raw.gateEntry[0] / 100) * WORLD.w, y: (raw.gateEntry[1] / 100) * WORLD.h, r: (raw.gateEntry[2] / 100) * WORLD.w }
