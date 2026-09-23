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
  async extract(_text, { preliminary = false } = {}) {
    const e = structuredClone(healthyExtracted)
    // Con declaración de renta o balance de prueba no hay estados formales: solo las cifras del último año
    if (preliminary) {
      e.statements = { esf: false, eri: false, flujo: false, patrimonio: false, notas: false }
      e.periods = [e.periods[0]]
      e.cashFlow = null
    }
    return e
  },
  async judge() {
    return structuredClone(MOCK_FINDINGS)
  },
  async explain({ title }) {
    return `Explicación de demostración de "${title}". Configure AI_MODEL para que el análisis la redacte con sus cifras.`
  },
}
