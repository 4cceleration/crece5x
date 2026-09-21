import { describe, expect, it } from 'vitest'
import type { Extracted, Period } from '@/ai/schemas'
import { healthyExtracted } from './fixtures'
import { buildChartData, chartFacts } from './charts'

const period = (over: Partial<Period>): Period => ({
  label: '2025',
  totalAssets: null,
  currentAssets: null,
  nonCurrentAssets: null,
  totalLiabilities: null,
  currentLiabilities: null,
  nonCurrentLiabilities: null,
  equity: null,
  cash: null,
  inventories: null,
  revenue: null,
  netIncome: null,
  ...over,
})

const extracted = (periods: Period[], cashFlow: Extracted['cashFlow'] = null): Extracted => ({
  statements: { esf: true, eri: true, flujo: false, patrimonio: false, notas: false },
  periods,
  cashFlow,
  currency: 'COP',
})

describe('buildChartData', () => {
  it('arma cifras, comparativo, estructura, flujo e indicadores', () => {
    const data = buildChartData(healthyExtracted, null)!
    expect(data.periodLabel).toBe('2025')
    expect(data.kpis.map((k) => k.label)).toEqual(['Ingresos', 'Utilidad neta', 'Activos', 'Patrimonio'])
    // Ingresos: 1.500 M contra 1.300 M
    expect(data.kpis[0].change).toBeCloseTo(0.1538, 3)
    // El comparativo va del año más antiguo al más reciente
    expect(data.trends[0].bars.map((b) => b.period)).toEqual(['2024', '2025'])
    expect(data.stacks.map((s) => s.title)).toEqual(['Activo', 'Pasivo y patrimonio'])
    // El efectivo al cierre es un saldo, no un movimiento: va como dato aparte, no como barra
    expect(data.flows.map((f) => f.label)).toEqual(['Operación', 'Inversión', 'Financiación'])
    expect(data.closingCash).toBe(120_000_000)
  })

  it('completa la barra del activo cuando falta parte del detalle', () => {
    const data = buildChartData(extracted([period({ totalAssets: 1000, currentAssets: 600, nonCurrentAssets: null })]), null)!
    const activo = data.stacks[0]
    expect(activo.total).toBe(1000)
    expect(activo.segments).toEqual([
      { label: 'Activo corriente', value: 600 },
      { label: 'Otros activos', value: 400 },
    ])
  })

  it('muestra el pasivo en una sola parte si el detalle no cuadra con el total', () => {
    const data = buildChartData(
      extracted([period({ totalAssets: 1000, totalLiabilities: 840, currentLiabilities: 300, equity: 160 })]),
      null,
    )!
    const financiacion = data.stacks.find((s) => s.title === 'Pasivo y patrimonio')!
    expect(financiacion.segments).toEqual([
      { label: 'Pasivo', value: 840 },
      { label: 'Patrimonio', value: 160 },
    ])
    // La barra cubre el total: antes se pintaba solo el 16 % del patrimonio
    expect(financiacion.segments.reduce((a, s) => a + s.value, 0)).toBe(financiacion.total)
  })

  it('no arma comparativo con un solo período', () => {
    const data = buildChartData(extracted([period({ revenue: 100, totalAssets: 200 })]), null)!
    expect(data.trends).toEqual([])
  })
})

describe('chartFacts', () => {
  it('entrega al modelo la participación de cada parte tal como se ve', () => {
    const data = buildChartData(healthyExtracted, null)!
    const facts = chartFacts(data, 'estructura') as { composicion: { titulo: string; partes: { concepto: string; participacion_porcentual: number }[] }[] }
    const financiacion = facts.composicion.find((c) => c.titulo === 'Pasivo y patrimonio')!
    expect(financiacion.partes.find((p) => p.concepto === 'Patrimonio')!.participacion_porcentual).toBe(55)
  })
})
