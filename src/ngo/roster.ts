import { cleanRoll } from '../lib/roll'

/**
 * A teacher's class list: roll number -> name. It is the only place a student's name ever appears in Minar Insights, and it
 * never leaves the teacher's device (not uploaded, not in CSV exports). Students only ever send their 4-digit roll number.
 */
export type Roster = Record<string, string>

const NAME_MAX = 40
const cleanName = (s: string) => s.replace(/[\t ]+/g, ' ').replace(/^[\s,.;:|-]+|[\s,.;:|-]+$/g, '').slice(0, NAME_MAX).trim()

export interface ParsedRoster { roster: Roster; lines: number; skipped: string[]; repeated: string[] }

/**
 * Reads a pasted class list, one student per line, in whatever shape a register or spreadsheet gives:
 * "23, Ravi Kumar", "0023<tab>Ravi Kumar", "23. Ravi Kumar", "Ravi Kumar - 23". Header rows and blank lines are ignored.
 */
export function parseRoster(text: string): ParsedRoster {
  const roster: Roster = {}
  const skipped: string[] = []
  const repeated: string[] = []
  let lines = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    lines++
    const front = /^(\d{1,4})(?![\d])[\s,.;:|)\-]+(.*\S.*)$/.exec(line)
    const back = front ? null : /^(.*\S)[\s,.;:|(\-]+(\d{1,4})\)?$/.exec(line)
    const roll = cleanRoll(front ? front[1] : back ? back[2] : '')
    const name = cleanName(front ? front[2] : back ? back[1] : '')
    if (!roll || !name || /\d{5,}/.test(line)) { skipped.push(line); continue }
    if (roster[roll]) repeated.push(roll)
    roster[roll] = name
  }
  return { roster, lines, skipped, repeated }
}

/** the list back as text, for editing in the same box */
export const rosterText = (r: Roster) => Object.entries(r).sort(([a], [b]) => a.localeCompare(b)).map(([roll, name]) => `${roll}, ${name}`).join('\n')
