import { describe, expect, it } from 'vitest'
import { buildIcs } from './ics'

describe('buildIcs', () => {
  it('genera un evento válido con fechas UTC y texto escapado', () => {
    const ics = buildIcs({
      uid: 'abc',
      start: new Date('2026-09-28T15:00:00Z'),
      end: new Date('2026-09-28T16:00:00Z'),
      summary: 'Consulta NIIF, CRECE',
      description: 'Línea 1\nLínea 2',
    })
    expect(ics).toContain('BEGIN:VCALENDAR\r\n')
    expect(ics).toContain('DTSTART:20260928T150000Z')
    expect(ics).toContain('DTEND:20260928T160000Z')
    expect(ics).toContain('SUMMARY:Consulta NIIF\\, CRECE')
    expect(ics).toContain('DESCRIPTION:Línea 1\\nLínea 2')
    expect(ics).toContain('UID:abc@crece')
  })
})
