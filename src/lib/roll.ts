/** Keep the editable field numeric without padding while the student types. */
export function rollInput(value: string): string {
  return value.replace(/[^0-9]/g, '').slice(0, 4)
}

/** A valid roll is 1..9999, stored as exactly four digits. */
export function cleanRoll(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  if (!/^[0-9]{1,4}$/.test(text) || Number(text) === 0) return null
  return text.padStart(4, '0')
}
