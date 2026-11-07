import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppId, Step } from '../types.ts'
import { CASES } from '../content/index.ts'
import { indexCase, leadNudgeKey, leadQKey, locate, zoneTextKey } from '../engine/case.ts'
import {
  activeLead, allRequiredFound, closeCase, goldRemaining, levelOf, openLeads, reasonOptions, type HintResult,
} from '../engine/progress.ts'
import { usePillar4 } from '../store.ts'
import { useT } from './useT.ts'
import { HOME_NAV, Phone, type Nav } from './Phone.tsx'
import { AnalystDock, AnalystMark, type Mood } from './Analyst.tsx'
import { ReportSheet, outcomeLine, type Pick } from './ReportSheet.tsx'
import { CaseFile, EvidenceCounter } from './Notebook.tsx'
import { Board } from './Board.tsx'
import { Debrief, FixQuestion } from './FixReplay.tsx'
import { Icon } from './icons.tsx'
import { LangToggle } from './screens.tsx'
import { sfx } from './feedback.ts'

interface Override { text: string; extra?: string | null; mood: Mood }

export default function CaseRunner({ caseId, onExit }: { caseId: string; onExit: () => void }) {
  const def = CASES[caseId]
  const idx = useMemo(() => indexCase(def), [def])
  const t = useT()
  const progress = usePillar4((s) => s.progress[caseId])
  const level = usePillar4((s) => s.profile.level)
  const S = usePillar4.getState // actions are stable; read lazily
  const tutorial = def.kind === 'tutorial'
  const mystery = def.kind === 'mystery'

  const [nav, setNav] = useState<Nav>(HOME_NAV)
  const [zoom, setZoom] = useState(false)
  const [linkMode, setLinkMode] = useState(false)
  const [linkPick, setLinkPick] = useState<string | null>(null)
  const [report, setReport] = useState<{ zoneId: string; options: Pick[] } | null>(null)
  const [casefile, setCasefile] = useState(false)
  const [breakOpen, setBreakOpen] = useState(false)
  const [override, setOverride] = useState<Override | null>(null)
  const [pulseZone, setPulseZone] = useState<string | null>(null)
  const [offer, setOffer] = useState(false)
  const [activity, setActivity] = useState(0)
  const [coach, setCoach] = useState(0) // Tutorial guidance steps; 0 = off

  const phase = progress?.phase ?? 'briefing'
  const lead = progress ? activeLead(def, progress) : null
  const lvl = lead && progress ? levelOf(progress, lead.id) : 1
  const glowApp: AppId | null = (tutorial && coach === 2 ? 'messages' : null) ?? (lead && lvl >= 3 ? lead.glowApp : null)
  const say = useCallback((text: string, mood: Mood = 'neutral', extra?: string | null) => setOverride({ text, mood, extra }), [])

  // ---- hints ------------------------------------------------------------------------------------------
  const showHint = useCallback((r: HintResult) => {
    setOverride(null)
    if (r.generic) { setOverride({ text: t('analyst.mysteryNudge'), mood: 'thinking' }); return }
    if (r.level && r.level >= 4 && r.leadId) {
      const l = def.leads.find((x) => x.id === r.leadId)
      const loc = l && locate(idx, l.pulseTarget)
      if (l && loc) {
        setNav({ app: loc.app, tab: loc.tab, thread: loc.thread ?? null, expanded: loc.expand ? [loc.expand] : [], profile: !!loc.profile })
        setPulseZone(l.pulseTarget)
        window.setTimeout(() => setPulseZone(null), 6500)
      }
    }
  }, [def.leads, idx, t])

  const onHelp = () => { setActivity((a) => a + 1); showHint(S().hint(caseId)) }
  const onElse = () => { S().cycleLead(caseId); setOverride(null) }

  // idle nudges: offer at 90 s; automatic L2 at 120 s (60 s for Beginner)
  useEffect(() => {
    if (phase !== 'investigating' || breakOpen || report || casefile) return undefined
    const offerT = window.setTimeout(() => setOffer(true), 90_000)
    const autoT = mystery ? undefined : window.setTimeout(() => {
      const r = S().idle(caseId)
      if (r.leadId && r.level === 2) setOverride(null)
    }, (level === 'beginner' ? 60 : 120) * 1000)
    return () => { window.clearTimeout(offerT); if (autoT) window.clearTimeout(autoT) }
  }, [activity, phase, breakOpen, report, casefile, mystery, level, caseId, S])

  // ---- reporting --------------------------------------------------------------------------------------
  const onZone = (zoneId: string) => {
    setActivity((a) => a + 1)
    setOffer(false)
    setReport({ zoneId, options: reasonOptions(def, zoneId) })
    if (tutorial && coach === 2) setCoach(3)
  }

  const resolve = (pick: Pick) => {
    const zoneId = report!.zoneId
    const r = S().report(caseId, zoneId, pick)
    const k = r.outcome.kind
    if (k === 'correct') sfx.pin()
    else if (k === 'herring_fine' || k === 'herring_any') sfx.herring()
    else sfx.soft()
    setOverride({ text: t(outcomeLine(r.outcome, pick)), mood: k === 'correct' || k === 'herring_fine' ? 'pleased' : 'thinking' })
    if (tutorial && k === 'correct' && coach <= 3) { setCoach(0); setOverride({ text: t('coach.4'), mood: 'pleased' }) }
    if (r.autoHint?.level === 4) showHint({ prog: r.prog, leadId: r.autoHint.leadId, level: 4 })
    return { outcome: r.outcome, pick }
  }

  const closeSheet = () => {
    const p = usePillar4.getState().progress[caseId]
    setReport(null)
    if (!p) return
    if (allRequiredFound(def, p) && phase === 'investigating') {
      const gold = goldRemaining(def, p)
      setOverride({ text: gold > 0 ? t('analyst.allFound') : t('analyst.allFoundNoGold'), extra: gold > 0 ? t('analyst.goldLeft', { n: gold }) : null, mood: 'pleased' })
    }
  }

  // ---- Link mode --------------------------------------------------------------------------------------
  const onItemLink = (itemId: string) => {
    if (!linkPick) return setLinkPick(itemId)
    if (linkPick === itemId) return setLinkPick(null)
    const r = S().link(caseId, linkPick, itemId)
    setLinkPick(null)
    if (r.result === 'ok') { sfx.success(); say(t('analyst.linkOk'), 'pleased'); setLinkMode(false) }
    else say(t(r.result === 'already' ? 'analyst.linkAlready' : 'analyst.linkFail'), 'thinking')
  }

  // ---- analyst text -----------------------------------------------------------------------------------
  const base: Override = (() => {
    if (!progress) return { text: '', mood: 'neutral' }
    if (tutorial && coach >= 1 && coach <= 3) return { text: t(`coach.${coach}`), mood: 'neutral' }
    if (phase === 'board') return { text: t(tutorial ? 'coach.6' : 'analyst.boardIntro'), mood: 'neutral' }
    if (phase === 'fix') return { text: t(tutorial ? 'coach.7' : 'analyst.fixIntro'), mood: 'neutral' }
    if (phase === 'replay' || phase === 'closed') return { text: t('analyst.replayIntro'), mood: 'reassuring' }
    if (mystery) return { text: t('analyst.mystery'), mood: 'neutral' }
    if (lead) {
      const extra = lvl >= 2 ? [t(leadNudgeKey(lead)), lvl === 3 ? t('ui.hint.l3') : lvl >= 4 ? t('ui.hint.l4') : ''].filter(Boolean).join(' ') : null
      return { text: t(leadQKey(lead)), extra, mood: 'neutral' }
    }
    return { text: t('analyst.allFoundNoGold'), mood: 'pleased' }
  })()
  const guided = tutorial && coach >= 1 && coach <= 3 && !override
  const shown = guided ? base : override ?? base
  const coachNext = guided && coach === 1

  if (!progress) return null
  const ready = allRequiredFound(def, progress)
  const pinnedZones = new Set<string>()
  for (const id of progress.pinned) for (const z of idx.clues.get(id)?.targets ?? []) pinnedZones.add(z)
  const investigating = phase === 'investigating' || phase === 'briefing'

  const header = (
    <div className="flex shrink-0 items-center gap-1.5 px-1.5 py-1 min-[640px]:gap-2 min-[640px]:px-2 min-[640px]:py-1.5" style={{ paddingTop: 'max(4px, env(safe-area-inset-top))' }}>
      <button type="button" className="p4-btn icon ghost" onClick={onExit} aria-label={t('ui.back')}><Icon name="back" /></button>
      <div className="min-w-0 flex-1">
        {investigating ? <EvidenceCounter def={def} progress={progress} t={t} /> : <span className="block truncate text-[15px] font-bold">{t(`${def.id}.title`)}</span>}
      </div>
      {phase === 'investigating' && (
        <>
          <button type="button" className={`p4-btn icon ${zoom ? 'is-on' : ''}`} aria-pressed={zoom} aria-label={t('ui.zoom')} title={t('ui.zoom')} onClick={() => setZoom((z) => !z)}><Icon name="search" size={20} /></button>
          <button type="button" className="p4-btn icon min-[900px]:!hidden" aria-label={t('ui.casefile')} title={t('ui.casefile')} onClick={() => { setCasefile(true); setActivity((a) => a + 1) }}><Icon name="note" size={20} /></button>
        </>
      )}
      <LangToggle />
    </div>
  )

  const dock = (
    <div className="flex shrink-0 flex-col gap-2">
      {phase === 'investigating' && ready && (
        <button type="button" className="p4-btn primary w-full" onClick={() => { setOverride(null); S().openBoard(caseId) }}><Icon name="flag" size={18} /> {t('ui.closeCase')}</button>
      )}
      {linkMode && phase === 'investigating' && (
        <button type="button" className="p4-btn is-on w-full !min-h-[40px] !text-[13.5px]" onClick={() => { setLinkMode(false); setLinkPick(null) }}><Icon name="link" size={16} /> {t('ui.link.on')} <Icon name="x" size={14} /></button>
      )}
      <AnalystDock
        text={shown.text} extra={shown.extra} mood={shown.mood}
        onReread={() => setOverride(null)}
        onHelp={phase === 'investigating' && !ready ? onHelp : undefined}
        helpLabel={mystery ? t('ui.needHelp.mystery') : undefined}
        onElse={phase === 'investigating' && !mystery && !ready && openLeads(def, progress).length > 1 ? onElse : undefined}
        offer={offer && phase === 'investigating' ? { onYes: () => { setOffer(false); onHelp() }, onNo: () => { setOffer(false); setActivity((a) => a + 1) } } : null}
        onBreak={() => setBreakOpen(true)}
      >
        {coachNext && <button type="button" className="p4-btn primary !min-h-[40px] !px-3 !text-[13.5px]" onClick={() => setCoach(2)}>{t('ui.coach.next')}</button>}
      </AnalystDock>
    </div>
  )

  let body: React.ReactNode
  if (phase === 'board') {
    body = <div className="min-h-0 flex-1 overflow-y-auto"><Board def={def} progress={progress} t={t} onDrop={(card, step: Step) => S().drop(caseId, card, step)} onSay={(key, mood) => say(t(key), mood)} onNext={() => { setOverride(null); S().goToFix(caseId) }} /></div>
  } else if (phase === 'fix') {
    body = <div className="min-h-0 flex-1 overflow-y-auto"><FixQuestion def={def} progress={progress} t={t} onAnswer={(key) => S().fix(caseId, key)} onSay={(key, mood) => say(t(key), mood)} onNext={() => { setOverride(null); S().goToReplay(caseId) }} /></div>
  } else if (phase === 'replay' || phase === 'closed') {
    body = <div className="min-h-0 flex-1 overflow-y-auto"><Debrief def={def} progress={progress} t={t} total={closeCase(def, progress).earned} onFinish={() => { S().finishCase(caseId); onExit() }} /></div>
  } else {
    body = (
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-1 pb-1.5 pt-0.5 min-[640px]:px-2 min-[900px]:flex-row min-[900px]:justify-center min-[900px]:gap-6 min-[900px]:p-5">
        <div className="relative min-h-0 flex-1 min-[900px]:flex-none">
          <Phone
            def={def} idx={idx} progress={progress} t={t} zoom={zoom} linkMode={linkMode} linkPick={linkPick}
            pulseZone={pulseZone} glowApp={glowApp} activeZone={report?.zoneId ?? null} pinnedZones={pinnedZones}
            nav={nav} setNav={setNav} onZone={onZone} onItemLink={onItemLink}
          />
          {phase === 'briefing' && (
            <div className="absolute inset-0 z-30 grid place-items-center p-4" style={{ background: 'rgba(5,9,14,.82)', borderRadius: 34 }}>
              <div className="p4-panel max-w-sm text-center">
                <div className="p4-eyebrow">{t('ui.casefile')}</div>
                <h2 className="p4-h1 my-1">{t(`${def.id}.title`)}</h2>
                <p className="m-0 mb-4 text-[15px] leading-relaxed p4-muted">{t(`${def.id}.brief`)}</p>
                <button type="button" className="p4-btn primary" onClick={() => { S().start(caseId); if (tutorial) setCoach(1) }}>{t('ui.case.openPhone')}</button>
              </div>
            </div>
          )}
        </div>
        <aside className="flex shrink-0 flex-col gap-2 min-[900px]:w-[400px] min-[900px]:gap-3 min-[900px]:overflow-y-auto">
          {dock}
          <div className="hidden min-[900px]:block">
            <CaseFile def={def} progress={progress} t={t} linkMode={linkMode} setLinkMode={(v) => { setLinkMode(v); setLinkPick(null) }} inline />
          </div>
        </aside>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: 'var(--p4-bg)' }} onPointerDownCapture={() => { setActivity((a) => a + 1); setOffer(false) }}>
      {header}
      {body}
      {(phase === 'board' || phase === 'fix') && (
        <div className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-2">
          <div className="p4-panel is-raised flex items-center gap-2.5 !px-3 !py-2" role="status" aria-live="polite">
            <AnalystMark mood={shown.mood} size={30} />
            <p className="m-0 line-clamp-2 min-w-0 flex-1 text-[13.5px] leading-snug">{shown.text}</p>
          </div>
        </div>
      )}

      {report && (
        <ReportSheet
          key={report.zoneId + report.options.join()} t={t}
          quote={(() => { const z = idx.zones.get(report.zoneId); return z ? t(zoneTextKey(z.zone)) : '' })()}
          makeOptions={() => report.options} resolve={resolve} onClose={closeSheet}
        />
      )}
      {casefile && <CaseFile def={def} progress={progress} t={t} linkMode={linkMode} setLinkMode={(v) => { setLinkMode(v); setLinkPick(null) }} onClose={() => setCasefile(false)} />}
      {breakOpen && (
        <div className="p4-sheet" role="dialog" aria-modal="true" onClick={() => setBreakOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="text-center">
            <div className="p4-h2">{t('ui.break')}</div>
            <p className="my-3 text-[15px] leading-snug p4-muted">{t('analyst.break')} {t('ui.break.body')}</p>
            <div className="flex justify-center gap-2">
              <button type="button" className="p4-btn primary" onClick={() => setBreakOpen(false)}>{t('ui.continue')}</button>
              <button type="button" className="p4-btn" onClick={onExit}>{t('ui.back')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
