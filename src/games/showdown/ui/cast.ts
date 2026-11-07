/** The shared cast, painted like the rest of the game (the hub's own sprites). Fictional people. */
export const CAST = {
  shobha: 'npc-nani-stand',
  arjun: 'npc-chai-stand',
  ayesha: 'npc-bangle-stand',
  sunny: 'npc-kiosk-stand',
  rao: 'npc-pearl-stand',
} as const
export type CastId = keyof typeof CAST
