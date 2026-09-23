import { describe, expect, it } from 'vitest'
import { FLAG_QUESTIONS, nextStep, previousTarget } from './flow'
import { ALL_FLAGS, q } from './test-helpers'

const qs = [
  q({ id: 'b', dimension: 'D1', order: 2 }),
  q({ id: 'a', dimension: 'D1', order: 1 }),
  q({ id: 'inv', dimension: 'D3', order: 3, requiresFlag: 'inventarios' }),
]

describe('nextStep', () => {
  it('pregunta primero las banderas en orden', () => {
    const s = nextStep(qs, {}, {}, 2)
    expect(s).toMatchObject({ kind: 'flag', flag: FLAG_QUESTIONS[0].key, position: 1, total: FLAG_QUESTIONS.length })
  })

  it('luego las preguntas aplicables por orden', () => {
    const s = nextStep(qs, { ...ALL_FLAGS, inventarios: false }, {}, 2)
    expect(s).toMatchObject({ kind: 'question', position: 1, total: 2 })
    if (s.kind === 'question') expect(s.question.id).toBe('a')
  })

  it('termina cuando todo está respondido', () => {
    expect(nextStep(qs, { ...ALL_FLAGS, inventarios: false }, { a: 'si', b: 'no' }, 2)).toEqual({ kind: 'done' })
  })
})

describe('previousTarget', () => {
  it('deshace la última respuesta', () => {
    expect(previousTarget(qs, ALL_FLAGS, { a: 'si', b: 'no' }, 2)).toEqual({ kind: 'answer', questionId: 'b' })
  })
  it('sin respuestas deshace la última bandera', () => {
    expect(previousTarget(qs, { inventarios: false, activosFijos: true }, {}, 2)).toEqual({ kind: 'flag', flag: 'activosFijos' })
  })
  it('al inicio no hay nada que deshacer', () => {
    expect(previousTarget(qs, {}, {}, 2)).toBeNull()
  })
})
