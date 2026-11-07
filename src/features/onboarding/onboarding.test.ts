// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from './hooks'
import { useGame } from '../../store/game'

describe('useOnboarding', () => {
  beforeEach(() => {
    useGame.setState({ persona: null, storySeen: false, festival: 'diwali', avatar: 'female', gender: 'girl' })
  })

  it('progresses through steps', () => {
    const { result } = renderHook(() => useOnboarding())
    
    // Step 0: Welcome
    expect(result.current.currentStep.kind).toBe('welcome')
    expect(result.current.canNext).toBe(true)
    
    act(() => result.current.next())
    // Step 1: Problem
    expect(result.current.currentStep.kind).toBe('problem')
    
    act(() => result.current.next())
    // Step 2: Persona (requires choice)
    expect(result.current.currentStep.kind).toBe('persona')
    expect(result.current.canNext).toBe(false)
    
    // Choosing a persona allows next
    act(() => result.current.choices.setPersona('college'))
    expect(result.current.canNext).toBe(true)
    
    act(() => result.current.next())
    // Step 3: Festival (requires choice)
    expect(result.current.currentStep.kind).toBe('festival')
    
    act(() => result.current.choices.setFestival('diwali'))
    expect(result.current.canNext).toBe(true)
    
    act(() => result.current.next())
    
    act(() => result.current.choices.setAvatar('male'))
    expect(result.current.canNext).toBe(true)
    
    // Skip to end
    act(() => result.current.skip())
    expect(useGame.getState().storySeen).toBe(true)
    expect(useGame.getState().persona).toBe('college')
    expect(useGame.getState().festival).toBe('diwali')
    expect(useGame.getState().avatar).toBe('male')
  })

  it('finishing marks the story seen', () => {
    const { result } = renderHook(() => useOnboarding())
    // Mock skipping straight to end
    act(() => result.current.skip())
    expect(useGame.getState().storySeen).toBe(true)
    // Default fallback if skipped before choosing persona
    expect(useGame.getState().persona).toBe('school')
  })
})
