import type { LessonMeta } from '@/academia/lessons'
import { SEVERITY_ORDER } from './types'
import type { Severity } from './types'

export function learningPath(findings: { lesson: string | null; severity: Severity }[], lessons: LessonMeta[]): LessonMeta[] {
  const ordered = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
  const seen = new Set<string>()
  const out: LessonMeta[] = []
  for (const f of ordered) {
    if (!f.lesson || seen.has(f.lesson)) continue
    const lesson = lessons.find((l) => l.slug === f.lesson)
    if (!lesson) continue
    seen.add(f.lesson)
    out.push(lesson)
  }
  return out
}

export function lessonForSection(section: string, lessons: LessonMeta[]): string | null {
  const m = section.match(/\d+/)
  if (!m) return null
  const n = Number(m[0])
  return lessons.find((l) => l.sections.includes(n))?.slug ?? null
}
