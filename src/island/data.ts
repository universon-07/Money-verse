import raw from '../content/island.json'
import type { PillarId } from '../content/data'

export type NodeId = 'dock' | 'plaza' | PillarId | 'gate'
export interface IslandNode { id: NodeId; kind: 'start' | 'hub' | 'pillar' | 'goal'; n?: number; x: number; y: number; art: { x: number; y: number }; labelKey: string; hookKey?: string }
export interface IslandPath { id: string; from: string; to: string; pts: number[][] }

export const WORLD = raw.world
/** life-moment spots on the island (percent of the world); tapping one opens that moment */
export const SPOTS = raw.spots as { id: string; x: number; y: number }[]
export const NODES = raw.nodes as IslandNode[]
export const nodeById = (id: NodeId) => NODES.find((n) => n.id === id)!
const WP: { id: string; x: number; y: number }[] = [...raw.nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })), ...raw.waypoints]
/** the walk network drawn as paths (fallback art only) */
export const PATHS: IslandPath[] = (raw.edges as string[][]).map(([a, b]) => {
  const A = WP.find((w) => w.id === a)!, B = WP.find((w) => w.id === b)!
  return { id: `${a}-${b}`, from: a, to: b, pts: [[A.x, A.y], [B.x, B.y]] }
})

/** % of the world -> world px */
export const px = (p: number[]) => [(p[0] / 100) * WORLD.w, (p[1] / 100) * WORLD.h]

/** Catmull-Rom through the points, written as a cubic Bezier path (gently curved, never a grid). */
export function smoothD(pts: number[][], closed = false): string {
  const P = pts.map(px)
  const n = P.length
  const at = (i: number) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))])
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return closed ? d + 'Z' : d
}

export const PALETTE = {
  ink: '#3A2A24', paper: '#F8EBCB', water: '#92C9D3', water2: '#6EB7C9', stone: '#F2DFB0', stoneShade: '#DEC48C',
  terracotta: '#D8683A', ochre: '#E8AB3A', sage: '#8DB45E', green: '#4E9050', granite: '#8E7C98', granite2: '#AC9CB4',
  coral: '#D9573F', gold: '#D9A520', rock: '#A9826A', rock2: '#86604E',
} as const
