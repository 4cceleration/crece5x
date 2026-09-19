import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase, DEMO_CONSULTANT } from '@/db/seed-data'
import { fileMailer } from '@/mail/mailer'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import {
  bookAppointment,
  cancelAppointment,
  consultantAgenda,
  dueReminders,
  getAppointmentForConsultant,
  getAvailability,
  markReminded,
  notifyAppointment,
  openSlots,
  saveNotes,
  setAvailability,
  upcomingForCompany,
} from './agenda'

// Lunes 21 sep 2026, 08:00 en Bogotá
const now = new Date('2026-09-21T13:00:00Z')
let db: Db
let a: string
let b: string
let consultantId: string

async function company(email: string) {
  const u = await createUserWithPassword(db, { email, name: email, role: 'empresa', password: 'Clave12345!' })
  return createCompanyForUser(db, { userId: u, name: `Empresa ${email}`, nit: '900' })
}

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  a = await company('a@x.co')
  b = await company('b@x.co')
  consultantId = (await db.query.user.findFirst({ where: eq(user.email, DEMO_CONSULTANT.email) }))!.id
})

describe('agenda', () => {
  it('ofrece franjas con 2 horas de anticipación', async () => {
    const slots = await openSlots(db, now)
    expect(slots[0].startsAt.toISOString()).toBe('2026-09-21T16:00:00.000Z') // 11:00 Bogotá
  })

  it('reserva, evita dobles reservas y libera al cancelar', async () => {
    const startsAt = new Date('2026-09-21T16:00:00Z')
    const r = await bookAppointment(db, { companyId: a, startsAt, now })
    expect(r.ok).toBe(true)
    expect(await bookAppointment(db, { companyId: b, startsAt, now })).toEqual({ ok: false, reason: 'ocupado' })
    expect(await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T19:00:00Z'), now })).toEqual({ ok: false, reason: 'ya-tiene-cita' })

    const up = await upcomingForCompany(db, a, now)
    expect(up?.consultantName).toBe('Laura Consultora')
    expect(await cancelAppointment(db, up!.id, b)).toBe(false)
    expect(await cancelAppointment(db, up!.id, a)).toBe(true)
    expect((await bookAppointment(db, { companyId: b, startsAt, now })).ok).toBe(true)
  })

  it('recordatorios de las próximas 24 horas', async () => {
    await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    const due = await dueReminders(db, now)
    expect(due).toHaveLength(1)
    await markReminded(db, due[0].id)
    expect(await dueReminders(db, now)).toHaveLength(0)
  })

  it('envía correos con invitación a la empresa y al consultor', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'crece-ag-'))
    const r = await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    if (!r.ok) throw new Error('reserva fallida')
    await notifyAppointment(db, r.appointmentId, 'confirmada', fileMailer(dir), 'https://crece.test')
    const files = readdirSync(dir)
    expect(files.filter((f) => f.endsWith('.html'))).toHaveLength(2)
    expect(files.filter((f) => f.endsWith('.ics'))).toHaveLength(2)
  })

  it('panel del consultor: agenda, notas y disponibilidad', async () => {
    const r = await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    if (!r.ok) throw new Error('reserva fallida')
    const list = await consultantAgenda(db, consultantId, now)
    expect(list).toHaveLength(1)
    expect(list[0].companyName).toBe('Empresa a@x.co')

    const other = await createUserWithPassword(db, { email: 'z@x.co', name: 'Z', role: 'consultor', password: 'Clave12345!' })
    expect(await getAppointmentForConsultant(db, r.appointmentId, other)).toBeNull()
    await saveNotes(db, r.appointmentId, consultantId, 'Revisar políticas')
    expect((await getAppointmentForConsultant(db, r.appointmentId, consultantId))?.notes).toBe('Revisar políticas')

    await setAvailability(db, consultantId, [{ weekday: 2, startMinute: 540, endMinute: 600 }])
    expect(await getAvailability(db, consultantId)).toHaveLength(1)
  })
})
