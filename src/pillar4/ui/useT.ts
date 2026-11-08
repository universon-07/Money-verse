import { useCallback } from 'react'
import { EN } from '../content/index.ts'
import type { Lang } from '../host.tsx'

/** Flat English string lookup with named substitutions. */
export function tr(_lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = EN[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{{${k}}}`).join(String(v))
  return s
}
export type T = (key: string, vars?: Record<string, string | number>) => string
export function useT(): T {
  return useCallback((key, vars) => tr('en', key, vars), [])
}
