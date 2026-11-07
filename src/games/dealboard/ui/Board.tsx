import { useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTouchUi } from '../../../island/input'
import { RING, TURNS } from '../engine/board'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { RunState } from '../engine/state'
import type { CompanyId, MarketRun } from '../engine/types'
import { HoverCard, Mark, gainPct } from './Companies'
import { Pawn } from './icons'

/** Grid cell (row, col) of each ring slot on the 4 x 4 board, clockwise from the top-left corner. */
export function cellOf(i: number): [number, number] {
  if (i <= 3) return [0, i]
  if (i <= 6) return [i - 3, 3]
  if (i <= 9) return [3, 9 - i]
  return [12 - i, 0]
}

/** Pin the hover card to the side of the tile that keeps it inside the board. */
function hoverStyle(r: number, c: number): CSSProperties {
  const style: CSSProperties = { position: 'absolute', zIndex: 20 }
  if (c <= 1) style.left = `${(c / 4) * 100}%`
  else style.right = `${((3 - c) / 4) * 100}%`
  if (r <= 1) style.top = `calc(${((r + 1) / 4) * 100}% + 4px)`
  else style.bottom = `calc(${((4 - r) / 4) * 100}% + 4px)`
  return style
}

/**
 * The ring: the four companies of this game sit on the corners, the twelve quarters fill the stretches between,
 * and the token walks forward one quarter at a time. The company pitching this quarter glows.
 */
export function Board({ run, m, tokenAt, pitching, onOpen, children }: { run: RunState; m: MarketRun; tokenAt: number; pitching: CompanyId | null; onOpen: (id: CompanyId) => void; children: ReactNode }) {
  const { t } = useTranslation('dealboard')
  const touch = useTouchUi()
  const [hover, setHover] = useState<number | null>(null)
  const [tr, tc] = cellOf(tokenAt)
  const done = run.phase === 'done'
  return (
    <div className="db-board w-full" role="group" aria-label={t('title')}>
      {RING.map((slot, i) => {
        const [r, c] = cellOf(i)
        const place = { gridRow: r + 1, gridColumn: c + 1 }
        if (slot.kind === 'quarter') {
          const past = done || slot.q < run.turn || (slot.q === run.turn && run.phase !== 'desk')
          const now = slot.q === run.turn && !done
          return (
            <div key={i} className={`db-tile db-q ${past ? 'past' : ''}`} style={place} aria-label={t('quarter', { n: slot.q })} aria-current={now}>
              <span className="label lang-fit">{t('quarterShort', { n: slot.q })}</span>
              <span className="mark" aria-hidden>{past ? '✓' : '·'}</span>
            </div>
          )
        }
        const id = m.picked[slot.index]
        const own = !!run.holdings[id]
        const met = run.pitched.includes(id)
        const g = gainPct(run, m, id)
        const glow = pitching === id
        return (
          <button
            key={i}
            type="button"
            className={`db-tile db-lot ${own ? 'owned' : ''} ${glow ? 'glow' : ''}`}
            style={place}
            aria-label={t('tileLot', { name: t(`companies.${id}.name`), state: own ? t('lotState.own') : met ? t('lotState.met') : t('lotState.unmet') })}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => { setHover(null); onOpen(id) }}
          >
            <span className="band" style={{ background: SECTOR_COLOUR[COMPANY[id].sector] }} />
            <span className="lotmark">{met || own ? <Mark id={id} size={22} /> : <span className="font-sign grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-[2.5px] border-dashed border-ink/50 text-[12px] opacity-70" aria-hidden>?</span>}</span>
            <span className="label lang-fit">{t(`companies.${id}.name`)}</span>
            {own && g !== null ? <span className="badge" style={{ color: g >= 0 ? '#2f6f4a' : '#C8442F' }}>{g >= 0 ? '▲' : '▼'}{Math.abs(g * 100).toFixed(0)}%</span> : glow ? <span className="badge" style={{ color: '#B8473A' }}>{t('lotState.pitching')}</span> : null}
          </button>
        )
      })}
      <div className="db-centre">{children}</div>
      <div className="db-token" style={{ left: `calc(8px + (100% - 16px) * ${(tc + 0.5) / 4})`, top: `calc(8px + (100% - 16px) * ${(tr + 0.5) / 4})` }}>
        <span key={tokenAt} className="db-hop"><Pawn /></span>
      </div>
      {hover !== null && RING[hover].kind === 'lot' && !touch && (
        <div style={hoverStyle(...cellOf(hover))}><HoverCard run={run} m={m} id={m.picked[(RING[hover] as { index: number }).index]} touch={false} /></div>
      )}
      <span className="sr-only">{t('quarter', { n: Math.min(TURNS, run.turn) })}</span>
    </div>
  )
}
