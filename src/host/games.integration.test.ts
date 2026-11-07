import { describe, expect, it } from 'vitest'
import { reportOf, toGameResult } from '../games/showdown/engine/report'
import { presetLog } from '../games/showdown/state/presets'
import { ECON } from '../games/payrun/engine/content'
import { replaySeason } from '../games/payrun/engine/replay'
import { makeScript } from '../games/payrun/engine/script'
import { adaptFestival, adaptPayRun } from './adapters'

/** exactly what Festival Showdown hands to onComplete: the reference plans played to the report, through the game's own engine */
function festivalPayload(plan: 'A' | 'B') {
  const log = presetLog(plan, 'report')
  const r = reportOf(log)
  return { payload: toGameResult(r, 'K7M2', '', r.lessons.map((l) => l.id)), report: r }
}

describe('the real Festival Showdown, through its adapter', () => {
  it('Plan B clears the pillar and Plan A does not, exactly when the game lights its own minaret', () => {
    for (const plan of ['A', 'B'] as const) {
      const { payload } = festivalPayload(plan)
      const r = adaptFestival(payload)
      expect(r.pillar).toBe('plan')
      expect(r.cleared).toBe(payload.minaretLit)
      for (const n of [r.quality, r.partial]) expect(n >= 0 && n <= 1).toBe(true)
      if (!r.cleared) expect(r.partial).toBeLessThan(1)
    }
    expect(adaptFestival(festivalPayload('B').payload).cleared).toBe(true)
    expect(adaptFestival(festivalPayload('A').payload).cleared).toBe(false)
  })
  it('reads the score parts as skills, and quality is the 100-point total', () => {
    const r = adaptFestival(festivalPayload('B').payload)
    expect(Object.keys(r.skills).sort()).toEqual(['planning', 'prioritising', 'riskSense', 'scamSense'])
    expect(r.quality).toBeCloseTo(0.98, 2)
  })
  it('carries the game\'s own lessons through, and a quit before the report is a quit', () => {
    expect(adaptFestival(festivalPayload('A').payload).lessonsSeen.length).toBeGreaterThan(0)
    const quit = adaptFestival({ game: 'festival', progress: 0 })
    expect(quit.cleared).toBe(false)
    expect(quit.partial).toBe(0)
  })
})

describe('the real Pay Run, through the shell wrapper payload', () => {
  const fresh = replaySeason(makeScript('DEMO'), []).state
  const payload = (over: Record<string, unknown>) => ({ game: 'payrun', jar: fresh.jar, goal: ECON.goal, shifts: fresh.week, ...over })

  it('reaching the goal clears the pillar with a full jar', () => {
    const r = adaptPayRun(payload({ goalReached: true, jar: ECON.goal }))
    expect(r).toMatchObject({ pillar: 'save', cleared: true, quality: 1, partial: 1 })
  })
  it('leaving early is a quit, not a clear, and keeps partial progress below 1', () => {
    const r = adaptPayRun(payload({ goalReached: false, jar: Math.round(ECON.goal / 2) }))
    expect(r.cleared).toBe(false)
    expect(r.partial).toBeCloseTo(0.5, 1)
    expect(r.partial).toBeLessThan(1)
  })
  it('an empty jar on a brand-new season is zero progress', () => {
    const r = adaptPayRun(payload({ goalReached: false }))
    expect(r).toMatchObject({ cleared: false, quality: 0, partial: 0 })
  })
  it('a jar above the goal never gives a quality above 1', () => {
    expect(adaptPayRun(payload({ goalReached: true, jar: ECON.goal * 3 })).quality).toBe(1)
  })
})
