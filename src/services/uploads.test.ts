import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { diskStorage } from '@/storage/storage'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { startConsultation } from './consultations'
import { listUploads, removeUpload, saveUpload, validateFile, MAX_UPLOAD_BYTES } from './uploads'

describe('validateFile', () => {
  it('acepta PDF y Excel dentro del límite', () => {
    expect(validateFile({ name: 'eeff.PDF', size: 10 })).toBeNull()
    expect(validateFile({ name: 'eeff.xlsx', size: 10 })).toBeNull()
  })
  it('rechaza otros tipos, vacíos y grandes', () => {
    expect(validateFile({ name: 'foto.png', size: 10 })).toMatch(/PDF o Excel/)
    expect(validateFile({ name: 'a.pdf', size: 0 })).toMatch(/vacío/)
    expect(validateFile({ name: 'a.pdf', size: MAX_UPLOAD_BYTES + 1 })).toMatch(/4 MB/)
  })
})

describe('saveUpload', () => {
  it('guarda el archivo y lo registra', async () => {
    const db = await makeTestDb()
    const storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-up-')))
    const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
    const consultationId = await startConsultation(db, companyId)

    const r = await saveUpload(db, storage, { consultationId, name: 'eeff.pdf', size: 4, bytes: Buffer.from('%PDF') })
    expect(r.ok).toBe(true)
    const files = await listUploads(db, consultationId)
    expect(files).toHaveLength(1)
    expect((await storage.read(files[0].storageKey)).toString()).toBe('%PDF')

    await removeUpload(db, consultationId, files[0].id)
    expect(await listUploads(db, consultationId)).toHaveLength(0)
  })
})
