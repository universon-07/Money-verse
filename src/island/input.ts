import { useEffect, useState } from 'react'

/** Shared analog stick vector (-1..1), written by <Joystick/>, read by the overworld loop every frame. */
export const joy = { x: 0, y: 0, active: false }

const q = () => {
  try {
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 700
  } catch {
    return false
  }
}

/** true on phones / tablets / narrow windows: show the virtual joystick and the compact HUD */
export function useTouchUi() {
  const [t, setT] = useState(q)
  useEffect(() => {
    const f = () => setT(q())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return t
}

/** phone held sideways: the portrait-only story asks to be rotated */
export function useShortLandscape() {
  const get = () => window.innerHeight < 480 && window.innerWidth > window.innerHeight
  const [s, setS] = useState(get)
  useEffect(() => {
    const f = () => setS(get())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}
