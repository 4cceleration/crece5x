import { and, count, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { analysis, company, consultation } from '@/db/schema'
import { analysesLeft, canAnalyze, DEFAULT_PLAN, type PlanKey, type Scope, can } from '@/domain/plans'

export type CompanyPlan = {
  plan: PlanKey
  /** Análisis con IA ya usados por la empresa */
  used: number
  /** Cuántos le quedan; null es sin límite */
  left: number | null
  canAnalyze: boolean
}

export async function getCompanyPlan(db: Db, companyId: string): Promise<CompanyPlan> {
  const row = await db.query.company.findFirst({ where: eq(company.id, companyId) })
  const plan = row?.plan ?? DEFAULT_PLAN
  const used = await analysesUsed(db, companyId)
  return { plan, used, left: analysesLeft(plan, used), canAnalyze: canAnalyze(plan, used) }
}

/** Análisis con IA que ya salieron bien: los que fallaron no se le cobran a nadie, y las cifras escritas no usan IA */
export async function analysesUsed(db: Db, companyId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(analysis)
    .innerJoin(consultation, eq(consultation.id, analysis.consultationId))
    .where(and(eq(consultation.companyId, companyId), eq(analysis.status, 'listo'), eq(analysis.source, 'archivos')))
  return row?.n ?? 0
}

export async function setCompanyPlan(db: Db, companyId: string, plan: PlanKey): Promise<void> {
  await db.update(company).set({ plan, planSince: new Date() }).where(eq(company.id, companyId))
}

export async function companyCan(db: Db, companyId: string, scope: Scope): Promise<boolean> {
  const row = await db.query.company.findFirst({ where: eq(company.id, companyId) })
  return can(row?.plan ?? DEFAULT_PLAN, scope)
}
