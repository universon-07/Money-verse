import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getActive, saveSlot, type SlotMeta } from '../home/slots'
import type { SubmitResult } from './cloud'
import { cleanRoll, rollInput } from '../lib/roll'
import { buildSummary, cleanCode, encodeSummary } from './summary'

// the database client is loaded only when a student actually sends, so the game itself stays small
const cloudEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

const SEND_MSG: Record<SubmitResult | 'need', string> = {
  ok: 'home.shareSent', unknown_class: 'home.shareErrClass', too_soon: 'home.shareErrSoon', offline: 'home.shareErrOffline',
  invalid: 'home.shareErrOther', class_full: 'home.shareErrOther', off: 'home.shareErrOther', need: 'home.shareNeedCode',
}

/** What a student can send to a facilitator from a saved game: an anonymous progress code, as text, a file, or the phone's share sheet. */
export function ShareProgress({ slot, onClose }: { slot: SlotMeta; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const base = useMemo(() => {
    const s = window.localStorage
    if (getActive(s) === slot.id) saveSlot(s, slot.id) // the game being played has the freshest data
    try {
      return buildSummary(JSON.parse(s.getItem(`mm-slot-data:${slot.id}`) ?? '{}'))
    } catch {
      return buildSummary({})
    }
  }, [slot.id])
  const [code, setCode] = useState(base.cohort ?? '')
  const [roll, setRoll] = useState(base.roll ? String(Number(base.roll)) : '')
  const shared = { ...base, cohort: cleanCode(code), roll: cleanRoll(roll) }
  const text = encodeSummary(shared)

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { /* the box below can still be selected by hand */ }
  }
  const file = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = 'my-progress.mmprogress'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  // straight to the class's database when one is connected: no sign-in, only the anonymous summary is sent
  const [sending, setSending] = useState<SubmitResult | 'busy' | 'need' | null>(null)
  const toTeacher = async () => {
    if (!cleanCode(code)) return setSending('need')
    setSending('busy')
    const { submitProgress } = await import('./cloud')
    setSending(await submitProgress(code, shared))
  }
  const send = () => { void navigator.share?.({ title: 'Minar', text }).catch(() => undefined) }

  return (
    <div className="mt-3 rounded-xl border-[1.5px] p-3" style={{ borderColor: '#3A2A24', background: '#FFF7E3' }} role="dialog" aria-label={t('home.shareTitle')}>
      <p className="m-0 text-[14px] leading-snug">{t('home.shareBody')}</p>
      <p className="m-0 mt-1 text-[12.5px] leading-snug opacity-75">{t('home.shareWhat')}</p>
      <label className="mt-2 block text-[12px] font-bold uppercase tracking-[.16em] opacity-70">
        {t('hud.classCode')}
        <input value={code} maxLength={14} onChange={(e) => setCode(e.target.value)} className="mt-1 h-11 w-full rounded-md border-[1.5px] border-ink bg-transparent px-2 text-[16px] normal-case tracking-normal" />
      </label>
      <label className="mt-2 block text-[12px] font-bold uppercase tracking-[.16em] opacity-70">
        {t('hud.rollNo')}
        <input value={roll} inputMode="numeric" autoComplete="off" maxLength={4} placeholder="0000" onChange={(e) => setRoll(rollInput(e.target.value))} className="mt-1 h-11 w-full rounded-md border-[1.5px] border-ink bg-transparent px-2 text-[16px] normal-case tracking-normal" />
      </label>
      {!cleanRoll(roll) && <p className="m-0 mt-1 text-[12.5px] font-bold leading-snug" style={{ color: '#9A4A12' }}>{t('home.shareRollMissing')}</p>}
      <p className="m-0 mt-2 text-[13px] leading-snug">{t('home.shareYourCode', { id: base.id })}</p>
      {cloudEnabled && (
        <div className="mt-2 grid gap-1.5">
          <button type="button" className="ink-btn" disabled={sending === 'busy'} onClick={() => void toTeacher()}>{sending === 'busy' ? t('home.shareSending') : t('home.shareToTeacher')}</button>
          {sending && sending !== 'busy' && <p className="m-0 text-[13px] font-bold leading-snug" role="status">{t(SEND_MSG[sending])}</p>}
        </div>
      )}
      <textarea readOnly value={text} rows={3} aria-label={t('home.shareTitle')} onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full rounded-md border-[1.5px] border-ink bg-transparent p-2 text-[12px]" style={{ fontFamily: 'monospace' }} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="ink-btn" onClick={() => void copy()}>{copied ? t('home.shareCopied') : t('home.shareCopy')}</button>
        {typeof navigator.share === 'function' && <button type="button" className="ink-btn" onClick={send}>{t('home.shareSend')}</button>}
        <button type="button" className="ink-btn cream" onClick={file}>{t('home.shareDownload')}</button>
        <button type="button" className="ink-btn cream" onClick={onClose}>{t('home.shareClose')}</button>
      </div>
    </div>
  )
}
