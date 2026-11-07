// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHub, usePillarIntro } from './hooks'
import { useCoachTips } from './coach'
import { useGame } from '../../store/game'
import { player } from '../../test/factories'

// Optional mock for useNavigate if react-router triggers error inside hook
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

describe('Hub view models', () => {
  beforeEach(() => {
    useGame.setState(player())
  })

  it('useHub returns correctly ordered pillars', () => {
    const { result } = renderHook(() => useHub())
    expect(result.current.pillars.length).toBe(4)
    expect(result.current.pillars[0].id).toBe('plan')
    expect(result.current.pillars[0].state).toBe('notStarted')
  })

  it('usePillarIntro returns details for specific pillar', () => {
    const { result } = renderHook(() => usePillarIntro('plan'))
    expect(result.current.teachesKey).toBe('hub.plan.teaches')
    expect(result.current.primaryCtaKey).toBe('hub.cta.start')
    expect(result.current.secondaryCtaKey).toBeUndefined()
  })

  it('useCoachTips manages seen state', () => {
    const { result } = renderHook(() => useCoachTips())
    expect(result.current.tips.length).toBe(4)

    act(() => result.current.dismiss('goal'))
    expect(result.current.tips.length).toBe(3)
    
    act(() => result.current.dismissAll())
    expect(result.current.tips.length).toBe(0)
  })
})
