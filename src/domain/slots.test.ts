import { describe, expect, it } from 'vitest'
import { availableSlots, uniqueTimes } from './slots'

// Lunes 21 sep 2026, 08:00 en Bogotá = 13:00 UTC
const now = new Date('2026-09-21T13:00:00Z')
const rules = [{ consultantId: 'c1', weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60 }]

describe('availableSlots', () => {
  it('genera franjas y exige 2 horas de anticipación', () => {
    const s = availableSlots({ rules, busy: [], now, days: 1, durationMin: 60, offsetMin: -300 })
    // 9:00 y 10:00 están a menos de 2 h; solo queda 11:00 (16:00 UTC)
    expect(s.map((x) => x.startsAt.toISOString())).toEqual(['2026-09-21T16:00:00.000Z'])
  })

  it('incluye la semana siguiente y excluye franjas ocupadas', () => {
    const busy = [{ consultantId: 'c1', startsAt: new Date('2026-09-28T14:00:00Z'), endsAt: new Date('2026-09-28T15:00:00Z') }]
    const s = availableSlots({ rules, busy, now, days: 8, durationMin: 60, offsetMin: -300 })
    expect(s.map((x) => x.startsAt.toISOString())).toEqual([
      '2026-09-21T16:00:00.000Z',
      '2026-09-28T15:00:00.000Z',
      '2026-09-28T16:00:00.000Z',
    ])
  })

  it('uniqueTimes deduplica horas con varios consultores', () => {
    const two = [...rules, { ...rules[0], consultantId: 'c2' }]
    const s = availableSlots({ rules: two, busy: [], now, days: 1, durationMin: 60, offsetMin: -300 })
    expect(s).toHaveLength(2)
    expect(uniqueTimes(s)).toHaveLength(1)
  })
})
