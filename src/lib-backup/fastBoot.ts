import { installFastMode, readFastFactor } from './fastMode'

// imported FIRST in main.tsx, so libraries that capture requestAnimationFrame or timers at load (framer-motion) get the fast clock too
try {
  installFastMode(readFastFactor(window.location.search, window.sessionStorage))
} catch { /* no storage or no window: normal speed */ }
