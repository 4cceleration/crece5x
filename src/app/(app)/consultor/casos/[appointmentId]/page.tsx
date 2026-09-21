import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getAppointmentDetail, getAppointmentForConsultant } from '@/services/agenda'
import { getResultData } from '@/services/report'
import { companyEmails } from '@/services/companies'
import { audit } from '@/services/audit'
import { formatDateTime } from '@/domain/dates'
import { ResultView } from '@/components/result-view'
import { completeAction, saveNotesAction } from '../../actions'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'

export default async function CasoPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  const { appointmentId } = await params
  const { ok } = await searchParams
  const user = await requireUser(['consultor'])
  const appt = await getAppointmentForConsultant(db, appointmentId, user.id)
  if (!appt) notFound()
  const detail = (await getAppointmentDetail(db, appointmentId))!
  const emails = await companyEmails(db, appt.companyId)
  const data = appt.consultationId ? await getResultData(db, appt.consultationId) : null
  if (appt.consultationId) {
    await audit(db, { userId: user.id, action: 'ver_reporte', entity: 'consultation', entityId: appt.consultationId })
  }

  return (
    <div className="space-y-16 pt-6">
      <section className="space-y-2">
        <p className="text-sm text-muted first-letter:uppercase">{formatDateTime(appt.startsAt)}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{detail.companyName}</h1>
        <p className="text-muted">{emails.join(', ')}</p>
      </section>

      <form action={saveNotesAction.bind(null, appointmentId)} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Notas de la sesión</span>
          <textarea
            name="notes"
            defaultValue={appt.notes ?? ''}
            rows={5}
            className="w-full rounded-md p-4 text-ink bg-card ring-1 ring-ink/15 outline-hidden transition-shadow duration-base hover:ring-ink/30 focus:ring-brand"
          />
        </label>
        <div className="flex flex-wrap items-center gap-6">
          <SubmitButton pendingLabel="Guardando…">Guardar notas</SubmitButton>
          {ok && <span role="status" className="text-sm text-muted">Guardado</span>}
        </div>
      </form>

      {data ? (
        <ResultView data={data} pdfHref={`/consulta/${data.consultationId}/resultado/pdf`} />
      ) : (
        <p className="text-muted">Esta empresa aún no ha terminado una consulta.</p>
      )}

      {appt.status === 'reservada' && (
        <form action={completeAction.bind(null, appointmentId)}>
          <button className={buttonClass('link')}>Marcar la cita como realizada</button>
        </form>
      )}
    </div>
  )
}
