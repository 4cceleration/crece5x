import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, latestConsultation, startConsultation, stepPath } from '@/services/consultations'
import { upcomingForCompany } from '@/services/agenda'
import { formatDateTime } from '@/domain/dates'
import { startConsultationAction } from '../consulta/actions'
import { Score } from '@/ui/score'
import { ButtonLink, buttonClass } from '@/ui/button'
import { Icon } from '@/ui/icons'

export default async function InicioPage() {
  const { user, companyId } = await requireCompany()
  const last = await latestConsultation(db, companyId)
  const upcoming = await upcomingForCompany(db, companyId)
  const appointmentLine = upcoming && (
    <p className="text-sm text-muted">
      Su cita: <Link href="/agenda" className="text-ink underline underline-offset-4">{formatDateTime(upcoming.startsAt)}</Link>
    </p>
  )
  const firstName = user.name.split(' ')[0]

  if (last?.status === 'resultado' && last.finalScore !== null) {
    return (
      <section className="animate-enter space-y-10 pt-6">
        <p className="text-muted">Hola, {firstName}. Su índice de salud NIIF:</p>
        <Score value={last.finalScore} />
        <div className="flex flex-wrap items-center gap-6">
          <ButtonLink href={`/consulta/${last.id}/resultado`} className="gap-2">
            Ver resultado
            <Icon name="siguiente" size={18} />
          </ButtonLink>
          <form action={startConsultationAction}>
            <button className={buttonClass('link')}>Nueva consulta</button>
          </form>
        </div>
        {appointmentLine}
      </section>
    )
  }

  // Sin resultado todavía: directo al formulario de la consulta (la abierta o una nueva), sin botón intermedio
  const id = await startConsultation(db, companyId)
  const open = await getOwnedConsultation(db, id, companyId)
  redirect(stepPath(id, open?.status ?? 'clasificar'))
}
