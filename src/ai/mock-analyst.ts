import { healthyExtracted } from '@/domain/fixtures'
import type { Analyst } from './analyst'
import type { AiFinding } from './schemas'

export const MOCK_FINDINGS: AiFinding[] = [
  {
    title: 'No se evidencia el cálculo del impuesto diferido',
    detail: 'Las notas no mencionan diferencias temporarias ni saldos de impuesto diferido.',
    niifSection: 'Sección 29',
    severity: 'alta',
    recommendation: 'Calcule el impuesto diferido comparando las bases contables y fiscales al cierre.',
  },
  {
    title: 'Las notas no detallan cómo se miden los inventarios',
    detail: 'No se indica la fórmula de costo ni la comparación con el precio de venta.',
    niifSection: 'Sección 13',
    severity: 'media',
    recommendation: 'Revele la fórmula de costo usada (promedio ponderado o PEPS) y los ajustes al precio de venta menos costos.',
  },
]

// Analista simulado: se usa cuando AI_MODEL está vacío (desarrollo, pruebas, demo)
export const mockAnalyst: Analyst = {
  async extract() {
    return structuredClone(healthyExtracted)
  },
  async judge() {
    return structuredClone(MOCK_FINDINGS)
  },
}
