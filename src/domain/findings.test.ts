import { describe, expect, it } from 'vitest'
import { diagnosticFindings } from './findings'
import { ALL_FLAGS, q } from './test-helpers'

describe('diagnosticFindings', () => {
  const qs = [
    q({ id: 'w3', dimension: 'D1', weight: 3, niifSection: 'Sección 7', lesson: 'flujo-efectivo' }),
    q({ id: 'w2', dimension: 'D2', weight: 2 }),
    q({ id: 'w1', dimension: 'D2', weight: 1 }),
    q({ id: 'inv', dimension: 'D3', weight: 3, requiresFlag: 'inventarios' }),
  ]

  it('genera hallazgo alto para peso 3 y medio para peso 2 cuando la respuesta es No o No sé', () => {
    const f = diagnosticFindings(qs, { w3: 'no', w2: 'nose', w1: 'no', inv: 'no' }, { ...ALL_FLAGS, inventarios: false }, 2)
    expect(f).toHaveLength(2)
    expect(f[0]).toMatchObject({ source: 'diagnostico', severity: 'alta', title: 'Brecha w3', recommendation: 'Arreglo w3', niifSection: 'Sección 7', lesson: 'flujo-efectivo' })
    expect(f[1]).toMatchObject({ severity: 'media', title: 'Brecha w2' })
  })

  it('no genera hallazgos para Sí o Parcial', () => {
    expect(diagnosticFindings(qs, { w3: 'si', w2: 'parcial' }, ALL_FLAGS, 2)).toHaveLength(0)
  })
})
