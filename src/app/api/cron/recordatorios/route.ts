import { db } from '@/db'
import { appUrl, getMailer } from '@/mail/mailer'
import { dueReminders, markReminded, notifyAppointment } from '@/services/agenda'

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
  return Response.json({ sent })
}
