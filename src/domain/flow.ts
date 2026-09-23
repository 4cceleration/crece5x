import type { AnswerValue, Audience, Flag, Flags, Group, Question } from './types'

// Las de Sí/No van intercaladas con las demás preguntas por `order`: cada una justo antes de las que abre;
// si responde No, esas se saltan
export const FLAG_QUESTIONS: { key: Flag; order: number; text: string; simpleText: string }[] = [
  {
    key: 'inventarios',
    order: 205,
    text: '¿Maneja inventarios?',
    simpleText: '¿Tiene mercancía o materias primas para vender o para producir?',
  },
  {
    key: 'activosFijos',
    order: 225,
    text: '¿Tiene activos fijos como maquinaria, vehículos, equipos o inmuebles?',
    simpleText: '¿La empresa es dueña de máquinas, vehículos, equipos, locales o bodegas?',
  },
  {
    key: 'arrendamientos',
    order: 245,
    text: '¿Tiene contratos de arriendo o leasing?',
    simpleText: '¿Tiene en arriendo o en leasing algún local, bodega, vehículo o equipo?',
  },
  {
    key: 'financiamiento',
    order: 255,
    text: '¿Tiene préstamos o cuentas por cobrar a clientes?',
    simpleText: '¿Tiene préstamos, o clientes que le compran a crédito?',
  },
  {
    key: 'empleados',
    order: 295,
    text: '¿Tiene empleados con contrato laboral?',
    simpleText: '¿Tiene empleados con contrato de trabajo, no solo contratistas por prestación de servicios?',
  },
]

export type Step =
  | { kind: 'flag'; flag: Flag; text: string; position: number; total: number }
  | { kind: 'question'; question: Question; text: string; help: string; position: number; total: number }
  | { kind: 'done' }

export type UndoTarget = { kind: 'flag'; flag: Flag } | { kind: 'answer'; questionId: string }

/** Lo que se lleva respondido de una consulta: con esto se decide la siguiente pantalla */
export type DiagnosticState = {
  questions: Question[]
  flags: Partial<Flags>
  answers: Record<string, AnswerValue>
  group: Group
  /** Se elige al abrir la consulta, antes que la contabilidad; sin elegir, se pregunta como al contador */
  audience: Audience | null
}

type Item =
  | { kind: 'flag'; flag: (typeof FLAG_QUESTIONS)[number]; order: number }
  | { kind: 'question'; question: Question; order: number }

// Todo el recorrido en un solo orden. Una pregunta cuya Sí/No todavía no se responde cuenta como pendiente,
// así la barra nunca retrocede; si la respuesta es No, sale del recorrido y la barra salta adelante
function sequence({ questions, flags, group }: DiagnosticState): Item[] {
  const items: Item[] = [
    ...FLAG_QUESTIONS.map((flag) => ({ kind: 'flag' as const, flag, order: flag.order })),
    ...questions
      .filter((q) => q.active && q.groups.includes(group) && (q.requiresFlag === null || flags[q.requiresFlag] !== false))
      .map((question) => ({ kind: 'question' as const, question, order: question.order })),
  ]
  return items.sort((a, b) => a.order - b.order)
}

const answered = (s: DiagnosticState, item: Item) =>
  item.kind === 'flag' ? s.flags[item.flag.key] !== undefined : s.answers[item.question.id] !== undefined

export function nextStep(s: DiagnosticState): Step {
  const items = sequence(s)
  const total = items.length
  const i = items.findIndex((item) => !answered(s, item))
  if (i < 0) return { kind: 'done' }
  const item = items[i]
  const position = i + 1
  const simple = s.audience === 'empresario'
  if (item.kind === 'flag') {
    return { kind: 'flag', flag: item.flag.key, text: simple ? item.flag.simpleText : item.flag.text, position, total }
  }
  const q = item.question
  return {
    kind: 'question',
    question: q,
    text: simple ? (q.simpleText ?? q.text) : q.text,
    help: simple ? (q.simpleHelp ?? q.help) : q.help,
    position,
    total,
  }
}

// "Atrás" deshace la pantalla anterior del recorrido, sea pregunta o Sí/No
export function previousTarget(s: DiagnosticState): UndoTarget | null {
  const items = sequence(s)
  const i = items.findIndex((item) => !answered(s, item))
  const prev = items[(i < 0 ? items.length : i) - 1]
  if (!prev) return null
  return prev.kind === 'flag' ? { kind: 'flag', flag: prev.flag.key } : { kind: 'answer', questionId: prev.question.id }
}
