import { describe, expect, it } from 'vitest'
import { needsConsultant } from './derivation'

const ok = { hasFinancialStatements: true, finalScore: 85, findings: [], threshold: 60 }

describe('needsConsultant', () => {
  it('no deriva a una empresa sana', () => expect(needsConsultant(ok)).toBe(false))
  it('deriva sin estados financieros', () => expect(needsConsultant({ ...ok, hasFinancialStatements: false })).toBe(true))
  it('deriva con índice bajo el umbral', () => expect(needsConsultant({ ...ok, finalScore: 59 })).toBe(true))
  it('deriva con hallazgo crítico', () =>
    expect(needsConsultant({ ...ok, findings: [{ severity: 'critica' as const }] })).toBe(true))
})
