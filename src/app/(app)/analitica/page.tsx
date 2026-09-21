import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { latestCompletedConsultation } from '@/services/consultations'
import { getResultData } from '@/services/report'
import { FinancialCharts } from '@/components/charts/financial-charts'
import { explainChartAction } from '../consulta/actions'
import { ButtonLink } from '@/ui/button'
import { Icon } from '@/ui/icons'

export default async function AnaliticaPage() {
  const { companyId } = await requireCompany()
  const last = await latestCompletedConsultation(db, companyId)
  const data = last ? await getResultData(db, last.id) : null

  return (
    <div className="animate-enter space-y-6 pt-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Analítica financiera</h1>
        <p className="text-muted">
          {data?.financials
            ? 'Las cifras que leímos de sus estados financieros. Toque el “?” de cada gráfica para que se la expliquemos.'
            : 'Aquí verá sus cifras cuando analicemos sus estados financieros.'}
        </p>
      </header>

      {data?.financials ? (
        <>
          <FinancialCharts
            financials={data.financials}
            ratios={data.ratios}
            explainAction={explainChartAction.bind(null, data.consultationId)}
          />
          <p className="text-sm text-muted">
            De su consulta del {data.completedAt.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.{' '}
            <ButtonLink href={`/consulta/${data.consultationId}/resultado`} variant="link">
              Ver el resultado completo
            </ButtonLink>
          </p>
        </>
      ) : (
        <div className="glass space-y-5 rounded-lg p-6 text-center sm:p-8">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
            <Icon name="analitica" size={24} />
          </span>
          <p className="text-muted">
            {data
              ? 'Su última consulta terminó sin estados financieros analizados. Suba el balance y el estado de resultados en una nueva consulta.'
              : 'Todavía no ha terminado una consulta.'}
          </p>
          <ButtonLink href="/inicio" className="gap-2">
            Ir a mi consulta
            <Icon name="siguiente" size={18} />
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
