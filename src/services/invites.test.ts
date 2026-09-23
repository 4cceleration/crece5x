import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { consultation } from '@/db/schema'
import { diskStorage, type Storage } from '@/storage/storage'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { saveClassification, setEeff, startConsultation } from './consultations'
import { listUploads, saveUpload } from './uploads'
import {
  createInvite,
  dueWaitingReminders,
  findOpenInvite,
  listInviteUploads,
  markInviteDone,
  markWaitingReminded,
  removeInviteUpload,
} from './invites'

const DAY = 24 * 60 * 60 * 1000

let db: Db
let storage: Storage
let id: string

const pdf = Buffer.from('%PDF-1.4 prueba')

beforeEach(async () => {
  db = await makeTestDb()
  storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-inv-')))
  const userId = await createUserWithPassword(db, { email: 'gerente@espiga.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  const companyId = await createCompanyForUser(db, { userId, name: 'La Espiga', nit: '900' })
  id = await startConsultation(db, companyId)
  await saveClassification(db, id, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
  await setEeff(db, id, 'contador')
  await db.update(consultation).set({ status: 'examinar' }).where(eq(consultation.id, id))
})

describe('invitación al contador', () => {
  it('el enlace abre la consulta de esa empresa y vence a los 7 días', async () => {
    const now = new Date('2026-09-23T15:00:00Z')
    const { token } = await createInvite(db, id, ' Contador@Firma.co ', now)
    const open = await findOpenInvite(db, token, now)
    expect(open).toMatchObject({ consultationId: id, companyName: 'La Espiga', email: 'contador@firma.co', doneAt: null })
    expect(await findOpenInvite(db, token, new Date(now.getTime() + 7 * DAY))).toBeNull()
    expect(await findOpenInvite(db, 'otro-token', now)).toBeNull()
  })

  it('reenviar invalida el enlace anterior', async () => {
    const first = await createInvite(db, id, 'contador@firma.co')
    const second = await createInvite(db, id, 'otra@firma.co')
    expect(await findOpenInvite(db, first.token)).toBeNull()
    expect((await findOpenInvite(db, second.token))?.email).toBe('otra@firma.co')
  })

  it('no sirve cuando la consulta ya tiene resultado', async () => {
    const { token } = await createInvite(db, id, 'contador@firma.co')
    await db.update(consultation).set({ status: 'resultado' }).where(eq(consultation.id, id))
    expect(await findOpenInvite(db, token)).toBeNull()
  })

  it('el contador solo quita lo que subió él', async () => {
    const { id: inviteId } = await createInvite(db, id, 'contador@firma.co')
    const mine = await saveUpload(db, storage, { consultationId: id, name: 'eeff.pdf', size: pdf.length, bytes: pdf, inviteId })
    const company = await saveUpload(db, storage, { consultationId: id, name: 'renta.pdf', size: pdf.length, bytes: pdf })
    expect((await listInviteUploads(db, inviteId)).map((u) => u.fileName)).toEqual(['eeff.pdf'])

    if (company.ok) await removeInviteUpload(db, inviteId, company.id)
    if (mine.ok) await removeInviteUpload(db, inviteId, mine.id)
    expect((await listUploads(db, id)).map((u) => u.fileName)).toEqual(['renta.pdf'])
  })

  it('marca cuando el contador termina', async () => {
    const { id: inviteId, token } = await createInvite(db, id, 'contador@firma.co')
    await markInviteDone(db, inviteId)
    expect((await findOpenInvite(db, token))?.doneAt).toBeInstanceOf(Date)
  })
})

describe('recordatorios mientras espera los archivos', () => {
  it('recuerda a los 3 y a los 7 días, y no más', async () => {
    const since = new Date('2026-09-01T12:00:00Z')
    await db.update(consultation).set({ waitingSince: since }).where(eq(consultation.id, id))
    const at = (days: number) => new Date(since.getTime() + days * DAY)

    expect(await dueWaitingReminders(db, at(2))).toHaveLength(0)
    expect((await dueWaitingReminders(db, at(3))).map((c) => c.id)).toEqual([id])
    await markWaitingReminded(db, id)
    expect(await dueWaitingReminders(db, at(5))).toHaveLength(0)
    expect(await dueWaitingReminders(db, at(7))).toHaveLength(1)
    await markWaitingReminded(db, id)
    expect(await dueWaitingReminders(db, at(30))).toHaveLength(0)
  })

  it('no recuerda si ya hay archivos', async () => {
    const since = new Date('2026-09-01T12:00:00Z')
    await db.update(consultation).set({ waitingSince: since }).where(eq(consultation.id, id))
    await saveUpload(db, storage, { consultationId: id, name: 'eeff.pdf', size: pdf.length, bytes: pdf })
    expect(await dueWaitingReminders(db, new Date(since.getTime() + 4 * DAY))).toHaveLength(0)
  })

  it('solo recuerda a quien eligió "Los tiene mi contador"', async () => {
    await setEeff(db, id, 'empirica')
    expect(await dueWaitingReminders(db, new Date(Date.now() + 10 * DAY))).toHaveLength(0)
  })
})
