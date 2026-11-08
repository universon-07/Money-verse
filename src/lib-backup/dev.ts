const FLAG = 'mm-dev'

/**
 * Dev tools are on only when the page was opened with ?dev=1. The flag is remembered for the rest of the browser tab
 * (in-app navigation drops the query string), and ?dev=0 turns it off. Without ?dev=1 nothing dev-related renders.
 */
export function isDevMode(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('dev')
    if (q === '1') sessionStorage.setItem(FLAG, '1')
    else if (q === '0') sessionStorage.removeItem(FLAG)
    return sessionStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}
