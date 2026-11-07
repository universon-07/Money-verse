import { useEffect, useState } from 'react'
import { usePillar4 } from '../store.ts'

/** short, low synthesised blips (no audio files to ship) plus a haptic buzz; both fail silently */
let ctx: AudioContext | null = null
function blip(freqs: number[], dur = 0.09) {
  try {
    if (!usePillar4.getState().settings.sound) return
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'triangle'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + i * dur)
      g.gain.exponentialRampToValueAtTime(0.06, t0 + i * dur + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * dur + dur)
      o.connect(g).connect(ctx!.destination)
      o.start(t0 + i * dur)
      o.stop(t0 + i * dur + dur + 0.02)
    })
  } catch { /* no audio */ }
}
const buzz = (ms: number) => { try { navigator.vibrate?.(ms) } catch { /* unsupported */ } }

export const sfx = {
  pin: () => { blip([523, 784]); buzz(30) },
  snap: () => blip([660]),
  success: () => blip([523, 659, 784, 1047], 0.1),
  soft: () => blip([330], 0.08),
  herring: () => blip([600, 700], 0.06),
}

/** Reduce-motion: explicit setting, else the OS preference */
export function useReduceMotion(): boolean {
  const pref = usePillar4((s) => s.settings.reduceMotion)
  const [os, setOs] = useState(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
  })
  useEffect(() => {
    try {
      const m = window.matchMedia('(prefers-reduced-motion: reduce)')
      const f = () => setOs(m.matches)
      m.addEventListener('change', f)
      return () => m.removeEventListener('change', f)
    } catch { return undefined }
  }, [])
  return pref ?? os
}
