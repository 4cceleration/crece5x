import type { Severity } from './types'

export function needsConsultant(i: {
  hasFinancialStatements: boolean
  finalScore: number
  findings: { severity: Severity }[]
  threshold: number
}): boolean {
  return !i.hasFinancialStatements || i.finalScore < i.threshold || i.findings.some((f) => f.severity === 'critica')
}
