import { isApplicable } from './scoring'
import type { AnswerValue, Flags, Group, NewFinding, Question } from './types'

export function diagnosticFindings(
  questions: Question[],
  answers: Record<string, AnswerValue>,
  flags: Partial<Flags>,
  group: Group,
): NewFinding[] {
  return questions
    .filter((q) => isApplicable(q, flags, group) && q.weight >= 2)
    .filter((q) => answers[q.id] === 'no' || answers[q.id] === 'nose')
    .sort((a, b) => b.weight - a.weight || a.order - b.order)
    .map((q): NewFinding => ({
      source: 'diagnostico',
      title: q.gap,
      detail: answers[q.id] === 'nose' ? 'La empresa no sabe si lo cumple.' : 'La empresa indica que no lo cumple.',
      niifSection: q.niifSection,
      severity: q.weight >= 3 ? 'alta' : 'media',
      recommendation: q.fix,
      lesson: q.lesson,
    }))
}
