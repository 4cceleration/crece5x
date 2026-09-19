import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { latestConsultation } from '@/services/consultations'
import { startConsultationAction } from '../consulta/actions'
import { SubmitButton } from '@/ui/submit-button'

export default async function InicioPage() {
  const { user, companyId } = await requireCompany()
  const last = await latestConsultation(db, companyId)
  const inProgress = last && last.status !== 'resultado'
  return (
    <section className="space-y-6 pt-10">
      <h1 className="text-4xl font-semibold tracking-tight">Hola, {user.name.split(' ')[0]}</h1>
      <p className="max-w-prose text-lg text-muted">Su consulta NIIF toma unos 15 minutos.</p>
      <form action={startConsultationAction}>
        <SubmitButton>{inProgress ? 'Continuar consulta' : 'Iniciar consulta'}</SubmitButton>
      </form>
    </section>
  )
}
