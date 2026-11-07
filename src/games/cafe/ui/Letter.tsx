import { Btn } from './kit'
import { useCt } from './text'

/**
 * Ammamma's letter, full screen. No envelope to fiddle with: the sheet simply comes out from behind Chacha's side
 * of the counter and settles in the middle, and the words appear line by line. Pure presentation.
 */
export function Letter({ onDone }: { onDone: () => void }) {
  const { t } = useCt()
  return (
    <div className="cafe-letter" role="dialog" aria-label={t('letter.dear')}>
      <div className="cafe-env-open">
        <div className="cafe-sheet-wrap">
          <div className="cafe-sheet-paper">
            <img src="/art/cafe/letter.webp" alt="" className="cafe-paper-bg" draggable={false} />
            <div className="cafe-paper-text">
              <p className="cafe-hand cafe-line" style={{ animationDelay: '1.2s' }}>{t('letter.dear')}</p>
              <p className="cafe-hand cafe-line" style={{ animationDelay: '1.8s' }}>{t('letter.body')}</p>
              <p className="cafe-hand cafe-line is-sign" style={{ animationDelay: '2.7s' }}>{t('letter.sign')}</p>
            </div>
            <div className="cafe-notes" aria-hidden>
              {[0, 1, 2, 3, 4, 5].map((i) => <i key={i} style={{ animationDelay: `${3.1 + i * 0.12}s`, left: `${12 + i * 14}%` }}>₹</i>)}
            </div>
          </div>
        </div>
        <div className="cafe-letter-take"><Btn onClick={onDone}>{t('letter.take')} ▸</Btn></div>
      </div>
    </div>
  )
}
