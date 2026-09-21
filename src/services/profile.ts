import { eq, ne, and } from 'drizzle-orm'
import { z } from 'zod'
import type { Db } from '@/db/client'
import { emailChange, user } from '@/db/schema'
import { checkOtp, hashOtp, newOtp, otpExpiry } from '@/domain/otp'

export type Profile = {
  name: string
  email: string
  notifyByEmail: boolean
  marketingEmails: boolean
  /** Correo nuevo esperando el código, si hay un cambio a medias */
  pendingEmail: string | null
}

export async function getProfile(db: Db, userId: string): Promise<Profile | null> {
  const row = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (!row) return null
  const pending = await db.query.emailChange.findFirst({ where: eq(emailChange.userId, userId) })
  return {
    name: row.name,
    email: row.email,
    notifyByEmail: row.notifyByEmail,
    marketingEmails: row.marketingEmails,
    pendingEmail: pending && pending.expiresAt > new Date() ? pending.newEmail : null,
  }
}

export async function setEmailPreferences(
  db: Db,
  userId: string,
  prefs: { notifyByEmail: boolean; marketingEmails: boolean },
): Promise<void> {
  const current = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (!current) return
  await db
    .update(user)
    .set({
      ...prefs,
      // Queda la fecha en que aceptó el marketing; al rechazarlo se borra
      marketingConsentAt: prefs.marketingEmails ? (current.marketingConsentAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
}

export type EmailChangeRequest =
  | { ok: true; code: string; newEmail: string }
  | { ok: false; error: 'invalido' | 'igual' | 'ocupado' }

/** Deja pendiente el cambio y devuelve el código para enviarlo al correo nuevo */
export async function requestEmailChange(db: Db, userId: string, rawEmail: string): Promise<EmailChangeRequest> {
  const newEmail = rawEmail.trim().toLowerCase()
  if (!z.email().safeParse(newEmail).success) return { ok: false, error: 'invalido' }

  const current = await db.query.user.findFirst({ where: eq(user.id, userId) })
  if (!current) return { ok: false, error: 'invalido' }
  if (current.email.toLowerCase() === newEmail) return { ok: false, error: 'igual' }

  const taken = await db.query.user.findFirst({ where: and(eq(user.email, newEmail), ne(user.id, userId)) })
  if (taken) return { ok: false, error: 'ocupado' }

  const code = newOtp()
  // Un solo cambio pendiente por persona: pedir otro código reemplaza el anterior
  await db.delete(emailChange).where(eq(emailChange.userId, userId))
  await db.insert(emailChange).values({ userId, newEmail, codeHash: hashOtp(code), expiresAt: otpExpiry() })
  return { ok: true, code, newEmail }
}

export type EmailChangeResult =
  | { ok: true; email: string }
  | { ok: false; error: 'sin-solicitud' | 'vencido' | 'agotado' | 'incorrecto' | 'ocupado' }

export async function confirmEmailChange(db: Db, userId: string, code: string): Promise<EmailChangeResult> {
  const pending = await db.query.emailChange.findFirst({ where: eq(emailChange.userId, userId) })
  if (!pending) return { ok: false, error: 'sin-solicitud' }

  const verdict = checkOtp(pending, code)
  if (!verdict.ok) {
    if (verdict.reason === 'incorrecto') {
      await db.update(emailChange).set({ attempts: pending.attempts + 1 }).where(eq(emailChange.userId, userId))
    }
    if (verdict.reason === 'vencido') await db.delete(emailChange).where(eq(emailChange.userId, userId))
    return { ok: false, error: verdict.reason }
  }

  // Alguien pudo registrarse con ese correo mientras el código estaba en camino
  const taken = await db.query.user.findFirst({ where: and(eq(user.email, pending.newEmail), ne(user.id, userId)) })
  if (taken) {
    await db.delete(emailChange).where(eq(emailChange.userId, userId))
    return { ok: false, error: 'ocupado' }
  }

  // El código llegó al correo nuevo, así que queda verificado
  await db
    .update(user)
    .set({ email: pending.newEmail, emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, userId))
  await db.delete(emailChange).where(eq(emailChange.userId, userId))
  return { ok: true, email: pending.newEmail }
}

export async function cancelEmailChange(db: Db, userId: string): Promise<void> {
  await db.delete(emailChange).where(eq(emailChange.userId, userId))
}
