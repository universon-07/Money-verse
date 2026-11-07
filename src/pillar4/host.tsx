import { createContext, useContext } from 'react'

export type Lang = 'en' | 'te' | 'hi'

/**
 * Everything Pillar 4 needs from whatever app mounts it. This is the whole integration surface:
 * render <Pillar4 language setLanguage onExit onComplete /> inside any route or screen.
 * Pillar 4 imports nothing else from the host app (no map, no router, no shared store, no shared CSS).
 */
export interface Pillar4Host {
  language: Lang
  /** optional player portrait (e.g. the avatar chosen on the host's map), shown on the case desk */
  avatarSrc?: string
  setLanguage: (l: Lang) => void
  /** the student leaves Pillar 4 (back to the map) */
  onExit: () => void
  /** the Master Board is finished: light the pillar on the host's map */
  onComplete: () => void
}

const Ctx = createContext<Pillar4Host | null>(null)
export const HostProvider = Ctx.Provider
export function useHost(): Pillar4Host {
  const h = useContext(Ctx)
  if (!h) throw new Error('Pillar 4 must be rendered inside <Pillar4 />')
  return h
}
