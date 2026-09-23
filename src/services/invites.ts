import { createHash, randomBytes } from 'node:crypto'
import { and, asc, count, eq, lt } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { accountantInvite, company, consultation, upload } from '@/db/schema'
import { INVITE_DAYS, WAITING_REMINDER_DAYS } from '@/domain/eeff'

const DAY_MS = 24 * 60 * 60 * 1000

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function getInvite(db: Db, consultationId: string) {
  return db.query.accountantInvite.findFirst({ where: eq(accountantInvite.consultationId, consultationId) })
}

// Una invitación por consulta: reenviar cambia el token (el enlace anterior deja de servir) y renueva el plazo.
// Devuelve el token en claro, que solo viaja en el correo
export async function createInvite(
  db: Db,
  consultationId: string,
  email: string,
  now = new Date(),
): Promise<{ id: string; token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(now.getTime() + INVITE_DAYS * DAY_MS)
  const values = { email: email.trim().toLowerCase(), tokenHash: hash(token), expiresAt, doneAt: null, createdAt: now }
  const [row] = await db
    .insert(accountantInvite)
    .values({ consultationId, ...values })
    .onConflictDoUpdate({ target: accountantInvite.consultationId, set: values })
    .returning({ id: accountantInvite.id })
  return { id: row.id, token, expiresAt }
}

export type OpenInvite = {
  id: string
  consultationId: string
  companyId: string
  companyName: string
  email: string
  expiresAt: Date
  doneAt: Date | null
}

/** La invitación de ese enlace, solo si no venció y la consulta sigue esperando archivos */
export async function findOpenInvite(db: Db, token: string, now = new Date()): Promise<OpenInvite | null> {
  const [row] = await db
    .select({
      id: accountantInvite.id,
      consultationId: accountantInvite.consultationId,
      email: accountantInvite.email,
      expiresAt: accountantInvite.expiresAt,
      doneAt: accountantInvite.doneAt,
      status: consultation.status,
      companyId: company.id,
      companyName: company.name,
    })
    .from(accountantInvite)
    .innerJoin(consultation, eq(consultation.id, accountantInvite.consultationId))
    .innerJoin(company, eq(company.id, consultation.companyId))
    .where(eq(accountantInvite.tokenHash, hash(token)))
  if (!row || row.expiresAt <= now || row.status !== 'examinar') return null
  return {
    id: row.id,
    consultationId: row.consultationId,
    companyId: row.companyId,
    companyName: row.companyName,
    email: row.email,
    expiresAt: row.expiresAt,
    doneAt: row.doneAt,
  }
}

export async function listInviteUploads(db: Db, inviteId: string) {
  return db.select().from(upload).where(eq(upload.inviteId, inviteId)).orderBy(asc(upload.createdAt))
}

/** El contador solo puede quitar lo que subió él */
export async function removeInviteUpload(db: Db, inviteId: string, uploadId: string): Promise<void> {
  await db.delete(upload).where(and(eq(upload.id, uploadId), eq(upload.inviteId, inviteId)))
}

export async function markInviteDone(db: Db, inviteId: string, now = new Date()): Promise<void> {
  await db.update(accountantInvite).set({ doneAt: now }).where(eq(accountantInvite.id, inviteId))
}

// Consultas que esperan los archivos del contador y ya cumplieron el plazo del siguiente recordatorio
export async function dueWaitingReminders(db: Db, now = new Date()) {
  const waiting = await db
    .select({
      id: consultation.id,
      companyId: consultation.companyId,
      waitingSince: consultation.waitingSince,
      waitingReminders: consultation.waitingReminders,
      files: count(upload.id),
    })
    .from(consultation)
    .leftJoin(upload, eq(upload.consultationId, consultation.id))
    .where(
      and(
        eq(consultation.status, 'examinar'),
        eq(consultation.eeff, 'contador'),
        lt(consultation.waitingReminders, WAITING_REMINDER_DAYS.length),
      ),
    )
    .groupBy(consultation.id)
  return waiting.filter(
    (c) =>
      c.files === 0 &&
      c.waitingSince !== null &&
      c.waitingSince.getTime() + WAITING_REMINDER_DAYS[c.waitingReminders] * DAY_MS <= now.getTime(),
  )
}

export async function markWaitingReminded(db: Db, consultationId: string): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) return
  await db
    .update(consultation)
    .set({ waitingReminders: c.waitingReminders + 1 })
    .where(and(eq(consultation.id, consultationId), eq(consultation.waitingReminders, c.waitingReminders)))
}

/** Invitaciones pendientes, sin aviso de terminado (para mostrar en Examinar) */
export function isPending(invite: { doneAt: Date | null; expiresAt: Date }, now = new Date()): boolean {
  return invite.doneAt === null && invite.expiresAt > now
}
