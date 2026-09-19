import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { LESSONS } from '@/academia/lessons'
import { LESSON_CONTENT } from '@/academia/content'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { completedLessons, learningPathForCompany, markLessonDone } from './academia'
import { seedDatabase } from '@/db/seed-data'
import { FLAG_QUESTIONS, nextStep } from '@/domain/flow'
import { completeReviewIfDone, loadDiagnosticState, saveAnswer, saveClassification, setFlag, startConsultation } from './consultations'
import { finalizeConsultation, getResultData } from './report'

describe('academia', () => {
  it('cada guía tiene contenido', () => {
    for (const l of LESSONS) expect(LESSON_CONTENT[l.slug]?.length, l.slug).toBeGreaterThan(200)
  })

  it('marca guías leídas sin duplicar', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    await markLessonDone(db, userId, 'inventarios')
    await markLessonDone(db, userId, 'inventarios')
    expect([...(await completedLessons(db, userId))]).toEqual(['inventarios'])
  })

  it('sin consulta terminada no hay ruta', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
    expect(await learningPathForCompany(db, companyId)).toEqual([])
  })

  it('la ruta sale de la última consulta terminada aunque haya otra en curso', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    const userId = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })

    // Consulta terminada: sin estados financieros y "No" a todo, así hay hallazgos con guía
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
    for (const f of FLAG_QUESTIONS) await setFlag(db, id, f.key, f.key !== 'tieneEEFF')
    for (;;) {
      const s = await loadDiagnosticState(db, id)
      const step = nextStep(s.questions, s.flags, s.answers, s.group)
      if (step.kind !== 'question') break
      await saveAnswer(db, id, step.question.id, 'no')
    }
    await completeReviewIfDone(db, id)
    await finalizeConsultation(db, id)
    const terminada = (await getResultData(db, id))!.path
    expect(terminada.length).toBeGreaterThan(0)

    // Nueva consulta abierta: la ruta sigue siendo la de la terminada
    expect(await startConsultation(db, companyId)).not.toBe(id)
    expect(await learningPathForCompany(db, companyId)).toEqual(terminada)
  })
})
