import { eq } from 'drizzle-orm'
import type { Db } from './client'
import { availability, question, setting } from './schema'
import { QUESTION_BANK } from './questions'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { createUserWithPassword } from '@/services/users'

export const DEMO_ADMIN = { email: 'admin@crece.local', password: 'Admin12345!' }
export const DEMO_CONSULTANT = { email: 'consultor@crece.local', password: 'Consultor123!' }

export type SeedOptions = {
  admin?: { email: string; password: string }
  demoConsultant?: boolean
}

export async function seedDatabase(db: Db, opts: SeedOptions = {}): Promise<void> {
  for (const q of QUESTION_BANK) {
    const { id: _id, ...rest } = q
    await db.insert(question).values({ ...q, active: true }).onConflictDoUpdate({ target: question.id, set: rest })
  }

  await db.insert(setting).values({ key: 'app', value: DEFAULT_SETTINGS }).onConflictDoNothing()

  await createUserWithPassword(db, { ...(opts.admin ?? DEMO_ADMIN), name: 'Administración CRECE', role: 'admin' })
  if (opts.demoConsultant === false) return

  const consultantId = await createUserWithPassword(db, { ...DEMO_CONSULTANT, name: 'Laura Consultora', role: 'consultor' })

  const hasRules = await db.query.availability.findFirst({ where: eq(availability.consultantId, consultantId) })
  if (!hasRules) {
    const rules = [1, 2, 3, 4, 5].flatMap((weekday) => [
      { consultantId, weekday, startMinute: 8 * 60, endMinute: 12 * 60 },
      { consultantId, weekday, startMinute: 14 * 60, endMinute: 17 * 60 },
    ])
    await db.insert(availability).values(rules)
  }
}
