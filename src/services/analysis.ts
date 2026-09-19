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
    .onConflictDoUpdate({ target: analysis.consultationId, set: { status: 'procesando', error: null, updatedAt: new Date() } })
  await db
    .delete(finding)
    .where(and(eq(finding.consultationId, consultationId), inArray(finding.source, ['chequeo', 'ia'])))

  try {
    const files = await listUploads(db, consultationId)
    if (files.length === 0) throw new Error('No hay archivos para analizar.')

    const parts: string[] = []
    for (const f of files) {
      parts.push(`# Archivo: ${f.fileName}\n${await fileToText(await deps.storage.read(f.storageKey), f.mime)}`)
    }
    const text = parts.join('\n\n')
    if (text.replace(/\s/g, '').length < 50) {
      throw new Error('No encontramos texto en los archivos. Si el PDF es escaneado, súbalo en Excel o en PDF digital.')
    }

    const group = (c.group ?? 2) as Group
    const extracted = await deps.analyst.extract(text)
    const checks = runChecks(extracted, group)
    const ai = await deps.analyst.judge({ text, extracted, group })
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
