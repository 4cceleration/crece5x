import Link from 'next/link'
import type { ResultData } from '@/services/report'
import { trafficLight } from '@/domain/scoring'
import { SEVERITY_LABEL, type Severity } from '@/domain/types'
import { FinancialCharts } from './charts/financial-charts'
import { AnalyticsUpsell } from './plan-upsell'
import type { ExplainAction } from './charts/chart-card'
import { Score } from '@/ui/score'
import { Icon } from '@/ui/icons'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

const SEV_PILL: Record<Severity, string> = {
  critica: 'bg-bad text-on-accent',
  alta: 'bg-bad/12 text-bad',
  media: 'bg-warn/15 text-warn-ink',
  baja: 'bg-ink/8 text-muted',
}
const BAR = { verde: 'bg-ok', ambar: 'bg-warn', rojo: 'bg-bad' } as const

function FindingItem({ f }: { f: ResultData['findings'][number] }) {
  return (
    <li className="space-y-1 py-4">
      <p className="flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide ${SEV_PILL[f.severity]}`}>
          {SEVERITY_LABEL[f.severity]}
        </span>
        <span className="text-muted">{f.niifSection}</span>
      </p>
      <p className="pt-1 font-semibold text-ink">{f.title}</p>
      <p className="text-ink">{f.recommendation}</p>
    </li>
  )
}

// Vista bloqueada del plan de acción: se insinúa el contenido y se entrega completo por correo
function LockedFindings({
  count,
  sendAction,
  sent,
  error,
}: {
  count: number
  sendAction: () => Promise<void>
  sent: boolean
  error: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-lg">
      <ul aria-hidden className="pointer-events-none select-none space-y-4 p-6 blur-[6px]">
        {Array.from({ length: Math.min(4, Math.max(2, count)) }).map((_, i) => (
          <li key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-ink/15" />
            <div className="h-4 w-3/4 rounded bg-ink/25" />
            <div className="h-3 w-2/3 rounded bg-ink/15" />
          </li>
        ))}
      </ul>
      <div className="glass absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
          <Icon name="contrasena" size={24} />
        </span>
        <p className="font-display text-lg font-semibold">
          {count} {count === 1 ? 'acción' : 'acciones'} priorizadas para su empresa
        </p>
        <p className="max-w-sm text-sm text-muted">
          Le enviamos el plan de acción completo con el reporte en PDF a su correo.
        </p>
        {sent ? (
          <p role="status" className="animate-pop flex items-center gap-2 font-medium text-brand-strong">
            <Icon name="check" size={20} />
            Enviado. Revise su correo.
          </p>
        ) : (
          <form action={sendAction}>
            <SubmitButton className="gap-2" pendingLabel="Enviando…">
              <Icon name="correo" size={20} />
              Enviármelo al correo
            </SubmitButton>
          </form>
        )}
        {error && <p className="text-sm text-bad">No pudimos enviar el correo. Intente de nuevo.</p>}
      </div>
    </div>
  )
}

export function ResultView({
  data,
  actions,
  notice,
  pdfHref,
  mockNote = false,
  locked,
  explainAction,
  upgrade,
  chartsPreview = false,
}: {
  data: ResultData
  actions?: React.ReactNode
  /** Aviso bajo el índice (p. ej. resultado preliminar o sin estados financieros) */
  notice?: React.ReactNode
  /** Solo para quien ve el reporte completo (consultor); la empresa lo recibe por correo */
  pdfHref?: string
  mockNote?: boolean
  /** Empresa: plan de acción bloqueado en pantalla y enviado por correo a pedido */
  locked?: { sendAction: () => Promise<void>; sent: boolean; error: boolean }
  /** Si viene, cada gráfica trae un botón "?" que pide la explicación al análisis */
  explainAction?: ExplainAction
  /** Sin explicación con IA: el "?" lleva a los planes */
  upgrade?: { href: string; label: string }
  /** Solo las cifras del último cierre; el resto de la analítica es de los planes de pago */
  chartsPreview?: boolean
}) {
  const top = data.findings.slice(0, 5)
  const rest = data.findings.slice(5)
  return (
    <div className="space-y-12">
      <section className="glass space-y-8 rounded-lg p-6 text-center sm:p-8">
        <p className="text-sm text-muted">
          {data.companyName} · Grupo {data.group} · {data.groupName}
        </p>
        <Score value={data.finalScore} />
        {notice && <div className="mx-auto max-w-md rounded-md bg-ink/5 px-4 py-3 text-left text-sm">{notice}</div>}
        {actions && <div className="flex flex-col items-center gap-4 [&>a:first-child]:w-full [&>a:first-child]:max-w-sm">{actions}</div>}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Por dimensión</h2>
        <ul className="glass divide-y divide-ink/5 rounded-lg">
          {data.dimensions.map((d) => {
            const score = d.score === null ? null : Math.round(d.score)
            return (
              <li key={d.key} className="space-y-2.5 px-6 py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{d.name}</span>
                  <span className="tabular-nums">
                    {score === null ? (
                      <span className="text-sm text-muted">No aplica</span>
                    ) : (
                      <>
                        <span className="font-display text-lg font-semibold">{score}</span>
                        <span className="text-sm text-muted"> / 100</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink/8">
                  {score !== null && (
                    <div
                      className={`h-2 rounded-full ${BAR[trafficLight(score)]} transition-[width] duration-slow`}
                      style={{ width: `${Math.max(score, 2)}%` }}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Qué hacer primero</h2>
        {data.findings.length === 0 ? (
          <p className="text-muted">No encontramos brechas relevantes.</p>
        ) : locked ? (
          <LockedFindings count={data.findings.length} {...locked} />
        ) : (
          <>
            <ul className="divide-y divide-ink/10">
              {top.map((f) => (
                <FindingItem key={f.id} f={f} />
              ))}
            </ul>
            {rest.length > 0 && (
              <details>
                <summary className="cursor-pointer py-2 text-sm text-muted">Ver {rest.length} más</summary>
                <ul className="divide-y divide-ink/10">
                  {rest.map((f) => (
                    <FindingItem key={f.id} f={f} />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>

      {data.financials && <FinancialCharts
          financials={data.financials}
          ratios={data.ratios}
          explainAction={explainAction}
          upgrade={upgrade}
          preview={chartsPreview}
          previewNote={<AnalyticsUpsell />}
        />}

      <footer className="space-y-3 text-sm text-muted">
        {data.analysisError && (
          <p>No pudimos leer sus estados financieros ({data.analysisError}). El índice usa solo el diagnóstico.</p>
        )}
        {mockNote && data.analysisStatus === 'listo' && <p>Análisis de demostración: aún no hay un modelo de IA configurado.</p>}
        {pdfHref && (
          <p>
            <Link href={pdfHref} className={`${buttonClass('link')} inline-flex items-center gap-1.5`} prefetch={false}>
              <Icon name="pdf" size={18} />
              Descargar PDF
            </Link>
          </p>
        )}
        <p>Este reporte es orientativo y no constituye una opinión de auditoría.</p>
      </footer>
    </div>
  )
}
