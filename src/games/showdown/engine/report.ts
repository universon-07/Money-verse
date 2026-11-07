import type { GameResult } from '../../../lib/gameResult'
import { CONCEPTS, factsOf, lowestConcepts, masteryOf, type ConceptId, type Level } from './concepts'
import { LESSON_OF, lessonFor, type LessonLine } from './lessons'
import { answerOf, planOf, type Decision } from './log'
import { PREDICTIONS, p3Truth, type PredictionId } from './predictions'
import { score, stars, title, type Score, type Stars } from './score'

export interface Report {
  score: Score
  stars: Stars
  title: ReturnType<typeof title>
  survived: number
  mastery: Record<ConceptId, { points: number; level: Level }>
  /** the three lowest concepts and their lesson cards: what to show on the report */
  lowest: ConceptId[]
  lessons: LessonLine[]
  predictions: { id: PredictionId; answer: string | null; truth: string; correct: boolean; unsure: boolean }[]
  minaretLit: boolean
}

/** Everything the final report shows, rebuilt from the log. */
export function reportOf(log: Decision[]): Report {
  const facts = factsOf(log)
  const plan = planOf(log)
  const mastery = masteryOf(facts)
  const lowest = [...CONCEPTS].sort((a, b) => mastery[a].points - mastery[b].points || CONCEPTS.indexOf(a) - CONCEPTS.indexOf(b)).slice(0, 3)
  const predictions = (['P1', 'P2', 'P3', 'P4'] as PredictionId[]).map((id) => {
    const answer = answerOf(log, id)?.answer ?? null
    const truth = id === 'P3' ? p3Truth(facts.played) : PREDICTIONS[id].truth!
    return { id, answer, truth, correct: answer === truth, unsure: answer === 'unsure' }
  })
  const sc = score(plan, facts.played, facts.survived)
  const minaretLit = CONCEPTS.filter((c) => mastery[c].level === 'got').length >= 4
  return { score: sc, stars: stars(plan, facts.played, facts.survived), title: title(sc.total), survived: facts.survived, mastery, lowest, lessons: lowest.map((c) => lessonFor(c, log, facts)), predictions, minaretLit }
}

/** The result passed to the hub on finish. No personal data: a made-up code, scores and concept evidence only. */
export function toGameResult(r: Report, code: string, cohortCode: string, lessonsSeen: string[]): GameResult {
  return {
    game: 'festival',
    cohortCode,
    seed: code,
    stars: { ...r.stars },
    score: { ...r.score },
    evidence: { ...Object.fromEntries(CONCEPTS.map((c) => [c, r.mastery[c].points])), futuresSurvived: r.survived },
    lessonsSeen,
    minaretLit: r.minaretLit,
  }
}

export { lowestConcepts, LESSON_OF }
