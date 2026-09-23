import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { analysis, consultation, finding } from '@/db/schema'
import type { Analyst } from '@/ai/analyst'
import { fileToText } from '@/ai/extract-text'
import type { Storage } from '@/storage/storage'
import { runChecks } from '@/domain/checks'
import { computeRatios } from '@/domain/ratios'
import { lessonForSection } from '@/domain/learning-path'
import { LESSONS } from '@/academia/lessons'
import type { Group, NewFinding } from '@/domain/types'
import { figuresFindings, figuresToExtracted, type Figures } from '@/domain/figures'
import { listUploads } from './uploads'

export async function getAnalysis(db: Db, consultationId: string) {
  return db.query.analysis.findFirst({ where: eq(analysis.consultationId, consultationId) })
}

async function setStatus(db: Db, consultationId: string, values: Partial<typeof analysis.$inferInsert>) {
  await db.update(analysis).set({ ...values, updatedAt: new Date() }).where(eq(analysis.consultationId, consultationId))
}

export async function runAnalysis(
  db: Db,
  consultationId: string,
  deps: { analyst: Analyst; storage: Storage },
): Promise<'listo' | 'error'> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) throw new Error('Consulta no encontrada')

  await db
    .insert(analysis)
    .values({ consultationId, status: 'procesando' })
    .onConflictDoUpdate({
      target: analysis.consultationId,
      set: { status: 'procesando', source: 'archivos', figures: null, error: null, updatedAt: new Date() },
    })
  await db
    .delete(finding)
    .where(and(eq(finding.consultationId, consultationId), inArray(finding.source, ['chequeo', 'ia'])))

  try {
    const files = await listUploads(db, consultationId)
    if (files.length === 0) throw new Error('No hay archivos para analizar.')

    const parts: string[] = []
    for (const f of files) {
      const content = f.text?.trim() || (await fileToText(await deps.storage.read(f.storageKey), f.mime))
      parts.push(`# Archivo: ${f.fileName}\n${content}`)
    }
    const text = parts.join('\n\n')
    if (text.replace(/\s/g, '').length < 50) {
      throw new Error('No pudimos leer texto en los archivos, ni siquiera con reconocimiento de imágenes. Intente con un PDF digital o un Excel.')
    }

    const group = (c.group ?? 2) as Group
    // Sin estados financieros: la IA arma unos preliminares con la declaración de renta o el balance de prueba
    const preliminary = c.eeff === 'parciales'
    const extracted = await deps.analyst.extract(text, { preliminary })
    const checks = runChecks(extracted, group, { preliminary })
    const ai = await deps.analyst.judge({ text, extracted, group, alreadyFound: checks.map((f) => f.title), preliminary })
    const aiFindings = ai.map((f): NewFinding => ({ ...f, source: 'ia', lesson: lessonForSection(f.niifSection, LESSONS) }))

    const all = [...checks, ...aiFindings]
    if (all.length > 0) await db.insert(finding).values(all.map((f) => ({ ...f, consultationId })))

    await setStatus(db, consultationId, { status: 'listo', extracted, ratios: computeRatios(extracted.periods[0]) })
    return 'listo'
  } catch (e) {
    await setStatus(db, consultationId, { status: 'error', error: e instanceof Error ? e.message : 'Error desconocido' })
    return 'error'
  }
}

// Sin archivos: la empresa escribe lo que tiene a la mano y se arma un balance estimado. Son reglas fijas,
// sin IA, así que no gasta el cupo de análisis del plan
export async function saveFiguresAnalysis(db: Db, consultationId: string, figures: Figures): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) throw new Error('Consulta no encontrada')
  const extracted = figuresToExtracted(figures)
  const values = {
    status: 'listo' as const,
    source: 'cifras' as const,
    figures,
    extracted,
    ratios: computeRatios(extracted.periods[0]),
    error: null,
    updatedAt: new Date(),
  }
  await db.insert(analysis).values({ consultationId, ...values }).onConflictDoUpdate({ target: analysis.consultationId, set: values })
  await db
    .delete(finding)
    .where(and(eq(finding.consultationId, consultationId), inArray(finding.source, ['chequeo', 'ia'])))
  const found = figuresFindings(figures, { empirical: c.eeff === 'empirica' })
  if (found.length > 0) await db.insert(finding).values(found.map((f) => ({ ...f, consultationId })))
}
