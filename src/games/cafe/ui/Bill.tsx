import { useState } from 'react'
import { billAmount, payBill } from '../engine/economy'
import type { BillId } from '../engine/types'
import { useCafe } from '../state/store'
import { Btn, Caption, Icon, SourcePicker } from './kit'
import { useCt } from './text'

const ICONOF: Record<BillId, string> = { auto: 'auto', data: 'data', lunch: 'lunch' }
const CHACHA: Record<BillId, string> = { auto: 'bill.chachaAuto', data: 'bill.chachaData', lunch: 'bill.chachaLunch' }

/** A need: a paper bill stamped BILL. It cannot be passed or cooled; the only choice is where the money comes from. */
export function Bill({ id }: { id: BillId }) {
  const { t } = useCt()
  const run = useCafe((s) => s.run)
  const apply = useCafe((s) => s.apply)
  const next = useCafe((s) => s.next)
  const [paid, setPaid] = useState<null | 'ok' | 'save'>(null)
  const amount = billAmount(run, id)
  return (
    <div className="flex flex-col gap-3">
      <Caption text={paid ? (paid === 'save' ? t('bill.fromSave') : t('bill.paid')) : t(CHACHA[id])} />
      <div className="cafe-bill" aria-label={`${t('bill.stamp')}: ${t(`bill.${id}`)} ₹${amount}`}>
        <span className="cafe-bill-stamp">{t('bill.stamp')}</span>
        <Icon id={ICONOF[id]} size={52} className="mx-auto" />
        <div className="text-[15px] font-bold">{t(`bill.${id}`)}</div>
        <div className="font-display text-[28px] leading-none">₹{amount}</div>
      </div>
      {paid ? (
        <div className="flex justify-end"><Btn onClick={next}>{t('hud.next')} ▸</Btn></div>
      ) : (
        <SourcePicker run={run} amount={amount} quick onPay={(p) => { apply((r) => payBill(r, id, p)); setPaid((p.save ?? 0) > 0 ? 'save' : 'ok') }} payLabel={`${t('bill.pay')} · ₹${amount}`} />
      )}
    </div>
  )
}
