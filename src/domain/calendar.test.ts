import { describe, expect, it } from 'vitest'
import { addMonths, monthGrid, monthKey } from './calendar'

describe('monthGrid', () => {
  it('arma semanas de lunes a domingo con relleno de otros meses', () => {
    const weeks = monthGrid('2026-09')
    // septiembre 2026 empieza en martes: la primera celda es el lunes 31 de agosto
    expect(weeks[0][0]).toEqual({ key: '2026-08-31', day: 31, inMonth: false })
    expect(weeks[0][1]).toEqual({ key: '2026-09-01', day: 1, inMonth: true })
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    const last = weeks[weeks.length - 1]
    expect(last.some((c) => c.key === '2026-09-30')).toBe(true)
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('navega meses y obtiene la clave de un día', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(monthKey('2026-09-22')).toBe('2026-09')
  })
})
