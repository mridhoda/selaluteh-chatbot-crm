import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateCartTotals,
  calculateItemPreviewTotal,
} from '../src/features/public-store/utils/calculateDisplayTotal.js'
import { formatCurrency } from '../src/features/public-store/utils/formatCurrency.js'
import { maskPhone } from '../src/features/public-store/utils/maskPhone.js'
import { normalizePhone } from '../src/features/public-store/utils/normalizePhone.js'

const product = {
  basePriceMinor: 14000,
  modifierGroups: [
    {
      options: [
        { id: 'opt-a', priceDeltaMinor: 4000 },
        { id: 'opt-b', priceDeltaMinor: 3000 },
      ],
    },
  ],
}

describe('public store utilities', () => {
  it('formats IDR currency without decimal fractions', () => {
    assert.equal(formatCurrency(18000), 'Rp 18.000')
  })

  it('normalizes Indonesian WhatsApp phone numbers', () => {
    assert.equal(normalizePhone('0812-3456-7890'), '6281234567890')
    assert.equal(normalizePhone('+62 812 3456 7890'), '6281234567890')
  })

  it('masks public order phone numbers', () => {
    assert.equal(maskPhone('6281234567890'), '6281****890')
  })

  it('calculates cart totals as display preview only', () => {
    assert.deepEqual(calculateCartTotals([{ lineTotalMinor: 18000 }, { lineTotalMinor: 22000 }]), {
      subtotalMinor: 40000,
      serviceFeeMinor: 1000,
      discountMinor: 0,
      totalMinor: 41000,
    })
  })

  it('calculates modifier item preview total from canonical option IDs', () => {
    assert.equal(calculateItemPreviewTotal(product, ['opt-a'], 2), 36000)
  })
})
