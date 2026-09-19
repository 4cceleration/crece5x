'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { appUrl, getMailer } from '@/mail/mailer'
import { bookAppointment, cancelAppointment, notifyAppointment } from '@/services/agenda'

export async function bookAction(fd: FormData) {
  const { companyId } = await requireCompany()
  const startsAt = new Date(String(fd.get('startsAt') ?? ''))
  if (Number.isNaN(startsAt.getTime())) redirect('/agenda')
  const r = await bookAppointment(db, { companyId, startsAt })
  if (!r.ok) redirect(`/agenda?error=${r.reason}`)
  try {
    await notifyAppointment(db, r.appointmentId, 'confirmada', getMailer(), appUrl())
  } catch (e) {
    console.error('No se pudo enviar la confirmación', e)
  }
  redirect('/agenda')
}

export async function cancelAction(appointmentId: string) {
  const { companyId } = await requireCompany()
  if (await cancelAppointment(db, appointmentId, companyId)) {
    try {
      await notifyAppointment(db, appointmentId, 'cancelada', getMailer(), appUrl())
    } catch (e) {
      console.error('No se pudo enviar la cancelación', e)
    }
  }
  redirect('/agenda')
}
