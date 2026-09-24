import { describe, expect, it } from 'vitest'
import { lessonMinutes, parseInline, readingMinutes } from './reading'
import { LESSONS } from './lessons'

const words = (n: number) => Array.from({ length: n }, () => 'palabra').join(' ')

describe('parseInline', () => {
  it('separa los términos en negrita del resto del texto', () => {
    expect(parseInline('Se mide al **costo**, no al **precio**.')).toEqual([
      { text: 'Se mide al ', strong: false },
      { text: 'costo', strong: true },
      { text: ', no al ', strong: false },
      { text: 'precio', strong: true },
      { text: '.', strong: false },
    ])
  })

  it('un texto sin negrita queda igual', () => {
    expect(parseInline('Sin marcas')).toEqual([{ text: 'Sin marcas', strong: false }])
  })
})

describe('readingMinutes', () => {
  it('cuenta 180 palabras por minuto y redondea hacia arriba', () => {
    expect(readingMinutes([words(180)])).toBe(1)
    expect(readingMinutes([words(181)])).toBe(2)
    expect(readingMinutes([words(200), words(200)])).toBe(3)
  })

  it('nunca da cero minutos', () => {
    expect(readingMinutes([''])).toBe(1)
  })

  it('cada lección de la Academia tiene su tiempo de lectura', () => {
    for (const l of LESSONS) expect(lessonMinutes(l.slug), l.slug).toBeGreaterThanOrEqual(1)
  })
})
