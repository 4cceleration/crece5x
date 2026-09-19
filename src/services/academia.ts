import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { consultation, lessonProgress } from '@/db/schema'
import type { LessonMeta } from '@/academia/lessons'
import { getResultData } from './report'

export async function completedLessons(db: Db, userId: string): Promise<Set<string>> {
  const rows = await db.select({ slug: lessonProgress.lessonSlug }).from(lessonProgress).where(eq(lessonProgress.userId, userId))
  return new Set(rows.map((r) => r.slug))
}

export async function markLessonDone(db: Db, userId: string, slug: string): Promise<void> {
  await db.insert(lessonProgress).values({ userId, lessonSlug: slug }).onConflictDoNothing()
}

// Ruta de la última consulta terminada (aunque haya otra en curso)
export async function learningPathForCompany(db: Db, companyId: string): Promise<LessonMeta[]> {
  const last = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, companyId), eq(consultation.status, 'resultado')),
    orderBy: desc(consultation.completedAt),
  })
  if (!last) return []
  return (await getResultData(db, last.id))?.path ?? []
}
