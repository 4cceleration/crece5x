import { describe, expect, it } from 'vitest'
import { formatCompactCOP, formatPercent, formatSignedPercent } from './format'

describe('formatCompactCOP', () => {
  it('abrevia en millones y miles de millones', () => {
    expect(formatCompactCOP(1_500_000_000)).toBe('$ 1.500 M')
    expect(formatCompactCOP(90_000_000)).toBe('$ 90 M')
    expect(formatCompactCOP(1_250_000)).toBe('$ 1,3 M')
    expect(formatCompactCOP(850_000)).toBe('$ 850 mil')
    expect(formatCompactCOP(-90_000_000)).toBe('-$ 90 M')
    expect(formatCompactCOP(0)).toBe('$ 0')
  })

  it('pasa a billones para que la cifra no desborde', () => {
    expect(formatCompactCOP(3_180_232_000_000)).toBe('$ 3,2 billones')
    expect(formatCompactCOP(1_000_000_000_000)).toBe('$ 1,0 billón')
    expect(formatCompactCOP(-2_500_000_000_000)).toBe('-$ 2,5 billones')
  })
})

describe('porcentajes', () => {
  it('formatea y agrega el signo en las variaciones', () => {
    expect(formatPercent(0.4523)).toBe('45 %')
    expect(formatSignedPercent(0.1538)).toBe('+15,4 %')
    expect(formatSignedPercent(-0.072)).toBe('−7,2 %')
    expect(formatSignedPercent(0)).toBe('0,0 %')
  })
})
