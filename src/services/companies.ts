import { and, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { company, companyMember, user } from '@/db/schema'

export async function createCompanyForUser(
  db: Db,
  i: { userId: string; name: string; nit: string },
): Promise<string> {
  const [row] = await db
    .insert(company)
    .values({ name: i.name.trim(), nit: i.nit.trim(), consentAt: new Date() })
    .returning({ id: company.id })

  await db.insert(companyMember).values({ companyId: row.id, userId: i.userId })
  return row.id
}

export async function getCompanyIdForUser(db: Db, userId: string): Promise<string | null> {
  const membership = await db.query.companyMember.findFirst({ where: eq(companyMember.userId, userId) })
  return membership?.companyId ?? null
}

export async function getCompany(db: Db, id: string) {
  return db.query.company.findFirst({ where: eq(company.id, id) })
}

export async function companyEmails(db: Db, companyId: string): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(companyMember)
    .innerJoin(user, eq(user.id, companyMember.userId))
    .where(eq(companyMember.companyId, companyId))

  return rows.map((row) => row.email)
}

/** Solo quienes aceptaron los avisos: citas y recordatorios, no lo que la persona pide en pantalla */
export async function companyNotificationEmails(db: Db, companyId: string): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(companyMember)
    .innerJoin(user, eq(user.id, companyMember.userId))
    .where(and(eq(companyMember.companyId, companyId), eq(user.notifyByEmail, true)))

  return rows.map((row) => row.email)
}
