import { useEffect, useState } from 'react'

/** A hint that shows at first, then disappears after `ms` or on the first tap/click/key press. Logic only, no styling. */
export function useFirstHint(ms = 9000): boolean {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setShow(false), ms)
    const off = () => setShow(false)
    window.addEventListener('pointerdown', off, { once: true })
    window.addEventListener('keydown', off, { once: true })
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', off)
    }
  }, [ms])
  return show
}
