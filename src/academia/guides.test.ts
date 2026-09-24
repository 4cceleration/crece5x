import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons'
import { GUIDES } from './guides'
import { GLOSSARY } from './glossary'

const GUIDE_SLUGS = LESSONS.filter((l) => l.slug !== 'glosario').map((l) => l.slug)

describe('guías', () => {
  it('cada guía trae todas sus partes', () => {
    for (const slug of GUIDE_SLUGS) {
      const g = GUIDES[slug]
      expect(g, slug).toBeDefined()
      for (const text of [g.lead, g.why, g.example.case, g.example.result, g.mistake.text, g.mistake.avoid]) {
        expect(text.trim(), slug).not.toBe('')
      }
      expect(g.rules.length, slug).toBeGreaterThanOrEqual(2)
      expect(g.example.rows.length, slug).toBeGreaterThanOrEqual(2)
      expect(g.steps.length, slug).toBeGreaterThanOrEqual(3)
      expect(g.checklist.length, slug).toBeGreaterThanOrEqual(3)
      expect(g.technical.length, slug).toBeGreaterThanOrEqual(1)
    }
  })

  it('no hay guías sueltas: cada una corresponde a una lección de la Academia', () => {
    for (const slug of Object.keys(GUIDES)) expect(GUIDE_SLUGS, slug).toContain(slug)
  })
})

describe('glosario', () => {
  const terms = GLOSSARY.flatMap((g) => g.terms)

  it('agrupa los términos por tema, cada uno con definición y ejemplo', () => {
    expect(terms.length).toBeGreaterThanOrEqual(20)
    for (const g of GLOSSARY) expect(g.terms.length, g.group).toBeGreaterThanOrEqual(2)
    for (const t of terms) {
      expect(t.definition.trim(), t.term).not.toBe('')
      expect(t.example.trim(), t.term).not.toBe('')
    }
    expect(new Set(terms.map((t) => t.term.toLowerCase())).size).toBe(terms.length)
  })

  it('cada término enlaza a una guía que existe', () => {
    for (const t of terms) if (t.lesson) expect(GUIDE_SLUGS, t.term).toContain(t.lesson)
  })
})

// Un ** sin cerrar pondría en negrita el resto de la frase
it('la negrita siempre queda cerrada', () => {
  const texts = [
    ...Object.values(GUIDES).flatMap((g) => [
      g.lead,
      g.why,
      ...g.rules,
      g.example.case,
      ...g.example.rows.flat(),
      g.example.result,
      ...g.steps,
      g.mistake.text,
      g.mistake.avoid,
      ...g.checklist,
      ...g.technical,
    ]),
    ...GLOSSARY.flatMap((g) => g.terms.flatMap((t) => [t.term, t.definition, t.example])),
  ]
  for (const text of texts) expect(text.split('**').length % 2, text).toBe(1)
})
