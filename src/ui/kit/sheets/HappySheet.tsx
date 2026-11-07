import { useTranslation } from 'react-i18next'
import { inr } from '../../../content/data'
import { useHappyView } from '../../../features/happy/hooks'
import { useMoments } from '../../../features/moments/hooks'
import { HAPPY } from '../../../happy/config'
import { useGame } from '../../../store/game'
import { AvatarFace } from '../MinarBar'
import { useCountTo } from '../hooks'
import { HappyIcon } from '../Icons'
import { Eyebrow, Sheet } from '../Sheet'

const MOMENT_ART: Record<string, string> = { chai: '/art/cafe/icon-chai.webp', festivalTreat: '/art/cafe/icon-gift.webp' }

function MomentArt({ id }: { id: string }) {
  const gender = useGame((s) => s.gender)
  const persona = useGame((s) => s.persona) ?? 'school'
  const src = MOMENT_ART[id] ?? `/art/cafe/seat/${gender}-${persona}-${gender === 'girl' ? 5 : 8}.webp`
  return <img src={src} alt="" draggable={false} />
}

export function HappySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const lang = useGame((s) => s.language)
  const v = useHappyView()
  const { moments, choose } = useMoments()
  const shown = useCountTo(open ? v.valueRounded : 0, 800)
  const fill = v.band === 'glowing' ? 'linear-gradient(90deg, #F5B93A, #FFD25A)' : v.band === 'ok' ? 'linear-gradient(90deg, #C79A42, #D8B05A)' : 'linear-gradient(90deg, #8C7B6E, #A39284)'
  const { bright, dim } = HAPPY.thresholds
  return (
    <Sheet open={open} onClose={onClose} title={t('kit.happy.title')} tone="rose" art={<HappyIcon band={v.band} size={38} />}>
      <div className="mk-card" style={{ background: 'linear-gradient(#FFF3DA, #FFF8E2)' }}>
        <div className="mk-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="mk-big"><HappyIcon band={v.band} size={34} className="mr-2 align-middle" />{shown}<span className="text-[18px] opacity-50"> / 100</span></div>
            <div className="mt-1 text-[15px] font-extrabold">{t(v.labelKey)}</div>
          </div>
          <div style={{ transform: 'scale(1.5)', transformOrigin: 'right center', margin: '8px 18px 8px 0' }}><AvatarFace size={44} band={v.band} /></div>
        </div>
        <div className="mk-meter mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v.percent}>
          <i style={{ width: `${v.percent}%`, background: fill }} />
          <span className="mk-tick" style={{ left: `${dim}%` }} /><span className="mk-tick" style={{ left: `${bright}%` }} />
        </div>
        <div className="mt-1 flex text-[11px] font-bold opacity-70" aria-hidden>
          <span style={{ width: `${dim}%` }}>{t('state.flicker')}</span>
          <span style={{ width: `${bright - dim}%` }}>{t('state.dim')}</span>
          <span style={{ flex: 1 }}>{t('state.bright')}</span>
        </div>
        <p className="mk-sub m-0 mt-2">{t('kit.happy.scale')}</p>
        {v.needsBreak && <p className="m-0 mt-2 rounded-lg border-[1.5px] border-ink bg-[#FDE2C8] p-2 text-[13.5px] font-bold">{t('kit.happy.tired', { count: v.sessionsSinceBreak })}</p>}
      </div>

      <div>
        <Eyebrow>{t('kit.happy.moments')}</Eyebrow>
        <ul className="mk-list">
          {moments.map((m) => (
            <li key={m.id}>
              <button type="button" className="mk-act" disabled={!m.affordable} onClick={() => choose(m.id)}>
                <MomentArt id={m.id} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[18px] leading-tight">{t(`moments.${m.id}.name`)}</span>
                  <span className="mk-sub block font-medium">{t(`moments.${m.id}.description`)}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    <span className="mk-chip">{m.cost > 0 ? t('kit.happy.cost', { x: inr(m.cost, lang) }) : t('kit.happy.free')}</span>
                    <span className="mk-chip" style={{ background: m.faded ? '#E6DCC4' : '#FFE9A8' }}>{m.faded ? t('moments.gainFaded') : t('kit.happy.gain', { n: m.gainNow })}</span>
                    {!m.affordable && <span className="mk-chip" style={{ background: '#F6CFC3' }}>{t('moments.cannotAfford')}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Eyebrow>{t('kit.happy.moves')}</Eyebrow>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="mk-card text-[13.5px] leading-snug"><b className="text-[#2F7A3A]">▲ {t('kit.happy.up')}</b><p className="m-0 mt-1">{t('kit.happy.u1')}</p><p className="m-0 mt-1">{t('kit.happy.u2')}</p></div>
          <div className="mk-card text-[13.5px] leading-snug"><b className="text-[#B63A25]">▼ {t('kit.happy.down')}</b><p className="m-0 mt-1">{t('kit.happy.d1')}</p><p className="m-0 mt-1">{t('kit.happy.d2')}</p></div>
        </div>
        <p className="mk-sub m-0 mt-2">{t('kit.happy.w1')} {t('kit.happy.w2')}</p>
      </div>
    </Sheet>
  )
}
