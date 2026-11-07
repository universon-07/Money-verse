// Seeded randomness. Every stream comes from mulberry32, so the same seed always gives the same run.

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit string hash. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Independent stream per purpose: adding a company never changes another's path. */
export const streamFor = (runSeed: string, id: string): Rng => mulberry32(hashSeed(`${runSeed}:${id}`))

/** Normal(0, sigma) via Box-Muller, clipped to ±2 sigma so trends stay readable. */
export function normal(rng: Rng, sigma: number): number {
  if (sigma === 0) return 0
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.max(-2, Math.min(2, z)) * sigma
}

export const int = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1))

export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Fresh random seed for a new run (the only non-deterministic call; the seed is then stored). */
export const newSeed = (): string => Math.floor(Math.random() * 0xffffffff).toString(36)
