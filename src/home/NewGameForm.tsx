import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cleanRoll, rollInput } from '../lib/roll'
import { cloudOn, lookupClass } from '../ngo/studentShare'
import { cleanCode } from '../ngo/summary'
import { NAME_MAX } from './slots'

type Check = { state: 'idle' | 'checking' | 'none' | 'offline' } | { state: 'found'; name: string }

/**
 * Starting a new game: the student's name (kept on this phone only), their school roll number, and their class code if they
 * have one. The class code is checked as they type, so they can see they have joined the right class before they start.
 */
export function NewGameForm({ onBack, onStart }: { onBack: () => void; onStart: (name: string, classCode: string | null, roll: string) => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [roll, setRoll] = useState('')
  const [code, setCode] = useState('')
  const [check, setCheck] = useState<Check>({ state: 'idle' })
  const [tried, setTried] = useState(false)

  const clean = cleanCode(code)
  useEffect(() => {
    if (!clean || clean.length < 6 || !cloudOn) { setCheck({ state: 'idle' }); return }
    setCheck({ state: 'checking' })
    let live = true
    const timer = window.setTimeout(() => {
      void lookupClass(clean).then((r) => {
        if (!live) return
        setCheck(r === 'offline' ? { state: 'offline' } : r ? { state: 'found', name: r } : { state: 'none' })
      })
    }, 450)
    return () => { live = false; window.clearTimeout(timer) }
  }, [clean])

  const nameOk = name.trim().length > 0
  const rollOk = !!cleanRoll(roll)
  const submit = () => {
    setTried(true)
    if (nameOk && rollOk) onStart(name.trim(), clean, roll)
  }

  const field = 'h-12 w-full rounded-md border-[1.5px] border-ink bg-transparent px-3 text-[17px]'
  const label = 'text-[13px] font-bold uppercase tracking-[.16em] opacity-70'
  const hint = 'm-0 text-[12.5px] font-semibold leading-snug opacity-75'
  const warn = 'm-0 text-[12.5px] font-bold leading-snug'

  return (
    <form className="paper rise flex w-full flex-col gap-2.5 p-4 text-left" onSubmit={(e) => { e.preventDefault(); submit() }} noValidate>
      <label className={label} htmlFor="ng-name">{t('home.nameLabel')}</label>
      <input id="ng-name" autoFocus value={name} maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setName(e.target.value)} className={field} />
      {tried && !nameOk ? <p className={warn} style={{ color: '#9A3412' }} role="alert">{t('home.nameRequired')}</p> : <p className={hint}>{t('home.nameHint')}</p>}

      <label className={`${label} mt-1`} htmlFor="ng-roll">{t('hud.rollNo')}</label>
      <input id="ng-roll" value={roll} inputMode="numeric" autoComplete="off" maxLength={4} placeholder="0000" onChange={(e) => setRoll(rollInput(e.target.value))} className={field} />
      {tried && !rollOk && <p className={warn} style={{ color: '#9A3412' }} role="alert">{t('home.rollRequired')}</p>}

      <label className={`${label} mt-1`} htmlFor="ng-class">{t('home.classOptional')}</label>
      <input id="ng-class" value={code} maxLength={12} autoComplete="off" placeholder="HYD-XXXXX" onChange={(e) => setCode(e.target.value)} className={`${field} uppercase`} />
      <p className={check.state === 'none' ? warn : hint} style={check.state === 'found' ? { color: '#166534', opacity: 1 } : check.state === 'none' ? { color: '#9A3412' } : undefined} role="status">
        {check.state === 'found' ? `✓ ${t('home.classFound', { name: check.name })}` : check.state === 'checking' ? t('home.classChecking') : check.state === 'none' ? t('home.classNotFound') : check.state === 'offline' ? t('home.classOffline') : t('home.classHint')}
      </p>

      <div className="mt-1 flex gap-2">
        <button type="button" className="ink-btn cream" onClick={onBack}>{t('home.back')}</button>
        <button type="submit" className="ink-btn flex-1">{t('home.start')} ▸</button>
      </div>
    </form>
  )
}
