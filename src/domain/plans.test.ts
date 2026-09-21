import { describe, expect, it } from 'vitest'
import { analysesLeft, can, canAnalyze, isPlanKey, planFor, PLAN_ORDER, PLANS } from './plans'

describe('planes', () => {
  it('cada plan incluye lo del anterior', () => {
    for (let i = 1; i < PLAN_ORDER.length; i++) {
      const antes = PLANS[PLAN_ORDER[i - 1]].scopes
      const ahora = PLANS[PLAN_ORDER[i]].scopes
      expect(ahora).toEqual(expect.arrayContaining(antes))
    }
  })

  it('la explicación con IA solo está de Monitoreo para arriba', () => {
    expect(can('gratis', 'explicacion-ia')).toBe(false)
    expect(can('reporte', 'explicacion-ia')).toBe(false)
    expect(can('monitoreo', 'explicacion-ia')).toBe(true)
    expect(can('acompanamiento', 'explicacion-ia')).toBe(true)
    expect(planFor('explicacion-ia').key).toBe('monitoreo')
  })

  it('el gratis analiza una sola vez', () => {
    expect(canAnalyze('gratis', 0)).toBe(true)
    expect(analysesLeft('gratis', 0)).toBe(1)
    expect(canAnalyze('gratis', 1)).toBe(false)
    expect(analysesLeft('gratis', 1)).toBe(0)
  })

  it('el acompañamiento no tiene tope', () => {
    expect(analysesLeft('acompanamiento', 99)).toBeNull()
    expect(canAnalyze('acompanamiento', 99)).toBe(true)
  })

  it('reconoce las claves de plan', () => {
    expect(isPlanKey('monitoreo')).toBe(true)
    expect(isPlanKey('premium')).toBe(false)
  })
})
