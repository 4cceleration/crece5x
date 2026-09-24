import { GUIDES } from './guides'
import { GLOSSARY } from './glossary'

export type InlinePart = { text: string; strong: boolean }

/** Los textos de las guías marcan los términos clave con **negrita**; el resto va tal cual */
export function parseInline(text: string): InlinePart[] {
  return text
    .split('**')
    .map((part, i) => ({ text: part, strong: i % 2 === 1 }))
    .filter((p) => p.text !== '')
}

const WORDS_PER_MINUTE = 180

export function readingMinutes(texts: string[]): number {
  const words = texts.join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

/** El tiempo de lectura sale del texto de la guía, así no se desactualiza cuando cambia */
export function lessonMinutes(slug: string): number {
  if (slug === 'glosario') {
    return readingMinutes(GLOSSARY.flatMap((g) => g.terms.flatMap((t) => [t.term, t.definition, t.example])))
  }
  const g = GUIDES[slug]
  if (!g) return 1
  return readingMinutes([
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
  ])
}
