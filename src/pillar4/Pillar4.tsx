import { useEffect, useState } from 'react'
import './ui/p4.css'
import { HostProvider, useHost, type Pillar4Host } from './host.tsx'
import { usePillar4 } from './store.ts'
import { useCompletionSync } from './hub/adapter.ts'
import { useT } from './ui/useT.ts'
import { useReduceMotion } from './ui/feedback.ts'
import { CaseMap, Intro, LangToggle, Page, Playbook, Settings } from './ui/screens.tsx'
import { Icon } from './ui/icons.tsx'
import CaseRunner from './ui/CaseRunner.tsx'
import MasterBoard from './ui/Master.tsx'
import { registerOffline } from './offline.ts'

type View = 'intro' | 'map' | 'case' | 'master' | 'playbook' | 'settings'

/** phone held sideways on a small screen: the game is portrait-only */
function useShortLandscape() {
  const get = () => window.innerHeight < 480 && window.innerWidth > window.innerHeight
  const [s, setS] = useState(get)
  useEffect(() => {
    const f = () => setS(get())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

function Screens() {
  const t = useT()
  const reduce = useReduceMotion()
  const landscape = useShortLandscape()
  const introSeen = usePillar4((s) => s.profile.introSeen)
  const [view, setView] = useState<View>(introSeen ? 'map' : 'intro')
  const [caseId, setCaseId] = useState<string | null>(null)
  const { onExit } = useHost()
  useCompletionSync()
  useEffect(() => registerOffline(), [])

  const open = (key: string) => {
    const S = usePillar4.getState()
    if (key !== 'MYSTERY' && S.progress[key]?.closed) S.resetCase(key) // replays start a fresh run (25% points)
    setCaseId(S.beginCase(key))
    setView('case')
  }
  const toMap = () => setView('map')

  let screen: React.ReactNode
  switch (view) {
    case 'intro':
      screen = <Intro onBack={onExit} onStart={() => { usePillar4.getState().setProfile({ introSeen: true }); setView('map') }} />
      break
    case 'case':
      screen = caseId ? <CaseRunner key={caseId} caseId={caseId} onExit={toMap} /> : null
      break
    case 'master':
      screen = (
        <Page onBack={toMap} title={t('ui.map.master')} right={<LangToggle />}>
          <MasterBoard onDone={() => { usePillar4.getState().finishMaster(); setView('playbook') }} />
        </Page>
      )
      break
    case 'playbook': screen = <Playbook onBack={toMap} />; break
    case 'settings': screen = <Settings onBack={toMap} />; break
    default:
      screen = <CaseMap onOpen={open} onNav={setView} onHub={onExit} />
  }
  return (
    <div className={`p4-root absolute inset-0 ${reduce ? 'p4-reduce' : ''}`}>
      {screen}
      {landscape && (
        <div className="absolute inset-0 z-[90] grid place-items-center p-6 text-center" style={{ background: 'var(--p4-bg)' }}>
          <div className="flex flex-col items-center gap-3 text-[17px] font-bold"><Icon name="rotate" size={36} />{t('ui.rotate')}</div>
        </div>
      )}
    </div>
  )
}

/**
 * Pillar 4: Case Files, Mohalla Detective. Self-contained: render it anywhere and give it the four host props.
 *   <Pillar4 language="en" setLanguage={...} onExit={() => goToMap()} onComplete={() => markPillarDone()} />
 */
export default function Pillar4(host: Pillar4Host) {
  return (
    <HostProvider value={host}>
      <Screens />
    </HostProvider>
  )
}
