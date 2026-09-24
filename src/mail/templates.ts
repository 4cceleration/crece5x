import { SEVERITY_LABEL, type Severity } from '@/domain/types'

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const DISCLAIMER = 'Este reporte es orientativo y no constituye una opinión de auditoría.'

function layout(body: string, disclaimer = false): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#1E2422">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="font-size:18px;font-weight:600;margin:0 0 32px">crece<span style="color:#0F6B5C">5x</span></p>
${body}
${disclaimer ? `<p style="margin-top:40px;font-size:12px;color:#52605A">${DISCLAIMER}</p>` : ''}
</div></body></html>`
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#0F6B5C;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:6px">${esc(label)}</a>`

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
    .map((f) => `<li style="margin:0 0 8px"><span style="color:#52605A">${SEVERITY_LABEL[f.severity]} ·</span> ${esc(f.title)}</li>`)
    .join('')
  const body = `
<p style="margin:0;color:#52605A">${esc(d.companyName)}</p>
<p style="font-size:56px;font-weight:600;margin:8px 0 0">${d.score}<span style="font-size:20px;color:#52605A">/100</span></p>
<p style="margin:4px 0 32px;color:#52605A">${esc(d.lightLabel)}</p>
${items ? `<p style="font-weight:600;margin:0 0 12px">Lo más importante</p><ul style="padding-left:18px;margin:0 0 32px">${items}</ul>` : ''}
${button(d.url, d.needsConsultant ? 'Agendar con un consultor' : 'Ver el reporte completo')}
<p style="margin-top:16px;font-size:14px;color:#52605A">Adjuntamos el reporte en PDF.</p>`
  return { subject: `Su resultado crece5x: ${d.score}/100`, html: layout(body, true) }
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
<p style="margin:0 0 32px;color:#52605A">${lead}</p>
${button(d.url, d.kind === 'asignada' ? 'Ver el caso' : 'Ver mi agenda')}`
  return { subject, html: layout(body) }
}

export function passwordResetEmail(d: { name: string; url: string }): { subject: string; html: string } {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">Restablecer contraseña</p>
<p style="margin:0 0 32px;color:#52605A">Hola, ${esc(d.name)}. Recibimos una solicitud para cambiar su contraseña. El enlace vence en una hora.</p>
${button(d.url, 'Crear nueva contraseña')}
<p style="margin-top:24px;font-size:14px;color:#52605A">Si no la pidió, ignore este correo: su contraseña no cambia.</p>`
  return { subject: 'Restablecer su contraseña de crece5x', html: layout(body) }
}

export function emailChangeCodeEmail(d: { name: string; code: string; minutes: number }): { subject: string; html: string } {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">Confirme su correo nuevo</p>
<p style="margin:0 0 24px;color:#52605A">Hola, ${esc(d.name)}. Escriba este código en su perfil para terminar el cambio de correo.</p>
<p style="font-size:34px;font-weight:600;letter-spacing:8px;margin:0 0 24px">${esc(d.code)}</p>
<p style="margin:0;color:#52605A">El código vence en ${d.minutes} minutos.</p>
<p style="margin-top:24px;font-size:14px;color:#52605A">Si no pidió el cambio, ignore este correo: su cuenta sigue con el correo de siempre.</p>`
  return { subject: `Su código de crece5x: ${d.code}`, html: layout(body) }
}

export function accountantInviteEmail(d: { companyName: string; inviterName: string; url: string; days: number }): {
  subject: string
  html: string
} {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">${esc(d.companyName)} le pide sus estados financieros</p>
<p style="margin:0 0 24px;color:#52605A">${esc(d.inviterName)} está haciendo un diagnóstico NIIF de ${esc(d.companyName)} en crece5x y le pide subir los estados financieros del último cierre: balance, estado de resultados y notas, en PDF o Excel.</p>
${button(d.url, 'Subir los estados financieros')}
<p style="margin-top:24px;font-size:14px;color:#52605A">No necesita crear cuenta. El enlace es solo para usted y vence en ${d.days} días.</p>`
  return { subject: `${d.companyName} le pide sus estados financieros`, html: layout(body) }
}

export function accountantDoneEmail(d: { companyName: string; accountantEmail: string; files: number; url: string }): {
  subject: string
  html: string
} {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">Su contador ya subió los archivos</p>
<p style="margin:0 0 32px;color:#52605A">${esc(d.accountantEmail)} subió ${d.files === 1 ? 'un archivo' : `${d.files} archivos`} a la consulta de ${esc(d.companyName)}. Ya puede ver su análisis.</p>
${button(d.url, 'Ver mi análisis')}`
  return { subject: 'Su contador ya subió los estados financieros', html: layout(body) }
}

export function waitingReminderEmail(d: { companyName: string; url: string }): { subject: string; html: string } {
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">¿Ya tiene los estados financieros?</p>
<p style="margin:0 0 32px;color:#52605A">Su consulta de ${esc(d.companyName)} está esperando los archivos del último cierre. Súbalos usted o recuérdele a su contador desde crece5x.</p>
${button(d.url, 'Seguir con mi consulta')}`
  return { subject: 'Su consulta espera los estados financieros', html: layout(body) }
}
