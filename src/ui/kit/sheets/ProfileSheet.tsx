import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PILLARS, SKILLS } from '../../../content/data'
import { getActive, listSlots, type SlotMeta } from '../../../home/slots'
import { ShareProgress } from '../../../ngo/ShareProgress'
import { useGame } from '../../../store/game'
import { Eyebrow, Sheet } from '../Sheet'
import { TeacherCard } from './TeacherCard'

function activeSlot(): SlotMeta | null {
  try {
    const s = window.localStorage
    const id = getActive(s)
    return listSlots(s).find((x) => x.id === id) ?? null
  } catch {
    return null
  }
}

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const s = useGame()
  const [sharing, setSharing] = useState(false)
  const slot = useMemo(() => (open ? activeSlot() : null), [open])
  const lit = PILLARS.filter((p) => s.pillars[p.id].status === 'complete').length
  const attempts = PILLARS.reduce((n, p) => n + s.pillars[p.id].attempts, 0)
  const persona = s.persona
  return (
    <Sheet open={open} onClose={onClose} title={t('kit.profile.title')} tone="sky">
      <div className="mk-card mk-row" style={{ background: 'linear-gradient(135deg, #D9EEF1, #FFF8E2 70%)', alignItems: 'flex-end' }}>
        <div className="relative flex h-[132px] w-[84px] shrink-0 items-end justify-center">
          <div className="absolute bottom-0 h-3 w-16 rounded-[50%]" style={{ background: 'rgba(58,42,36,.22)' }} />
          {persona && <img className="anim-float relative h-full w-auto object-contain" src={`/art/avatar/${s.gender}-${persona}-0.webp`} alt="" draggable={false} />}
        </div>
        <div className="min-w-0 flex-1 pb-1">
          {slot && <div className="mk-sub">{t('kit.profile.saveName')}</div>}
          {slot && <div className="font-display lang-fit truncate text-[22px] leading-tight">{slot.name}</div>}
          {persona && <div className="mt-1 text-[15px] font-extrabold">{t(`personas.${persona}.name`)}</div>}
          {persona && <div className="mk-sub">{t('kit.profile.goalFor')}: {t(`personas.${persona}.goalFor`)}</div>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="mk-chip">{t('kit.profile.lit', { n: lit })}</span>
            <span className="mk-chip">{t(`festivals.${s.festival}`)}</span>
            <span className="mk-chip">{t('kit.profile.played', { n: attempts })}</span>
          </div>
        </div>
      </div>

      <TeacherCard />

      <div>
        <Eyebrow>{t('kit.profile.places')}</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {PILLARS.map((p) => {
            const st = s.pillars[p.id]
            const isLit = st.status === 'complete' && st.brightness
            return (
              <div key={p.id} className="flex flex-col items-center gap-1 text-center">
                <span className={`mk-lamp ${isLit ? st.brightness : 'off'}`} style={{ width: 58, height: 58 }}><img src={`/art/shop-${p.id}.webp`} alt="" draggable={false} /></span>
                <span className="text-[11.5px] font-bold leading-tight">{t(`pillars.${p.id}.name`)}</span>
                <span className="text-[11px] opacity-70">{isLit ? t(`state.${st.brightness}`) : t(`state.${st.status === 'in_progress' ? 'partial' : 'notStarted'}`)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <Eyebrow>{t('kit.profile.skills')}</Eyebrow>
        <ul className="mk-list" style={{ gap: 8 }}>
          {SKILLS.map((k) => (
            <li key={k}>
              <div className="flex justify-between text-[13.5px] font-bold"><span>{t(`skills.${k}`)}</span><span className="opacity-60">{s.skills[k] > 0 ? `${Math.round(s.skills[k] * 100)}%` : t('kit.profile.skillNone')}</span></div>
              <div className="mk-meter" style={{ height: 12 }}><i style={{ width: `${Math.round(s.skills[k] * 100)}%`, background: 'linear-gradient(90deg, #5BB5D6, #86B35F)' }} /></div>
            </li>
          ))}
        </ul>
      </div>

      {(s.diamonds > 0 || s.shieldPieces.length > 0 || s.title) && (
        <div>
          <Eyebrow>{t('kit.profile.rewards')}</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {s.diamonds > 0 && <span className="mk-chip">{t('kit.profile.diamonds', { n: s.diamonds })}</span>}
            {s.shieldPieces.length > 0 && <span className="mk-chip">{t('kit.profile.shield', { n: s.shieldPieces.length })}</span>}
            {s.title && <span className="mk-chip">{s.title}</span>}
          </div>
        </div>
      )}

      {slot && (
        <div>
          <button type="button" className="mk-act" onClick={() => setSharing((v) => !v)}>
            <span className="flex-1">{t('kit.profile.otherWays')}</span><span aria-hidden>{sharing ? '−' : '+'}</span>
          </button>
          {sharing && <div className="mt-2"><ShareProgress slot={slot} onClose={() => setSharing(false)} /></div>}
        </div>
      )}
    </Sheet>
  )
}
