import { db } from '@/db'
import { appUrl, getMailer } from '@/mail/mailer'
import { waitingReminderEmail } from '@/mail/templates'
import { dueReminders, markReminded, notifyAppointment } from '@/services/agenda'
import { companyNotificationEmails, getCompany } from '@/services/companies'
import { dueWaitingReminders, markWaitingReminded } from '@/services/invites'

export async function GET(req: Request) {
  // Sin CRON_SECRET configurado nadie puede invocar el cron ("Bearer undefined" no sirve)
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('No autorizado', { status: 401 })
  }
  const due = await dueReminders(db)
  let sent = 0
  for (const a of due) {
    try {
      await notifyAppointment(db, a.id, 'recordatorio', getMailer(), appUrl())
      await markReminded(db, a.id)
      sent++
    } catch (e) {
      console.error('Recordatorio fallido', a.id, e)
    }
  }

  // Consultas que esperan los estados financieros del contador: se le recuerda a la empresa a los 3 y 7 días
  let waiting = 0
  for (const c of await dueWaitingReminders(db)) {
    try {
      const to = await companyNotificationEmails(db, c.companyId)
      if (to.length > 0) {
        const company = await getCompany(db, c.companyId)
        const mail = waitingReminderEmail({ companyName: company?.name ?? '', url: `${appUrl()}/consulta/${c.id}/examinar` })
        await getMailer().send({ to, ...mail })
        waiting++
      }
      // Sin destinatarios también cuenta: así no se reintenta cada día
      await markWaitingReminded(db, c.id)
    } catch (e) {
      console.error('Recordatorio de estados financieros fallido', c.id, e)
    }
  }
  return Response.json({ sent, waiting })
}
