import type { PillarId } from '../../content/data'
import type { GameAdapter } from '../types'
import { adaptCafe } from './cafe'
import { adaptCaseFiles } from './casefiles'
import { adaptDealBoard } from './dealboard'
import { adaptFestival } from './festival'
import { adaptPayRun } from './payrun'

export { adaptCafe, adaptCaseFiles, adaptDealBoard, adaptFestival, adaptPayRun }

export const ADAPTERS: Record<PillarId, GameAdapter> = {
  plan: adaptFestival,
  // Pocket Panic replaced Pay Run as the Save game; an old Pay Run payload is still understood
  save: (payload) => (typeof payload === 'object' && payload !== null && (payload as { game?: unknown }).game === 'payrun' ? adaptPayRun(payload) : adaptCafe(payload)),
  invest: adaptDealBoard,
  safe: adaptCaseFiles,
}
