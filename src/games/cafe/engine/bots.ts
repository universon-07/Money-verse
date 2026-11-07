import { trolleyItem, windowItem } from './content'
import {
  billAmount, buyWindow, chooseBigNight, chooseTeja, confirmPayday, declineWindow, guessBand, littleTotal, newRun, openBigNight,
  payBill, payRain, payExtra, extraBill, paymentError, rainBill, tejaAvailable, trolleyOk, trolleySkip, bigNightPrice, openFinePrint,
} from './economy'
import { popped } from './pressure'
import { settle } from './tally'
import type { BigNightChoice, Jars, Payment, Run, Source, Tally, TejaChoice } from './types'

/**
 * Bots play whole months through the real engine. They are the balance tests (no strategy may dominate)
 * and can drive Demo mode. Each one is a reference playstyle from the design doc, section 3.
 */
export interface Strategy {
  split: Jars
  window: Record<string, 'buy' | 'pass' | 'coolNo' | 'coolYes'>
  trolley: Record<string, 'ok' | 'skip'>
  bigNight: BigNightChoice
  teja: TejaChoice
  pay: { bill: Source[]; want: Source[]; rain: Source[] }
  readFine?: boolean
}

/** greedy payment from an ordered list of sources; Quick Cash covers what is left in ₹50 steps */
export function payWith(run: Run, amount: number, order: Source[], quick: boolean): Payment | null {
  const p: Payment = {}
  let left = amount
  for (const s of order) {
    if (left <= 0) break
    if (s === 'quick') {
      if (!quick) continue
      const step = Math.ceil(left / 50) * 50
      p.quick = step
      left = 0
      break
    }
    const take = Math.min(run.jars[s], left)
    if (take > 0) { p[s] = take; left -= take }
  }
  if (left > 0) return null
  return paymentError(run, amount, p, { quick }) ? null : p
}

export function playMonth(s: Strategy, seed = 'BOT', run0?: Run): { run: Run; tally: Tally } {
  let run = run0 ?? newRun({ seed, goal: 'earphones' })
  run = confirmPayday(run, s.split)
  const bill = (r: Run, id: 'auto' | 'data' | 'lunch') => {
    const p = payWith(r, billAmount(r, id), s.pay.bill, true) ?? payWith(r, billAmount(r, id), ['spend', 'emergency', 'save', 'quick'], true)!
    return payBill(r, id, p)
  }
  run = bill(run, 'auto')
  for (const wave of run.waves) {
    for (const id of wave) {
      const act = s.window[id] ?? 'pass'
      const price = windowItem(id).price
      if (act === 'buy' || act === 'coolYes') {
        const soldOut = act === 'coolYes' && windowItem(id).soldOut
        const p = soldOut ? null : payWith(run, price, s.pay.want, false)
        run = p ? buyWindow(run, id, p, act === 'buy' ? 'get' : 'cool') : declineWindow(run, id, soldOut ? 'soldout' : 'pass')
      } else {
        run = declineWindow(run, id, act === 'coolNo' ? (windowItem(id).soldOut ? 'soldout' : 'dropped') : 'pass')
      }
    }
  }
  run = bill(run, 'data')
  for (const id of run.trolleyOrder) {
    const p = s.trolley[id] === 'ok' ? payWith(run, trolleyItem(id).price, s.pay.want, false) : null
    run = p ? trolleyOk(run, id, p) : trolleySkip(run, id)
  }
  run = { ...run, predict2: guessBand(littleTotal(run)) }
  if (popped(run).length) {
    run = openBigNight(run)
    const price = bigNightPrice(run, s.bigNight)
    const p = price ? payWith(run, price, s.pay.want, false) : {}
    run = chooseBigNight(run, p ? s.bigNight : 'stay', p ?? {})
  }
  const teja = tejaAvailable(run).includes(s.teja) ? s.teja : 'no'
  run = chooseTeja(run, teja)
  run = bill(run, 'lunch')
  if (s.readFine) run = openFinePrint(run)
  run = payRain(run, payWith(run, rainBill(run), s.pay.rain, true) ?? payWith(run, rainBill(run), ['emergency', 'spend', 'save', 'quick'], true)!)
  if (run.extra) run = payExtra(run, payWith(run, extraBill(run), s.pay.rain, true) ?? payWith(run, extraBill(run), ['emergency', 'spend', 'save', 'quick'], true)!)
  return { run, tally: settle(run) }
}

const BILL: Source[] = ['spend', 'save', 'emergency']
const SKIP_ALL = { chai: 'skip', samosa: 'skip', cold: 'skip', tiffin: 'skip', biscuit: 'skip', ice: 'skip' } as const

/** the five reference playstyles in the design doc (section 3) */
export const REFERENCE: Record<string, Strategy> = {
  A_shelfFirst: {
    split: { save: 250, emergency: 100, spend: 250 },
    window: { gamepack: 'pass', jacket: 'pass', match: 'pass', cover: 'buy' },
    trolley: { ...SKIP_ALL, chai: 'ok', samosa: 'ok', biscuit: 'ok' },
    bigNight: 'half', teja: 'no',
    pay: { bill: BILL, want: ['spend'], rain: ['emergency', 'spend', 'save'] },
  },
  B_spendsEarly: {
    split: { save: 250, emergency: 50, spend: 300 },
    window: { gamepack: 'buy', jacket: 'pass', match: 'buy', cover: 'buy' },
    trolley: { chai: 'ok', samosa: 'ok', cold: 'ok', tiffin: 'ok', biscuit: 'ok', ice: 'ok' },
    bigNight: 'go', teja: 'no',
    pay: { bill: BILL, want: ['spend'], rain: ['emergency', 'spend', 'save'] },
  },
  C_vault: {
    split: { save: 500, emergency: 100, spend: 0 },
    window: { gamepack: 'pass', jacket: 'pass', match: 'pass', cover: 'pass' },
    trolley: { ...SKIP_ALL },
    bigNight: 'stay', teja: 'no',
    pay: { bill: ['save', 'emergency'], want: ['save'], rain: ['emergency', 'save'] },
  },
  D_cushionLight: {
    split: { save: 300, emergency: 0, spend: 300 },
    window: { gamepack: 'buy', jacket: 'pass', match: 'pass', cover: 'buy' },
    trolley: { ...SKIP_ALL, chai: 'ok', samosa: 'ok', biscuit: 'ok' },
    bigNight: 'go', teja: 'no',
    pay: { bill: BILL, want: ['spend'], rain: ['spend', 'save'] },
  },
  E_quickCash: {
    split: { save: 250, emergency: 0, spend: 350 },
    window: { gamepack: 'buy', jacket: 'pass', match: 'buy', cover: 'pass' },
    trolley: { chai: 'ok', samosa: 'ok', cold: 'ok', tiffin: 'ok', biscuit: 'ok', ice: 'ok' },
    bigNight: 'go', teja: 'no',
    pay: { bill: BILL, want: ['spend'], rain: ['spend', 'quick'] },
  },
}
