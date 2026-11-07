import { C } from '../art/palette'

export type PillarId = 'plan' | 'save' | 'invest' | 'safe'
export type PersonaId = 'school' | 'college' | 'earner'
export type Lang = 'en' | 'hi' | 'te'
export type Avatar = 'male' | 'female'
export type Festival = 'diwali' | 'eid' | 'bonalu' | 'sankranti' | 'christmas'
export type ShieldPiece = 'protect' | 'verify' | 'pause'

export const PILLAR_IDS: PillarId[] = ['plan', 'save', 'invest', 'safe']
export const FESTIVALS: Festival[] = ['diwali', 'eid', 'bonalu', 'sankranti', 'christmas']
export const SHIELD_PIECES: ShieldPiece[] = ['protect', 'verify', 'pause']

// defaults until the player chooses in the story (Case Files needs an avatar, Festival Countdown needs a festival)
export const DEFAULT_AVATAR: Avatar = 'female'
export const DEFAULT_FESTIVAL: Festival = 'diwali'

export const PILLARS: { id: PillarId; n: number; color: string; lampIndex: number }[] = [
  { id: 'plan', n: 1, color: C.pink, lampIndex: 0 },
  { id: 'save', n: 2, color: C.sky, lampIndex: 1 },
  { id: 'invest', n: 3, color: C.gold, lampIndex: 2 },
  { id: 'safe', n: 4, color: C.coral, lampIndex: 3 },
]

// Illustrative numbers only. The UI says so on screen.
export const PERSONAS: Record<PersonaId, { start: number; goal: number; face: string }> = {
  school: { start: 1500, goal: 12000, face: 'cheer' },
  college: { start: 4000, goal: 30000, face: 'soft' },
  earner: { start: 6000, goal: 45000, face: 'calm' },
}

export const SKILLS = ['planning', 'prioritising', 'saving', 'riskSense', 'patience', 'scamSense'] as const
export type Skill = (typeof SKILLS)[number]

export const LANGS: Lang[] = ['en', 'hi', 'te']

export const inr = (n: number, lang: Lang = 'en') =>
  '₹' + Math.round(n).toLocaleString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'te-IN')