import { useCallback } from 'react'
import { EN, TE } from '../content/index.ts'
import { useHost, type Lang } from '../host.tsx'

/**
 * Pillar 4 copy lookup. Keys are flat strings (they contain dots), so this is a plain map lookup.
 * Telugu falls back to English per key until a translation exists; Hindi uses the English text
 * because Pillar 4 ships English + Telugu only.
 */
export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = (lang === 'te' ? TE[key] : undefined) ?? EN[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
  return s
}

export type T = (key: string, vars?: Record<string, string | number>) => string

export function useT(): T {
  const { language } = useHost()
  return useCallback((key, vars) => tr(language, key, vars), [language])
}
