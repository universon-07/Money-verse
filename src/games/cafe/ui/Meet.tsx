import { useEffect, useState } from 'react'
import { moodStage } from '../engine/mood'
import { useStage } from '../state/stage'
import { useCafe } from '../state/store'
import { Btn, Caption, MoodFace } from './kit'
import { useCt } from './text'

/** fizz values the demo walks through (a presentation loop; nothing here touches the run) */
const UP = [0, 30, 55, 80, 100]
const DOWN = [80, 55, 30, 10]

type Page = { key: string; who: 'chacha'; kinds: ('fun' | 'friends')[]; loop: number[]; mood?: boolean; cloud?: boolean }
const PAGES: Page[] = [
  { key: 'p1', who: 'chacha', kinds: ['fun'], loop: UP },
  { key: 'p2', who: 'chacha', kinds: ['friends'], loop: UP },
  { key: 'p3', who: 'chacha', kinds: ['fun', 'friends'], loop: DOWN },
  { key: 'p4', who: 'chacha', kinds: ['fun'], loop: [100] },
  { key: 'p9', who: 'chacha', kinds: [], loop: [] },
  { key: 'p8', who: 'chacha', kinds: [], loop: [], cloud: true },
  { key: 'p5', who: 'chacha', kinds: [], loop: [], mood: true },
  { key: 'p7', who: 'chacha', kinds: [], loop: [] },
  { key: 'p6', who: 'chacha', kinds: [], loop: [] },
]

/**
 * Before the money: meet the two bottles and the mood bar, with the same bottles that sit on the table.
 * The scene's bottles play the demo too, so the player sees where to look.
 */
export function Meet() {
  const { t, stage } = useCt()
  const next = useCafe((s) => s.next)
  const setStage = useStage((s) => s.set)
  const [i, setI] = useState(0)
  const [k, setK] = useState(0)
  const page = PAGES[i]
  const v = page.loop.length ? page.loop[Math.min(k, page.loop.length - 1)] : 0
  const [mood, setMood] = useState(50)
  const [cl, setCl] = useState(0)

  useEffect(() => { setK(0) }, [i])
  useEffect(() => {
    if (page.loop.length <= 1) return
    const id = window.setInterval(() => setK((x) => (x + 1) % (page.loop.length + 1)), 1150)
    return () => window.clearInterval(id)
  }, [page])
  useEffect(() => {
    const fun = page.kinds.includes('fun') ? v : 0
    const friends = page.kinds.includes('friends') ? v : 0
    setStage({ demo: page.kinds.length ? { fun, friends } : null, focus: page.kinds.length ? 'bottle' : page.cloud ? 'cloud' : null, cloud: page.cloud ? cl : null })
  }, [page, v, cl, setStage])
  useEffect(() => () => setStage({ demo: null, focus: null, cloud: null }), [setStage])
  useEffect(() => {
    if (!page.cloud) return
    setCl(0)
    const id = window.setInterval(() => setCl((c) => (c + 1) % 5), 1300)
    return () => window.clearInterval(id)
  }, [page])
  useEffect(() => {
    if (!page.mood) return
    const seq = [50, 82, 64, 18, 50]
    let n = 0
    const id = window.setInterval(() => { n = (n + 1) % seq.length; setMood(seq[n]) }, 1100)
    return () => window.clearInterval(id)
  }, [page])

  const s = moodStage(mood)
  const last = i === PAGES.length - 1
  return (
    <div className="flex flex-col gap-3">
      <div className="cafe-meet-row" aria-hidden>
        {page.kinds.map((kind) => (
          <div key={kind} className="cafe-meet-bottle">
            {[0, 1, 2, 3, 4].map((st) => (
              <img key={st} src={`/art/cafe/bottle-${kind}-${st}.webp`} alt="" className={`${st === Math.min(4, Math.floor(v / 25)) ? 'is-on' : ''}`} draggable={false} />
            ))}
          </div>
        ))}
        {page.kinds.length > 0 && <div className="cafe-meet-word">{stage(v)}</div>}
        {page.cloud && <img src={`/art/cafe/cloud-${cl}.webp`} alt="" className="cafe-meet-cloud" draggable={false} />}
        {page.mood && (
          <div className="cafe-meet-mood">
            <MoodFace stage={s} size={64} />
            <div className="cafe-gauge-bar is-mood"><b style={{ width: `${Math.max(6, mood)}%` }} /></div>
            <div className="text-[12px] font-bold">{t(`gauge.m${s}`)}</div>
          </div>
        )}
      </div>
      <Caption text={t(`meet.${page.key}`)} sub={t(`meet.${page.key}s`)} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5" aria-hidden>{PAGES.map((_, n) => <i key={n} className={`cafe-dot ${n === i ? 'on' : ''}`} />)}</div>
        <div className="flex gap-2">
          {!last && <Btn kind="ghost" onClick={next}>{t('hud.skip')}</Btn>}
          <Btn onClick={() => (last ? next() : setI(i + 1))}>{last ? t('meet.go') : t('hud.next')} ▸</Btn>
        </div>
      </div>
    </div>
  )
}
