import { describe, expect, it } from 'vitest'
import { computeRatios } from './ratios'
import { healthyExtracted as healthy } from './fixtures'

describe('computeRatios', () => {
  it('calcula indicadores del período más reciente', () => {
    expect(computeRatios(healthy.periods[0])).toEqual({
      currentRatio: 2,
      quickRatio: 1.33,
      debtRatio: 0.45,
      netMargin: 0.06,
      roa: 0.09,
    })
  })

  it('devuelve null si falta el denominador o el dato', () => {
    const r = computeRatios({ ...healthy.periods[0], currentLiabilities: 0, inventories: null, revenue: null })
    expect(r.currentRatio).toBeNull()
    expect(r.quickRatio).toBeNull()
    expect(r.netMargin).toBeNull()
  })
})
