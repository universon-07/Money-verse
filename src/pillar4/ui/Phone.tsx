import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppId, CaseDef, CaseProgress, PhoneItem, Zone } from '../types.ts'
import { TABS_OF_APP, THREAD_TABS, isChild, tabOf, zoneTextKey, type CaseIndex, type TabId } from '../engine/case.ts'
import type { T } from './useT.ts'
import { APP_STYLE, AppIcon, Icon, type IconName } from './icons.tsx'
import { Speaker } from './Speaker.tsx'
import { useHost } from '../host.tsx'

/** the device clock: the real current time and date, refreshed every few seconds (story timestamps stay fictional) */
function useClock() {
  const { language } = useHost()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 5000)
    return () => window.clearInterval(id)
  }, [])
  const loc = language === 'te' ? 'te-IN' : 'en-IN'
  const time = now.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', hour12: false })
  const date = now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' })
  return { time, date }
}

export interface Nav {
  app: AppId | null
  tab: TabId
  thread: string | null
  /** call items whose recording / highlights are open */
  expanded: string[]
  profile: boolean
}
export const HOME_NAV: Nav = { app: null, tab: 'inbox', thread: null, expanded: [], profile: false }

export interface PhoneCtx {
  def: CaseDef
  idx: CaseIndex
  progress: CaseProgress
  t: T
  zoom: boolean
  linkMode: boolean
  linkPick: string | null
  pulseZone: string | null
  glowApp: AppId | null
  activeZone: string | null
  pinnedZones: Set<string>
  nav: Nav
  setNav: (n: Nav | ((p: Nav) => Nav)) => void
  onZone: (zoneId: string) => void
  onItemLink: (itemId: string) => void
}
const PhoneContext = createContext<PhoneCtx | null>(null)
const usePhone = () => useContext(PhoneContext)!

const COLORS = ['#e57373', '#7986cb', '#4db6ac', '#ffb74d', '#9575cd', '#4fc3f7', '#f06292', '#81c784']
const colorFor = (s: string) => COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]
const initials = (s: string) => (s.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '#').toUpperCase()

function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  return <span className="avatar" style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.38 }} aria-hidden>{initials(name)}</span>
}

// ---- a tappable zone -------------------------------------------------------------------------------------
function ZoneSpan({ zone, block, format, variant }: { zone: Zone; block: boolean; format?: (text: string) => ReactNode; variant?: 'button' }) {
  const c = usePhone()
  const text = c.zoom && zone.zoomKey ? c.t(zone.zoomKey) : c.t(zoneTextKey(zone))
  const cls = ['zone', block ? 'is-block' : '', c.pinnedZones.has(zone.id) ? 'is-found' : '', c.activeZone === zone.id ? 'is-active' : '', c.pulseZone === zone.id ? 'is-pulse' : ''].join(' ')
  const style = variant === 'button' ? { background: '#1f3596', color: '#fff', textAlign: 'center' as const, borderRadius: 10, fontWeight: 700, marginTop: 8 } : undefined
  return (
    <span
      role="button" tabIndex={0} data-zone={zone.id} className={cls} style={style}
      onClick={(e) => { if (c.linkMode) return; e.stopPropagation(); c.onZone(zone.id) }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !c.linkMode) { e.preventDefault(); c.onZone(zone.id) } }}
    >
      {format ? format(text) : <span className="txt">{text}</span>}
    </span>
  )
}

function Body({ item, format }: { item: PhoneItem; format?: (text: string) => ReactNode }) {
  const head = item.zones.find((z) => z.part === 'head')
  const body = item.zones.filter((z) => z.part !== 'head')
  const multi = body.length > 1
  return (
    <>
      {head && <div className="text-[12.5px] font-bold" style={{ color: '#4a5562' }}><ZoneSpan zone={head} block={false} /></div>}
      <div>{body.map((z) => <ZoneSpan key={z.id} zone={z} block={!multi && !format} format={format} variant={z.id.endsWith('.btn') ? 'button' : undefined} />)}</div>
      {item.time && <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: '#7a8694' }}>{item.time}</div>}
    </>
  )
}

const spoken = (item: PhoneItem, t: T) => item.zones.map((z) => t(zoneTextKey(z))).join(' ')

// ---- formatters: the same single zone, laid out like the real app ---------------------------------------
const callFormat = (missed: boolean, out: boolean) => (text: string): ReactNode => {
  const cut = text.indexOf(', ')
  const name = cut > 0 ? text.slice(0, cut) : text
  const meta = cut > 0 ? text.slice(cut + 2) : ''
  const icon: IconName = missed ? 'missed' : out ? 'outgoing' : 'incoming'
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: missed ? '#fde8e8' : '#e4f4ea', color: missed ? '#c62828' : '#1c7a46' }}><Icon name={icon} size={20} /></span>
      <span className="min-w-0">
        <span className="block text-[15.5px] font-bold" style={{ color: missed ? '#c62828' : '#14181d' }}>{name}</span>
        <span className="block text-[13px]" style={{ color: '#5b6673' }}>{meta}</span>
      </span>
    </span>
  )
}

const TXN = /^(Paid to|Received from)\s+(.+?)\.\s+(Rs\.\s?[\d,]+)\.?\s*(.*)$/
const txnFormat = (text: string): ReactNode => {
  const m = TXN.exec(text)
  if (!m) return <span className="txt">{text}</span>
  const out = m[1] === 'Paid to'
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: out ? '#fdecea' : '#e4f4ea', color: out ? '#c62828' : '#1c7a46' }}><Icon name={out ? 'outgoing' : 'incoming'} size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">{out ? 'Paid to ' : 'Received from '}{m[2]}</span>
        {m[4] && <span className="block text-[12.5px]" style={{ color: '#5b6673' }}>{m[4]}</span>}
      </span>
      <span className="text-[16px] font-extrabold" style={{ color: out ? '#c62828' : '#1c7a46' }}>{out ? '−' : '+'}{m[3].replace('Rs. ', '₹')}</span>
    </span>
  )
}

// ---- one item ---------------------------------------------------------------------------------------------
function ItemView({ item, chatStyle }: { item: PhoneItem; chatStyle?: boolean }) {
  const c = usePhone()
  const { nav, setNav, idx } = c
  const children = idx.def.items.filter((i) => isChild(i) && i.thread === item.id)
  const open = nav.expanded.includes(item.id)
  const toggle = () => setNav((n) => ({ ...n, expanded: n.expanded.includes(item.id) ? n.expanded.filter((x) => x !== item.id) : [...n.expanded, item.id] }))
  const out = item.dir === 'out'
  const speak = <Speaker text={spoken(item, c.t)} />
  const wrap = `item ${c.linkMode ? 'is-linkmode' : ''} ${c.linkPick === item.id ? 'is-pick' : ''}`
  const onWrap = c.linkMode ? () => c.onItemLink(item.id) : undefined

  let inner: ReactNode
  switch (item.kind) {
    case 'sms': case 'chat': case 'dm': case 'caption':
      inner = (
        <div className={`flex items-end gap-1 px-3 py-1 ${out ? 'flex-row-reverse' : ''}`}>
          <div className={`bubble ${out ? 'is-out' : ''}`}><Body item={item} /></div>
          {speak}
        </div>
      )
      break
    case 'call': {
      const text = c.t(zoneTextKey(item.zones[0]))
      const missed = /missed/i.test(text)
      inner = (
        <div className="px-3 py-1.5" style={{ borderBottom: '1px solid #eef1f4' }}>
          <Body item={item} format={callFormat(missed, out)} />
          {children.length > 0 && (
            <button type="button" className="mt-1 inline-flex min-h-[40px] items-center gap-2 rounded-full px-3 text-[13.5px] font-bold" style={{ background: '#e4f4ea', color: '#1c7a46', border: 0 }} onClick={toggle} aria-expanded={open}>
              <Icon name="speaker" size={16} /> {open ? c.t('ui.phone.hideRecording') : c.t('ui.phone.recording')}
            </button>
          )}
        </div>
      )
      break
    }
    case 'videocall':
      inner = (
        <div className="px-3 py-2" style={{ borderBottom: '1px solid #eef1f4' }}>
          <div className="flex items-center gap-3">
            <Avatar name={item.thread ?? '?'} />
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-bold">{item.thread}</div>
              <div className="flex items-center gap-1 text-[13px]" style={{ color: '#5b6673' }}><Icon name="video" size={14} /> <Body item={item} /></div>
            </div>
          </div>
          <button type="button" className="mt-1.5 inline-flex min-h-[40px] items-center rounded-full px-3 text-[13.5px] font-bold" style={{ background: '#e4f4ea', color: '#0e8f6e', border: 0 }} onClick={toggle} aria-expanded={open}>
            {open ? c.t('ui.phone.hideHighlights') : c.t('ui.phone.highlights')}
          </button>
        </div>
      )
      break
    case 'highlight':
      inner = <div className="card-light" style={{ background: '#f4f6fb' }}><Body item={item} /></div>
      break
    case 'profile':
      inner = <div className="card-light" style={{ background: '#f1f8f5' }}><Body item={item} /></div>
      break
    case 'feed': case 'saved': case 'page': {
      const who = item.thread ?? 'feed'
      inner = (
        <div className="overflow-hidden" style={{ borderBottom: '8px solid #f3f4f6' }}>
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg,#f7b733,#fc4a1a,#b724c9)' }}><span className="block rounded-full border-2 border-white"><Avatar name={who} size={30} /></span></span>
            <span className="text-[14px] font-bold">{item.kind === 'saved' ? who : item.kind === 'page' ? who : 'Suggested'}</span>
          </div>
          {item.kind !== 'page' && <div className="h-28" style={{ background: `linear-gradient(135deg, ${colorFor(item.id)}55, #1b2f8655)` }} aria-hidden />}
          <div className="whitespace-pre-line px-3 py-2 text-[15.5px] leading-snug"><Body item={item} /></div>
          {item.kind !== 'page' && <div className="flex gap-4 px-3 pb-2" style={{ color: '#4a5562' }} aria-hidden><Icon name="heart" size={22} /><Icon name="comment" size={22} /><Icon name="send" size={22} /></div>}
        </div>
      )
      break
    }
    case 'history': case 'summary': case 'payees': case 'request': {
      if (item.kind === 'history') {
        inner = <div className="px-3 py-2" style={{ borderBottom: '1px solid #eef1f4' }}><Body item={item} format={txnFormat} /></div>
      } else if (item.kind === 'summary') {
        inner = (
          <div className="m-3 rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#3a63e0,#1b2f86)' }}>
            <div className="text-[12px] font-bold opacity-80">ACCOUNT</div>
            <div className="mt-1 text-[16px] font-bold" style={{ color: '#fff' }}><Body item={item} /></div>
          </div>
        )
      } else if (item.kind === 'request') {
        inner = <div className="m-3 rounded-2xl border p-3" style={{ borderColor: '#d6defa', background: '#f6f8ff' }}><div className="mb-1 text-[12px] font-bold" style={{ color: '#1f3596' }}>PAYMENT REQUEST</div><Body item={item} /></div>
      } else {
        inner = <div className="px-4 py-3" style={{ borderBottom: '1px solid #eef1f4' }}><div className="mb-0.5 text-[12px] font-bold" style={{ color: '#7a8694' }}>SAVED PAYEES</div><Body item={item} /></div>
      }
      break
    }
    case 'perm':
      inner = (
        <div className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: '1px solid #eef1f4' }}>
          <Avatar name={item.thread ?? '?'} size={38} />
          <div className="min-w-0 flex-1"><div className="text-[15.5px] font-bold">{item.thread}</div><div className="text-[14px]" style={{ color: '#445060' }}><Body item={item} /></div></div>
        </div>
      )
      break
    default:
      inner = <div className="card-light"><Body item={item} /></div>
  }
  void chatStyle
  return (
    <div className={wrap} data-item={item.id} onClick={onWrap}>
      {inner}
      {open && children.length > 0 && (
        <div className="mx-3 mb-2 mt-1 flex flex-col gap-1.5 rounded-xl p-2" style={{ background: '#f4f6f8', borderLeft: '3px solid #9aa7b5' }}>
          {children.map((ch) => <ItemView key={ch.id} item={ch} />)}
        </div>
      )}
    </div>
  )
}

// ---- tabs -----------------------------------------------------------------------------------------------
function TabView({ app, tab }: { app: AppId; tab: TabId }) {
  const c = usePhone()
  const { nav, setNav, idx, t } = c
  const items = idx.def.items.filter((i) => i.app === app && tabOf(i) === tab && !isChild(i))
  const main = items.filter((i) => i.kind !== 'profile')
  const profileItems = items.filter((i) => i.kind === 'profile')

  if (THREAD_TABS.includes(tab)) {
    const threads = [...new Set(main.map((i) => i.thread ?? ''))]
    if (!nav.thread) {
      return (
        <div>
          {threads.map((th) => {
            const last = [...main].reverse().find((i) => (i.thread ?? '') === th)!
            const preview = t(zoneTextKey(last.zones.find((z) => z.part !== 'head') ?? last.zones[0])).split('\n')[0]
            return (
              <button key={th} type="button" className="app-row" onClick={() => setNav((n) => ({ ...n, thread: th, profile: false }))}>
                <Avatar name={th} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><span className="truncate text-[15.5px] font-bold">{th}</span><span className="shrink-0 text-[11.5px]" style={{ color: '#7a8694' }}>{last.time?.split(' ').slice(-2).join(' ')}</span></span>
                  <span className="block truncate text-[13.5px]" style={{ color: '#5b6673' }}>{preview}</span>
                </span>
              </button>
            )
          })}
        </div>
      )
    }
    const inThread = main.filter((i) => (i.thread ?? '') === nav.thread)
    const prof = profileItems.filter((i) => i.thread === nav.thread)
    return (
      <div className={`flex flex-col gap-0.5 py-2 ${app === 'chatup' ? 'chat' : ''}`}>
        {prof.length > 0 && (
          <div className="px-3 pb-1">
            <button type="button" className="inline-flex min-h-[40px] items-center gap-1 rounded-full px-3 text-[13.5px] font-bold" style={{ background: '#e4f4ea', color: '#0e8f6e', border: 0 }} aria-pressed={nav.profile} onClick={() => setNav((n) => ({ ...n, profile: !n.profile }))}>
              <Icon name="user" size={16} /> {t('ui.phone.profile')}
            </button>
          </div>
        )}
        {nav.profile && prof.map((i) => <div key={i.id} className="px-3 pb-1"><ItemView item={i} /></div>)}
        {inThread.map((i) => <ItemView key={i.id} item={i} />)}
      </div>
    )
  }

  if (!main.length) return <div className="p-6 text-center" style={{ color: '#7a8694' }}>{t('ui.phone.empty')}</div>
  return (
    <div>
      {main.map((i) => <ItemView key={i.id} item={i} />)}
    </div>
  )
}

// ---- an app ----------------------------------------------------------------------------------------------
function AppScreen({ app }: { app: AppId }) {
  const c = usePhone()
  const { nav, setNav, idx, t } = c
  const st = APP_STYLE[app]
  const tabs = TABS_OF_APP[app].filter((tb) => idx.def.items.some((i) => i.app === app && tabOf(i) === tb))
  const tab = tabs.includes(nav.tab) ? nav.tab : tabs[0]
  const light = app === 'instaglam'
  const inThread = THREAD_TABS.includes(tab) && !!nav.thread
  const goBack = () => (inThread ? setNav((n) => ({ ...n, thread: null, profile: false })) : setNav(HOME_NAV))
  return (
    <div className={`app ${c.zoom ? 'is-zoom' : ''} ${app === 'chatup' && inThread ? 'chat-bg' : ''}`} style={{ ['--tab' as string]: st.tab }}>
      <div className="app-bar" style={{ background: st.bar, color: light ? '#14181d' : '#fff', borderBottom: light ? '1px solid #e3e7ec' : 'none' }}>
        <button type="button" onClick={goBack} aria-label={t('ui.back')} className="grid h-10 w-10 place-items-center rounded-full" style={{ background: 'transparent', border: 0 }}><Icon name="back" size={24} /></button>
        {inThread ? <Avatar name={nav.thread!} size={34} /> : null}
        <span className="min-w-0 flex-1 truncate text-[18px] font-bold" style={light && !inThread ? { background: 'linear-gradient(90deg,#f7b733,#fc4a1a,#b724c9)', WebkitBackgroundClip: 'text', color: 'transparent' } : undefined}>
          {inThread ? nav.thread : t(`ui.app.${app}`)}
        </span>
        {app === 'chatup' && <><Icon name="video" size={22} /><Icon name="phone" size={20} /></>}
        {app === 'paynow' && <Icon name="more" size={22} />}
      </div>
      {tabs.length > 1 && !inThread && (
        <div className="app-tabs" role="tablist">
          {tabs.map((tb) => (
            <button key={tb} type="button" role="tab" aria-selected={tb === tab} onClick={() => setNav((n) => ({ ...n, tab: tb, thread: null, profile: false }))}>{t(`ui.tab.${tb}`)}</button>
          ))}
        </div>
      )}
      <div className="app-body" data-scroll><TabView app={app} tab={tab} /></div>
    </div>
  )
}

const DECOYS: { name: string; icon: IconName; bg: string }[] = [
  { name: 'Camera', icon: 'camera', bg: 'linear-gradient(145deg,#6b7280,#374151)' },
  { name: 'Gallery', icon: 'image', bg: 'linear-gradient(145deg,#f59e0b,#b45309)' },
  { name: 'Clock', icon: 'clock', bg: 'linear-gradient(145deg,#475569,#1e293b)' },
  { name: 'Calculator', icon: 'calc', bg: 'linear-gradient(145deg,#f97316,#c2410c)' },
]

function HomeScreen() {
  const c = usePhone()
  const { time, date } = useClock()
  return (
    <div className="os-wallpaper flex min-h-0 flex-1 flex-col px-3 pb-3 pt-5">
      <div className="mb-5 px-1">
        <div className="text-[52px] font-light leading-none tracking-tight">{time}</div>
        <div className="mt-1 text-[14px] font-semibold opacity-80">{date}</div>
      </div>
      <div className="os-grid">
        {c.def.apps.map((app) => (
          <button key={app} type="button" className="os-cell" onClick={() => c.setNav({ ...HOME_NAV, app, tab: TABS_OF_APP[app][0] })} aria-label={c.t(`ui.app.${app}`)} data-app={app}>
            <AppIcon app={app} glow={c.glowApp === app} />
            <span className="os-app-label">{c.t(`ui.app.${app}`)}</span>
          </button>
        ))}
        {DECOYS.map((d) => (
          <div key={d.name} className="os-cell opacity-90" aria-hidden>
            <span className="os-icon" style={{ background: d.bg }}><Icon name={d.icon} size={28} /></span>
            <span className="os-app-label">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBar({ light }: { light: boolean }) {
  const { time } = useClock()
  return (
    <div className={`os-status ${light ? 'is-light' : ''}`} aria-hidden>
      <span>{time}</span>
      <span className="flex items-center gap-1.5">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="4.3" y="5.5" width="3" height="6.5" rx="1" /><rect x="8.6" y="3" width="3" height="9" rx="1" /><rect x="12.9" y="0" width="3" height="12" rx="1" opacity=".35" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1.5 4.2a9 9 0 0 1 13 0M3.8 6.8a5.6 5.6 0 0 1 8.4 0M6.2 9.2a2.4 2.4 0 0 1 3.6 0" /></svg>
        <span className="flex items-center gap-0.5"><span className="relative block h-[11px] w-[22px] rounded-[3px] border border-current p-[1.5px]"><span className="block h-full rounded-[1px] bg-current" style={{ width: '78%' }} /></span><span className="block h-[5px] w-[2px] rounded-r bg-current" /></span>
      </span>
    </div>
  )
}

export function Phone(props: PhoneCtx) {
  const { nav, t } = props
  useEffect(() => {
    if (!props.pulseZone) return undefined
    const id = window.setTimeout(() => document.querySelector(`[data-zone="${CSS.escape(props.pulseZone!)}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60)
    return () => window.clearTimeout(id)
  }, [props.pulseZone, nav.app, nav.tab, nav.thread])
  const lightChrome = nav.app !== null
  return (
    <PhoneContext.Provider value={props}>
      <div className="os-wrap">
        <div className="os-frame">
          <div className="os-screen" style={{ background: lightChrome ? '#fff' : '#000' }}>
            <div className="os-cam" aria-hidden />
            <div style={{ background: nav.app ? (nav.app === 'instaglam' ? '#fff' : APP_STYLE[nav.app].bar) : 'transparent', position: nav.app ? 'static' : 'absolute', inset: 0, bottom: 'auto', zIndex: 3 }}>
              <StatusBar light={nav.app === 'instaglam'} />
            </div>
            {nav.app ? <AppScreen app={nav.app} /> : <HomeScreen />}
            <button type="button" className={`os-home-bar ${lightChrome ? 'is-light' : ''}`} style={{ background: lightChrome ? '#fff' : 'transparent' }} onClick={() => props.setNav(HOME_NAV)} aria-label={t('ui.home')}><i /></button>
          </div>
        </div>
      </div>
    </PhoneContext.Provider>
  )
}
