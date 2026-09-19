import { db } from '@/db'
import { getCurrentUser } from '@/lib/session'
import { appointmentIcs, getAppointmentDetail } from '@/services/agenda'
import { getCompanyIdForUser } from '@/services/companies'

export async function GET(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const user = await getCurrentUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  const d = await getAppointmentDetail(db, appointmentId)
  if (!d) return new Response('No encontrado', { status: 404 })
  const allowed =
    d.appointment.consultantId === user.id || (await getCompanyIdForUser(db, user.id)) === d.appointment.companyId
  if (!allowed) return new Response('No encontrado', { status: 404 })
  return new Response(appointmentIcs(d), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="cita-crece.ics"',
    },
  })
}
