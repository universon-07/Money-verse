import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LangSwitch } from '../components/Hud'
import { ShareProgress } from '../ngo/ShareProgress'
import { NewGameForm } from './NewGameForm'
import { WelcomeScene } from './WelcomeScene'
import { NAME_MAX, adoptLiveIfNeeded, deleteSlot, getActive, listSlots, loadSlot, renameSlot, saveSlot, startNewGame, type SlotMeta } from './slots'

const ENTERED = 'mm-entered'
const store = (): Storage | null => {
  try { return window.localStorage } catch { return null }
}

/** true once the player has picked a game in this tab */
export function hasEntered(): boolean {
  try { return sessionStorage.getItem(ENTERED) === '1' } catch { return false }
}
const enter = () => { try { sessionStorage.setItem(ENTERED, '1') } catch { /* the home screen just shows again */ } }

/** the page reloads so every store rehydrates from the swapped-in game */
const reloadAtStart = () => window.location.assign('/')

/** leave to the home screen (from the gear menu): the current game is saved first */
export function goHome(): void {
  const s = store()
  const id = s && getActive(s)
  if (s && id) saveSlot(s, id)
  try { sessionStorage.removeItem(ENTERED) } catch { /* ignore */ }
  reloadAtStart()
}

/** keeps the active slot up to date while playing: every few seconds and whenever the tab is hidden or closed */
export function useAutosave(on: boolean): void {
  useEffect(() => {
    if (!on) return undefined
    const s = store()
    if (!s) return undefined
    const save = () => { const id = getActive(s); if (id) saveSlot(s, id) }
    const every = window.setInterval(save, 4000)
    const hidden = () => { if (document.visibilityState === 'hidden') save() }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', hidden)
    return () => { window.clearInterval(every); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', hidden) }
  }, [on])
}

function Face({ slot }: { slot: SlotMeta }) {
  const src = slot.persona && slot.gender ? `/art/avatar/${slot.gender}-${slot.persona}-face.webp` : null
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-ink" style={{ background: '#F8EBCB' }}>
      {src ? <img src={src} alt="" draggable={false} className="h-full w-full object-cover object-top" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : <span aria-hidden className="text-[22px]">?</span>}
    </span>
  )
}

function SlotCard({ slot, onPlay, onChanged }: { slot: SlotMeta; onPlay: () => void; onChanged: () => void }) {
  const { t, i18n } = useTranslation()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(slot.name)
  const [confirm, setConfirm] = useState(false)
  const [sharing, setSharing] = useState(false)
  const date = new Date(slot.updatedAt).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const commit = () => { const s = store(); if (s) renameSlot(s, slot.id, name); setRenaming(false); onChanged() }
  return (
    <li className="paper p-3 text-left">
      <div className="flex items-center gap-3">
        <Face slot={slot} />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input autoFocus value={name} maxLength={NAME_MAX} aria-label={t('home.nameLabel')} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setRenaming(false) }} className="h-11 w-full rounded-md border-[1.5px] border-ink bg-transparent px-2 text-[16px]" />
          ) : (
            <div className="font-display lang-fit truncate text-[20px] leading-tight">{slot.name}</div>
          )}
          <div className="mt-0.5 text-[13px] leading-snug opacity-80">{t('home.places', { n: slot.placesDone })} · {date}</div>
        </div>
      </div>
      {confirm ? (
        <div className="mt-3" role="alertdialog" aria-label={t('home.deleteConfirm', { name: slot.name })}>
          <p className="m-0 mb-2 text-[14px] font-bold">{t('home.deleteConfirm', { name: slot.name })}</p>
          <div className="flex gap-2">
            <button type="button" className="ink-btn" onClick={() => { const s = store(); if (s) deleteSlot(s, slot.id); onChanged() }}>{t('home.deleteYes')}</button>
            <button type="button" className="ink-btn cream" autoFocus onClick={() => setConfirm(false)}>{t('home.cancel')}</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="ink-btn flex-1" onClick={onPlay}>{t('home.play')} ▸</button>
          {renaming ? (
            <button type="button" className="ink-btn cream" onClick={commit}>{t('home.save')}</button>
          ) : (
            <button type="button" className="ink-btn cream" onClick={() => { setName(slot.name); setRenaming(true) }}>{t('home.rename')}</button>
          )}
          <button type="button" className="ink-btn cream" onClick={() => setSharing((x) => !x)}>{t('home.share')}</button>
          <button type="button" className="ink-btn cream" onClick={() => setConfirm(true)}>{t('home.delete')}</button>
        </div>
      )}
      {sharing && <ShareProgress slot={slot} onClose={() => setSharing(false)} />}
    </li>
  )
}

/** The home screen: new game or load a saved one (any number, each with its own name). Built over the game, not into it. */
export default function Home() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [tick, setTick] = useState(0)
  const [view, setView] = useState<'menu' | 'load' | 'new'>('menu')
  useMemo(() => { const s = store(); if (s) adoptLiveIfNeeded(s, t('home.firstName')) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const slots = useMemo(() => { const s = store(); return s ? listSlots(s) : [] }, [tick])
  const defaultName = t('home.defaultName', { n: slots.length + 1 })
  useEffect(() => { if (slots.length === 0 && view === 'load') setView('menu') }, [slots.length, view])

  const play = (id: string) => { const s = store(); if (s && loadSlot(s, id)) { enter(); reloadAtStart() } }
  const begin = (name: string, classCode: string | null, rollNo: string) => { const s = store(); if (!s) { enter(); reloadAtStart(); return } startNewGame(s, name || defaultName, Date.now(), { classCode, rollNo }); enter(); reloadAtStart() }

  const letters = useMemo(() => Array.from(new Intl.Segmenter(i18n.language, { granularity: 'grapheme' }).segment(t('home.title')), (x) => x.segment), [i18n.language, t])

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      <WelcomeScene />
      <div className="wl-fore" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <div className="absolute right-3 top-3 z-10" style={{ top: 'max(12px, env(safe-area-inset-top))' }}><LangSwitch /></div>
        {/* the door to Minar Insights, the dashboard for teachers and NGOs */}
        <button type="button" className="wl-ngo absolute left-3 z-10" style={{ top: 'max(12px, env(safe-area-inset-top))' }} onClick={() => nav('/ngo')} title={t('home.facilitatorSub')}>
          <img src="/art/monument.webp" alt="" aria-hidden />
          <span>{t('home.facilitator')}</span>
        </button>
        <div className="wl-head">
          <h1 className="wl-title" aria-label={t('home.title')}>{letters.map((ch, n) => <span key={n} aria-hidden style={{ ['--i' as string]: n }}>{ch}</span>)}</h1>
          <p className="wl-tag">{t('home.tagline')}</p>
        </div>
        <div className="wl-spacer" />
        <div className="wl-card">
        {view === 'menu' && (
          <div className="rise flex w-full flex-col gap-3">
            <button type="button" className="wl-btn" autoFocus onClick={() => setView('new')}>{t('welcome.begin')} <span aria-hidden>▸</span></button>
            <button type="button" className="wl-btn cream" disabled={slots.length === 0} onClick={() => setView('load')}>
              {t('home.load')}{slots.length > 0 ? ` (${slots.length})` : ''}
            </button>
            {slots.length === 0 && <p className="m-0 text-center text-[13px] font-semibold opacity-80">{t('home.noSaves')}</p>}
          </div>
        )}

        {view === 'new' && <NewGameForm onBack={() => setView('menu')} onStart={begin} />}

        {view === 'load' && (
          <div className="rise flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display m-0 text-[22px]">{t('home.saved')}</h2>
              <button type="button" className="ink-btn cream" onClick={() => setView('menu')}>{t('home.back')}</button>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {slots.map((sl) => <SlotCard key={sl.id} slot={sl} onPlay={() => play(sl.id)} onChanged={() => setTick((n) => n + 1)} />)}
            </ul>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
