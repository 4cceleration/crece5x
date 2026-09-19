import { and, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, companyMember, consultation } from '@/db/schema'
import type { Role } from '@/domain/types'

export async function canViewConsultation(db: Db, u: { id: string; role: Role }, consultationId: string): Promise<boolean> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) return false
  if (u.role === 'admin') return true
  if (u.role === 'empresa') {
    const m = await db.query.companyMember.findFirst({
      where: and(eq(companyMember.userId, u.id), eq(companyMember.companyId, c.companyId)),
    })
    return Boolean(m)
  }
  const a = await db.query.appointment.findFirst({
    where: and(eq(appointment.consultantId, u.id), eq(appointment.companyId, c.companyId)),
  })
  return Boolean(a)
}
