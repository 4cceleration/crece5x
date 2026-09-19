import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { diskStorage, type Storage } from '@/storage/storage'
import { mockAnalyst } from '@/ai/mock-analyst'
import type { Analyst } from '@/ai/analyst'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { saveClassification, startConsultation } from './consultations'
import { saveUpload } from './uploads'
import { getAnalysis, runAnalysis } from './analysis'
import { finding } from '@/db/schema'
import { eq } from 'drizzle-orm'

let db: Db
let storage: Storage
let consultationId: string

function xlsx(): Buffer {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estado de situación financiera', '2025'], ['Activo total', 1000000000]]), 'Balance')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

beforeEach(async () => {
  db = await makeTestDb()
  storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-an-')))
  const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
  const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
  consultationId = await startConsultation(db, companyId)
  await saveClassification(db, consultationId, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
})

describe('runAnalysis', () => {
  it('extrae, chequea, juzga y guarda hallazgos e indicadores', async () => {
    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    expect(await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })).toBe('listo')

    const a = await getAnalysis(db, consultationId)
    expect(a?.status).toBe('listo')
    expect(a?.ratios?.currentRatio).toBe(2)

    const f = await db.select().from(finding).where(eq(finding.consultationId, consultationId))
    expect(f.map((x) => [x.source, x.lesson])).toEqual([
      ['ia', 'impuesto-ganancias'],
      ['ia', 'inventarios'],
    ])
  })

  it('reemplaza los hallazgos al volver a analizar', async () => {
    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })
    await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })
    const f = await db.select().from(finding).where(eq(finding.consultationId, consultationId))
    expect(f).toHaveLength(2)
  })

  it('marca error sin archivos o si el modelo falla', async () => {
    expect(await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })).toBe('error')
    expect((await getAnalysis(db, consultationId))?.error).toMatch(/No hay archivos/)

    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    const broken: Analyst = { ...mockAnalyst, extract: async () => { throw new Error('modelo caído') } }
    expect(await runAnalysis(db, consultationId, { analyst: broken, storage })).toBe('error')
    expect((await getAnalysis(db, consultationId))?.error).toBe('modelo caído')
  })
})
