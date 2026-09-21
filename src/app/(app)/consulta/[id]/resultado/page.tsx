import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { getResultData } from '@/services/report'
import { isMockAnalyst } from '@/ai/analyst'
import { ResultView } from '@/components/result-view'
import { sendReportAction } from '../../actions'
import { ButtonLink, buttonClass } from '@/ui/button'
import { Magnetic } from '@/ui/magnetic'

export default async function ResultadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ enviado?: string; error?: string }>
}) {
  const { id } = await params
  const { enviado, error } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status !== 'resultado') redirect(stepPath(id, c.status))
  const data = await getResultData(db, id)
  if (!data) notFound()

  // Agendar con un consultor es siempre la acción principal; la ruta de aprendizaje queda como secundaria
  const primary = { href: '/agenda', label: 'Agendar con un consultor' }
  const secondary = { href: '/academia', label: 'Ver mi ruta de aprendizaje' }

  return (
    <>
      <ResultView
        data={data}
        locked={{ sendAction: sendReportAction.bind(null, id), sent: enviado === '1', error: error === 'correo' }}
        mockNote={isMockAnalyst()}
        actions={
          <>
            <Magnetic>
              <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            </Magnetic>
            <Link href={secondary.href} className={buttonClass('link')}>{secondary.label}</Link>
          </>
        }
      />
    </>
  )
}
