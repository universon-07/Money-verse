import type { Skill } from '../content/data'
import { GAME_NAME, LESSONS, PLACE_NAME, SKILL_NAME } from './lessons'

/**
 * Flashcard decks a teacher can present or download for each lesson. Everyday situations a Grade 11-12 student in Hyderabad
 * recognises; every amount is made up; nothing recommends a product or an investment.
 */
export interface Flashcard { q: string; a: string }
interface DeckContent { idea: string; points: string[]; cards: Flashcard[]; takeaway: string }

export const DECKS: Record<Skill, DeckContent> = {
  prioritising: {
    idea: 'A need keeps you safe, healthy or learning. A want makes life nicer.',
    points: ['Needs come first.', 'Wants wait for what is left.', 'The same thing can be a need for one person and a want for another.'],
    cards: [
      { q: 'Your phone screen cracked but the phone still works. Is a new phone a need or a want?', a: 'A want, for now. It still does the job. A repair or screen guard costs less; replace it when your savings allow.' },
      { q: 'A college bus pass or new earphones: which comes first this month?', a: 'The bus pass. Getting to class is a need. The earphones can wait for next month, or become a saving goal.' },
      { q: "Medicine for Nani, or a movie ticket with friends?", a: 'The medicine. Health is a need. Suggest a free plan with friends instead, like an evening walk by the lake.' },
      { q: 'Can the same thing be a need for one person and a want for another?', a: 'Yes. A laptop is a need for someone doing online classes, and a want for someone who only games on it.' },
      { q: 'What is one quick test before you buy something?', a: 'Ask: what happens if I wait a week? If nothing bad happens, it is probably a want.' },
    ],
    takeaway: 'Needs first, wants wait. "Can it wait a week?" is a good test.',
  },
  planning: {
    idea: 'A plan gives every rupee a job before the money arrives, so nothing important is missed.',
    points: ['Write what you must buy, with a price.', 'Keep a little aside for surprises.', 'Look back afterwards and improve.'],
    cards: [
      { q: 'You have ₹2,000 for festival shopping. What do you write down first?', a: 'What the family must have (sweets, oil, puja items) with a price next to each. Then see what is left for the rest.' },
      { q: 'Why keep some money aside in the plan?', a: 'Prices change and surprises happen. A small "just in case" amount stops the whole plan from breaking.' },
      { q: 'Your plan says ₹300 for a gift, but you love one that costs ₹450. What can you do?', a: 'Change the plan on purpose: move ₹150 from another want, or choose a cheaper gift. Do not just overspend.' },
      { q: 'What is a budget, in one line?', a: 'Money coming in, minus money going out, written down before you spend.' },
      { q: 'After the festival, why look back at your plan?', a: 'To spot what you forgot or overspent on, so the next plan is better.' },
    ],
    takeaway: 'Give every rupee a job before you spend, and keep a little aside.',
  },
  saving: {
    idea: 'Pay yourself first: set savings aside the day money arrives, then spend what is left.',
    points: ['Save first, not last.', 'Small daily spends add up.', 'Keep a cushion for emergencies.'],
    cards: [
      { q: 'You earn ₹3,000 a month from tuition classes. When should you save?', a: 'On the day you are paid. Waiting until the end of the month usually leaves nothing to save.' },
      { q: 'A ₹20 chai every day. How much is that in a month?', a: 'About ₹600. Small daily spends add up; noting them down shows where the money goes.' },
      { q: 'What is an emergency fund?', a: 'Money kept only for surprises: a phone repair, a hospital visit, a lost bus pass. It stops one bad day turning into debt.' },
      { q: 'Why does a goal make saving easier?', a: 'You know what you are saving for (a cycle, exam fees), so saying no to a want feels worth it.' },
      { q: 'A friend asks to borrow ₹500. What do you think about first?', a: 'Could you manage if it comes back late, or not at all? Lend only what you can afford, and agree on when it comes back.' },
    ],
    takeaway: 'Save first, track small spends, keep a cushion.',
  },
  riskSense: {
    idea: 'Every money choice carries some risk. Spreading money out means one bad event cannot wipe out everything.',
    points: ['Higher possible gains usually mean higher risk.', 'Spread money across different things.', 'Nothing is completely risk-free.'],
    cards: [
      { q: 'What does "do not put all your eggs in one basket" mean for money?', a: 'Do not keep all your money in one place. If that one thing goes badly, you lose everything.' },
      { q: 'Someone promises "double your money in one month, no risk". What do you think?', a: 'Big, quick, "no risk" promises are warning signs. Higher possible gains almost always come with higher risk.' },
      { q: 'What is diversification?', a: 'Spreading money across different kinds of things, so a loss in one can be balanced by the others.' },
      { q: 'How can a "safe" choice still lose value?', a: 'Prices rise over time (inflation). Money that grows slower than prices buys less later.' },
      { q: 'Why are the numbers in the game made up?', a: 'To practise thinking safely. Real results can be very different, and nothing in the game tells you what to buy.' },
    ],
    takeaway: 'Spread it out, be wary of big promises, nothing is risk-free.',
  },
  patience: {
    idea: 'Values go up and down along the way. Time lets growth build on growth; reacting to every dip can turn a small dip into a real loss.',
    points: ['Ups and downs are normal.', 'Compounding needs time.', 'Hype and hurry are reasons to slow down.'],
    cards: [
      { q: 'What is compounding?', a: 'Earning on your earnings. At a made-up 10% a year, ₹100 becomes ₹110, then ₹121: growth on top of growth.' },
      { q: 'Something you own drops 10% this week. What is a calm first step?', a: 'Pause. Ask why it dropped and whether your reason for holding it has changed, before you act.' },
      { q: 'Why does starting early matter?', a: 'More years means more rounds of compounding. Small amounts started early can end up ahead of bigger amounts started late.' },
      { q: 'When is waiting NOT the right choice?', a: 'When you need the money soon, or you learn it was a bad choice. Patience is not ignoring problems.' },
      { q: 'A friend says "everyone is buying this, buy now!" What do you do?', a: 'Slow down. Hype and hurry are reasons to check carefully, not reasons to rush.' },
    ],
    takeaway: 'Dips are normal. Time and patience let growth add up.',
  },
  scamSense: {
    idea: 'Scams use pressure: urgent, secret, too good to be true. Pause, ask someone you trust, and check for yourself.',
    points: ['Never share an OTP, PIN or password.', 'You never pay to receive a prize or a job.', 'If it went wrong, act fast and report it.'],
    cards: [
      { q: 'A caller says they are from your bank and asks for the OTP to "stop a block". What do you do?', a: 'Never share an OTP, PIN or password; banks never ask for them. Hang up and call the number printed on your card or passbook.' },
      { q: 'A message says "You won ₹50,000! Pay a ₹500 fee to claim." Real or scam?', a: 'A scam. You never have to pay to receive a prize.' },
      { q: 'A job offer asks for a "registration fee" before the interview. Red flag?', a: 'Yes. Real employers do not charge you to apply.' },
      { q: 'Which words often show pressure in a scam?', a: '"Urgent", "secret", "only today". The pressure is there to stop you thinking.' },
      { q: 'You shared a code by mistake. What now?', a: 'Act fast: call your bank on its official number, change passwords, tell a trusted adult, and report it at cybercrime.gov.in or on 1930.' },
    ],
    takeaway: 'Pause, ask, verify. Never share an OTP or PIN.',
  },
}

export type Slide =
  | { kind: 'title'; title: string; sub: string; foot: string }
  | { kind: 'idea'; title: string; body: string; items: string[] }
  | { kind: 'card'; n: number; of: number; q: string; a: string }
  | { kind: 'list'; title: string; items: string[]; numbered?: boolean; note?: string }
  | { kind: 'end'; title: string; body: string; foot: string }

export const DISCLAIMER = 'Educational only. All amounts are made up. Nothing here recommends a product or an investment.'

/** the whole deck for one lesson; classSlips adds a "what our class found tricky" slide (class-level, never a student) */
export function deckFor(skill: Skill, classSlips: string[] = []): Slide[] {
  const l = LESSONS[skill]
  const d = DECKS[skill]
  const slides: Slide[] = [
    { kind: 'title', title: l.title, sub: `${SKILL_NAME[skill]} · a ${l.minutes}-minute class activity`, foot: 'Minar · Learn by doing: make choices, see consequences, try again.' },
    { kind: 'idea', title: 'The big idea', body: d.idea, items: d.points },
    ...d.cards.map((c, i): Slide => ({ kind: 'card', n: i + 1, of: d.cards.length, q: c.q, a: c.a })),
  ]
  if (classSlips.length) slides.push({ kind: 'list', title: 'What our class found tricky', items: classSlips.slice(0, 4), note: 'From the class as a whole, never from one student.' })
  slides.push(
    { kind: 'list', title: 'Activity: do this', items: l.steps, numbered: true },
    { kind: 'list', title: 'Talk about it', items: l.questions },
    { kind: 'end', title: 'Remember', body: d.takeaway, foot: `Now replay ${GAME_NAME[l.replay]} in ${PLACE_NAME[l.replay]} to try it out. ${DISCLAIMER}` },
  )
  return slides
}
