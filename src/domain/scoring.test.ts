import { describe, expect, it } from 'vitest'
import { finalIndex, isApplicable, scoreAnalysis, scoreDiagnostic, trafficLight } from './scoring'
import { DEFAULT_SETTINGS } from './settings'
import { ALL_FLAGS, q } from './test-helpers'

const W = DEFAULT_SETTINGS.dimensionWeights

describe('isApplicable', () => {
  it('respeta bandera, grupo y activo', () => {
    expect(isApplicable(q({ id: 'a', dimension: 'D3', requiresFlag: 'inventarios' }), { inventarios: false }, 2)).toBe(false)
    expect(isApplicable(q({ id: 'a', dimension: 'D3', requiresFlag: 'inventarios' }), { inventarios: true }, 2)).toBe(true)
    expect(isApplicable(q({ id: 'a', dimension: 'D1', groups: [1, 2] }), ALL_FLAGS, 3)).toBe(false)
    expect(isApplicable(q({ id: 'a', dimension: 'D1', active: false }), ALL_FLAGS, 2)).toBe(false)
  })
})

describe('scoreDiagnostic', () => {
  it('pondera respuestas dentro de la dimensión', () => {
    const qs = [q({ id: 'a', dimension: 'D1', weight: 3 }), q({ id: 'b', dimension: 'D1', weight: 1 })]
    const r = scoreDiagnostic(qs, { a: 'si', b: 'no' }, ALL_FLAGS, 2, W)
    expect(r.dimensions.D1).toBe(75)
    expect(r.total).toBe(75)
  })

  it('parcial vale medio y sin respuesta vale cero', () => {
    const qs = [q({ id: 'a', dimension: 'D1' }), q({ id: 'b', dimension: 'D1' })]
    expect(scoreDiagnostic(qs, { a: 'parcial' }, ALL_FLAGS, 2, W).dimensions.D1).toBe(25)
  })

  it('renormaliza cuando una dimensión no tiene preguntas aplicables', () => {
    const qs = [
      q({ id: 'a', dimension: 'D1' }),
      q({ id: 'b', dimension: 'D2' }),
      q({ id: 'c', dimension: 'D3', requiresFlag: 'inventarios' }),
    ]
    const r = scoreDiagnostic(qs, { a: 'si', b: 'no' }, { ...ALL_FLAGS, inventarios: false }, 2, W)
    expect(r.dimensions.D3).toBeNull()
    // (100*25 + 0*20) / 45
    expect(r.total).toBe(55.6)
  })
})

describe('scoreAnalysis', () => {
  it('resta penalizaciones y no baja de cero', () => {
    const P = DEFAULT_SETTINGS.severityPenalty
    expect(scoreAnalysis([{ severity: 'alta' }, { severity: 'media' }], P)).toBe(85)
    expect(scoreAnalysis(Array(6).fill({ severity: 'critica' }), P)).toBe(0)
    expect(scoreAnalysis([], P)).toBe(100)
  })
})

describe('finalIndex y semáforo', () => {
  it('mezcla 60/40 cuando hay análisis', () => {
    expect(finalIndex(100, 85, DEFAULT_SETTINGS.blend)).toBe(94)
    expect(finalIndex(72.4, null, DEFAULT_SETTINGS.blend)).toBe(72)
  })
  it('asigna color', () => {
    expect(trafficLight(80)).toBe('verde')
    expect(trafficLight(79)).toBe('ambar')
    expect(trafficLight(60)).toBe('ambar')
    expect(trafficLight(59)).toBe('rojo')
  })
})
