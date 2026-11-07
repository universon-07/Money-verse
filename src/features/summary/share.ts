import { C } from '../../art/palette'
import type { SummaryView } from './view'

export const SHARE_W = 1080
export const SHARE_H = 1350

/** one drawing step for a 2D canvas; the layout is pure so it can be tested without a canvas */
export type DrawOp =
  | { op: 'rect'; x: number; y: number; w: number; h: number; fill: string }
  | { op: 'text'; x: number; y: number; text: string; size: number; weight: 400 | 700; fill: string; align: 'left' | 'center' }

const INK = C.ink
const CREAM = C.jasmine
const GOLD = C.mustard

/** `labels` carries the already-translated strings so this stays free of i18n */
export function shareCardLayout(view: SummaryView, labels: { title: string; goal: string; pillars: Record<string, string>; skills: Record<string, string>; closing: string }): DrawOp[] {
  const ops: DrawOp[] = [{ op: 'rect', x: 0, y: 0, w: SHARE_W, h: SHARE_H, fill: CREAM }]
  ops.push({ op: 'text', x: SHARE_W / 2, y: 140, text: labels.title, size: 72, weight: 700, fill: INK, align: 'center' })
  ops.push({ op: 'rect', x: 120, y: 220, w: 840, h: 48, fill: C.track })
  ops.push({ op: 'rect', x: 120, y: 220, w: Math.round((840 * Math.max(0, Math.min(100, view.goal.percent))) / 100), h: 48, fill: GOLD })
  ops.push({ op: 'text', x: SHARE_W / 2, y: 330, text: labels.goal, size: 40, weight: 700, fill: INK, align: 'center' })
  view.pillars.forEach((p, i) => {
    ops.push({ op: 'text', x: 120, y: 470 + i * 90, text: labels.pillars[p.id] ?? p.id, size: 44, weight: 700, fill: INK, align: 'left' })
  })
  view.skills.forEach((s, i) => {
    ops.push({ op: 'text', x: 120, y: 880 + i * 64, text: labels.skills[s.id] ?? s.id, size: 36, weight: 400, fill: INK, align: 'left' })
  })
  ops.push({ op: 'text', x: SHARE_W / 2, y: 1260, text: labels.closing, size: 38, weight: 700, fill: INK, align: 'center' })
  return ops
}

/** draws the ops on a canvas and returns a PNG data URL */
export function renderShareCard(ops: DrawOp[]): string {
  const c = document.createElement('canvas')
  c.width = SHARE_W
  c.height = SHARE_H
  const g = c.getContext('2d')!
  for (const o of ops) {
    g.fillStyle = o.fill
    if (o.op === 'rect') g.fillRect(o.x, o.y, o.w, o.h)
    else { g.font = `${o.weight} ${o.size}px sans-serif`; g.textAlign = o.align; g.fillText(o.text, o.x, o.y) }
  }
  return c.toDataURL('image/png')
}
