import { and, asc, desc, eq, ne } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { answer, consultation, question, type ConsultationStatus } from '@/db/schema'
import { classify, type ClassificationInput } from '@/domain/classify'
import { nextStep, previousTarget } from '@/domain/flow'
import type { AnswerValue, Flag, Flags, Group, Question } from '@/domain/types'
import { getSettings } from './settings'

export function stepPath(id: string, status: ConsultationStatus): string {
  return `/consulta/${id}/${status}`
}

export async function startConsultation(db: Db, companyId: string): Promise<string> {
  const open = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, companyId), ne(consultation.status, 'resultado')),
    orderBy: desc(consultation.createdAt),
  })
  if (open) return open.id
  const [row] = await db.insert(consultation).values({ companyId }).returning({ id: consultation.id })
  return row.id
}

export async function getOwnedConsultation(db: Db, id: string, companyId: string) {
  return db.query.consultation.findFirst({
    where: and(eq(consultation.id, id), eq(consultation.companyId, companyId)),
  })
}

export async function latestConsultation(db: Db, companyId: string) {
  return db.query.consultation.findFirst({
    where: eq(consultation.companyId, companyId),
    orderBy: desc(consultation.createdAt),
  })
}

export async function saveClassification(db: Db, id: string, input: ClassificationInput): Promise<void> {
  const settings = await getSettings(db)
  const { group, reason } = classify(input, settings)
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  await db
    .update(consultation)
    .set({ group, groupReason: reason, classificationInput: input, status: c.status === 'clasificar' ? 'revisar' : c.status })
    .where(eq(consultation.id, id))
}

export async function getActiveQuestions(db: Db): Promise<Question[]> {
  return db.select().from(question).where(eq(question.active, true)).orderBy(asc(question.order))
}

export async function loadDiagnosticState(db: Db, id: string) {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const questions = await getActiveQuestions(db)
  const rows = await db.select().from(answer).where(eq(answer.consultationId, id))
  const answers: Record<string, AnswerValue> = Object.fromEntries(rows.map((r) => [r.questionId, r.value]))
  return { questions, answers, flags: c.flags, group: (c.group ?? 2) as Group }
}

export async function setFlag(db: Db, id: string, flag: Flag, value: boolean): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const flags: Partial<Flags> = { ...c.flags, [flag]: value }
  await db.update(consultation).set({ flags }).where(eq(consultation.id, id))
}

export async function saveAnswer(db: Db, id: string, questionId: string, value: AnswerValue): Promise<void> {
  await db
    .insert(answer)
    .values({ consultationId: id, questionId, value })
    .onConflictDoUpdate({ target: [answer.consultationId, answer.questionId], set: { value } })
}

export async function undoLast(db: Db, id: string): Promise<void> {
  const s = await loadDiagnosticState(db, id)
  const target = previousTarget(s.questions, s.flags, s.answers, s.group)
  if (!target) return
  if (target.kind === 'answer') {
    await db.delete(answer).where(and(eq(answer.consultationId, id), eq(answer.questionId, target.questionId)))
    return
  }
  const flags = { ...s.flags }
  delete flags[target.flag]
  await db.update(consultation).set({ flags }).where(eq(consultation.id, id))
}

export async function completeReviewIfDone(db: Db, id: string): Promise<boolean> {
  const s = await loadDiagnosticState(db, id)
  if (nextStep(s.questions, s.flags, s.answers, s.group).kind !== 'done') return false
  await db
    .update(consultation)
    .set({ status: 'examinar' })
    .where(and(eq(consultation.id, id), eq(consultation.status, 'revisar')))
  return true
}
