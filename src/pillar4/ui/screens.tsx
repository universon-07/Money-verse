import { useEffect, useRef, useState } from 'react'
import { useHost, type Lang } from '../host.tsx'
import { CASES, JOURNEY, MYSTERY_IDS } from '../content/index.ts'
import { firstTryClues, TITLE_ORDER } from '../engine/progress.ts'
import { indexCase } from '../engine/case.ts'
import { diamondsOf, shieldPiecesOf, titleOf, unlocked, usePillar4 } from '../store.ts'
import { useT } from './useT.ts'
import { Icon, ShieldMark } from './icons.tsx'
import { clueExcerpt } from './Notebook.tsx'
import { canvasToBlob, drawPlaybook } from './playbook.ts'
import { useReduceMotion } from './feedback.ts'

export function Page({ children, onBack, title, right }: { children: React.ReactNode; onBack: () => void; title: string; right?: React.ReactNode }) {
  const t = useT()
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--p4-bg)' }}>
      <header className="flex shrink-0 items-center gap-2 px-3 py-2" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <button type="button" className="p4-btn icon" onClick={onBack} aria-label={t('ui.back')}><Icon name="back" /></button>
        <div className="p4-chip min-w-0 flex-1 !justify-start truncate !text-[14px]">{title}</div>
        {right}
      </header>
      <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-10 pt-4">{children}</div>
    </div>
  )
}

export function PointsChip() {
  const d = usePillar4(diamondsOf)
  const t = useT()
  return <div className="p4-chip is-accent" aria-label={`${t('ui.points')}: ${d}`}><Icon name="star" size={14} /> {d}</div>
}

/** compact English / Telugu switch, always visible; the host owns the language state */
export function LangToggle() {
  const { language, setLanguage } = useHost()
  const opts: { l: Lang; label: string }[] = [{ l: 'en', label: 'EN' }, { l: 'te', label: 'తె' }]
  return (
    <div className="flex overflow-hidden rounded-lg" style={{ border: '1px solid var(--p4-line)' }} role="group" aria-label="Language">
      {opts.map((o) => (
        <button key={o.l} type="button" aria-pressed={language === o.l || (o.l === 'en' && language === 'hi')} className="min-h-[40px] min-w-[44px] px-2 text-[13.5px] font-bold" onClick={() => setLanguage(o.l)}
          style={{ background: language === o.l || (o.l === 'en' && language === 'hi') ? 'var(--p4-accent)' : 'var(--p4-surface2)', color: language === o.l || (o.l === 'en' && language === 'hi') ? 'var(--p4-accent-ink)' : 'inherit', border: 0 }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const STORY_BEATS = ['b1', 'b2', 'b3', 'b4'] as const

/** the opening: Raju Bhai from the phone kiosk tells the story in a few quick beats (first run only) */
function Backstory({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const t = useT()
  const reduce = useReduceMotion()
  const [i, setI] = useState(0)
  const last = i === STORY_BEATS.length - 1
  return (
    <Page onBack={onBack} title={t('ui.subtitle')} right={<LangToggle />}>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <img src="/art/npc-kiosk-phone.webp" alt="" draggable={false} className={`h-[34vh] max-h-[280px] object-contain ${reduce ? '' : 'idle'}`} style={{ filter: 'drop-shadow(0 6px 8px rgba(58,42,36,.3))' }} />
        <div className="p4-chip is-accent">{t('ui.story.name')} · {t('ui.story.role')}</div>
        <div key={i} className="p4-panel rise w-full max-w-md !p-4 text-left text-[18px] font-semibold leading-snug" role="status">
          {t(`ui.story.${STORY_BEATS[i]}`)}
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {STORY_BEATS.map((k, n) => <span key={k} style={{ width: n === i ? 22 : 8, height: 8, borderRadius: 4, background: n <= i ? 'var(--p4-accent)' : 'var(--p4-line)', transition: 'width .25s' }} />)}
        </div>
        <div className="flex w-full max-w-md gap-2">
          <button type="button" className="p4-btn" onClick={onDone}>{t('ui.story.skip')}</button>
          <button type="button" className="p4-btn primary flex-1" autoFocus onClick={() => (last ? onDone() : setI(i + 1))}>{last ? t('ui.story.go') : t('ui.story.next')}</button>
        </div>
      </div>
    </Page>
  )
}

// ---- Intro ----------------------------------------------------------------------------------------------
export function Intro({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const t = useT()
  const profile = usePillar4((s) => s.profile)
  const setProfile = usePillar4((s) => s.setProfile)
  const [told, setTold] = useState(false)
  if (!told) return <Backstory onDone={() => setTold(true)} onBack={onBack} />
  return (
    <Page onBack={onBack} title={t('ui.subtitle')} right={<LangToggle />}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="p4-eyebrow">{t('ui.intro.eyebrow')}</div>
          <h1 className="p4-h1 mt-1" style={{ fontSize: 28 }}>{t('ui.title')}</h1>
        </div>
        <fieldset className="m-0 border-0 p-0">
          <legend className="p4-eyebrow mb-2">{t('ui.intro.level')}</legend>
          <div className="flex flex-col gap-2">
            {(['beginner', 'confident'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={profile.level === l} className={`p4-option ${profile.level === l ? 'is-right' : ''}`} onClick={() => setProfile({ level: l })}>
                <span className="text-[15px] font-semibold">{t(`ui.level.${l}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1.5">
          <span className="p4-eyebrow">{t('ui.intro.nickname')}</span>
          <input value={profile.nickname} maxLength={16} onChange={(e) => setProfile({ nickname: e.target.value })} className="min-h-[48px] rounded-lg px-3 text-[16px]" style={{ userSelect: 'text', background: 'var(--p4-surface2)', border: '1px solid var(--p4-line)', color: 'inherit' }} />
        </label>
        <p className="m-0 flex gap-2 text-[13.5px] p4-muted"><Icon name="lock" size={16} /> {t('ui.intro.privacy')}</p>
        <button type="button" className="p4-btn primary" onClick={onStart}>{t('ui.intro.start')}</button>
      </div>
    </Page>
  )
}

// ---- Case desk ------------------------------------------------------------------------------------------
interface MapProps {
  onOpen: (key: string) => void
  onNav: (v: 'master' | 'playbook' | 'settings') => void
  onHub: () => void
}

export function CaseMap({ onOpen, onNav, onHub }: MapProps) {
  const t = useT()
  const { avatarSrc } = useHost()
  const s = usePillar4()
  const title = titleOf(s)
  const rank = TITLE_ORDER.indexOf(title)
  const pieces = shieldPiecesOf(s)
  const rows = [
    ...JOURNEY.map((id, i) => ({
      key: id, label: id === 'TUT' ? t('ui.map.tutorial') : t('ui.map.case', { n: i }), title: t(`${id}.title`), tag: t(`${id}.tag`),
      closed: s.completed.includes(id), started: !!s.progress[id] && s.progress[id].phase !== 'briefing',
    })),
    {
      key: 'MYSTERY', label: t('ui.map.mystery'), title: t('ui.map.mysteryBlurb'), tag: t('ui.map.mysteryTag'),
      closed: MYSTERY_IDS.some((m) => s.completed.includes(m)),
      started: !!s.mysteryCurrent && !!s.progress[s.mysteryCurrent] && !s.progress[s.mysteryCurrent].closed && s.progress[s.mysteryCurrent].phase !== 'briefing',
    },
  ]
  return (
    <Page onBack={onHub} title={t('ui.title')} right={<><PointsChip /><LangToggle /></>}>
      <div className="p4-panel flex items-center gap-4">
        {avatarSrc && <img src={avatarSrc} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover object-top" style={{ border: '1.5px solid var(--p4-ink)' }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} draggable={false} />}
        <div className="min-w-0 flex-1">
          <div className="p4-eyebrow">{t('ui.map.rank')}</div>
          <div className="p4-h2 truncate">{s.profile.nickname ? `${s.profile.nickname} · ` : ''}{t(`ui.title.${title}`)}</div>
          <div className="p4-bar mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={rank}><i style={{ width: `${(rank / 4) * 100}%` }} /></div>
          <div className="mt-1 text-[12.5px] p4-muted">{rank < 4 ? t('ui.map.nextRank', { name: t(`ui.title.${TITLE_ORDER[rank + 1]}`) }) : t('ui.map.topRank')}</div>
        </div>
        <ShieldMark pieces={pieces} size={58} />
      </div>

      <h2 className="p4-eyebrow mb-2 mt-6">{t('ui.map.heading')}</h2>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => {
          const open = unlocked(s, r.key)
          return (
            <div key={r.key} className="p4-panel flex items-center gap-3 !p-3.5" style={{ opacity: open ? 1 : 0.55 }}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[15px] font-extrabold" style={{ background: r.closed ? 'color-mix(in srgb, var(--p4-ok) 22%, var(--p4-surface2))' : 'var(--p4-surface2)', color: r.closed ? 'var(--p4-ok)' : 'inherit' }}>
                {r.closed ? <Icon name="check" size={20} /> : open ? i + 1 : <Icon name="lock" size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="p4-eyebrow">{r.label} · {r.tag}</div>
                <div className="text-[15.5px] font-bold leading-tight">{r.title}</div>
                {!open && <div className="mt-0.5 text-[12.5px] p4-muted">{t('ui.map.locked')}</div>}
              </div>
              <button type="button" className="p4-btn primary" disabled={!open} data-case={r.key} onClick={() => onOpen(r.key)}>
                {r.closed ? t('ui.map.replay') : r.started ? t('ui.map.resume') : t('ui.map.play')}
              </button>
            </div>
          )
        })}
        <div className="p4-panel flex items-center gap-3 !p-3.5" style={{ opacity: unlocked(s, 'MASTER') ? 1 : 0.55 }}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: 'var(--p4-surface2)' }}><Icon name={unlocked(s, 'MASTER') ? 'search' : 'lock'} size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="p4-eyebrow">{t('ui.map.master')}{s.master.done ? ' ✓' : ''}</div>
            <div className="text-[14.5px] leading-snug">{t('ui.map.masterBlurb')}</div>
          </div>
          <button type="button" className="p4-btn primary" disabled={!unlocked(s, 'MASTER')} data-case="MASTER" onClick={() => onNav('master')}>{s.master.done ? t('ui.map.review') : t('ui.map.play')}</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="p4-btn" disabled={!s.master.done} onClick={() => onNav('playbook')}><Icon name="note" size={18} /> {t('ui.map.playbook')}</button>
        <button type="button" className="p4-btn" onClick={() => onNav('settings')}><Icon name="gear" size={18} /> {t('ui.map.settings')}</button>
      </div>
      <p className="mt-4 text-[12.5px] p4-muted">{t('ui.intro.privacy')}</p>
    </Page>
  )
}

// ---- Settings -------------------------------------------------------------------------------------------
function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="p4-option" onClick={onClick}>
      <span className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5" style={{ background: on ? 'var(--p4-ok)' : 'rgba(58,42,36,.3)' }}>
        <span className="h-5 w-5 rounded-full bg-white" style={{ marginLeft: on ? 'auto' : 0 }} />
      </span>
      <span className="text-[15px] font-semibold">{label}</span>
    </button>
  )
}

export function Settings({ onBack }: { onBack: () => void }) {
  const t = useT()
  const s = usePillar4()
  const reduce = useReduceMotion()
  const [confirm, setConfirm] = useState<'all' | 'new' | null>(null)
  const [code, setCode] = useState(s.profile.classCode ?? '')
  return (
    <Page onBack={onBack} title={t('ui.settings.title')}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3"><span className="text-[15px] font-semibold">{t('ui.settings.language')}</span><LangToggle /></div>
        <Toggle label={t('ui.settings.reduce')} on={reduce} onClick={() => s.setSettings({ reduceMotion: !reduce })} />
        <Toggle label={t('ui.settings.sound')} on={s.settings.sound} onClick={() => s.setSettings({ sound: !s.settings.sound })} />
        <div>
          <div className="p4-eyebrow mb-1.5">{t('ui.settings.level')}</div>
          <div className="flex gap-2">
            {(['beginner', 'confident'] as const).map((l) => (
              <button key={l} type="button" aria-pressed={s.profile.level === l} className="p4-btn flex-1" onClick={() => s.setProfile({ level: l })}>{t(`ui.level.${l}`).split(':')[0]}</button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="p4-eyebrow">{t('ui.settings.classCode')}</span>
          <input value={code} maxLength={12} onChange={(e) => setCode(e.target.value.toUpperCase())} onBlur={() => s.setProfile({ classCode: code.trim() || null })} className="min-h-[48px] rounded-lg px-3 text-[16px]" style={{ userSelect: 'text', background: 'var(--p4-surface2)', border: '1px solid var(--p4-line)', color: 'inherit' }} />
          <span className="text-[13px] leading-snug p4-muted">{t('ui.settings.classCode.body')}</span>
        </label>
        <div>
          <div className="p4-eyebrow mb-1.5">{t('ui.settings.resetCase')}</div>
          <div className="flex flex-wrap gap-2">
            {[...JOURNEY, ...MYSTERY_IDS].filter((id) => s.progress[id]).map((id) => (
              <button key={id} type="button" className="p4-btn !min-h-[40px]" onClick={() => s.resetCase(id)}>{id}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="p4-btn" onClick={() => setConfirm('new')}>{t('ui.settings.newDetective')}</button>
          <button type="button" className="p4-btn danger" onClick={() => setConfirm('all')}>{t('ui.settings.resetAll')}</button>
        </div>
        {confirm && (
          <div className="p4-panel" style={{ borderColor: 'var(--p4-danger)' }}>
            <p className="m-0 mb-3 text-[14.5px]">{confirm === 'all' ? t('ui.settings.resetAll.confirm') : t('ui.settings.newDetective.body')}</p>
            <div className="flex gap-2">
              <button type="button" className="p4-btn primary" onClick={() => { if (confirm === 'all') s.resetEverything(); else s.newDetective(); setConfirm(null); onBack() }}>{t('ui.settings.yes')}</button>
              <button type="button" className="p4-btn" onClick={() => setConfirm(null)}>{t('ui.settings.cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}

// ---- Field card (the shareable Playbook) --------------------------------------------------------------
export function Playbook({ onBack }: { onBack: () => void }) {
  const t = useT()
  const { language } = useHost()
  const s = usePillar4()
  const ref = useRef<HTMLCanvasElement>(null)
  const title = titleOf(s)
  const mystery = s.mysteryCurrent
  const clues = [...JOURNEY.filter((j) => j !== 'TUT'), ...(mystery ? [mystery] : [])]
    .flatMap((id) => (s.progress[id] ? firstTryClues(CASES[id], s.progress[id]).map((cid) => clueExcerpt(CASES[id], indexCase(CASES[id]).clues.get(cid)!, t)) : []))
    .slice(0, 3)
  const data = {
    heading: t('ui.playbook.title'), title: t(`ui.title.${title}`), name: s.profile.nickname || t('ui.playbook.analyst'),
    rulesHeading: t('ui.master.rules'), rules: (['pause', 'verify', 'protect'] as const).map((r) => t(`ui.rule.${r}`)),
    stepsHeading: t('ui.playbook.steps'), steps: [1, 2, 3, 4, 5].map((n) => t(`ui.step.${n}.name`)),
    clueHeading: t('ui.playbook.proud'), clues, tell: t('ui.playbook.tell'), help: t('ui.help.4'), fake: t('ui.playbook.fake'),
  }
  const key = JSON.stringify(data)
  useEffect(() => {
    if (ref.current) void drawPlaybook(ref.current, data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, language])

  const save = async () => {
    if (!ref.current) return
    const blob = await canvasToBlob(ref.current)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-safety-playbook.png'
    a.click()
    URL.revokeObjectURL(url)
  }
  const share = async () => {
    if (!ref.current) return
    const blob = await canvasToBlob(ref.current)
    if (!blob) return
    const file = new File([blob], 'my-safety-playbook.png', { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] })
      else await save()
    } catch { /* share cancelled */ }
  }
  if (!s.master.done) return <Page onBack={onBack} title={t('ui.map.playbook')}><p className="p4-panel">{t('ui.playbook.locked')}</p></Page>
  return (
    <Page onBack={onBack} title={t('ui.map.playbook')}>
      <canvas ref={ref} className="w-full rounded-xl" style={{ border: '1px solid var(--p4-line)' }} aria-label={t('ui.playbook.title')} />
      <label className="mt-4 flex min-h-[48px] items-center gap-3 text-[15px] font-semibold">
        <input type="checkbox" className="h-5 w-5" checked={s.told} onChange={(e) => s.setTold(e.target.checked)} /> {t('ui.playbook.told')}
      </label>
      <div className="mt-2 flex gap-2">
        <button type="button" className="p4-btn primary" onClick={() => void save()}>{t('ui.playbook.download')}</button>
        <button type="button" className="p4-btn" onClick={() => void share()}>{t('ui.playbook.share')}</button>
      </div>
    </Page>
  )
}
