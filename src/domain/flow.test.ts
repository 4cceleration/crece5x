import { describe, expect, it } from 'vitest'
import { FLAG_QUESTIONS, nextStep, previousTarget, type DiagnosticState } from './flow'
import { q } from './test-helpers'
import type { Flag } from './types'

const qs = [
  q({ id: 'cierre', dimension: 'D5', order: 550 }),
  q({
    id: 'balance',
    dimension: 'D1',
    order: 10,
    text: '¿Prepara el balance?',
    help: 'Ayuda técnica',
    simpleText: '¿Tiene un balance?',
    simpleHelp: 'Ayuda sencilla',
  }),
  q({ id: 'inv', dimension: 'D3', order: 210, requiresFlag: 'inventarios', help: 'Ayuda de inventarios' }),
  q({ id: 'solo-g12', dimension: 'D1', order: 30, groups: [1, 2] }),
]

const estado = (patch: Partial<DiagnosticState> = {}): DiagnosticState => ({
  questions: qs,
  flags: {},
  answers: {},
  group: 2,
  audience: 'contador',
  ...patch,
})

// Recorre la consulta como lo haría alguien: "Sí" a todo, salvo las Sí/No indicadas
function recorrer(inicio: DiagnosticState, noTiene: Flag[] = []) {
  const pantallas: { key: string; position: number; total: number }[] = []
  let s = inicio
  for (let step = nextStep(s); step.kind !== 'done'; step = nextStep(s)) {
    if (step.kind === 'flag') {
      pantallas.push({ key: step.flag, position: step.position, total: step.total })
      s = { ...s, flags: { ...s.flags, [step.flag]: !noTiene.includes(step.flag) } }
    } else {
      pantallas.push({ key: step.question.id, position: step.position, total: step.total })
      s = { ...s, answers: { ...s.answers, [step.question.id]: 'si' } }
    }
  }
  return pantallas
}

describe('nextStep', () => {
  it('intercala cada Sí/No justo antes de las preguntas que abre', () => {
    expect(recorrer(estado()).map((p) => p.key)).toEqual([
      'balance',
      'solo-g12',
      'inventarios',
      'inv',
      'activosFijos',
      'arrendamientos',
      'financiamiento',
      'empleados',
      'cierre',
    ])
  })

  it('lleva una sola barra de principio a fin: avanza de a uno sobre el mismo total', () => {
    const pantallas = recorrer(estado())
    // 5 de Sí/No + 4 preguntas del Grupo 2
    expect(pantallas.map((p) => p.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(new Set(pantallas.map((p) => p.total))).toEqual(new Set([9]))
  })

  it('si responde No, salta las preguntas que dependen de eso y la barra se acorta', () => {
    const pantallas = recorrer(estado(), ['inventarios'])
    expect(pantallas.map((p) => p.key)).not.toContain('inv')
    expect(pantallas.find((p) => p.key === 'activosFijos')).toEqual({ key: 'activosFijos', position: 4, total: 8 })
  })

  it('al Grupo 3 no le hace las preguntas que no le aplican', () => {
    expect(recorrer(estado({ group: 3 })).map((p) => p.key)).not.toContain('solo-g12')
  })

  it('no hace las preguntas que la administración desactivó', () => {
    const questions = [...qs, q({ id: 'apagada', dimension: 'D2', order: 110, active: false })]
    expect(recorrer(estado({ questions })).map((p) => p.key)).not.toContain('apagada')
  })

  it('al contador le hace la pregunta técnica', () => {
    expect(nextStep(estado())).toMatchObject({ kind: 'question', text: '¿Prepara el balance?', help: 'Ayuda técnica' })
  })

  it('al empresario le hace la misma pregunta en palabras sencillas', () => {
    expect(nextStep(estado({ audience: 'empresario' }))).toMatchObject({
      kind: 'question',
      text: '¿Tiene un balance?',
      help: 'Ayuda sencilla',
    })
  })

  it('si todavía no eligió quién responde, pregunta como al contador', () => {
    expect(nextStep(estado({ audience: null }))).toMatchObject({ kind: 'question', text: '¿Prepara el balance?' })
  })

  it('si una pregunta no tiene versión sencilla, el empresario ve la del contador', () => {
    const s = estado({ audience: 'empresario', answers: { balance: 'si', 'solo-g12': 'si' }, flags: { inventarios: true } })
    expect(nextStep(s)).toMatchObject({ kind: 'question', text: 'Pregunta inv', help: 'Ayuda de inventarios' })
  })

  it('las de Sí/No también se dicen según quién responde', () => {
    const inventarios = FLAG_QUESTIONS.find((f) => f.key === 'inventarios')!
    const hastaInventarios = { answers: { balance: 'si', 'solo-g12': 'si' } } as const
    expect(nextStep(estado({ ...hastaInventarios, audience: 'contador' }))).toMatchObject({ kind: 'flag', text: inventarios.text })
    expect(nextStep(estado({ ...hastaInventarios, audience: 'empresario' }))).toMatchObject({
      kind: 'flag',
      text: inventarios.simpleText,
    })
  })

  it('termina cuando todo está respondido', () => {
    const flags = { inventarios: false, activosFijos: false, arrendamientos: false, financiamiento: false, empleados: false }
    const answers = { balance: 'si', 'solo-g12': 'no', cierre: 'parcial' } as const
    expect(nextStep(estado({ flags, answers }))).toEqual({ kind: 'done' })
  })
})

describe('previousTarget', () => {
  it('Atrás vuelve a la pantalla anterior aunque sea una de Sí/No', () => {
    const s = estado({ answers: { balance: 'si', 'solo-g12': 'si' }, flags: { inventarios: true } })
    expect(previousTarget(s)).toEqual({ kind: 'flag', flag: 'inventarios' })
  })

  it('Atrás después de una pregunta deshace esa respuesta', () => {
    expect(previousTarget(estado({ answers: { balance: 'si' } }))).toEqual({ kind: 'answer', questionId: 'balance' })
  })

  it('en la primera pregunta no hay nada que deshacer', () => {
    expect(previousTarget(estado())).toBeNull()
  })
})
