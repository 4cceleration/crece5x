import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { account, user } from '@/db/schema'
import type { Role } from '@/domain/types'

export async function createUserWithPassword(
  db: Db,
  i: { email: string; name: string; role: Role; password: string },
): Promise<string> {
  const email = i.email.trim().toLowerCase()
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) })
  if (existing) return existing.id
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(user).values({ id, email, name: i.name, role: i.role, emailVerified: true, createdAt: now, updatedAt: now })
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: await hashPassword(i.password),
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function getUserRole(db: Db, userId: string): Promise<Role> {
  const u = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { role: true } })
  return u?.role ?? 'empresa'
}
