import { SEVERITY_LABEL, type Severity } from '@/domain/types'

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const DISCLAIMER = 'Este reporte es orientativo y no constituye una opinión de auditoría.'

function layout(body: string, disclaimer = false): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#14213D">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="font-size:18px;font-weight:600;margin:0 0 32px">crece<span style="color:#3F9B6E">.</span></p>
${body}
${disclaimer ? `<p style="margin-top:40px;font-size:12px;color:#5B6477">${DISCLAIMER}</p>` : ''}
</div></body></html>`
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#2E7D5B;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:6px">${esc(label)}</a>`

export function reportEmail(d: {
  companyName: string
  score: number
  lightLabel: string
  findings: { title: string; severity: Severity }[]
  url: string
  needsConsultant: boolean
}): { subject: string; html: string } {
  const items = d.findings
    .slice(0, 5)
    .map((f) => `<li style="margin:0 0 8px"><span style="color:#5B6477">${SEVERITY_LABEL[f.severity]} ·</span> ${esc(f.title)}</li>`)
    .join('')
  const body = `
<p style="margin:0;color:#5B6477">${esc(d.companyName)}</p>
<p style="font-size:56px;font-weight:600;margin:8px 0 0">${d.score}<span style="font-size:20px;color:#5B6477">/100</span></p>
<p style="margin:4px 0 32px;color:#5B6477">${esc(d.lightLabel)}</p>
${items ? `<p style="font-weight:600;margin:0 0 12px">Lo más importante</p><ul style="padding-left:18px;margin:0 0 32px">${items}</ul>` : ''}
${button(d.url, d.needsConsultant ? 'Agendar con un consultor' : 'Ver el reporte completo')}
<p style="margin-top:16px;font-size:14px;color:#5B6477">Adjuntamos el reporte en PDF.</p>`
  return { subject: `Su resultado CRECE: ${d.score}/100`, html: layout(body, true) }
}

type AppointmentKind = 'confirmada' | 'recordatorio' | 'cancelada' | 'asignada'

export function appointmentEmail(d: {
  kind: AppointmentKind
  when: string
  companyName: string
  consultantName: string
  url: string
}): { subject: string; html: string } {
  const subject = {
    confirmada: `Cita confirmada: ${d.when}`,
    recordatorio: `Recordatorio: su cita es ${d.when}`,
    cancelada: `Cita cancelada: ${d.when}`,
    asignada: `Nueva cita con ${d.companyName}: ${d.when}`,
  }[d.kind]
  const lead = {
    confirmada: `Su consulta con ${esc(d.consultantName)} quedó agendada.`,
    recordatorio: `Le recordamos su consulta con ${esc(d.consultantName)}.`,
    cancelada: 'La cita fue cancelada. Puede agendar otra cuando quiera.',
    asignada: `${esc(d.companyName)} agendó una consulta con usted.`,
  }[d.kind]
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">${esc(d.when)}</p>
<p style="margin:0 0 32px;color:#5B6477">${lead}</p>
${button(d.url, d.kind === 'asignada' ? 'Ver el caso' : 'Ver mi agenda')}`
  return { subject, html: layout(body) }
}

export function passwordResetEmail(d: { name: string; url: string }): { subject: string; html: string } {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">Restablecer contraseña</p>
<p style="margin:0 0 32px;color:#5B6477">Hola, ${esc(d.name)}. Recibimos una solicitud para cambiar su contraseña. El enlace vence en una hora.</p>
${button(d.url, 'Crear nueva contraseña')}
<p style="margin-top:24px;font-size:14px;color:#5B6477">Si no la pidió, ignore este correo: su contraseña no cambia.</p>`
  return { subject: 'Restablecer su contraseña de CRECE', html: layout(body) }
}
