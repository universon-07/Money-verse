import { describe, expect, it } from 'vitest'
import { freshProgress } from '../../progress/state'
import type { ProgressState } from '../../progress/types'
import { buildSummaryView } from './view'
import { SHARE_H, SHARE_W, shareCardLayout } from './share'

const done = (brightness: 'bright' | 'dim' | 'flicker'): ProgressState => {
  const s = freshProgress(1000, 5000)
  for (const id of ['plan', 'save', 'invest', 'safe'] as const) s.pillars[id] = { ...s.pillars[id], status: 'complete', partial: 1, bestQuality: 1, attempts: 1, brightness }
  return s
}
const labels = { title: 'T', goal: 'G', pillars: {}, skills: {}, closing: 'C' }

describe('summary view', () => {
  it('is not complete on a fresh game and says keep going', () => {
    const v = buildSummaryView(freshProgress(1000, 5000))
    expect(v.complete).toBe(false)
    expect(v.closingKey).toBe('summary.closing.keepGoing')
    expect(v.skills).toEqual([])
  })
  it('all bright gives the all-bright closing and nothing to brighten', () => {
    const v = buildSummaryView(done('bright'))
    expect(v.complete).toBe(true)
    expect(v.toBrighten).toEqual([])
    expect(v.closingKey).toBe('summary.closing.allBright')
  })
  it('dim pillars are listed and change the closing line', () => {
    const v = buildSummaryView(done('dim'))
    expect(v.toBrighten).toHaveLength(4)
    expect(v.closingKey).toBe('summary.closing.someDim')
  })
  it('lists only practised skills', () => {
    const s = freshProgress(0, 1000)
    s.skills.saving = 3
    expect(buildSummaryView(s).skills.map((k) => k.id)).toEqual(['saving'])
  })
  it('carries the balance view', () => {
    expect(buildSummaryView(freshProgress(0, 1000)).balance.tone).toBe('none')
  })
})

describe('shareCardLayout', () => {
  it('starts with a full-size background', () => {
    expect(shareCardLayout(buildSummaryView(done('bright')), labels)[0]).toMatchObject({ op: 'rect', w: SHARE_W, h: SHARE_H })
  })
  it('fills the goal bar in proportion', () => {
    const ops = shareCardLayout(buildSummaryView(freshProgress(0, 1000)), labels)
    expect(ops[3]).toMatchObject({ op: 'rect', w: 0 })
  })
  it('keeps every op inside the canvas', () => {
    for (const o of shareCardLayout(buildSummaryView(done('bright')), labels)) {
      expect(o.x).toBeGreaterThanOrEqual(0)
      expect(o.y).toBeGreaterThanOrEqual(0)
      expect(o.y).toBeLessThanOrEqual(SHARE_H)
    }
  })
})
