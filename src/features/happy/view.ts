import { brightnessFor } from '../../happy/brightness'
import { HAPPY } from '../../happy/config'
import type { ProgressState } from '../../progress/types'

/** View-model for the Happy Index. Pure; any UI can draw it. */

export type HappyBand = 'glowing' | 'ok' | 'tired'

export interface HappyView {
  /** the Happy Index, HAPPY.min..HAPPY.max */
  value: number
  /** the value as a whole number, for display */
  valueRounded: number
  /** 0..100, for a bar or a face */
  percent: number
  band: HappyBand
  /** locale key for the band's text label (happy.band.*); a UI shows an icon AND this label */
  labelKey: string
  /** several game sessions in a row with no life moment: show a gentle "time for a break" note */
  needsBreak: boolean
  sessionsSinceBreak: number
}

const BAND: Record<'bright' | 'dim' | 'flicker', HappyBand> = { bright: 'glowing', dim: 'ok', flicker: 'tired' }

export function buildHappyView(state: Pick<ProgressState, 'happy' | 'sessionsSinceBreak'>): HappyView {
  const band = BAND[brightnessFor(state.happy)]
  const sessions = state.sessionsSinceBreak ?? 0
  return {
    value: state.happy,
    valueRounded: Math.round(state.happy),
    percent: Math.max(0, Math.min(100, Math.round(state.happy))),
    band,
    labelKey: `happy.band.${band}`,
    needsBreak: sessions >= HAPPY.tiredAfterSessions,
    sessionsSinceBreak: sessions,
  }
}

/** the one-time tip: shown the first time Happy is below the level where lamps shine fully, until it has been seen */
export function shouldShowHappyToast(state: Pick<ProgressState, 'happy'> & { happyToastSeen: boolean }): boolean {
  return !state.happyToastSeen && state.happy < HAPPY.thresholds.bright
}

/** the tip must never cover a game being played or the onboarding; everywhere else it may show */
const QUIET_BASES = ['/play', '/story', '/welcome']
export function isToastSuppressed(pathname: string): boolean {
  return QUIET_BASES.some((base) => pathname === base || pathname.startsWith(`${base}/`))
}
