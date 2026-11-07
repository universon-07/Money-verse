import { useEffect, useRef, useState } from 'react'

/** counts a number up (or down) to its new value in a few steps, so changes are felt rather than snapped */
export function useCountTo(target: number, ms = 700): number {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start === target) return undefined
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const e = 1 - (1 - k) * (1 - k)
      const v = Math.round(start + (target - start) * e)
      setShown(v)
      from.current = v
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}

/** the change since the last value, for a few seconds: shown as a little "+₹500" or "-5" tag */
export function useDelta(value: number, holdMs = 2200): number {
  const prev = useRef(value)
  const [delta, setDelta] = useState(0)
  useEffect(() => {
    const d = Math.round(value - prev.current)
    prev.current = value
    if (!d) return undefined
    setDelta(d)
    const id = window.setTimeout(() => setDelta(0), holdMs)
    return () => window.clearTimeout(id)
  }, [value, holdMs])
  return delta
}
