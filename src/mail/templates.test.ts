import { describe, expect, it } from 'vitest'
import { accountantDoneEmail, accountantInviteEmail, appointmentEmail, reportEmail, waitingReminderEmail } from './templates'

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

  it('invitación al contador: empresa escapada, enlace y vencimiento', () => {
    const { subject, html } = accountantInviteEmail({ companyName: 'Pan & Co', inviterName: 'Ana', url: 'https://crece.app/contador/abc', days: 7 })
    expect(subject).toBe('Pan & Co le pide sus estados financieros')
    expect(html).toContain('Pan &amp; Co')
    expect(html).toContain('https://crece.app/contador/abc')
    expect(html).toContain('vence en 7 días')
  })

  it('aviso de archivos del contador y recordatorio a la empresa', () => {
    expect(accountantDoneEmail({ companyName: 'E', accountantEmail: 'c@f.co', files: 2, url: 'https://x' }).html).toContain('2 archivos')
    expect(waitingReminderEmail({ companyName: 'E', url: 'https://x/examinar' }).html).toContain('https://x/examinar')
  })
})
