import Link from 'next/link'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { latestConsultation } from '@/services/consultations'
import { upcomingForCompany } from '@/services/agenda'
import { formatDateTime } from '@/domain/dates'
import { startConsultationAction } from '../consulta/actions'
import { Score } from '@/ui/score'
import { ButtonLink, buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

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
      <section className="space-y-10 pt-6">
        <p className="text-muted">Hola, {firstName}. Su índice de salud NIIF:</p>
        <Score value={last.finalScore} />
        <div className="flex flex-wrap items-center gap-6">
          <ButtonLink href={`/consulta/${last.id}/resultado`}>Ver resultado</ButtonLink>
          <form action={startConsultationAction}>
            <button className={buttonClass('link')}>Nueva consulta</button>
          </form>
        </div>
        {appointmentLine}
      </section>
    )
  }

  return (
    <section className="space-y-6 pt-10">
      <h1 className="text-4xl font-semibold tracking-tight">Hola, {firstName}</h1>
      <p className="max-w-prose text-lg text-muted">Su consulta NIIF toma unos 15 minutos.</p>
      <form action={startConsultationAction}>
        <SubmitButton>{last ? 'Continuar consulta' : 'Iniciar consulta'}</SubmitButton>
      </form>
      <p className="text-sm text-muted">
        ¿Prefiere hablar con alguien? <Link href="/agenda" className="underline underline-offset-4">Agende un consultor</Link>
      </p>
      {appointmentLine}
    </section>
  )
}
