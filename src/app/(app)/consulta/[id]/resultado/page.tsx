import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { getCompanyPlan } from '@/services/plans'
import { can, PRIMER_CIERRE } from '@/domain/plans'
import { BASIS_NOTE } from '@/domain/eeff'
import { getResultData } from '@/services/report'
import { isMockAnalyst } from '@/ai/analyst'
import { ResultView } from '@/components/result-view'
import { explainUpgrade } from '@/components/plan-upsell'
import { explainChartAction, sendReportAction } from '../../actions'
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
  const { plan } = await getCompanyPlan(db, companyId)
  const explica = can(plan, 'explicacion-ia')

  // Agendar con un consultor es siempre la acción principal; la ruta de aprendizaje queda como secundaria.
  // Con contabilidad empírica, lo que se agenda es armar el primer cierre y la guía es qué son los estados financieros
  const sinEEFF = data.eeff === 'empirica'
  const primary = sinEEFF
    ? { href: '/agenda', label: 'Armar mi primer cierre' }
    : { href: '/agenda', label: 'Agendar con un consultor' }
  const secondary = sinEEFF
    ? { href: '/academia/presentacion', label: 'Qué son los estados financieros' }
    : { href: '/academia', label: 'Ver mi ruta de aprendizaje' }
  const basisNote = data.basis && data.basis !== 'estados' ? BASIS_NOTE[data.basis] : null
  const notice = sinEEFF ? (
    <div className="space-y-2">
      <p>
        <span className="font-semibold">Su mayor riesgo es no tener estados financieros.</span> Sin ellos no puede
        demostrar sus cifras ante un banco, la DIAN o la Supersociedades. Con el{' '}
        <Link href="/planes#primer-cierre" className="underline underline-offset-4">
          {PRIMER_CIERRE.name}
        </Link>{' '}
        un consultor los arma con usted.
      </p>
      {basisNote && <p className="text-muted">{basisNote}</p>}
    </div>
  ) : basisNote ? (
    <p>{basisNote} Un consultor puede convertirlo en estados financieros NIIF.</p>
  ) : undefined

  return (
    <>
      <ResultView
        data={data}
        notice={notice}
        locked={
          can(plan, 'plan-accion')
            ? undefined
            : { sendAction: sendReportAction.bind(null, id), sent: enviado === '1', error: error === 'correo' }
        }
        explainAction={explica ? explainChartAction.bind(null, id) : undefined}
        upgrade={explica ? undefined : explainUpgrade}
        chartsPreview={!can(plan, 'analitica')}
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
