import { describe, expect, it } from 'vitest'
import { pickCoachTip } from './coach'

describe('pickCoachTip', () => {
  it('starts with the goal tip', () => expect(pickCoachTip({})?.id).toBe('goal'))
  it('skips tips already seen and keeps order', () => expect(pickCoachTip({ goal: true })?.id).toBe('happy'))
  it('returns null once all are seen', () => expect(pickCoachTip({ goal: true, happy: true, progress: true, hub: true })).toBeNull())
})
