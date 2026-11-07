import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { LANGS, type Lang } from '../../../content/data'
import { goHome } from '../../../home/Home'
import { restartAllGames } from '../../../host/restart'
import { useGame, useLite } from '../../../store/game'
import { Eyebrow, Sheet } from '../Sheet'

export function SettingsSheet({ open, onClose, replay = true }: { open: boolean; onClose: () => void; replay?: boolean }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const lang = useGame((s) => s.language)
  const setLanguage = useGame((s) => s.setLanguage)
  const lite = useLite()
  const setLite = useGame((s) => s.setLite)
  const classCode = useGame((s) => s.classCode)
  const setClassCode = useGame((s) => s.setClassCode)
  const rollNo = useGame((s) => s.rollNo)
  const setRollNo = useGame((s) => s.setRollNo)
  const resetProgress = useGame((s) => s.resetProgress)
  const [ask, setAsk] = useState(false)
  const done = () => { setAsk(false); onClose() }
  return (
    <Sheet open={open} onClose={done} title={t('kit.settings.title')}>
      <div>
        <Eyebrow>{t('hud.language')}</Eyebrow>
        <div className="mk-seg" role="radiogroup" aria-label={t('hud.language')}>
          {LANGS.map((l: Lang) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLanguage(l)}>{t(`lang.${l}`)}</button>
          ))}
        </div>
      </div>

      <div className="mk-card mk-row">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">{t('kit.settings.light')}</div>
          <div className="mk-sub">{t('kit.settings.lightHint')}</div>
        </div>
        <button type="button" className="mk-switch" role="switch" aria-checked={lite} aria-label={t('kit.settings.light')} onClick={() => setLite(!lite)} />
      </div>

      <label className="block">
        <Eyebrow>{t('hud.classCode')}</Eyebrow>
        <input type="text" className="mk-field" value={classCode ?? ''} maxLength={12} onChange={(e) => setClassCode(e.target.value)} />
        <span className="mk-sub mt-1 block">{t('kit.settings.classHint')}</span>
      </label>

      <label className="block">
        <Eyebrow>{t('hud.rollNo')}</Eyebrow>
        <input type="text" inputMode="numeric" autoComplete="off" className="mk-field" value={rollNo ?? ''} maxLength={4} placeholder="0000" onChange={(e) => setRollNo(e.target.value)} />
        <span className="mk-sub mt-1 block">{t('kit.settings.rollHint')}</span>
      </label>

      <ul className="mk-list">
        {replay && (
          <li><button type="button" className="mk-act" onClick={() => { done(); nav('/story?replay=1') }}><img src="/art/npc-nani-wave.webp" alt="" draggable={false} /><span className="flex-1">{t('kit.settings.story')}</span></button></li>
        )}
        <li><button type="button" className="mk-act" onClick={() => { done(); goHome() }}><img src="/art/monument.webp" alt="" draggable={false} /><span className="min-w-0 flex-1"><span className="block">{t('kit.settings.menu')}</span><span className="mk-sub block font-medium">{t('kit.settings.menuHint')}</span></span></button></li>
        <li>
          {ask ? (
            <div className="mk-card" role="alertdialog" aria-label={t('kit.settings.resetAsk')}>
              <p className="m-0 mb-2 text-[14.5px] font-bold">{t('kit.settings.resetAsk')}</p>
              <div className="flex gap-2">
                <button type="button" className="ink-btn" onClick={() => { resetProgress(); void restartAllGames(); done() }}>{t('kit.settings.resetYes')}</button>
                <button type="button" className="ink-btn cream" autoFocus onClick={() => setAsk(false)}>{t('kit.settings.resetNo')}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="mk-act danger" onClick={() => setAsk(true)}><span className="min-w-0 flex-1"><span className="block">{t('kit.settings.reset')}</span><span className="mk-sub block font-medium">{t('kit.settings.resetHint')}</span></span></button>
          )}
        </li>
      </ul>
      <p className="mk-sub m-0 text-center">{t('kit.settings.about')}</p>
    </Sheet>
  )
}
