import { describe, expect, it } from 'vitest'
import { runChecks } from './checks'
import { healthyExtracted as healthy } from './fixtures'
import type { Extracted } from '@/ai/schemas'

const M = 1_000_000

const titles = (e: Extracted, g: 1 | 2 | 3 = 2) => runChecks(e, g).map((f) => f.title)

describe('runChecks', () => {
  it('no genera hallazgos para estados sanos', () => {
    expect(runChecks(healthy, 2)).toEqual([])
  })

  it('detecta balance descuadrado como crítico', () => {
    const e = structuredClone(healthy)
    e.periods[0].equity = 500 * M
    const f = runChecks(e, 2)
    expect(f[0]).toMatchObject({ severity: 'critica', source: 'chequeo', niifSection: 'Sección 4' })
  })

  it('detecta estados obligatorios faltantes según grupo', () => {
    const e = structuredClone(healthy)
    e.statements.flujo = false
    e.cashFlow = null
    expect(titles(e, 2)).toContain('Falta el estado de flujos de efectivo')
    expect(titles(e, 3)).not.toContain('Falta el estado de flujos de efectivo')
  })

  it('detecta falta de comparativo', () => {
    const e = structuredClone(healthy)
    e.periods = [e.periods[0]]
    expect(titles(e)).toContain('No presenta información comparativa')
  })

  it('detecta subtotales que no suman', () => {
    const e = structuredClone(healthy)
    e.periods[0].currentAssets = 500 * M
    expect(titles(e)).toContain('Los subtotales del activo no suman el total')
  })

  it('detecta efectivo inconsistente y flujo que no cuadra', () => {
    const e = structuredClone(healthy)
    e.cashFlow!.closingCash = 130 * M
    const t = titles(e)
    expect(t).toContain('El efectivo del flujo no coincide con el del balance')
    expect(t).toContain('El flujo de efectivo no cuadra')
  })

  it('omite chequeos cuando faltan cifras', () => {
    const e = structuredClone(healthy)
    e.periods[0].totalAssets = null
    e.periods[0].currentAssets = null
    expect(runChecks(e, 2)).toEqual([])
  })

  it('con documentos parciales reporta una sola vez que no hay estados NIIF', () => {
    const e = structuredClone(healthy)
    e.statements = { esf: false, eri: false, flujo: false, patrimonio: false, notas: false }
    e.periods = [e.periods[0]]
    e.cashFlow = null
    const f = runChecks(e, 2, { preliminary: true })
    expect(f.map((x) => x.title)).toEqual(['No tiene estados financieros NIIF formales'])
    expect(f[0].severity).toBe('alta')
  })
})
