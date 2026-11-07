/**
 * Design tokens, TypeScript side. The CSS side lives in the @theme block and :root of src/index.css.
 * Every colour value below has the same hex in index.css (`--color-<kebab-name>`); `npm run check:tokens`
 * fails if the two drift apart. To reskin, change values here and in index.css, nowhere else.
 */

/** Base palette: named by what the colour looks like, never by where it is used. */
export const C = {
  ink: '#3A2A24',
  terracotta: '#D8683A',
  marigold: '#F28C28',
  mustard: '#E8B04A',
  jasmine: '#FFF3D6',
  sky: '#5BB5D6',
  teal: '#2F6F73',
  sage: '#86B35F',
  coral: '#D9573F',
  pink: '#E5457A',
  gold: '#D9A520',
  dusk: '#1E2A44',
  maroon: '#7A2A22',
  stone: '#F2DFB0',
  stoneShade: '#D9A86A',
  peach: '#F2A56B',
  cobble: '#D49A62',
  cobbleDark: '#B97A48',
  glove: '#FFF3D6',

  // neutrals
  white: '#FFFFFF',
  black: '#000000',
  inkSoft: '#3A231F',
  paperTan: '#F2D9A8',
  track: '#E9D3A6',
  skin: '#F9C97A',
  slate: '#4B5A63',
  stoneGrey: '#D9D3C6',

  // coins, lamps and glows
  coinLight: '#F0C24A',
  lampLit: '#FFD25A',
  lampUnlit: '#8C7B6E',
  lampRay: '#FFE9A0',
  lampStoneLight: '#A39284',
  lampStoneDark: '#6E5E52',
  lampGlow: '#FFC94A',
  glowPale: '#FFE696',
  glowYellow: '#FFE178',
  glowAmber: '#FFC85A',

  // sky, sun and ground used by the story scenes and the play shell
  skyCream: '#FFE3A8',
  skyOrange: '#F9A94C',
  sunGlow: '#FFF1B0',
  groundTan: '#C98B58',
  nightSky: '#2A2A5E',
  dawnPurple: '#7C4A8E',
  dawnPink: '#F28C9A',
  dawnGold: '#FFC36B',
  hillPurple: '#6A4A7A',

  // story props
  roseLight: '#F26BA0',
  roseBright: '#FF8FB8',
  marigoldLight: '#F5A623',
  marigoldDeep: '#E8742A',
  creamWhite: '#FFF8E1',
  creamPale: '#FFF0C4',
  cream: '#F7E6B8',
  ruleLine: '#F3E1B4',
  sandLine: '#C9A867',
  yellow: '#F4C430',
  goldDark: '#B98A14',
  wood: '#8A4F2B',
  nightWallEnd: '#3B1F26',
  floorDark: '#3B2A26',
} as const

export type ColorName = keyof typeof C

/**
 * Semantic aliases: what a colour MEANS in the UI. Components should prefer these, so a reskin can retarget
 * "danger" or "joyDim" without touching components. joy* are the three Happy Index lamp/meter states.
 */
export const S = {
  surface: C.jasmine,
  surfaceInk: C.ink,
  accent: C.pink,
  success: C.sage,
  warning: C.marigold,
  danger: C.coral,
  joyBright: C.lampLit,
  joyDim: '#B8923A',
  joyFlicker: C.lampUnlit,
} as const

/** rgba() from a palette hex, so translucent colours also come from tokens */
export const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/** inked border, e.g. inkBorder(4) -> "4px solid <ink>" */
export const inkBorder = (w: number, color: string = C.ink) => `${w}px solid ${color}`

/** flat offset shadow (never blurred), e.g. flat(4, 5) -> "4px 5px 0 <ink>" */
export const flat = (x: number, y: number, color: string = C.ink) => `${x}px ${y}px 0 ${color}`

/** Stacking order. CSS twins are --z-* in index.css. Pillar/world objects inside the overworld use their own y-sorted values. */
export const Z = {
  scene: 30,
  hud: 40,
  overlay: 50,
  modal: 60,
  film: 90,
  transition: 100,
} as const

/** Shared motion timings in seconds / steps (stepped animation "on twos" keeps the ~10 fps cel look) */
export const MOTION = {
  steps: 12,
  irisDefault: 0.55,
  irisHold: 0.12,
  irisBeat: 0.38,
  irisBack: 0.3,
  goalBarFirst: 1.2,
  goalBar: 0.7,
  beatFade: 0.3,
  beatFadeSteps: 6,
} as const
