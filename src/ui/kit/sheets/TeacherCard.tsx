import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cleanRoll } from '../../../lib/roll'
import { cloudOn, lookupClass, readShareStatus, SHARE_EVENT, shareNow, writeShareStatus, type ShareStatus } from '../../../ngo/studentShare'
import { cleanCode } from '../../../ngo/summary'
import { useGame } from '../../../store/game'
import { Eyebrow } from '../Sheet'

const ERR: Record<string, string> = {
  unknown_class: 'home.shareErrClass', too_soon: 'home.shareErrSoon', offline: 'home.shareErrOffline', invalid: 'home.shareErrOther',
  class_full: 'home.shareErrOther', off: 'home.shareErrOther', need_roll: 'kit.profile.needRoll', need_class: 'kit.profile.teacherNone',
}

/** the profile's link to the teacher: join a class, share progress in one tap, and see when it was last sent */
export function TeacherCard() {
  const { t, i18n } = useTranslation()
  const classCode = useGame((s) => s.classCode)
  const setClassCode = useGame((s) => s.setClassCode)
  const rollNo = useGame((s) => s.rollNo)
  const [status, setStatus] = useState<ShareStatus>(readShareStatus)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const linked = cleanCode(classCode)
  const roll = cleanRoll(rollNo)

  useEffect(() => {
    const on = () => setStatus(readShareStatus())
    window.addEventListener(SHARE_EVENT, on)
    return () => window.removeEventListener(SHARE_EVENT, on)
  }, [])
  // show the class's name once (the teacher's name for it), so the student knows they are in the right class
  useEffect(() => {
    if (!linked || status.className || !cloudOn) return
    void lookupClass(linked).then((r) => { if (typeof r === 'string' && r !== 'offline') writeShareStatus({ className: r }) })
  }, [linked, status.className])

  const join = async () => {
    const c = cleanCode(code)
    if (!c) return
    setBusy(true); setMsg(null)
    const r = await lookupClass(c)
    setBusy(false)
    if (r === null) { setMsg('home.classNotFound'); return }
    setClassCode(c)
    writeShareStatus({ className: r === 'offline' ? null : r })
    setCode('')
  }
  const share = async () => {
    setBusy(true); setMsg(null)
    const r = await shareNow()
    setBusy(false)
    if (r !== 'ok') setMsg(ERR[r ?? 'offline'] ?? 'home.shareErrOther')
  }

  const when = status.lastAt ? new Date(status.lastAt).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null

  return (
    <div>
      <Eyebrow>{t('kit.profile.teacher')}</Eyebrow>
      <div className="mk-card" style={{ display: 'grid', gap: 10 }}>
        {!linked ? (
          <>
            <p className="m-0 text-[14px] font-semibold leading-snug">{t('kit.profile.teacherNone')}</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void join() }}>
              <input className="mk-field uppercase" style={{ flex: 1 }} value={code} maxLength={12} placeholder="HYD-XXXXX" aria-label={t('hud.classCode')} onChange={(e) => setCode(e.target.value)} />
              <button type="submit" className="ink-btn" disabled={busy || !cleanCode(code)}>{t('kit.profile.join')}</button>
            </form>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mk-chip">{t('kit.profile.classLine', { code: linked })}</span>
              {status.className && <span className="mk-chip" style={{ background: '#DCEFE2' }}>✓ {status.className}</span>}
              {roll && <span className="mk-chip">{t('kit.profile.rollLine', { roll })}</span>}
            </div>
            {!roll && <p className="m-0 text-[13px] font-bold" style={{ color: '#9A3412' }}>{t('kit.profile.needRoll')}</p>}
            {cloudOn && (
              <>
                <button type="button" className="ink-btn" disabled={busy || !roll} onClick={() => void share()}>{busy ? t('kit.profile.sending') : t('kit.profile.shareNow')}</button>
                <p className="m-0 text-[13px] font-semibold leading-snug" role="status">{status.last === 'ok' && when ? `✓ ${t('kit.profile.sent', { when })}` : t('kit.profile.notSent')}</p>
                <label className="flex items-start gap-3 text-[13.5px] font-semibold leading-snug">
                  <button type="button" className="mk-switch shrink-0" role="switch" aria-checked={status.auto} aria-label={t('kit.profile.autoShare')} onClick={() => writeShareStatus({ auto: !status.auto })} />
                  <span>{t('kit.profile.autoShare')}<span className="mk-sub block font-medium">{t('kit.profile.autoHint')}</span></span>
                </label>
              </>
            )}
          </>
        )}
        {msg && <p className="m-0 text-[13px] font-bold leading-snug" style={{ color: '#9A3412' }} role="alert">{t(msg)}</p>}
      </div>
    </div>
  )
}
