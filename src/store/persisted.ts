import {
  DEFAULT_AVATAR,
  DEFAULT_FESTIVAL,
  FESTIVALS,
  LANGS,
  PERSONAS,
  type Avatar,
  type Festival,
  type Lang,
  type PersonaId,
} from '../content/data'
import { migrateLegacyState, type LegacyState } from '../progress/migrate'
import { sanitizeProgress } from '../progress/state'
import type { ProgressState } from '../progress/types'
import { newInstallId } from './ids'

export type Gender = 'girl' | 'boy'
export const toGender = (a: Avatar): Gender => (a === 'male' ? 'boy' : 'girl')
export const toAvatar = (g: Gender): Avatar => (g === 'boy' ? 'male' : 'female')

export const STORE_KEY = 'money-mohalla-v2'
/** the key the game used before the progress model existed; read once for migration, never written again */
export const LEGACY_STORE_KEY = 'money-mohalla-v1'
export const STORE_VERSION = 2

export interface Settings {
  language: Lang
  persona: PersonaId | null
  storySeen: boolean
  celebrated: boolean
  /** null = automatic (decided from device + reduced-motion) */
  liteMode: boolean | null
  /** the one-time "your Happy Index is getting low" tip has been shown */
  happyToastSeen: boolean
  /** record of which coach tips have been seen */
  coachTipsSeen: Record<string, boolean>
}

export interface Identity {
  avatar: Avatar
  /** the island UI's name for the same choice: girl = female, boy = male. Always kept in step with avatar */
  gender: Gender
  festival: Festival
  /** random per install, created once, never linked to a person */
  installId: string
  /** optional NGO class code */
  classCode: string | null
  /** optional school roll number (digits only, up to 4), so a teacher can match progress to a student without a name */
  rollNo: string | null
}

/** everything that is saved to the device. Derived values (savedAmount, completedPillars) are NOT saved. */
export type PersistedData = Settings & Identity & ProgressState

const isLang = (v: unknown): v is Lang => typeof v === 'string' && (LANGS as string[]).includes(v)

/**
 * Repair whatever was saved into a complete, valid PersistedData. Anything missing or invalid falls back to a default,
 * so a partial or damaged save never crashes the app. Also upgrades a v1 state if it is handed one.
 */
export function normalizePersisted(raw: unknown, makeId: () => string = newInstallId): PersistedData {
  const p = (raw ?? {}) as Partial<PersistedData> & LegacyState
  const isLegacyShape = !p.pillars && (Array.isArray(p.completedPillars) || p.savedAmount !== undefined)
  const progress = isLegacyShape ? migrateLegacyState(p) : sanitizeProgress(p)
  return {
    language: isLang(p.language) ? p.language : 'en',
    persona: p.persona && PERSONAS[p.persona] ? p.persona : null,
    storySeen: p.storySeen === true,
    celebrated: p.celebrated === true,
    liteMode: typeof p.liteMode === 'boolean' ? p.liteMode : null,
    happyToastSeen: p.happyToastSeen === true,
    coachTipsSeen: p.coachTipsSeen && typeof p.coachTipsSeen === 'object' ? p.coachTipsSeen : {},
    ...(() => {
      const g = (p as { gender?: unknown }).gender
      const avatar: Avatar = p.avatar === 'male' || p.avatar === 'female' ? p.avatar : g === 'boy' ? 'male' : g === 'girl' ? 'female' : DEFAULT_AVATAR
      return { avatar, gender: toGender(avatar) }
    })(),
    festival: FESTIVALS.includes(p.festival as Festival) ? (p.festival as Festival) : DEFAULT_FESTIVAL,
    installId: typeof p.installId === 'string' && p.installId ? p.installId : makeId(),
    classCode: typeof p.classCode === 'string' && p.classCode ? p.classCode : null,
    rollNo: typeof p.rollNo === 'string' && /^\d{1,4}$/.test(p.rollNo) && Number(p.rollNo) > 0 ? p.rollNo : null,
    ...progress,
  }
}

/**
 * persist `migrate` hook. Saves from before version 2 have the old shape; normalizePersisted recognises and upgrades it,
 * and also repairs a current-version save, so one function covers every case.
 */
export const migratePersisted = (persisted: unknown, _version: number, makeId: () => string = newInstallId): PersistedData =>
  normalizePersisted(persisted, makeId)
