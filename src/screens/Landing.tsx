import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IslandMap } from '../island/IslandMap'
import { TopHud } from '../components/Hud'
import { useGame } from '../store/game'
import { pickCoachTip } from '../features/hub/coach'

export default function Landing() {
  const { t } = useTranslation()
  const storySeen = useGame((s) => s.storySeen)
  const [hint, setHint] = useState(true)
  const seen = useGame((s) => s.coachTipsSeen)
  const dismissAll = useGame((s) => s.dismissAllCoachTips)
  const tip = storySeen ? pickCoachTip(seen) : null
  useEffect(() => {
    const id = window.setTimeout(() => setHint(false), 8000)
    const off = () => setHint(false)
    window.addEventListener('pointerdown', off, { once: true })
    return () => { window.clearTimeout(id); window.removeEventListener('pointerdown', off) }
  }, [])
  if (!storySeen) return <Navigate to="/story" replace />
  return (
    <div className="absolute inset-0 overflow-hidden">
      <IslandMap />
      <TopHud />
      {tip && (
        <div className="absolute inset-x-0 z-30 flex justify-center px-3" style={{ top: 84 }}>
          <div className="paper rise flex max-w-[420px] items-center gap-3 p-3" role="status">
            <div className="min-w-0"><div className="font-display text-[16px]">{t(tip.titleKey)}</div><div className="text-[13px] leading-snug">{t(tip.bodyKey)}</div></div>
            <button type="button" className="ink-btn cream shrink-0" onClick={dismissAll}>{t('buttons.ok', { defaultValue: 'OK' })}</button>
          </div>
        </div>
      )}
      {hint && !tip && (
        <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-3" style={{ top: 84 }}>
          <div className="ink-chip rise px-3 py-1.5 text-center text-[13px] font-bold">{t('hud.walkHint')}</div>
        </div>
      )}
    </div>
  )
}
