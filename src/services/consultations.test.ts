import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase } from '@/db/seed-data'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import {
  completeReviewIfDone,
  getOwnedConsultation,
  loadDiagnosticState,
  saveAnswer,
  saveClassification,
  setFlag,
  startConsultation,
  undoLast,
} from './consultations'
import { FLAG_QUESTIONS, nextStep } from '@/domain/flow'

let db: Db
let companyId: string

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  companyId = await createCompanyForUser(db, { userId, name: 'Espiga', nit: '900' })
})

const input = { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false }

describe('consultations', () => {
  it('reutiliza la consulta abierta', async () => {
    const a = await startConsultation(db, companyId)
    const b = await startConsultation(db, companyId)
    expect(a).toBe(b)
  })

  it('no deja ver consultas de otra empresa', async () => {
    const id = await startConsultation(db, companyId)
    expect(await getOwnedConsultation(db, id, 'otra')).toBeUndefined()
  })

  it('clasifica y avanza a revisar', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    const c = await getOwnedConsultation(db, id, companyId)
    expect(c).toMatchObject({ group: 2, status: 'revisar' })
  })

  it('recorre el diagnóstico completo, permite deshacer y pasa a examinar', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    for (const f of FLAG_QUESTIONS) await setFlag(db, id, f.key, f.key !== 'arrendamientos')

    let s = await loadDiagnosticState(db, id)
    let step = nextStep(s.questions, s.flags, s.answers, s.group)
    expect(step.kind).toBe('question')
    if (step.kind === 'question') {
      expect(step.total).toBe(31) // 32 − 1 de arrendamientos
      await saveAnswer(db, id, step.question.id, 'si')
      await undoLast(db, id)
      s = await loadDiagnosticState(db, id)
      expect(Object.keys(s.answers)).toHaveLength(0)
    }

    expect(await completeReviewIfDone(db, id)).toBe(false)
    for (;;) {
      s = await loadDiagnosticState(db, id)
      step = nextStep(s.questions, s.flags, s.answers, s.group)
      if (step.kind !== 'question') break
      await saveAnswer(db, id, step.question.id, 'si')
    }
    expect(await completeReviewIfDone(db, id)).toBe(true)
    expect((await getOwnedConsultation(db, id, companyId))?.status).toBe('examinar')
  })
})
