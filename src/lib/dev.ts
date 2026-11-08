/** Remember the explicit developer toggle for this tab, including page reloads. */
export function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const value = new URLSearchParams(window.location.search).get('dev')
    if (value === '1') window.sessionStorage.setItem('mm-dev', '1')
    else if (value === '0') window.sessionStorage.removeItem('mm-dev')
    return window.sessionStorage.getItem('mm-dev') === '1'
  } catch { return new URLSearchParams(window.location.search).get('dev') === '1' }
}
