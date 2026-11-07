/**
 * A cartoon iris wipe, like the old cartoons (and Cuphead): the screen closes to a circle around the game that is about to start,
 * holds there for a beat, snaps shut, and the next screen opens out of the same spot.
 *
 * It is a plain fixed <div> with a huge box-shadow, so the "hole" is the div itself and only its size is animated (cheap on old
 * phones). Skipped for reduced motion and Lite mode; the fast demo mode speeds it up like every other animation.
 */
const OPEN_KEY = 'minar-iris-open'
const INK = '#1B1410'

const reduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.lite === 'true'
  } catch {
    return false
  }
}

const cover = () => Math.hypot(window.innerWidth, window.innerHeight) * 2.2 // a diameter that clears every corner

function hole(x: number, y: number, d: number): HTMLDivElement {
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.dataset.testid = 'iris'
  Object.assign(el.style, {
    position: 'fixed', left: `${x}px`, top: `${y}px`, width: `${d}px`, height: `${d}px`, transform: 'translate(-50%, -50%)',
    borderRadius: '50%', boxShadow: `0 0 0 ${cover()}px ${INK}, inset 0 0 0 6px ${INK}`, zIndex: '2147483000', pointerEvents: 'auto',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(el)
  return el
}

const centre = (target: Element | { x: number; y: number } | null | undefined) => {
  if (target && 'getBoundingClientRect' in target) {
    const r = target.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.max(r.width, r.height) }
  }
  return { x: target?.x ?? window.innerWidth / 2, y: target?.y ?? window.innerHeight / 2, size: 120 }
}

/**
 * closes the iris onto `target` (an element, or a point), then calls `then` (usually a navigation). The next screen opens it
 * again with irisOpen().
 */
export function irisClose(target: Element | { x: number; y: number } | null | undefined, then: () => void) {
  if (reduced() || typeof document === 'undefined') { then(); return }
  const { x, y, size } = centre(target)
  const hold = Math.min(Math.max(size * 1.35, 90), 220)
  const el = hole(x, y, cover())
  const anim = el.animate(
    [
      { width: `${cover()}px`, height: `${cover()}px`, easing: 'cubic-bezier(.55,0,.75,.4)' },
      { width: `${hold}px`, height: `${hold}px`, offset: 0.55 },
      { width: `${hold * 1.08}px`, height: `${hold * 1.08}px`, offset: 0.68, easing: 'ease-in' }, // the little "bounce" before it snaps shut
      { width: '0px', height: '0px' },
    ],
    { duration: 950, fill: 'forwards' },
  )
  let done = false
  const finish = () => {
    if (done) return
    done = true
    try { sessionStorage.setItem(OPEN_KEY, JSON.stringify({ x: x / window.innerWidth, y: y / window.innerHeight })) } catch { /* opens from the middle */ }
    then()
    // the next screen calls irisOpen(); if it never does (an error, a full reload), do not leave the screen black
    window.setTimeout(() => el.remove(), 1600)
  }
  anim.onfinish = finish
  window.setTimeout(finish, 1400) // in case the animation is throttled in a background tab
}

/** opens the iris on a screen that was reached through irisClose (does nothing otherwise) */
export function irisOpen() {
  let spot: { x: number; y: number } | null = null
  try {
    const raw = sessionStorage.getItem(OPEN_KEY)
    sessionStorage.removeItem(OPEN_KEY)
    spot = raw ? JSON.parse(raw) : null
  } catch { spot = null }
  document.querySelectorAll('[data-testid="iris"]').forEach((e) => e.remove())
  if (!spot || reduced()) return
  const x = spot.x * window.innerWidth
  const y = spot.y * window.innerHeight
  const el = hole(x, y, 0)
  el.style.pointerEvents = 'none'
  const anim = el.animate([{ width: '0px', height: '0px' }, { width: `${cover()}px`, height: `${cover()}px` }], { duration: 700, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' })
  anim.onfinish = () => el.remove()
  window.setTimeout(() => el.remove(), 1500)
}
