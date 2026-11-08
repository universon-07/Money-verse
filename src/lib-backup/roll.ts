/**
 * School roll numbers, the one thing that lets a teacher know whose progress is whose without the game ever sending a name.
 * Always shown and stored as 4 digits: "23", "023" and "0023" are the same student.
 */
export const ROLL_DIGITS = 4

/** what a student types, kept as digits only (at most 4) while typing */
export const rollInput = (v: string): string => v.replace(/\D/g, '').slice(0, ROLL_DIGITS)

/** a roll number as 4 digits ('23' is '0023'); null when empty, zero, or longer than 4 digits */
export function cleanRoll(v: unknown): string | null {
  const d = typeof v === 'number' ? String(Math.trunc(v)) : typeof v === 'string' ? v.replace(/\D/g, '') : ''
  if (!d || d.length > ROLL_DIGITS) return null
  const n = Number(d)
  return n >= 1 ? String(n).padStart(ROLL_DIGITS, '0') : null
}