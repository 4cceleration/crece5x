import { isApplicable } from './scoring'
import type { AnswerValue, Flag, Flags, Group, Question } from './types'

export const FLAG_QUESTIONS: { key: Flag; text: string }[] = [
  { key: 'inventarios', text: '¿Maneja inventarios?' },
  { key: 'activosFijos', text: '¿Tiene activos fijos como maquinaria, vehículos, equipos o inmuebles?' },
  { key: 'arrendamientos', text: '¿Tiene contratos de arriendo o leasing?' },
  { key: 'financiamiento', text: '¿Tiene préstamos o cuentas por cobrar a clientes?' },
  { key: 'empleados', text: '¿Tiene empleados con contrato laboral?' },
]

export type Step =
  | { kind: 'flag'; flag: Flag; text: string; position: number; total: number }
  | { kind: 'question'; question: Question; position: number; total: number }
  | { kind: 'done' }

function applicableInOrder(questions: Question[], flags: Partial<Flags>, group: Group) {
  return questions.filter((q) => isApplicable(q, flags, group)).sort((a, b) => a.order - b.order)
}

export function nextStep(
  questions: Question[],
  flags: Partial<Flags>,
  answers: Record<string, AnswerValue>,
  group: Group,
): Step {
  const fi = FLAG_QUESTIONS.findIndex((f) => flags[f.key] === undefined)
  if (fi >= 0) {
    const f = FLAG_QUESTIONS[fi]
    return { kind: 'flag', flag: f.key, text: f.text, position: fi + 1, total: FLAG_QUESTIONS.length }
  }
  const list = applicableInOrder(questions, flags, group)
  const qi = list.findIndex((q) => answers[q.id] === undefined)
  if (qi < 0) return { kind: 'done' }
  return { kind: 'question', question: list[qi], position: qi + 1, total: list.length }
}

export function previousTarget(
  questions: Question[],
  flags: Partial<Flags>,
  answers: Record<string, AnswerValue>,
  group: Group,
): { kind: 'answer'; questionId: string } | { kind: 'flag'; flag: Flag } | null {
  const answered = applicableInOrder(questions, flags, group).filter((q) => answers[q.id] !== undefined)
  if (answered.length > 0) return { kind: 'answer', questionId: answered[answered.length - 1].id }
  const lastFlag = [...FLAG_QUESTIONS].reverse().find((f) => flags[f.key] !== undefined)
  return lastFlag ? { kind: 'flag', flag: lastFlag.key } : null
}
