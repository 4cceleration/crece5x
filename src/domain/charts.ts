import type { Extracted, Period } from '@/ai/schemas'
import { formatPercent } from './format'
import type { Ratios } from './ratios'

// Un solo armado de datos para las gráficas: lo pinta la vista y lo explica el modelo,
// así la explicación habla exactamente de lo que la empresa está viendo.

export const CHART_TITLES = {
  cifras: 'Sus cifras',
  tendencia: 'Comparativo por año',
  estructura: 'Estructura financiera',
  flujo: 'Flujo de efectivo',
  indicadores: 'Indicadores',
} as const

export type ChartKey = keyof typeof CHART_TITLES

export const CHART_KEYS = Object.keys(CHART_TITLES) as ChartKey[]

export function isChartKey(v: string): v is ChartKey {
  return (CHART_KEYS as string[]).includes(v)
}

export type Kpi = {
  label: string
  value: number | null
  previous: number | null
  previousLabel: string | null
  change: number | null
  moreIsBetter: boolean
}

/** Una barra por período, con escala propia: comparar años de una misma cifra */
export type Trend = {
  label: string
  moreIsBetter: boolean
  bars: { period: string; value: number }[]
}

export type Segment = { label: string; value: number }
export type Stack = { title: string; total: number; segments: Segment[] }

export type Flow = { label: string; value: number }

export type Meter = {
  label: string
  value: number
  max: number
  reference: number
  display: string
  good: boolean
  hint: string
}

export type ChartData = {
  periodLabel: string
  /** Saldo de efectivo al cierre: acompaña al flujo como dato, no como barra (es un saldo, no un movimiento) */
  closingCash: number | null
  kpis: Kpi[]
  trends: Trend[]
  stacks: Stack[]
  flows: Flow[]
  meters: Meter[]
}

const METRICS: { label: string; pick: (p: Period) => number | null; moreIsBetter: boolean }[] = [
  { label: 'Ingresos', pick: (p) => p.revenue, moreIsBetter: true },
  { label: 'Utilidad neta', pick: (p) => p.netIncome, moreIsBetter: true },
  { label: 'Activos', pick: (p) => p.totalAssets, moreIsBetter: true },
  { label: 'Patrimonio', pick: (p) => p.equity, moreIsBetter: true },
]

export function change(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

function kpis(periods: Period[]): Kpi[] {
  const [now, before] = periods
  return METRICS.map((m) => ({
    label: m.label,
    value: m.pick(now),
    previous: before ? m.pick(before) : null,
    previousLabel: before?.label ?? null,
    change: change(m.pick(now), before ? m.pick(before) : null),
    moreIsBetter: m.moreIsBetter,
  }))
}

// Del más antiguo al más reciente, que es como se lee una serie de tiempo
function trends(periods: Period[]): Trend[] {
  const ordered = [...periods].reverse().slice(-4)
  if (ordered.length < 2) return []
  return METRICS.map((m) => ({
    label: m.label,
    moreIsBetter: m.moreIsBetter,
    bars: ordered.flatMap((p) => {
      const value = m.pick(p)
      return value === null ? [] : [{ period: p.label, value }]
    }),
  })).filter((t) => t.bars.length >= 2)
}

function stacks(p: Period): Stack[] {
  const out: Stack[] = []

  const assets: Segment[] = [
    { label: 'Activo corriente', value: p.currentAssets ?? 0 },
    { label: 'Activo no corriente', value: p.nonCurrentAssets ?? 0 },
  ].filter((s) => s.value > 0)
  const assetsTotal = p.totalAssets ?? assets.reduce((a, s) => a + s.value, 0)
  // Si el detalle no llegó, la barra se arma con el total para que no quede a medias
  if (assetsTotal > 0) {
    out.push({
      title: 'Activo',
      total: assetsTotal,
      segments: assets.length > 0 ? completed(assets, assetsTotal, 'Otros activos') : [{ label: 'Activo total', value: assetsTotal }],
    })
  }

  const detail: Segment[] = [
    { label: 'Pasivo corriente', value: p.currentLiabilities ?? 0 },
    { label: 'Pasivo no corriente', value: p.nonCurrentLiabilities ?? 0 },
  ].filter((s) => s.value > 0)
  const liabilitiesTotal = p.totalLiabilities ?? detail.reduce((a, s) => a + s.value, 0)
  // El corriente y el no corriente solo se separan si entre los dos dan el pasivo total;
  // si falta parte, se muestra el pasivo en una sola parte (la barra nunca miente por omisión)
  const detailed = detail.length > 0 && completed(detail, liabilitiesTotal, '').length === detail.length
  const liabilities: Segment[] = detailed ? detail : liabilitiesTotal > 0 ? [{ label: 'Pasivo', value: liabilitiesTotal }] : []
  const funding: Segment[] = [
    ...liabilities,
    ...(p.equity !== null && p.equity > 0 ? [{ label: 'Patrimonio', value: p.equity }] : []),
  ]
  const fundingTotal = liabilitiesTotal + Math.max(0, p.equity ?? 0)
  if (fundingTotal > 0 && funding.length > 0) out.push({ title: 'Pasivo y patrimonio', total: fundingTotal, segments: funding })

  return out
}

// El detalle nunca debe sumar menos que el total: el faltante se muestra como un segmento propio
function completed(segments: Segment[], total: number, restLabel: string): Segment[] {
  const sum = segments.reduce((a, s) => a + s.value, 0)
  const rest = total - sum
  // 0,5 % de holgura: los estados vienen redondeados
  return rest > total * 0.005 ? [...segments, { label: restLabel, value: rest }] : segments
}

function flows(financials: Extracted): Flow[] {
  const cf = financials.cashFlow
  if (!cf) return []
  const items: Flow[] = [
    { label: 'Operación', value: cf.operating ?? 0 },
    { label: 'Inversión', value: cf.investing ?? 0 },
    { label: 'Financiación', value: cf.financing ?? 0 },
  ].filter((f) => f.value !== 0)
  return items
}

function meters(ratios: Ratios | null): Meter[] {
  if (!ratios) return []
  const out: Meter[] = []
  if (ratios.currentRatio !== null) {
    out.push({
      label: 'Razón corriente',
      value: ratios.currentRatio,
      max: 3,
      reference: 1.5,
      display: ratios.currentRatio.toFixed(2).replace('.', ','),
      good: ratios.currentRatio >= 1.5,
      hint: 'Referencia: 1,5 veces el pasivo corriente',
    })
  }
  if (ratios.quickRatio !== null) {
    out.push({
      label: 'Prueba ácida',
      value: ratios.quickRatio,
      max: 3,
      reference: 1,
      display: ratios.quickRatio.toFixed(2).replace('.', ','),
      good: ratios.quickRatio >= 1,
      hint: 'Referencia: 1 vez el pasivo corriente',
    })
  }
  if (ratios.debtRatio !== null) {
    out.push({
      label: 'Endeudamiento',
      value: ratios.debtRatio,
      max: 1,
      reference: 0.6,
      display: formatPercent(ratios.debtRatio),
      good: ratios.debtRatio <= 0.6,
      hint: 'Referencia: hasta 60 % del activo',
    })
  }
  if (ratios.netMargin !== null) {
    out.push({
      label: 'Margen neto',
      value: ratios.netMargin,
      max: 0.3,
      reference: 0.05,
      display: formatPercent(ratios.netMargin, 1),
      good: ratios.netMargin >= 0.05,
      hint: 'Referencia: 5 % de los ingresos',
    })
  }
  if (ratios.roa !== null) {
    out.push({
      label: 'Rentabilidad del activo',
      value: ratios.roa,
      max: 0.3,
      reference: 0.05,
      display: formatPercent(ratios.roa, 1),
      good: ratios.roa >= 0.05,
      hint: 'Referencia: 5 % del activo',
    })
  }
  return out
}

export function buildChartData(financials: Extracted, ratios: Ratios | null): ChartData | null {
  const [p] = financials.periods
  if (!p) return null
  return {
    periodLabel: p.label,
    closingCash: financials.cashFlow?.closingCash ?? null,
    kpis: kpis(financials.periods),
    trends: trends(financials.periods),
    stacks: stacks(p),
    flows: flows(financials),
    meters: meters(ratios),
  }
}

/** Lo que ve la empresa en una gráfica, tal cual, para que el modelo explique eso y no otra cosa */
export function chartFacts(data: ChartData, key: ChartKey): Record<string, unknown> {
  switch (key) {
    case 'cifras':
      return {
        periodo: data.periodLabel,
        cifras: data.kpis.map((k) => ({
          concepto: k.label,
          valor: k.value,
          valor_anterior: k.previous,
          periodo_anterior: k.previousLabel,
          variacion_porcentual: k.change === null ? null : Math.round(k.change * 1000) / 10,
        })),
      }
    case 'tendencia':
      return { series: data.trends.map((t) => ({ concepto: t.label, por_periodo: t.bars })) }
    case 'estructura':
      return {
        periodo: data.periodLabel,
        composicion: data.stacks.map((s) => ({
          titulo: s.title,
          total: s.total,
          partes: s.segments.map((g) => ({ concepto: g.label, valor: g.value, participacion_porcentual: Math.round((g.value / s.total) * 1000) / 10 })),
        })),
      }
    case 'flujo':
      return {
        periodo: data.periodLabel,
        flujos: data.flows.map((f) => ({ concepto: f.label, valor: f.value })),
        efectivo_al_cierre: data.closingCash,
      }
    case 'indicadores':
      return {
        indicadores: data.meters.map((m) => ({
          indicador: m.label,
          valor: m.display,
          referencia: m.hint,
          cumple_la_referencia: m.good,
        })),
      }
  }
}
