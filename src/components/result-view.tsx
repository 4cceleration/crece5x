import Link from 'next/link'
import type { ResultData } from '@/services/report'
import { RATIO_LABELS } from '@/domain/ratios'
import { SEVERITY_LABEL, type Severity } from '@/domain/types'
import { Score } from '@/ui/score'
import { Icon } from '@/ui/icons'
import { buttonClass } from '@/ui/button'

const SEV_DOT: Record<Severity, string> = { critica: 'bg-bad', alta: 'bg-bad', media: 'bg-warn', baja: 'bg-muted' }

function FindingItem({ f }: { f: ResultData['findings'][number] }) {
  return (
    <li className="space-y-1 py-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <span className={`size-2 rounded-full ${SEV_DOT[f.severity]}`} aria-hidden />
        {SEVERITY_LABEL[f.severity]} · {f.niifSection}
      </p>
      <p className="font-medium">{f.title}</p>
      <p className="text-muted">{f.recommendation}</p>
    </li>
  )
}

export function ResultView({
  data,
  actions,
  pdfHref,
  mockNote = false,
}: {
  data: ResultData
  actions?: React.ReactNode
  pdfHref: string
  mockNote?: boolean
}) {
  const top = data.findings.slice(0, 5)
  const rest = data.findings.slice(5)
  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <p className="text-sm text-muted">{data.companyName} · Grupo {data.group} · {data.groupName}</p>
        <Score value={data.finalScore} />
        {actions && <div className="flex flex-wrap items-center gap-6">{actions}</div>}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Por dimensión</h2>
        <ul className="space-y-4">
          {data.dimensions.map((d) => (
            <li key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
              <span>{d.name}</span>
              <span className="text-muted tabular-nums">{d.score === null ? 'No aplica' : Math.round(d.score)}</span>
              <div className="col-span-2 h-1 rounded-full bg-surface">
                <div className="h-1 rounded-full bg-brand" style={{ width: `${d.score ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Qué hacer primero</h2>
        {data.findings.length === 0 ? (
          <p className="text-muted">No encontramos brechas relevantes.</p>
        ) : (
          <ul className="divide-y divide-surface">
            {top.map((f) => <FindingItem key={f.id} f={f} />)}
          </ul>
        )}
        {rest.length > 0 && (
          <details>
            <summary className="cursor-pointer py-2 text-sm text-muted">Ver {rest.length} más</summary>
            <ul className="divide-y divide-surface">
              {rest.map((f) => <FindingItem key={f.id} f={f} />)}
            </ul>
          </details>
        )}
      </section>

      {data.ratios && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Indicadores</h2>
          <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-3">
            {RATIO_LABELS.map((r) => {
              const v = data.ratios![r.key]
              if (v === null) return null
              return (
                <div key={r.key}>
                  <dt className="text-sm text-muted">{r.label}</dt>
                  <dd className="text-xl font-medium tabular-nums">{r.percent ? `${Math.round(v * 100)} %` : v.toFixed(2)}</dd>
                </div>
              )
            })}
          </dl>
        </section>
      )}

      <footer className="space-y-3 text-sm text-muted">
        {data.analysisError && (
          <p>No pudimos leer sus estados financieros ({data.analysisError}). El índice usa solo el diagnóstico.</p>
        )}
        {mockNote && data.analysisStatus === 'listo' && <p>Análisis de demostración: aún no hay un modelo de IA configurado.</p>}
        <p>
          <Link href={pdfHref} className={`${buttonClass('link')} inline-flex items-center gap-1.5`} prefetch={false}>
            <Icon name="pdf" size={18} />
            Descargar PDF
          </Link>
        </p>
        <p>Este reporte es orientativo y no constituye una opinión de auditoría.</p>
      </footer>
    </div>
  )
}
