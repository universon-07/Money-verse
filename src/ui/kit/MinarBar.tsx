import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inr } from '../../content/data'
import { useHappyView } from '../../features/happy/hooks'
import { useGame } from '../../store/game'
import { useCountTo, useDelta } from './hooks'
import { HappyIcon } from './Icons'
import { HappySheet } from './sheets/HappySheet'
import { MoneySheet } from './sheets/MoneySheet'
import { ProfileSheet } from './sheets/ProfileSheet'
import { SettingsSheet } from './sheets/SettingsSheet'
import './minar.css'

type Open = null | 'profile' | 'money' | 'happy' | 'settings'

export function AvatarFace({ size = 38, band }: { size?: number; band?: 'glowing' | 'ok' | 'tired' }) {
  const persona = useGame((s) => s.persona)
  const gender = useGame((s) => s.gender)
  const face = (
    <span className="mk-face" style={{ width: size, height: size }}>
      {persona ? <img src={`/art/avatar/${gender}-${persona}-face.webp`} alt="" draggable={false} /> : <span aria-hidden className="grid h-full w-full place-items-center text-[18px]">?</span>}
    </span>
  )
  if (!band) return face
  const cls = band === 'glowing' ? 'bright' : band === 'ok' ? 'dim' : 'flicker'
  return <span className={`mk-ring ${cls}`}>{face}</span>
}

/**
 * The top bar on every shell screen: you (profile), your money, your happiness, and settings.
 * Each part is one big tap target that opens a panel explaining itself. Changes count up and show a small +/- tag.
 */
export function MinarBar({ replay = true, hideProfile = false }: { replay?: boolean; hideProfile?: boolean }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const saved = useGame((s) => s.savedAmount)
  const goal = useGame((s) => s.goalAmount)
  const happy = useHappyView()
  const [open, setOpen] = useState<Open>(null)
  const shownSaved = useCountTo(saved)
  const shownHappy = useCountTo(happy.valueRounded, 500)
  const dMoney = useDelta(saved)
  const dHappy = useDelta(happy.valueRounded)
  const pct = goal ? Math.min(100, (saved / goal) * 100) : 0
  const bandCls = happy.band === 'glowing' ? 'happy-bright' : happy.band === 'ok' ? 'happy-dim' : 'happy-flicker'
  const close = () => setOpen(null)
  return (
    <>
      <div className="mk-bar" role="toolbar" aria-label="Minar">
        {!hideProfile && (
          <button type="button" className="mk-pill mk-profile" aria-label={t('kit.bar.profile')} onClick={() => setOpen('profile')}>
            <AvatarFace size={42} band={happy.band} />
          </button>
        )}
        <div className="mk-bar-mid">
          <button type="button" className={`mk-pill mk-money ${dMoney > 0 ? 'is-gain' : ''}`} aria-label={`${t('kit.bar.money')}: ${inr(saved, lang)} / ${inr(goal, lang)}`} onClick={() => setOpen('money')}>
            <img className="mk-coin" src="/art/cafe/coin.webp" alt="" draggable={false} />
            <span className="mk-pill-text">
              <span className="mk-pill-num">{inr(shownSaved, lang)} <small>/ {inr(goal, lang)}</small></span>
              <span className="mk-track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(saved)}>
                <span className="mk-fill gold" style={{ width: `${pct}%` }} />
                {[25, 50, 75].map((p) => <span key={p} className="mk-tick" style={{ left: `${p}%` }} />)}
              </span>
            </span>
            {dMoney !== 0 && <span className={`mk-delta ${dMoney < 0 ? 'neg' : ''}`} aria-live="polite">{dMoney > 0 ? '+' : '−'}{inr(Math.abs(dMoney), lang)}</span>}
          </button>
          <button type="button" className="mk-pill mk-happy" aria-label={`${t('kit.bar.happy')}: ${happy.valueRounded}`} onClick={() => setOpen('happy')}>
            <HappyIcon band={happy.band} size={30} />
            <span className="mk-pill-text">
              <span className="mk-pill-num">{t(happy.labelKey)} <small>{shownHappy}</small></span>
              <span className="mk-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={happy.percent}>
                <span className={`mk-fill ${bandCls}`} style={{ width: `${happy.percent}%` }} />
                <span className="mk-tick" style={{ left: '35%' }} />
                <span className="mk-tick" style={{ left: '60%' }} />
              </span>
            </span>
            {dHappy !== 0 && <span className={`mk-delta ${dHappy < 0 ? 'neg' : ''}`} aria-live="polite">{dHappy > 0 ? '+' : '−'}{Math.abs(dHappy)}</span>}
          </button>
        </div>
        <button type="button" className="mk-pill mk-gear" style={{ padding: 0, borderRadius: '50%' }} aria-label={t('hud.settings')} onClick={() => setOpen('settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none" stroke="#3A2A24" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7" />
          </svg>
        </button>
      </div>
      <ProfileSheet open={open === 'profile'} onClose={close} />
      <MoneySheet open={open === 'money'} onClose={close} />
      <HappySheet open={open === 'happy'} onClose={close} />
      <SettingsSheet open={open === 'settings'} onClose={close} replay={replay} />
    </>
  )
}
