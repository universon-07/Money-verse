import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMPANY, SECTOR_COLOUR } from '../engine/companies'
import type { ReasonOption } from '../engine/reasons'
import { MIN_BID, TRADE_FEE, type Holding } from '../engine/state'
import type { CompanyId } from '../engine/types'
import { InfoHeader } from './InfoTip'
import { useInr } from './Panels'
import { ReasonList } from './Reasons'

export type TradeMode = 'invest' | 'buyMore' | 'sell'

export interface TradeProps {
  mode: TradeMode
  companyId: CompanyId
  price: number
  cash: number
  holding?: Holding
  blocked?: boolean
  /** reasons tailored to this company and decision */
  options: ReasonOption[]
  onConfirm: (v: { amount: number; fraction: number; reason: ReasonOption }) => void
  onCancel: () => void
}

/** Buy or sell with the cost shown first, then one tailored reason. */
export function TradeDialog({ mode, companyId, price, cash, holding, blocked, options, onConfirm, onCancel }: TradeProps) {
  const { t } = useTranslation('dealboard')
  const money = useInr()
  const buying = mode !== 'sell'
  const maxBuy = Math.floor(cash / MIN_BID) * MIN_BID
  const [amount, setAmount] = useState(Math.min(Math.max(MIN_BID, 20000), Math.max(MIN_BID, maxBuy)))
  const [fraction, setFraction] = useState(1)
  const [reason, setReason] = useState<ReasonOption | null>(options.length === 1 ? options[0] : null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])

  const name = t(`companies.${companyId}.name`)
  const fee = buying ? Math.round(amount * TRADE_FEE) : 0
  const grossSell = holding ? holding.units * fraction * price : 0
  const feeSell = Math.round(grossSell * TRADE_FEE)
  const costPart = holding ? holding.cost * fraction : 0
  const gainSell = grossSell - feeSell - costPart
  const cannotBuy = buying && (maxBuy < MIN_BID || !!blocked)
  const ok = !!reason && !cannotBuy

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t(`trade.${mode}`, { name })} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div ref={ref} tabIndex={-1} className="paper db-sheet db-in max-h-[92vh] w-full max-w-[460px] overflow-y-auto p-4 outline-none">
        <div className="-mx-4 -mt-4 mb-3 border-b-[3px] border-ink px-4 py-2" style={{ background: SECTOR_COLOUR[COMPANY[companyId].sector] }}>
          <h2 className="font-sign lang-fit m-0 text-[18px] text-jasmine" style={{ textShadow: '1.5px 1.5px 0 #2B1A17' }}>{t(`trade.${mode}`, { name })}</h2>
        </div>

        {buying ? (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-sign text-[28px] leading-none">{money(amount)}</div>
              <div className="text-[12px] opacity-70">{t('trade.fee')} {money(fee)}</div>
            </div>
            <input id="db-amt" aria-label={t('trade.amount')} type="range" min={MIN_BID} max={Math.max(MIN_BID, maxBuy)} step={MIN_BID} value={amount} disabled={cannotBuy} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 h-10 w-full accent-[#E5457A]" />
            <div className="flex justify-between text-[11px] opacity-65"><span>{money(MIN_BID)}</span><span>{money(Math.max(MIN_BID, maxBuy))}</span></div>
            {maxBuy < MIN_BID && <p className="m-0 mt-1 text-[13px] font-bold text-[#C8442F]">{t('trade.notEnough')}</p>}
            {blocked && <p className="m-0 mt-1 text-[13px] font-bold text-[#C8442F]">{t('trade.jailed')}</p>}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t('trade.sellShare')}>
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <button key={f} type="button" aria-pressed={fraction === f} onClick={() => setFraction(f)} className="font-sign min-h-12 rounded-lg border-[2.5px] border-ink text-[14px]" style={{ background: fraction === f ? '#E5457A' : '#FFF3D6', color: fraction === f ? '#FFF3D6' : '#2B1A17' }}>
                  {t(`trade.share${f === 1 ? 'All' : Math.round(f * 100)}`)}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2 text-[14px]">
              <span><span className="opacity-65">{t('trade.youGet')} </span><b>{money(grossSell - feeSell)}</b></span>
              <b style={{ color: gainSell >= 0 ? '#2f6f4a' : '#C8442F' }}>{gainSell >= 0 ? '▲ ' : '▼ '}{money(Math.abs(gainSell))}</b>
            </div>
          </div>
        )}

        <div className="mt-3">
          <InfoHeader title={t('trade.why')}>{t('trade.whyHint')}</InfoHeader>
          <div className="mt-1.5"><ReasonList options={options} companyId={companyId} value={reason?.id ?? null} onPick={setReason} /></div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="ink-btn cream" onClick={onCancel}>{t('trade.cancel')}</button>
          <button type="button" className="ink-btn pink" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }} onClick={() => ok && onConfirm({ amount, fraction, reason: reason! })}>{t('trade.confirm')}</button>
        </div>
      </div>
    </div>
  )
}
