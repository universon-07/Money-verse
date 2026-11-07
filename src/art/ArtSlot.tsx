import { useEffect, useState, type ReactNode } from 'react'

export type Manifest = Record<string, { w: number; h: number; src?: string }>
let manifestP: Promise<Manifest> | null = null
const loadManifest = () =>
  (manifestP ??= fetch('/art/manifest.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({})) as Promise<Manifest>)
/** natural sizes of imported art (written by tools/import_art.py); {} until loaded or when no art exists */
export function useManifest(): Manifest {
  const [m, setM] = useState<Manifest>({})
  useEffect(() => {
    let dead = false
    void loadManifest().then((x) => { if (!dead && x && typeof x === 'object') setM(x) })
    return () => { dead = true }
  }, [])
  return m
}

const cache = new Map<string, string | null>()
const probe = (src: string) =>
  new Promise<boolean>((res) => {
    const i = new Image()
    i.onload = () => res(true)
    i.onerror = () => res(false)
    i.src = src
  })

/**
 * Swappable art: if /public/art/<name>.webp|png|svg exists it is shown,
 * otherwise the procedural SVG fallback renders. Drop in generated or commissioned art, no code change.
 */
export function ArtSlot({ name, fallback, className, alt = '' }: { name: string; fallback: ReactNode; className?: string; alt?: string }) {
  const [src, setSrc] = useState<string | null | undefined>(cache.get(name))
  useEffect(() => {
    if (cache.has(name)) return
    let dead = false
    ;(async () => {
      for (const ext of ['webp', 'png', 'svg']) {
        const url = `/art/${name}.${ext}`
        if (await probe(url)) {
          cache.set(name, url)
          if (!dead) setSrc(url)
          return
        }
      }
      cache.set(name, null)
      if (!dead) setSrc(null)
    })()
    return () => {
      dead = true
    }
  }, [name])
  if (src) return <img src={src} className={className} alt={alt} draggable={false} />
  return <>{fallback}</>
}

/** true once the named import exists in the art manifest */
export const useArtReady = (name: string) => !!useManifest()[name]
