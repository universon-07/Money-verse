import { Toon, type ToonLook } from '../../../art/Toon'

/** Friends from the shared cast, drawn with the hub's character rig. */
const LOOK: Record<string, ToonLook> = {
  arjun: { skin: '#C77D47', hair: '#2B1A17', hairStyle: 'curly', top: '#F28C28', bottom: '#2F6F73', glasses: 'shades' },
  ayesha: { skin: '#B8693A', hair: '#2B1A17', hairStyle: 'bun', top: '#3F7A3A', bottom: '#7A2A22', scarf: '#E8B04A' },
  sunny: { skin: '#A8602F', hair: '#2B1A17', hairStyle: 'none', top: '#5BB5D6', bottom: '#1E2A44' },
  classmate: { skin: '#B5683B', hair: '#2B1A17', hairStyle: 'hood', top: '#D9632E', bottom: '#1E2A44' },
}

export function Portrait({ who, size = 64, mood = 'happy' }: { who: string; size?: number; mood?: 'happy' | 'worried' | 'surprised' | 'sly' }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 100 150" aria-hidden className="shrink-0" style={{ overflow: 'visible' }}>
      <Toon look={LOOK[who] ?? LOOK.classmate} mood={mood} width={100} height={150} />
    </svg>
  )
}
