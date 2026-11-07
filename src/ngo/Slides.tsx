import { useCallback, useEffect, useRef, useState } from 'react'
import { DISCLAIMER, type Slide } from './decks'

/**
 * Flashcard decks: the same slides render in the presenter (full screen, click or arrow keys, cards flip to reveal the answer),
 * in a print / PDF handout, and as a PowerPoint file. Slides keep their own fixed palette in light and dark mode, since they are
 * projected in classrooms.
 */
const S = { burg: '#7A1F2B', burgDark: '#5E1620', navy: '#14213D', cream: '#FBF8F3', tan: '#C9A66B', ink: '#1F2430', muted: '#6B6F7A', green: '#2F6F5E', greenSoft: '#E6F1EC', line: '#E7E2D8' }

/** one 16:9 slide; text is sized in container units so it scales from a thumbnail to a projector */
export function SlideView({ slide, revealed = true, print = false }: { slide: Slide; revealed?: boolean; print?: boolean }) {
  const dark = slide.kind === 'title' || slide.kind === 'end'
  return (
    <div className={`mi-slide ${print ? 'mi-page' : ''}`} style={{ background: dark ? `linear-gradient(135deg, ${S.burg}, ${S.burgDark})` : S.cream, color: dark ? '#fff' : S.ink }}>
      {slide.kind === 'title' && (
        <div className="mi-slide-pad flex h-full flex-col justify-center">
          <img src="/art/monument.webp" alt="" aria-hidden style={{ width: '9cqw', marginBottom: '2.5cqw' }} />
          <div style={{ fontSize: '5.6cqw', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-.02em' }}>{slide.title}</div>
          <div style={{ fontSize: '2.3cqw', marginTop: '1.6cqw', color: '#F1DFC0' }}>{slide.sub}</div>
          <div style={{ width: '9cqw', height: '.5cqw', background: S.tan, borderRadius: 99, marginTop: '3cqw' }} />
          <div style={{ fontSize: '1.4cqw', marginTop: 'auto', opacity: 0.8 }}>{slide.foot}</div>
        </div>
      )}
      {slide.kind === 'idea' && (
        <div className="mi-slide-pad grid h-full content-center" style={{ gap: '2.4cqw' }}>
          <Kicker>{slide.title}</Kicker>
          <div style={{ fontSize: '3.8cqw', fontWeight: 750, lineHeight: 1.18, color: S.navy, letterSpacing: '-.01em' }}>{slide.body}</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '1.1cqw' }}>
            {slide.items.map((t) => <li key={t} style={{ fontSize: '2.2cqw', display: 'flex', gap: '1.2cqw', alignItems: 'baseline' }}><span style={{ width: '1cqw', height: '1cqw', borderRadius: 99, background: S.burg, flexShrink: 0, transform: 'translateY(-.2cqw)' }} />{t}</li>)}
          </ul>
        </div>
      )}
      {slide.kind === 'card' && (
        <div className="mi-slide-pad flex h-full flex-col">
          <Kicker>Flashcard {slide.n} of {slide.of}</Kicker>
          <div className="flex flex-1 flex-col justify-center" style={{ gap: '2cqw' }}>
            <div style={{ background: '#fff', border: `.2cqw solid ${S.line}`, borderRadius: '1.6cqw', padding: '3cqw 3.4cqw', boxShadow: '0 .6cqw 2cqw rgba(20,33,61,.08)' }}>
              <div style={{ fontSize: '1.4cqw', fontWeight: 700, color: S.burg, letterSpacing: '.12em', textTransform: 'uppercase' }}>Question</div>
              <div style={{ fontSize: '3.3cqw', fontWeight: 700, lineHeight: 1.22, color: S.navy, marginTop: '.8cqw' }}>{slide.q}</div>
            </div>
            <div style={{ borderRadius: '1.6cqw', padding: '2.4cqw 3.4cqw', background: revealed ? S.greenSoft : 'transparent', border: revealed ? 'none' : `.2cqw dashed ${S.tan}`, minHeight: '11cqw', transition: 'background .25s' }}>
              {revealed ? (
                <>
                  <div style={{ fontSize: '1.4cqw', fontWeight: 700, color: S.green, letterSpacing: '.12em', textTransform: 'uppercase' }}>Answer</div>
                  <div style={{ fontSize: '2.5cqw', lineHeight: 1.3, marginTop: '.6cqw' }}>{slide.a}</div>
                </>
              ) : <div style={{ fontSize: '2cqw', color: S.muted, display: 'grid', placeItems: 'center', height: '100%', minHeight: '6.5cqw' }}>Think, pair, share… then reveal the answer</div>}
            </div>
          </div>
        </div>
      )}
      {slide.kind === 'list' && (
        <div className="mi-slide-pad grid h-full content-center" style={{ gap: '2.4cqw' }}>
          <Kicker>{slide.title}</Kicker>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '1.5cqw' }}>
            {slide.items.map((t, i) => (
              <li key={t} style={{ display: 'flex', gap: '1.6cqw', alignItems: 'flex-start', fontSize: '2.35cqw', lineHeight: 1.3 }}>
                <span style={{ flexShrink: 0, width: '3.4cqw', height: '3.4cqw', borderRadius: 99, display: 'grid', placeItems: 'center', background: slide.numbered ? S.burg : S.navy, color: '#fff', fontSize: '1.6cqw', fontWeight: 700 }}>{slide.numbered ? i + 1 : '?'}</span>
                <span style={{ paddingTop: '.3cqw' }}>{t}</span>
              </li>
            ))}
          </ol>
          {slide.note && <div style={{ fontSize: '1.4cqw', color: S.muted }}>{slide.note}</div>}
        </div>
      )}
      {slide.kind === 'end' && (
        <div className="mi-slide-pad flex h-full flex-col justify-center">
          <div style={{ fontSize: '1.7cqw', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#F1DFC0' }}>{slide.title}</div>
          <div style={{ fontSize: '4.6cqw', fontWeight: 800, lineHeight: 1.12, marginTop: '1.5cqw', letterSpacing: '-.01em' }}>{slide.body}</div>
          <div style={{ fontSize: '1.5cqw', marginTop: 'auto', opacity: 0.85, lineHeight: 1.4 }}>{slide.foot}</div>
        </div>
      )}
    </div>
  )
}

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2cqw', fontSize: '1.6cqw', fontWeight: 700, color: S.burg, letterSpacing: '.12em', textTransform: 'uppercase' }}>
    <span style={{ width: '3cqw', height: '.45cqw', background: S.burg, borderRadius: 99 }} />{children}
  </div>
)

/** full-screen presenter: → / Space / click to go on (cards reveal first), ← to go back, Esc to close */
export function Presenter({ slides, title, start = 0, onClose }: { slides: Slide[]; title: string; start?: number; onClose: () => void }) {
  const [i, setI] = useState(start)
  const [shown, setShown] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const slide = slides[i]
  const next = useCallback(() => {
    if (slide.kind === 'card' && !shown) return setShown(true)
    if (i < slides.length - 1) { setI(i + 1); setShown(false) }
  }, [i, shown, slide, slides.length])
  const prev = useCallback(() => { if (i > 0) { setI(i - 1); setShown(false) } }, [i])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
      else if (e.key === 'Escape') onClose()
      else if (e.key.toLowerCase() === 'f') void box.current?.requestFullscreen?.().catch(() => undefined)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [next, prev, onClose])
  useEffect(() => {
    void box.current?.requestFullscreen?.().catch(() => undefined)
    return () => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined) }
  }, [])
  useEffect(() => {
    const off = () => { if (!document.fullscreenElement) box.current?.focus() }
    document.addEventListener('fullscreenchange', off)
    return () => document.removeEventListener('fullscreenchange', off)
  }, [])

  const btn = 'grid h-10 min-w-10 place-items-center rounded-full px-3 text-[14px] font-semibold text-white disabled:opacity-30'
  return (
    <div ref={box} tabIndex={-1} className="fixed inset-0 z-[60] flex flex-col outline-none" style={{ background: '#0E1117' }} role="dialog" aria-modal="true" aria-label={`Presenting: ${title}`}>
      <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6" onClick={next}>
        <div style={{ width: 'min(100%, calc((100dvh - 96px) * 16 / 9))' }}><SlideView slide={slide} revealed={slide.kind !== 'card' || shown} /></div>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-4 text-white">
        <button type="button" className={btn} style={{ background: 'rgba(255,255,255,.1)' }} onClick={onClose}>Exit</button>
        <div className="flex items-center gap-2">
          <button type="button" className={btn} style={{ background: 'rgba(255,255,255,.1)' }} onClick={prev} disabled={i === 0} aria-label="Previous slide">←</button>
          <span className="min-w-[64px] text-center text-[13px] tabular-nums opacity-80">{i + 1} / {slides.length}</span>
          <button type="button" className={btn} style={{ background: slide.kind === 'card' && !shown ? S.green : S.burg }} onClick={next} disabled={i === slides.length - 1 && (slide.kind !== 'card' || shown)}>{slide.kind === 'card' && !shown ? 'Reveal answer' : 'Next →'}</button>
        </div>
        <span className="hidden text-[12px] opacity-60 sm:block">← → keys · F full screen</span>
      </div>
      <div className="h-1" style={{ background: 'rgba(255,255,255,.08)' }}><div className="h-full" style={{ width: `${((i + 1) / slides.length) * 100}%`, background: S.tan, transition: 'width .25s' }} /></div>
    </div>
  )
}

/** the handout: one slide per landscape page, every answer shown (the teacher's copy) */
export function PrintDeck({ slides }: { slides: Slide[] }) {
  return (
    <>
      <style>{'@page { size: A4 landscape; margin: 8mm; }'}</style>
      {slides.map((s, k) => <SlideView key={k} slide={s} print />)}
    </>
  )
}

/** a real PowerPoint file (opens in PowerPoint, Google Slides, Keynote); flashcards become a question slide then an answer slide */
export async function downloadPptx(slides: Slide[], fileName: string, title: string) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9' // 10 x 5.625 in
  pptx.title = title
  pptx.company = 'Minar'
  const F = 'Segoe UI'
  const hex = (c: string) => c.replace('#', '')
  const kicker = (sl: ReturnType<typeof pptx.addSlide>, text: string) => {
    sl.addShape('rect', { x: 0.6, y: 0.62, w: 0.45, h: 0.06, fill: { color: hex(S.burg) }, line: { color: hex(S.burg) } })
    sl.addText(text.toUpperCase(), { x: 1.15, y: 0.45, w: 8, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: hex(S.burg), charSpacing: 2 })
  }
  const foot = (sl: ReturnType<typeof pptx.addSlide>, light = false) =>
    sl.addText(DISCLAIMER, { x: 0.6, y: 5.15, w: 8.8, h: 0.3, fontFace: F, fontSize: 9, color: light ? 'F1DFC0' : hex(S.muted) })

  for (const s of slides) {
    if (s.kind === 'title' || s.kind === 'end') {
      const sl = pptx.addSlide()
      sl.background = { color: hex(S.burg) }
      if (s.kind === 'title') {
        sl.addText(s.title, { x: 0.6, y: 1.5, w: 8.8, h: 1.4, fontFace: F, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'bottom' })
        sl.addText(s.sub, { x: 0.6, y: 2.95, w: 8.8, h: 0.5, fontFace: F, fontSize: 18, color: 'F1DFC0' })
        sl.addShape('rect', { x: 0.6, y: 3.6, w: 0.9, h: 0.06, fill: { color: hex(S.tan) }, line: { color: hex(S.tan) } })
        sl.addText(s.foot, { x: 0.6, y: 4.95, w: 8.8, h: 0.35, fontFace: F, fontSize: 11, color: 'F1DFC0' })
      } else {
        sl.addText(s.title.toUpperCase(), { x: 0.6, y: 1.3, w: 8.8, h: 0.4, fontFace: F, fontSize: 14, bold: true, color: 'F1DFC0', charSpacing: 2 })
        sl.addText(s.body, { x: 0.6, y: 1.75, w: 8.8, h: 1.8, fontFace: F, fontSize: 34, bold: true, color: 'FFFFFF', valign: 'top' })
        sl.addText(s.foot, { x: 0.6, y: 4.7, w: 8.8, h: 0.6, fontFace: F, fontSize: 11, color: 'F1DFC0' })
      }
    } else if (s.kind === 'idea') {
      const sl = pptx.addSlide()
      sl.background = { color: hex(S.cream) }
      kicker(sl, s.title)
      sl.addText(s.body, { x: 0.6, y: 1.05, w: 8.8, h: 1.6, fontFace: F, fontSize: 28, bold: true, color: hex(S.navy), valign: 'top' })
      sl.addText(s.items.map((t) => ({ text: t, options: { bullet: { indent: 18 }, breakLine: true } })), { x: 0.6, y: 2.8, w: 8.8, h: 2.1, fontFace: F, fontSize: 18, color: hex(S.ink), paraSpaceAfter: 8, valign: 'top' })
      foot(sl)
    } else if (s.kind === 'card') {
      for (const reveal of [false, true]) {
        const sl = pptx.addSlide()
        sl.background = { color: hex(S.cream) }
        kicker(sl, `Flashcard ${s.n} of ${s.of}${reveal ? ' · answer' : ''}`)
        sl.addShape('roundRect', { x: 0.6, y: 1.05, w: 8.8, h: reveal ? 1.55 : 2.6, fill: { color: 'FFFFFF' }, line: { color: hex(S.line), width: 1 }, rectRadius: 0.12 })
        sl.addText('QUESTION', { x: 0.9, y: 1.2, w: 8, h: 0.3, fontFace: F, fontSize: 11, bold: true, color: hex(S.burg), charSpacing: 2 })
        sl.addText(s.q, { x: 0.9, y: 1.5, w: 8.2, h: reveal ? 1.0 : 1.95, fontFace: F, fontSize: reveal ? 20 : 28, bold: true, color: hex(S.navy), valign: 'top' })
        if (reveal) {
          sl.addShape('roundRect', { x: 0.6, y: 2.8, w: 8.8, h: 2.15, fill: { color: hex(S.greenSoft) }, line: { color: hex(S.greenSoft) }, rectRadius: 0.12 })
          sl.addText('ANSWER', { x: 0.9, y: 2.95, w: 8, h: 0.3, fontFace: F, fontSize: 11, bold: true, color: hex(S.green), charSpacing: 2 })
          sl.addText(s.a, { x: 0.9, y: 3.25, w: 8.2, h: 1.6, fontFace: F, fontSize: 20, color: hex(S.ink), valign: 'top' })
        } else {
          sl.addText('Think, pair, share… then go to the next slide for the answer.', { x: 0.6, y: 3.95, w: 8.8, h: 0.5, fontFace: F, fontSize: 14, color: hex(S.muted), align: 'center' })
        }
        sl.addNotes(`Answer: ${s.a}`)
        foot(sl)
      }
    } else {
      const sl = pptx.addSlide()
      sl.background = { color: hex(S.cream) }
      kicker(sl, s.title)
      sl.addText(s.items.map((t) => ({ text: t, options: { bullet: s.numbered ? { type: 'number' as const, indent: 22 } : { indent: 18 }, breakLine: true } })), { x: 0.6, y: 1.05, w: 8.8, h: 3.8, fontFace: F, fontSize: 20, color: hex(S.ink), paraSpaceAfter: 12, valign: 'top' })
      if (s.note) sl.addText(s.note, { x: 0.6, y: 4.8, w: 8.8, h: 0.3, fontFace: F, fontSize: 10, color: hex(S.muted) })
      foot(sl)
    }
  }
  await pptx.writeFile({ fileName: fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx` })
}
