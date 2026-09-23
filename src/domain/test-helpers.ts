import type { Question } from './types'

export function q(partial: Partial<Question> & Pick<Question, 'id' | 'dimension'>): Question {
  return {
    text: `Pregunta ${partial.id}`,
    help: '',
    simpleText: null,
    simpleHelp: null,
    gap: `Brecha ${partial.id}`,
    fix: `Arreglo ${partial.id}`,
    weight: 1,
    requiresFlag: null,
    groups: [1, 2, 3],
    niifSection: 'Sección 3',
    lesson: 'presentacion',
    order: 0,
    active: true,
    ...partial,
  }
}

export const ALL_FLAGS = {
  inventarios: true,
  activosFijos: true,
  arrendamientos: true,
  financiamiento: true,
  empleados: true,
}
