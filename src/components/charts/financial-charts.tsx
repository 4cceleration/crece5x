import type { Extracted } from '@/ai/schemas'
import type { Ratios } from '@/domain/ratios'
import { buildChartData, CHART_TITLES, type Flow, type Kpi, type Meter as MeterData, type Stack, type Trend } from '@/domain/charts'
import { formatCompactCOP, formatPercent, formatSignedPercent } from '@/domain/format'
import { Icon } from '@/ui/icons'
import { ChartCard, type ExplainAction } from './chart-card'

// Paleta categórica validada para cada tema (banda de luminosidad, saturación y separación para
// daltonismo); los valores viven en globals.css. Máximo tres series: una cuarta no pasa la
// separación exigida, así que los datos se agrupan antes de pintarlos.
const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'] as const

type Bar = { label: string; value: number; color: string; hint: string }

// Barras verticales con línea de base en cero: las filas se reparten según cuánto sube y cuánto baja,
// para que una barra negativa use la misma escala que una positiva
function Bars({ bars }: { bars: Bar[] }) {
  const maxUp = Math.max(0, ...bars.map((b) => b.value))
  const maxDown = Math.max(0, ...bars.map((b) => -b.value))
  const span = maxUp + maxDown
  if (span === 0) return null

  return (
    <div className="space-y-2">
      <div
        className="relative grid gap-x-1.5"
        style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`, gridTemplateRows: `${maxUp / span}fr ${maxDown / span}fr`, height: '7rem' }}
      >
        {/* Línea del cero: las barras negativas cuelgan de ella */}
        <div className="absolute inset-x-0 h-px bg-ink/15" style={{ top: `${(maxUp / span) * 100}%` }} aria-hidden />
        {bars.map((b) => (
          <div key={`${b.label}-up`} className="flex items-end justify-center" style={{ gridRow: 1 }}>
            {b.value > 0 && (
              <div
                title={b.hint}
                className="w-full max-w-14 rounded-t-[4px]"
                style={{ height: `${(b.value / maxUp) * 100}%`, background: b.color }}
              />
            )}
          </div>
        ))}
        {maxDown > 0 &&
          bars.map((b) => (
            <div key={`${b.label}-down`} className="flex items-start justify-center" style={{ gridRow: 2 }}>
              {b.value < 0 && (
                <div
                  title={b.hint}
                  className="w-full max-w-14 rounded-b-[4px]"
                  style={{ height: `${(-b.value / maxDown) * 100}%`, background: b.color }}
                />
              )}
            </div>
          ))}
      </div>
      <div className="grid gap-x-1.5" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
        {bars.map((b) => (
          <div key={b.label} className="space-y-0.5 text-center">
            <p className="truncate text-xs text-muted">{b.label}</p>
            <p className="text-xs font-medium tabular-nums">{formatCompactCOP(b.value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Cifras clave del último cierre, con la variación frente al año anterior
function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-md bg-ink/8 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((k) => {
        const good = k.change !== null && k.change >= 0 === k.moreIsBetter
        return (
          <div key={k.label} className="space-y-1 bg-surface/80 p-4">
            <dt className="text-sm text-muted">{k.label}</dt>
            <dd className="font-display text-xl font-semibold tabular-nums sm:text-2xl">
              {k.value === null ? '—' : formatCompactCOP(k.value)}
            </dd>
            <dd className="whitespace-nowrap text-xs tabular-nums">
              {k.change === null ? (
                <span className="text-muted">Sin comparativo</span>
              ) : (
                <>
                  <span className={good ? 'text-ok' : 'text-bad'}>
                    <span aria-hidden>{k.change >= 0 ? '▲' : '▼'}</span> {formatSignedPercent(k.change)}
                  </span>
                  <span className="text-muted"> vs {k.previousLabel}</span>
                </>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

// Un gráfico por cifra, cada uno con su escala: comparar años sin mezclar magnitudes en un mismo eje
function TrendGrid({ trends }: { trends: Trend[] }) {
  const periods = [...new Set(trends.flatMap((t) => t.bars.map((b) => b.period)))]
  const colorOf = (period: string) => SERIES[periods.indexOf(period) === periods.length - 1 ? 0 : 1]
  return (
    <div className="space-y-5">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {periods.map((p) => (
          <li key={p} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: colorOf(p) }} aria-hidden />
            <span className="text-muted">{p}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
        {trends.map((t) => (
          <div key={t.label} className="space-y-3">
            <p className="text-sm font-medium">{t.label}</p>
            <Bars
              bars={t.bars.map((b) => ({
                label: b.period,
                value: b.value,
                // Una cifra negativa se lee en rojo, aunque el color del año sea otro
                color: b.value < 0 ? 'var(--color-bad)' : colorOf(b.period),
                hint: `${t.label} ${b.period}: ${formatCompactCOP(b.value)}`,
              }))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Barra apilada horizontal: composición de una magnitud, con etiquetas visibles y separación de 2 px
function StackedBar({ stack }: { stack: Stack }) {
  const { title, total, segments } = stack
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-medium">{title}</p>
        <p className="tabular-nums text-muted">{formatCompactCOP(total)}</p>
      </div>
      <div
        className="flex h-5 gap-0.5"
        role="img"
        aria-label={`${title}: ${segments.map((s) => `${s.label} ${formatPercent(s.value / total)}`).join(', ')}`}
      >
        {segments.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${formatCompactCOP(s.value)} (${formatPercent(s.value / total)})`}
            style={{ width: `${(s.value / total) * 100}%`, background: SERIES[i % SERIES.length] }}
            className={`h-5 ${i === 0 ? 'rounded-l-sm' : ''} ${i === segments.length - 1 ? 'rounded-r-sm' : ''}`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
            <span className="text-muted">{s.label}</span>
            <span className="tabular-nums">{formatPercent(s.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Medidor: valor sobre una pista, con la marca de la referencia y, en palabras, si la cumple o no.
// El color no va solo: siempre lo acompaña el texto, para quien no distingue verde de ámbar.
function Meter({ label, value, max, reference, display, good, direction, hint }: MeterData) {
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / max) * 100))}%`
  const veredicto = good
    ? 'Cumple la referencia'
    : direction === 'max'
      ? 'Por encima de la referencia'
      : 'Por debajo de la referencia'
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm">{label}</span>
        <span className={`font-display whitespace-nowrap text-lg font-semibold tabular-nums ${good ? 'text-ok' : 'text-warn'}`}>{display}</span>
      </div>
      <div className="relative h-2 rounded-full bg-ink/8">
        <div
          className="h-2 rounded-full"
          style={{ width: pct(value), background: good ? 'var(--color-ok)' : 'var(--color-warn)' }}
        />
        <span className="absolute top-[-3px] h-3.5 w-0.5 rounded-full bg-ink/40" style={{ left: pct(reference) }} aria-hidden />
      </div>
      <p className={`flex items-center gap-1 text-xs font-medium ${good ? 'text-ok' : 'text-warn'}`}>
        <Icon name={good ? 'check' : 'alerta'} size={14} />
        {veredicto}
      </p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  )
}

function CashFlow({ flows, closingCash }: { flows: Flow[]; closingCash: number | null }) {
  return (
    <div className="space-y-3">
      <Bars
        bars={flows.map((f) => ({
          label: f.label,
          value: f.value,
          // Verde lo que suma efectivo y rojo lo que sale
          color: f.value >= 0 ? SERIES[0] : 'var(--color-bad)',
          hint: `${f.label}: ${formatCompactCOP(f.value)}`,
        }))}
      />
      {closingCash !== null && (
        <p className="flex items-baseline justify-between gap-4 border-t border-ink/10 pt-3 text-sm">
          <span className="text-muted">Efectivo al cierre</span>
          <span className="font-medium tabular-nums">{formatCompactCOP(closingCash)}</span>
        </p>
      )}
      <p className="text-xs text-muted">En verde lo que entró de efectivo y en rojo lo que salió.</p>
    </div>
  )
}

export function FinancialCharts({
  financials,
  ratios,
  explainAction,
  upgrade,
  preview = false,
  previewNote,
}: {
  financials: Extracted
  ratios: Ratios | null
  explainAction?: ExplainAction
  /** Sin explicación con IA: el "?" lleva a los planes */
  upgrade?: { href: string; label: string }
  /** Solo las cifras del último cierre; el resto queda para los planes de pago */
  preview?: boolean
  previewNote?: React.ReactNode
}) {
  const data = buildChartData(financials, ratios)
  if (!data) return null
  const card = { explainAction, upgrade }

  if (preview) {
    return (
      <div className="space-y-6">
        <ChartCard title={`${CHART_TITLES.cifras} · ${data.periodLabel}`} chartKey="cifras" {...card}>
          <KpiGrid kpis={data.kpis} />
        </ChartCard>
        {previewNote}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ChartCard title={`${CHART_TITLES.cifras} · ${data.periodLabel}`} chartKey="cifras" {...card}>
        <KpiGrid kpis={data.kpis} />
      </ChartCard>

      {data.trends.length > 0 && (
        <ChartCard title={CHART_TITLES.tendencia} chartKey="tendencia" {...card}>
          <TrendGrid trends={data.trends} />
        </ChartCard>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {data.stacks.length > 0 && (
          <ChartCard title={CHART_TITLES.estructura} chartKey="estructura" {...card}>
            <div className="space-y-6">
              {data.stacks.map((s) => (
                <StackedBar key={s.title} stack={s} />
              ))}
            </div>
          </ChartCard>
        )}

        {data.flows.length > 0 && (
          <ChartCard title={CHART_TITLES.flujo} chartKey="flujo" {...card}>
            <CashFlow flows={data.flows} closingCash={data.closingCash} />
          </ChartCard>
        )}
      </div>

      {data.meters.length > 0 && (
        <ChartCard title={CHART_TITLES.indicadores} chartKey="indicadores" {...card}>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
            {data.meters.map((m) => (
              <Meter key={m.label} {...m} />
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  )
}
