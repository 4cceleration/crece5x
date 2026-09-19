import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase } from '@/db/seed-data'
import { fileMailer } from '@/mail/mailer'
import { diskStorage } from '@/storage/storage'
import { mockAnalyst } from '@/ai/mock-analyst'
import { FLAG_QUESTIONS, nextStep } from '@/domain/flow'
import type { AnswerValue } from '@/domain/types'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { completeReviewIfDone, loadDiagnosticState, saveAnswer, saveClassification, setFlag, startConsultation } from './consultations'
import { saveUpload } from './uploads'
import { runAnalysis } from './analysis'
import { finalizeConsultation, getResultData } from './report'

let db: Db
let id: string
let mailDir: string

async function answerAll(value: AnswerValue, hasEEFF: boolean) {
  for (const f of FLAG_QUESTIONS) await setFlag(db, id, f.key, f.key === 'tieneEEFF' ? hasEEFF : true)
  for (;;) {
    const s = await loadDiagnosticState(db, id)
    const step = nextStep(s.questions, s.flags, s.answers, s.group)
    if (step.kind !== 'question') break
    await saveAnswer(db, id, step.question.id, value)
  }
  await completeReviewIfDone(db, id)
}

const deps = () => ({ mailer: fileMailer(mailDir), renderPdf: async () => Buffer.from('%PDF-prueba'), baseUrl: 'https://crece.test' })

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  mailDir = mkdtempSync(join(tmpdir(), 'crece-mail-'))
  const userId = await createUserWithPassword(db, { email: 'gerente@espiga.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  const companyId = await createCompanyForUser(db, { userId, name: 'La Espiga', nit: '900' })
  id = await startConsultation(db, companyId)
  await saveClassification(db, id, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
})

describe('finalizeConsultation', () => {
  it('sin análisis: diagnóstico 100, sin derivación y un solo correo con PDF', async () => {
    await answerAll('si', true)
    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data).not.toBeNull()
    expect(data!.diagnosticScore).toBe(100)
    expect(data!.finalScore).toBe(100)
    expect(data!.needsConsultant).toBe(false)
    expect(data!.companyName).toBe('La Espiga')
    expect(data!.dimensions).toHaveLength(5)

    await finalizeConsultation(db, id, deps())
    const files = readdirSync(mailDir)
    expect(files.filter((f) => f.endsWith('.html'))).toHaveLength(1)
    expect(files.some((f) => f.endsWith('reporte-crece.pdf'))).toBe(true)
  })

  it('con análisis simulado listo, el índice final es 0.6·100 + 0.4·85 = 94', async () => {
    await answerAll('si', true)
    const storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-st-')))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estado de situación financiera 2025'], ['Activo total', 1000000000]]), 'Balance')
    const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    await saveUpload(db, storage, { consultationId: id, name: 'eeff.xlsx', size: bytes.length, bytes })
    expect(await runAnalysis(db, id, { analyst: mockAnalyst, storage })).toBe('listo')

    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data!.analysisScore).toBe(85)
    expect(data!.finalScore).toBe(94)
    expect(data!.needsConsultant).toBe(false)
    expect(data!.ratios?.currentRatio).toBe(2)
    expect(data!.findings.map((f) => f.source)).toEqual(['ia', 'ia'])
  })

  it('sin estados financieros deriva al consultor y genera hallazgos del diagnóstico', async () => {
    await answerAll('no', false)
    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data!.needsConsultant).toBe(true)
    expect(data!.analysisScore).toBeNull()
    expect(data!.finalScore).toBe(0)
    expect(data!.findings.every((f) => f.source === 'diagnostico')).toBe(true)
    expect(data!.findings[0].severity).toBe('alta')
    expect(data!.path.length).toBeGreaterThan(0)
  })

  it('renderiza el PDF real', async () => {
    const { renderReportPdf } = await import('@/report/report-pdf')
    await answerAll('parcial', true)
    await finalizeConsultation(db, id, deps())
    const pdf = await renderReportPdf((await getResultData(db, id))!)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  })
})
