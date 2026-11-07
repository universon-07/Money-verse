import { useMemo } from 'react'
import { factsOf, type ConceptId } from '../engine/concepts'
import { lessonFor } from '../engine/lessons'
import type { Point } from '../engine/types'
import { useView } from '../state/store'
import { LessonCard } from './kit'

/**
 * The one lesson card for a moment: a date that was short (cash flow), the crowd on Festival Day (fixed and variable costs),
 * or the ten futures (stress test). At most one per date; the report shows the rest.
 */
export function MomentLesson({ point, futures = false }: { point?: Point; futures?: boolean }) {
  const { log } = useView()
  const card = useMemo(() => {
    const facts = factsOf(log)
    let c: ConceptId | null = null
    if (futures) c = 'C5'
    else if (point === 'FD') c = 'C3'
    else if (point && facts.played.shortfallDetail.some((s) => s.point === point)) c = 'C1'
    return c ? lessonFor(c, log, facts) : null
  }, [log, point, futures])
  return card ? <LessonCard line={card} /> : null
}
