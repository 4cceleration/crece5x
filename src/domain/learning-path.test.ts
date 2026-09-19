import { describe, expect, it } from 'vitest'
import { learningPath, lessonForSection } from './learning-path'
import { LESSONS } from '@/academia/lessons'

describe('learningPath', () => {
  it('ordena por severidad y elimina duplicados', () => {
    const path = learningPath(
      [
        { lesson: 'notas', severity: 'media' },
        { lesson: 'inventarios', severity: 'critica' },
        { lesson: 'notas', severity: 'alta' },
        { lesson: null, severity: 'alta' },
        { lesson: 'no-existe', severity: 'alta' },
      ],
      LESSONS,
    )
    expect(path.map((l) => l.slug)).toEqual(['inventarios', 'notas'])
  })
})

describe('lessonForSection', () => {
  it('encuentra la guía por número de sección', () => {
    expect(lessonForSection('Sección 13', LESSONS)).toBe('inventarios')
    expect(lessonForSection('Sección 4', LESSONS)).toBe('presentacion')
    expect(lessonForSection('Control interno', LESSONS)).toBeNull()
  })
})
