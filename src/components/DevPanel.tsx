import { useState } from 'react'
import { PILLAR_IDS, type PillarId } from '../content/data'
import { brightnessFor } from '../happy/brightness'
import { HAPPY } from '../happy/config'
import { useGame } from '../store/game'

/**
 * Developer-only panel (open the page with ?dev=1). Deliberately plain and unstyled: it is a tool, not part of the game.
 * Lets you set Happy, force-clear a pillar at a chosen quality, and reset progress.
 */
export function DevPanel() {
  const s = useGame()
  const [pillar, setPillar] = useState<PillarId>('plan')
  const [quality, setQuality] = useState(0.8)
  return (
    <details style={{ position: 'fixed', left: 4, top: 4, zIndex: 2000, font: '12px monospace', background: 'Canvas', color: 'CanvasText', border: '1px solid', padding: 4, maxWidth: 260 }}>
      <summary>DEV</summary>
      <div>Happy {s.happy.toFixed(1)} ({brightnessFor(s.happy)})</div>
      <input aria-label="Happy" type="range" min={HAPPY.min} max={HAPPY.max} step={1} value={s.happy} onChange={(e) => s.devSetHappy(Number(e.target.value))} />
      <div>Saved {s.savedAmount} / {s.goalAmount}</div>
      <div>
        <select aria-label="Pillar" value={pillar} onChange={(e) => setPillar(e.target.value as PillarId)}>
          {PILLAR_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        {' '}quality {quality.toFixed(2)}
        <input aria-label="Quality" type="range" min={0} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
      </div>
      <button type="button" onClick={() => s.devForceComplete(pillar, quality)}>Force clear</button>{' '}
      <button type="button" onClick={() => s.applyBurnout()}>Burnout</button>{' '}
      <button type="button" onClick={() => s.resetProgress()}>Reset</button>{' '}
      <button type="button" onClick={() => s.devResetTips()}>Reset tips</button>
      <div>{PILLAR_IDS.map((id) => `${id}:${s.pillars[id].status === 'complete' ? s.pillars[id].brightness : s.pillars[id].status}`).join(' ')}</div>
    </details>
  )
}
