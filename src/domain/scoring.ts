import { DIMENSIONS } from './types'
import type { AnswerValue, Dimension, Flags, Group, Light, Question, Severity } from './types'

const VALUE_SCORE: Record<AnswerValue, number> = { si: 1, parcial: 0.5, no: 0, nose: 0 }

const round1 = (n: number) => Math.round(n * 10) / 10

export function isApplicable(q: Question, flags: Partial<Flags>, group: Group): boolean {
  if (!q.active) return false
  if (!q.groups.includes(group)) return false
  return q.requiresFlag === null || flags[q.requiresFlag] === true
}

export function scoreDiagnostic(
  questions: Question[],
  answers: Record<string, AnswerValue>,
  flags: Partial<Flags>,
  group: Group,
  weights: Record<Dimension, number>,
): { dimensions: Record<Dimension, number | null>; total: number } {
  const dimensions = {} as Record<Dimension, number | null>
  for (const { key } of DIMENSIONS) {
    const qs = questions.filter((q) => q.dimension === key && isApplicable(q, flags, group))
    const wsum = qs.reduce((acc, q) => acc + q.weight, 0)
    dimensions[key] =
      wsum === 0
        ? null
        : round1((qs.reduce((acc, q) => acc + q.weight * VALUE_SCORE[answers[q.id] ?? 'nose'], 0) / wsum) * 100)
  }

  let num = 0
  let den = 0
  for (const { key } of DIMENSIONS) {
    const v = dimensions[key]
    if (v === null) continue
    num += v * weights[key]
    den += weights[key]
  }
  return { dimensions, total: den === 0 ? 0 : round1(num / den) }
}

export function scoreAnalysis(findings: { severity: Severity }[], penalty: Record<Severity, number>): number {
  return Math.max(0, 100 - findings.reduce((acc, f) => acc + penalty[f.severity], 0))
}

export function finalIndex(
  diagnostic: number,
  analysis: number | null,
  blend: { diagnostic: number; analysis: number },
): number {
  return Math.round(analysis === null ? diagnostic : blend.diagnostic * diagnostic + blend.analysis * analysis)
}

export function trafficLight(score: number): Light {
  if (score >= 80) return 'verde'
  if (score >= 60) return 'ambar'
  return 'rojo'
}

export const LIGHT_LABEL: Record<Light, string> = {
  verde: 'Saludable',
  ambar: 'Requiere atención',
  rojo: 'En riesgo',
}
