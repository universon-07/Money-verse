import type { PillarId } from '../../content/data'
import type { ComponentType } from 'react'
import type { GameProps } from '../types'
import { makePlaceholder } from './makePlaceholder'
import { caseFilesPayload, dealBoardPayload, festivalPayload, payRunPayload } from './payloads'

export const PLACEHOLDERS: Record<PillarId, ComponentType<GameProps>> = {
  plan: makePlaceholder('plan', festivalPayload),
  save: makePlaceholder('save', payRunPayload),
  invest: makePlaceholder('invest', dealBoardPayload),
  safe: makePlaceholder('safe', caseFilesPayload),
}
