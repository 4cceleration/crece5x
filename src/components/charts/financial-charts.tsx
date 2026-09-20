import type { Extracted, Period } from '@/ai/schemas'
import type { Ratios } from '@/domain/ratios'
import { formatCompactCOP, formatPercent, formatSignedPercent } from '@/domain/format'

// Paleta categórica validada (banda de luminosidad, saturación y separación para daltonismo)
const SERIES = ['#12805A', '#5FBF93', '#3A6FB0'] as const

type Segment = { label: string; value: number; color: string }

function delta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

// Fila de cifras clave con su variación frente al año anterior
function KpiRow({ periods }: { periods: Period[] }) {
  const [now, before] = periods
  const items: { label: string; value: number | null; change: number | null; moreIsBetter: boolean }[] = [
    { label: 'Ingresos', value: now.revenue, change: delta(now.revenue, before?.revenue ?? null), moreIsBetter: true },
    { label: 'Utilidad neta', value: now.netIncome, change: delta(now.netIncome, before?.netIncome ?? null), moreIsBetter: true },
    { label: 'Activos', value: now.totalAssets, change: delta(now.totalAssets, before?.totalAssets ?? null), moreIsBetter: true },
    { label: 'Patrimonio', value: now.equity, change: delta(now.equity, before?.equity ?? null), moreIsBetter: true },
  ]
  return (
    <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {items.map((i) => {
        const good = i.change !== null && (i.change >= 0) === i.moreIsBetter
        return (
          <div key={i.label} className="text-left">
            <dt className="text-sm text-muted">{i.label}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{i.value === null ? '—' : formatCompactCOP(i.value)}</dd>
            {i.change !== null && (
              <dd className={`mt-0.5 text-sm tabular-nums ${good ? 'text-ok' : 'text-bad'}`}>
                <span aria-hidden>{i.change >= 0 ? '▲' : '▼'}</span> {formatSignedPercent(i.change)}
                <span className="text-muted"> vs {before?.label}</span>
              </dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}

// Barra apilada horizontal: composición de una magnitud, con etiquetas visibles y separación de 2 px
function StackedBar({ title, total, segments }: { title: string; total: number; segments: Segment[] }) {
  const usable = segments.filter((s) => s.value > 0)
  if (total <= 0 || usable.length === 0) return null
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-medium">{title}</p>
        <p className="tabular-nums text-muted">{formatCompactCOP(total)}</p>
      </div>
      <div className="flex h-5 gap-0.5" role="img" aria-label={`${title}: ${usable.map((s) => `${s.label} ${formatPercent(s.value / total)}`).join(', ')}`}>
        {usable.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${formatCompactCOP(s.value)} (${formatPercent(s.value / total)})`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            className={`h-5 ${i === 0 ? 'rounded-l-sm' : ''} ${i === usable.length - 1 ? 'rounded-r-sm' : ''}`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {usable.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span className="text-muted">{s.label}</span>
            <span className="tabular-nums">{formatPercent(s.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Medidor: valor sobre una pista, con marca del valor de referencia
function Meter({
  label,
  value,
  max,
  reference,
  display,
  good,
  hint,
}: {
  label: string
  value: number
  max: number
  reference: number
  display: string
  good: boolean
  hint: string
}) {
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / max) * 100))}%`
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className={`font-display text-lg font-semibold tabular-nums ${good ? 'text-ok' : 'text-warn'}`}>{display}</span>
      </div>
      <div className="relative h-2 rounded-full bg-ink/8">
        <div className="h-2 rounded-full" style={{ width: pct(value), background: SERIES[0] }} />
        <span className="absolute top-[-3px] h-3.5 w-0.5 rounded-full bg-ink/40" style={{ left: pct(reference) }} aria-hidden />
      </div>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  )
}

export function FinancialCharts({ financials, ratios }: { financials: Extracted; ratios: Ratios | null }) {
  const [p] = financials.periods
  if (!p) return null

  const assets: Segment[] = [
    { label: 'Activo corriente', value: p.currentAssets ?? 0, color: SERIES[0] },
    { label: 'Activo no corriente', value: p.nonCurrentAssets ?? 0, color: SERIES[1] },
  ]
  const funding: Segment[] = [
    { label: 'Pasivo corriente', value: p.currentLiabilities ?? 0, color: SERIES[2] },
    { label: 'Pasivo no corriente', value: p.nonCurrentLiabilities ?? 0, color: SERIES[1] },
    { label: 'Patrimonio', value: p.equity ?? 0, color: SERIES[0] },
  ]
  const totalAssets = p.totalAssets ?? assets.reduce((a, s) => a + s.value, 0)
  const totalFunding = (p.totalLiabilities ?? 0) + (p.equity ?? 0)

  const meters = [
    ratios?.currentRatio != null && {
      label: 'Razón corriente',
      value: ratios.currentRatio,
      max: 3,
      reference: 1.5,
      display: ratios.currentRatio.toFixed(2),
      good: ratios.currentRatio >= 1.5,
      hint: 'Referencia: 1,5 veces el pasivo corriente',
    },
    ratios?.debtRatio != null && {
      label: 'Endeudamiento',
      value: ratios.debtRatio,
      max: 1,
      reference: 0.6,
      display: formatPercent(ratios.debtRatio),
      good: ratios.debtRatio <= 0.6,
      hint: 'Referencia: hasta 60 % del activo',
    },
    ratios?.netMargin != null && {
      label: 'Margen neto',
      value: ratios.netMargin,
      max: 0.3,
      reference: 0.05,
      display: formatPercent(ratios.netMargin, 1),
      good: ratios.netMargin >= 0.05,
      hint: 'Referencia: 5 % de los ingresos',
    },
    ratios?.roa != null && {
      label: 'Rentabilidad del activo',
      value: ratios.roa,
      max: 0.3,
      reference: 0.05,
      display: formatPercent(ratios.roa, 1),
      good: ratios.roa >= 0.05,
      hint: 'Referencia: 5 % del activo',
    },
  ].filter(Boolean) as Parameters<typeof Meter>[0][]

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Sus cifras</h2>
        <div className="glass rounded-lg p-6">
          <KpiRow periods={financials.periods} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Estructura financiera</h2>
        <div className="glass space-y-6 rounded-lg p-6 text-left">
          <StackedBar title="Activo" total={totalAssets} segments={assets} />
          <StackedBar title="Pasivo y patrimonio" total={totalFunding} segments={funding} />
        </div>
      </section>

      {meters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Indicadores</h2>
          <div className="glass grid gap-6 rounded-lg p-6 text-left sm:grid-cols-2">
            {meters.map((m) => (
              <Meter key={m.label} {...m} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
