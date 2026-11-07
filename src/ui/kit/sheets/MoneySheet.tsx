import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PERSONAS, PILLARS, inr } from '../../../content/data'
import { pillarContribution, pillarMax } from '../../../progress/saved'
import { useGame } from '../../../store/game'
import { useCountTo } from '../hooks'
import { Eyebrow, Sheet } from '../Sheet'

export function MoneySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const s = useGame()
  const lang = s.language
  const [how, setHow] = useState(false)
  const saved = useCountTo(open ? s.savedAmount : 0, 900)
  const goal = s.goalAmount
  const pct = goal ? Math.min(100, (s.savedAmount / goal) * 100) : 0
  const reached = goal > 0 && s.savedAmount >= goal
  const each = pillarMax(s)
  return (
    <Sheet open={open} onClose={onClose} title={t('kit.money.title')} tone="gold" art={<img src="/art/cafe/coin.webp" alt="" width={44} height={44} draggable={false} />}>
      <div className="mk-card" style={{ background: 'linear-gradient(#FFF3C8, #FFF8E2)' }}>
        <div className="mk-row" style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div className="mk-sub">{t('kit.money.saved')}</div>
            <div className="mk-big">{inr(saved, lang)}</div>
          </div>
          <div className="text-right">
            <div className="mk-sub">{s.persona ? t(`personas.${s.persona}.goalFor`) : t('hud.goal')}</div>
            <div className="font-display text-[22px]">{inr(goal, lang)}</div>
          </div>
        </div>
        <div className="mk-meter mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(s.savedAmount)}>
          <i style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #E8AB3A, #F5CE62)' }} />
          {[25, 50, 75].map((p) => <span key={p} className="mk-tick" style={{ left: `${p}%` }} />)}
        </div>
        <div className="mt-2 text-[14px] font-bold">{reached ? t('kit.money.reached') : t('kit.money.toGo', { x: inr(Math.max(0, goal - s.savedAmount), lang) })}</div>
      </div>

      <div>
        <Eyebrow>{t('kit.money.from')}</Eyebrow>
        <ul className="mk-list">
          {PILLARS.map((p) => {
            const st = s.pillars[p.id]
            const lit = st.status === 'complete' && st.brightness
            const gained = Math.round(pillarContribution(s, p.id))
            return (
              <li key={p.id} className="mk-card mk-row">
                <span className={`mk-lamp ${lit ? st.brightness : 'off'}`}><img src={`/art/shop-${p.id}.webp`} alt="" draggable={false} /></span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[18px] leading-tight">{t(`pillars.${p.id}.name`)}</div>
                  <div className="mk-sub font-bold">{t(`pillars.${p.id}.topic`)}</div>
                  <div className="mk-sub">{lit ? t('kit.money.earned', { x: inr(gained, lang) }) : t('kit.money.notYet')}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-extrabold tabular-nums">{lit ? inr(gained, lang) : '—'}</div>
                  <div className="mk-sub">{t('kit.money.upTo', { x: inr(Math.round(each), lang) })}</div>
                </div>
              </li>
            )
          })}
        </ul>
        {s.lifeMomentSpend > 0 && <p className="mk-sub m-0 mt-2">{t('kit.money.spent', { x: inr(s.lifeMomentSpend, lang) })} {t('kit.money.spentHint')}</p>}
      </div>

      <div>
        <button type="button" className="mk-act" aria-expanded={how} onClick={() => setHow((v) => !v)}>
          <span className="flex-1">{t('kit.money.how')}</span>
          <span aria-hidden>{how ? '−' : '+'}</span>
        </button>
        {how && (
          <div className="mk-card mt-2 flex flex-col gap-2 text-[14px] leading-snug">
            <p className="m-0">{t('kit.money.h1')}</p>
            <p className="m-0">{t('kit.money.h2')}</p>
            <ul className="mk-list" style={{ gap: 6 }}>
              {(['bright', 'dim', 'flicker'] as const).map((b) => (
                <li key={b} className="mk-row"><span className={`mk-lamp ${b}`} style={{ width: 30, height: 30, borderRadius: 8 }}><img src="/art/flag-done.webp" alt="" draggable={false} /></span><span className="font-bold">{t(`kit.money.lamp.${b}`)}</span></li>
              ))}
            </ul>
            <p className="m-0">{t('kit.money.h3')}</p>
            {s.persona && <p className="mk-sub m-0">{t('kit.money.start', { x: inr(PERSONAS[s.persona].start, lang) })}</p>}
          </div>
        )}
      </div>
    </Sheet>
  )
}
