/**
 * Offline support: the repo has no PWA setup, so Pillar 4 registers a small hand-written service worker
 * (public/sw.js) in production builds only. It caches same-origin GETs as they are used, so after the first
 * online visit the app, the Pillar 4 chunk, content and fonts all load offline. A web app manifest is added
 * at runtime so the app can be installed. Nothing is sent anywhere.
 */
export function registerOffline(): void {
  // The shell's vite-plugin-pwa already precaches the whole app (including this chunk); a second service worker would clash with it.
  return
  // eslint-disable-next-line no-unreachable
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  try {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link')
      l.rel = 'manifest'
      l.href = '/manifest.webmanifest'
      document.head.appendChild(l)
    }
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  } catch { /* offline support is a bonus, never an error */ }
}
