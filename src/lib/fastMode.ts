/** Optional visual fast mode; never changes game clocks, money, or scoring. */
export function installFastMode(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  if (new URLSearchParams(window.location.search).get('fast') !== '1') return
  if (document.getElementById('mm-fast-mode')) return
  const style = document.createElement('style')
  style.id = 'mm-fast-mode'
  style.textContent = '*,*::before,*::after{animation-duration:0.01ms!important;animation-delay:0ms!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}'
  document.head.append(style)
}
