import type { PillarId, Skill } from '../content/data'
import type { Concept, StudentSummary } from './summary'

/** plain-English wording the facilitator sees (the facilitator desk is English only for now) */
export const PLACE_NAME: Record<PillarId, string> = { plan: 'Bangle Bazaar', save: 'Café Meherban', invest: 'The Pearl Exchange', safe: 'Helpline Kiosk' }
export const GAME_NAME: Record<PillarId, string> = { plan: 'Festival Showdown', save: 'Pocket Panic', invest: 'Deal Board', safe: 'Case Files' }
export const SKILL_NAME: Record<Skill, string> = {
  planning: 'Planning', prioritising: 'Needs before wants', saving: 'Saving', riskSense: 'Risk sense', patience: 'Patience', scamSense: 'Scam sense',
}
/** which place mostly trains each skill (used to know who has had a chance to show it) */
export const SKILL_PLACE: Record<Skill, PillarId> = { planning: 'plan', prioritising: 'plan', saving: 'save', riskSense: 'invest', patience: 'invest', scamSense: 'safe' }

/** a common mistake a facilitator can act on: who it applies to, and who made it */
export interface Mistake {
  id: string
  pillar: PillarId
  text: string
  applicable: (s: StudentSummary) => boolean
  hit: (s: StudentSummary) => boolean
}

const skillMistake = (skill: Skill, text: string): Mistake => ({
  id: `skill:${skill}`,
  pillar: SKILL_PLACE[skill],
  text,
  applicable: (s) => s.places[SKILL_PLACE[skill]].a > 0,
  hit: (s) => s.skills[skill] < 0.5,
})

const habit = (c: Concept, text: string): Mistake => ({
  id: `habit:${c}`,
  pillar: 'save',
  text,
  applicable: (s) => s.habits !== null,
  hit: (s) => s.habits !== null && !s.habits[c],
})

export const MISTAKES: Mistake[] = [
  skillMistake('prioritising', 'Mixed up needs and wants when planning a festival'),
  skillMistake('planning', 'Went in without a plan for every rupee'),
  skillMistake('saving', 'Did not build the habit of putting savings aside'),
  skillMistake('riskSense', 'Put too much in one place instead of spreading it'),
  skillMistake('patience', 'Reacted to ups and downs instead of staying calm'),
  skillMistake('scamSense', 'Missed the warning signs of a scam'),
  habit('payFirst', 'Spent first and saved what was left, instead of saving first'),
  habit('track', 'Did not keep track of where the money went'),
  habit('small', 'Overlooked small daily spends that add up'),
  habit('emergency', 'Left no cushion for an emergency'),
  habit('plan', 'Had no plan for the month'),
  habit('wait', 'Gave in to a tempting want instead of waiting'),
  habit('goals', 'Did not tie saving to a goal'),
  habit('borrow', 'Borrowed without counting what it costs'),
  habit('lend', 'Lent money without thinking about getting it back'),
  {
    id: 'p4:tries',
    pillar: 'safe',
    text: 'Needed several tries to spot what the scammer did',
    applicable: (s) => !!s.p4 && s.p4.closed > 0,
    hit: (s) => !!s.p4 && s.p4.closed > 0 && s.p4.wrong / s.p4.closed >= 3,
  },
  {
    id: 'p4:hints',
    pillar: 'safe',
    text: 'Leaned on hints to solve scam cases',
    applicable: (s) => !!s.p4 && s.p4.closed > 0,
    hit: (s) => !!s.p4 && s.p4.closed > 0 && s.p4.hints / s.p4.closed >= 0.5,
  },
]

/** a ready-to-run 15-minute offline activity for the weakest skill. Educational only: it never recommends a product. */
export interface Lesson {
  skill: Skill
  title: string
  minutes: number
  replay: PillarId
  steps: string[]
  questions: string[]
}

export const LESSONS: Record<Skill, Lesson> = {
  prioritising: {
    skill: 'prioritising', title: 'Needs and wants card sort', minutes: 15, replay: 'plan',
    steps: ['Write 12 everyday items on slips (rice, a new phone cover, school fees, a cinema ticket, medicine, a gift...).', 'In pairs, sort them into NEED, WANT and "it depends".', 'Pairs share one item they argued about and why.'],
    questions: ['What made an item a need for one pair and a want for another?', 'What happens to the month if wants come first?', 'Which want could wait one week?'],
  },
  planning: {
    skill: 'planning', title: 'Plan a festival on Rs 2,000', minutes: 15, replay: 'plan',
    steps: ['Give each group a made-up Rs 2,000 and a festival.', 'They list what the family must buy, what is nice to have, and what to keep aside.', 'Groups compare plans and spot what each forgot.'],
    questions: ['What did you plan for that surprised other groups?', 'How much did you keep aside, and why that much?', 'What would you change after seeing another plan?'],
  },
  saving: {
    skill: 'saving', title: 'Pay yourself first', minutes: 15, replay: 'save',
    steps: ['Draw a made-up month of income on the board.', 'Run it twice: once spending first and saving the rest, once setting savings aside first.', 'Compare the two ends of the month.'],
    questions: ['Which version felt harder, and which ended better?', 'What small spend added up the most?', 'What goal would make saving easier to stick to?'],
  },
  riskSense: {
    skill: 'riskSense', title: 'Do not carry all the eggs', minutes: 15, replay: 'invest',
    steps: ['Give each student 10 tokens and four made-up shops.', 'Roll a die for a good or bad week for one shop at a time.', 'Compare students who split their tokens with those who put all in one.'],
    questions: ['Who was hurt most by one bad week, and why?', 'What does spreading cost and what does it protect?', 'Why do made-up examples never promise real results?'],
  },
  patience: {
    skill: 'patience', title: 'The patience jar', minutes: 15, replay: 'invest',
    steps: ['Show a made-up value that goes up slowly with small dips.', 'Ask students when they would panic, and why.', 'Reveal the longer view and discuss what changed.'],
    questions: ['What does it feel like to want to act during a dip?', 'What helps you wait?', 'When is waiting not the right choice?'],
  },
  scamSense: {
    skill: 'scamSense', title: 'Spot the pressure', minutes: 15, replay: 'safe',
    steps: ['Read three made-up scam messages aloud (fake bank call, prize link, urgent job offer).', 'Students underline the pressure words: urgent, secret, only today.', 'Agree on a three-step check: pause, ask someone you trust, verify on your own.'],
    questions: ['Which word made it feel urgent?', 'Who would you call before acting?', 'What do you do if you already shared a code or password?'],
  },
}
