import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { getResultData } from '@/services/report'
import { isMockAnalyst } from '@/ai/analyst'
import { ResultView } from '@/components/result-view'
import { Steps } from '@/ui/steps'
import { ButtonLink, buttonClass } from '@/ui/button'

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status !== 'resultado') redirect(stepPath(id, c.status))
  const data = await getResultData(db, id)
  if (!data) notFound()

  const agenda = { href: '/agenda', label: data.needsConsultant ? 'Agendar con un consultor' : 'Hablar con un consultor' }
  const ruta = { href: '/academia', label: 'Ver mi ruta de aprendizaje' }
  const [primary, secondary] = data.needsConsultant ? [agenda, ruta] : [ruta, agenda]

  return (
    <>
      <Steps current={data.needsConsultant ? 4 : 3} />
      <ResultView
        data={data}
        pdfHref={`/consulta/${id}/resultado/pdf`}
        mockNote={isMockAnalyst()}
        actions={
          <>
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <Link href={secondary.href} className={buttonClass('link')}>{secondary.label}</Link>
          </>
        }
      />
    </>
  )
}
