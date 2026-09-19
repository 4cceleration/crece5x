import { describe, expect, it } from 'vitest'
import { appointmentEmail, reportEmail } from './templates'

describe('plantillas de correo', () => {
  it('reporte: puntaje, hallazgos escapados, enlace y aviso legal', () => {
    const { subject, html } = reportEmail({
      companyName: 'La Espiga <SAS>',
      score: 72,
      lightLabel: 'Requiere atención',
      findings: [{ title: 'Falta flujo & notas', severity: 'alta' }],
      url: 'https://crece.app/consulta/1/resultado',
      needsConsultant: true,
    })
    expect(subject).toBe('Su resultado crece5x: 72/100')
    expect(html).toContain('La Espiga &lt;SAS&gt;')
    expect(html).toContain('Falta flujo &amp; notas')
    expect(html).toContain('https://crece.app/consulta/1/resultado')
    expect(html).toContain('Agendar con un consultor')
    expect(html).toContain('no constituye una opinión de auditoría')
  })

  it('cita: asunto según tipo', () => {
    const d = { when: 'lunes, 28 de septiembre de 2026, 10:00', companyName: 'Espiga', consultantName: 'Laura', url: 'https://x' }
    expect(appointmentEmail({ ...d, kind: 'confirmada' }).subject).toBe('Cita confirmada: lunes, 28 de septiembre de 2026, 10:00')
    expect(appointmentEmail({ ...d, kind: 'recordatorio' }).subject).toMatch(/^Recordatorio/)
    expect(appointmentEmail({ ...d, kind: 'cancelada' }).subject).toMatch(/^Cita cancelada/)
    expect(appointmentEmail({ ...d, kind: 'asignada' }).subject).toMatch(/^Nueva cita/)
  })
})
