import type { PillarId } from '../content/data'

/** 32-bit FNV-1a with a chosen starting value, as 8 hex characters */
function fnv1a(text: string, start: number): string {
  let h = start >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

const START_A = 0x811c9dc5
const START_B = 0x9747b28c

/**
 * The seed a pillar game receives. Pure and deterministic: the same install and pillar always give the same seed, so a
 * replay faces the same shifts/market/prices and the player improves their choices, not their luck. `salt` only changes
 * for the developer "new seed" button.
 */
export function seedFor(installId: string, pillar: PillarId, salt = 0): string {
  const text = `${installId}|${pillar}|${salt}`
  return `mm-${pillar}-${fnv1a(text, START_A)}${fnv1a(text, START_B)}`
}
