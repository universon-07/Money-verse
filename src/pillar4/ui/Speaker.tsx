import { useEffect, useState } from 'react'
import { useHost } from '../host.tsx'
import { useT } from './useT.ts'
import { Icon } from './icons.tsx'

/**
 * Read-aloud: browser speech synthesis where a voice exists for the language.
 * No voice for the language: the control is hidden for that string and no error shows.
 */
const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)

function useVoice(code: 'te' | 'en'): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null)
  useEffect(() => {
    const s = synth()
    if (!s) return undefined
    const pick = () => {
      const vs = s.getVoices()
      setVoice(vs.find((v) => v.lang.toLowerCase().startsWith(code) && v.lang.toLowerCase().includes('in')) ?? vs.find((v) => v.lang.toLowerCase().startsWith(code)) ?? null)
    }
    pick()
    s.addEventListener?.('voiceschanged', pick)
    return () => s.removeEventListener?.('voiceschanged', pick)
  }, [code])
  return voice
}

export function Speaker({ text, className = '' }: { text: string; className?: string }) {
  const { language } = useHost()
  const t = useT()
  const voice = useVoice(language === 'te' ? 'te' : 'en')
  if (!voice || !text) return null
  const say = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    const s = synth()
    if (!s) return
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice
    u.lang = voice.lang
    u.rate = 0.95
    s.speak(u)
  }
  return (
    <button type="button" onClick={say} aria-label={t('ui.readAloud')} title={t('ui.readAloud')} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${className}`} style={{ background: 'rgba(127,140,155,.18)', border: 0, color: 'inherit' }}>
      <Icon name="speaker" size={16} />
    </button>
  )
}
