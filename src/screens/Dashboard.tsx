import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TitleCard } from '../components/TitleCard'
import { GoalBar } from '../components/Hud'
import { useArtReady } from '../art/ArtSlot'
import { useGame } from '../store/game'
import { buildSummaryView } from '../features/summary/view'
import { renderShareCard, shareCardLayout } from '../features/summary/share'

/** Goal screen: reached through the college gate once all four lessons are done. */
export default function Dashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const open = useArtReady('gate-open')
  const state = useGame()
  const sum = buildSummaryView(state)
  const download = () => {
    const pillars = Object.fromEntries(sum.pillars.map((p) => [p.id, `${t(p.nameKey)}: ${t(p.stateLabelKey)}`]))
    const skills = Object.fromEntries(sum.skills.map((s) => [s.id, t(s.labelKey)]))
    const ops = shareCardLayout(sum, { title: t('summary.shareTitle'), goal: `${sum.goal.percent}%`, pillars, skills, closing: t(sum.closingKey) })
    const a = document.createElement('a')
    a.href = renderShareCard(ops)
    a.download = 'minar.png'
    a.click()
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-4" style={{ background: 'linear-gradient(#92C9D3, #F8EBCB 70%)' }}>
      {open && <img src="/art/gate-open.webp" alt="" draggable={false} className="rise w-[min(70vw,360px)]" style={{ filter: 'drop-shadow(0 10px 16px rgba(58,42,36,.28))' }} />}
      <div className="w-full max-w-md">
        <TitleCard title={t('dashboard.title')}>
          <p className="m-0">{t('dashboard.body')}</p>
          <div className="mt-3 flex justify-center"><GoalBar /></div>
          <button type="button" className="ink-btn mt-4" onClick={() => nav('/')}>{t('buttons.backToCharminar')}</button>
        </TitleCard>
        <div className="paper mt-3 p-3 text-[14px] leading-snug">
          <div className="font-display text-[18px]">{t('summary.title')}</div>
          <ul className="m-0 mt-2 list-none p-0">
            {sum.pillars.map((p) => <li key={p.id}>{t(p.nameKey)}: {t(p.stateLabelKey)}</li>)}
          </ul>
          {sum.skills.length > 0 && <p className="m-0 mt-2">{sum.skills.map((s) => t(s.labelKey)).join(' · ')}</p>}
          <p className="m-0 mt-2">{t('summary.lessons', { n: sum.lessonsSeen.length })}</p>
          {sum.toBrighten.length > 0 && <p className="m-0 mt-1">{t('summary.brighten', { names: sum.toBrighten.map((id) => t(`pillars.${id}.name`)).join(', ') })}</p>}
          <p className="m-0 mt-2 font-bold">{t(sum.closingKey)}</p>
          <button type="button" className="ink-btn cream mt-3" onClick={download}>{t('summary.share')}</button>
        </div>
      </div>
    </div>
  )
}
