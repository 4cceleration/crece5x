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
  setAudience,
  setEeff,
  setFlag,
  startConsultation,
  undoLast,
} from './consultations'
import { nextStep } from '@/domain/flow'

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

  it('guarda quién responde y deja volver a elegirlo', async () => {
    const id = await startConsultation(db, companyId)
    await setAudience(db, id, 'empresario')
    expect((await loadDiagnosticState(db, id)).audience).toBe('empresario')
    await setAudience(db, id, null)
    expect((await loadDiagnosticState(db, id)).audience).toBeNull()
  })

  it('recorre el diagnóstico en un solo recorrido, permite deshacer y pasa a examinar', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    await setEeff(db, id, 'contador')
    expect(await getOwnedConsultation(db, id, companyId)).toMatchObject({ eeff: 'contador', waitingSince: expect.any(Date) })
    await setAudience(db, id, 'contador')

    let s = await loadDiagnosticState(db, id)
    let step = nextStep(s)
    // 5 de Sí/No + 32 preguntas del Grupo 2
    expect(step).toMatchObject({ kind: 'question', position: 1, total: 37 })
    if (step.kind === 'question') {
      await saveAnswer(db, id, step.question.id, 'si')
      await undoLast(db, id)
      s = await loadDiagnosticState(db, id)
      expect(Object.keys(s.answers)).toHaveLength(0)
    }

    expect(await completeReviewIfDone(db, id)).toBe(false)
    for (;;) {
      s = await loadDiagnosticState(db, id)
      step = nextStep(s)
      if (step.kind === 'done') break
      if (step.kind === 'flag') await setFlag(db, id, step.flag, step.flag !== 'arrendamientos')
      else await saveAnswer(db, id, step.question.id, 'si')
    }
    expect(Object.keys(s.answers)).toHaveLength(31) // 32 − 1 de arrendamientos
    expect(await completeReviewIfDone(db, id)).toBe(true)
    expect((await getOwnedConsultation(db, id, companyId))?.status).toBe('examinar')
  })

  it('cambiar la respuesta de contabilidad reinicia la espera del contador', async () => {
    const id = await startConsultation(db, companyId)
    await setEeff(db, id, 'contador')
    await setEeff(db, id, null)
    expect(await getOwnedConsultation(db, id, companyId)).toMatchObject({ eeff: null, waitingSince: null })
  })

  it('Atrás después de una de Sí/No la deja otra vez sin responder', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    await setAudience(db, id, 'contador')
    // Estados financieros y políticas (12 preguntas) hasta la primera de Sí/No: inventarios
    for (;;) {
      const step = nextStep(await loadDiagnosticState(db, id))
      if (step.kind !== 'question') break
      await saveAnswer(db, id, step.question.id, 'si')
    }
    await setFlag(db, id, 'inventarios', true)

    await undoLast(db, id)
    const s = await loadDiagnosticState(db, id)
    expect(s.flags.inventarios).toBeUndefined()
    expect(Object.keys(s.answers)).toHaveLength(12)
  })

  it('Atrás en la primera pregunta no cambia quién responde', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    await setAudience(db, id, 'empresario')
    await undoLast(db, id)
    expect((await loadDiagnosticState(db, id)).audience).toBe('empresario')
  })
})
