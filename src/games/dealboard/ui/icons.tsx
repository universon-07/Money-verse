import { useGame } from '../../../store/game'

/** The player's token: the girl from the main map, in the outfit of the persona they picked. */
export function Pawn() {
  const persona = useGame((st) => st.persona) ?? 'college'
  return <img src={`/art/avatar/girl-${persona}-0.webp`} alt="" aria-hidden draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: '50% 100%' }} />
}

const strokeProps = { stroke: '#2B1A17', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Small hand-inked icons used in place of emojis. */
export function IconCash({ size = 26 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><rect x="3" y="9" width="26" height="14" rx="3" fill="#BFD8A0" {...strokeProps} /><circle cx="16" cy="16" r="4" fill="#FFF3D6" {...strokeProps} /><path d="M7 13v.1M25 19v.1" fill="none" {...strokeProps} /></svg>
}
export function IconPeople({ size = 26 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><circle cx="12" cy="11" r="4.5" fill="#F6C48A" {...strokeProps} /><path d="M3.5 26c.5-5 4-8 8.5-8s8 3 8.5 8Z" fill="#8FB8D8" {...strokeProps} /><circle cx="23" cy="12" r="3.5" fill="#F6C48A" {...strokeProps} /><path d="M22 18c4 0 6.5 2.5 7 7" fill="none" {...strokeProps} /></svg>
}
export function IconBank({ size = 26 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><path d="M16 4 4 11h24Z" fill="#E8B04A" {...strokeProps} /><path d="M7 13v10M13 13v10M19 13v10M25 13v10M4 27h24" fill="none" {...strokeProps} /></svg>
}
export function IconEye({ size = 26 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><path d="M2.5 16C6 10 11 7 16 7s10 3 13.5 9C26 22 21 25 16 25S6 22 2.5 16Z" fill="#FFF3D6" {...strokeProps} /><circle cx="16" cy="16" r="4.5" fill="#7C5BC4" {...strokeProps} /><circle cx="17.5" cy="14.5" r="1.2" fill="#FFF3D6" /></svg>
}
export function IconSearch({ size = 22 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><circle cx="13" cy="13" r="8" fill="#FFF3D6" {...strokeProps} /><path d="m19 19 9 9" strokeWidth="3.4" stroke="#2B1A17" strokeLinecap="round" /></svg>
}
export function IconLock({ size = 16 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden><rect x="6" y="14" width="20" height="14" rx="3" fill="#E8B04A" {...strokeProps} /><path d="M10 14v-4a6 6 0 0 1 12 0v4" fill="none" {...strokeProps} /></svg>
}
