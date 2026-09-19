import { and, asc, count, desc, eq, gt, isNull, lt, lte } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, availability, company, consultation, user } from '@/db/schema'
import { availableSlots, type Slot } from '@/domain/slots'
import { BOGOTA_OFFSET_MIN, formatDateTime } from '@/domain/dates'
import { buildIcs } from '@/domain/ics'
import type { Mailer } from '@/mail/mailer'
import { appointmentEmail } from '@/mail/templates'
import { companyEmails } from './companies'
import { getSettings } from './settings'

// Ventana de reserva: días hacia adelante que se ofrecen en el calendario y se aceptan al confirmar
export const BOOKING_WINDOW_DAYS = 60

export async function openSlots(db: Db, now = new Date()): Promise<Slot[]> {
  const settings = await getSettings(db)
  const rules = await db
    .select({ consultantId: availability.consultantId, weekday: availability.weekday, startMinute: availability.startMinute, endMinute: availability.endMinute })
    .from(availability)
  const busy = await db
    .select({ consultantId: appointment.consultantId, startsAt: appointment.startsAt, endsAt: appointment.endsAt })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
  return availableSlots({ rules, busy, now, days: BOOKING_WINDOW_DAYS, durationMin: settings.appointmentMinutes, offsetMin: BOGOTA_OFFSET_MIN })
}

export type BookResult = { ok: true; appointmentId: string } | { ok: false; reason: 'ocupado' | 'ya-tiene-cita' }

export async function bookAppointment(db: Db, i: { companyId: string; startsAt: Date; now?: Date }): Promise<BookResult> {
  const now = i.now ?? new Date()
  if (await upcomingForCompany(db, i.companyId, now)) return { ok: false, reason: 'ya-tiene-cita' }

  const settings = await getSettings(db)
  const endsAt = new Date(i.startsAt.getTime() + settings.appointmentMinutes * 60_000)
  const candidates = (await openSlots(db, now))
    .filter((s) => s.startsAt.getTime() === i.startsAt.getTime())
    .map((s) => s.consultantId)
  if (candidates.length === 0) return { ok: false, reason: 'ocupado' }

  const load = await db
    .select({ consultantId: appointment.consultantId, n: count() })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.startsAt, now)))
    .groupBy(appointment.consultantId)
  const loadOf = (id: string) => load.find((l) => l.consultantId === id)?.n ?? 0
  const consultantId = [...candidates].sort((x, y) => loadOf(x) - loadOf(y))[0]

  const last = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, i.companyId), eq(consultation.status, 'resultado')),
    orderBy: desc(consultation.completedAt),
  })

  return db.transaction(async (tx): Promise<BookResult> => {
    const clash = await tx
      .select({ id: appointment.id })
      .from(appointment)
      .where(
        and(
          eq(appointment.consultantId, consultantId),
          eq(appointment.status, 'reservada'),
          lt(appointment.startsAt, endsAt),
          gt(appointment.endsAt, i.startsAt),
        ),
      )
    if (clash.length > 0) return { ok: false, reason: 'ocupado' }
    const [row] = await tx
      .insert(appointment)
      .values({ consultantId, companyId: i.companyId, consultationId: last?.id ?? null, startsAt: i.startsAt, endsAt })
      .returning({ id: appointment.id })
    return { ok: true, appointmentId: row.id }
  })
}

export async function upcomingForCompany(db: Db, companyId: string, now = new Date()) {
  const [row] = await db
    .select({ id: appointment.id, startsAt: appointment.startsAt, endsAt: appointment.endsAt, consultantName: user.name })
    .from(appointment)
    .innerJoin(user, eq(user.id, appointment.consultantId))
    .where(and(eq(appointment.companyId, companyId), eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
    .orderBy(asc(appointment.startsAt))
    .limit(1)
  return row ?? null
}

export async function cancelAppointment(db: Db, appointmentId: string, companyId: string): Promise<boolean> {
  const rows = await db
    .update(appointment)
    .set({ status: 'cancelada' })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.companyId, companyId), eq(appointment.status, 'reservada')))
    .returning({ id: appointment.id })
  return rows.length > 0
}

export async function getAppointmentDetail(db: Db, appointmentId: string) {
  const [row] = await db
    .select({ appointment, companyName: company.name, consultantName: user.name, consultantEmail: user.email })
    .from(appointment)
    .innerJoin(company, eq(company.id, appointment.companyId))
    .innerJoin(user, eq(user.id, appointment.consultantId))
    .where(eq(appointment.id, appointmentId))
  return row ?? null
}

type Detail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetail>>>

export function appointmentIcs(d: Detail): string {
  return buildIcs({
    uid: d.appointment.id,
    start: d.appointment.startsAt,
    end: d.appointment.endsAt,
    summary: `Consulta NIIF crece5x · ${d.companyName}`,
    description: `Consulta con ${d.consultantName}.`,
  })
}

export async function notifyAppointment(
  db: Db,
  appointmentId: string,
  kind: 'confirmada' | 'recordatorio' | 'cancelada',
  mailer: Mailer,
  baseUrl: string,
): Promise<void> {
  const d = await getAppointmentDetail(db, appointmentId)
  if (!d) return
  const when = formatDateTime(d.appointment.startsAt)
  const ics = kind === 'cancelada' ? [] : [{ filename: 'cita-crece5x.ics', content: Buffer.from(appointmentIcs(d)) }]
  const base = { when, companyName: d.companyName, consultantName: d.consultantName }

  const toCompany = appointmentEmail({ ...base, kind, url: `${baseUrl}/agenda` })
  await mailer.send({ to: await companyEmails(db, d.appointment.companyId), ...toCompany, attachments: ics })

  if (kind === 'recordatorio') return
  const toConsultant = appointmentEmail({
    ...base,
    kind: kind === 'confirmada' ? 'asignada' : 'cancelada',
    url: `${baseUrl}/consultor/casos/${appointmentId}`,
  })
  await mailer.send({ to: [d.consultantEmail], ...toConsultant, attachments: ics })
}

export async function dueReminders(db: Db, now = new Date()) {
  return db
    .select({ id: appointment.id })
    .from(appointment)
    .where(
      and(
        eq(appointment.status, 'reservada'),
        isNull(appointment.remindedAt),
        gt(appointment.startsAt, now),
        lte(appointment.startsAt, new Date(now.getTime() + 24 * 3_600_000)),
      ),
    )
}

export async function markReminded(db: Db, id: string): Promise<void> {
  await db.update(appointment).set({ remindedAt: new Date() }).where(eq(appointment.id, id))
}

// ── Consultor ─────────────────────────────────────────────────
export async function consultantAgenda(db: Db, consultantId: string, now = new Date()) {
  return db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      companyName: company.name,
      finalScore: consultation.finalScore,
    })
    .from(appointment)
    .innerJoin(company, eq(company.id, appointment.companyId))
    .leftJoin(consultation, eq(consultation.id, appointment.consultationId))
    .where(and(eq(appointment.consultantId, consultantId), eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
    .orderBy(asc(appointment.startsAt))
}

export async function getAppointmentForConsultant(db: Db, appointmentId: string, consultantId: string) {
  const row = await db.query.appointment.findFirst({
    where: and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)),
  })
  return row ?? null
}

export async function saveNotes(db: Db, appointmentId: string, consultantId: string, notes: string): Promise<void> {
  await db
    .update(appointment)
    .set({ notes })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)))
}

export async function completeAppointment(db: Db, appointmentId: string, consultantId: string): Promise<void> {
  await db
    .update(appointment)
    .set({ status: 'realizada' })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)))
}

export async function getAvailability(db: Db, consultantId: string) {
  return db.select().from(availability).where(eq(availability.consultantId, consultantId)).orderBy(asc(availability.weekday), asc(availability.startMinute))
}

export async function setAvailability(
  db: Db,
  consultantId: string,
  rules: { weekday: number; startMinute: number; endMinute: number }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(availability).where(eq(availability.consultantId, consultantId))
    if (rules.length > 0) await tx.insert(availability).values(rules.map((r) => ({ ...r, consultantId })))
  })
}
