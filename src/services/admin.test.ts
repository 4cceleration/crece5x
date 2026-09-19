import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from '@/db/seed-data'
import { consultation } from '@/db/schema'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { adminMetrics, listQuestions, listUsers, setUserRole, settingsFromForm, updateQuestion } from './admin'

describe('admin', () => {
  it('métricas básicas', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    const u = await createUserWithPassword(db, { email: 'e@x.co', name: 'E', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId: u, name: 'E', nit: '900' })
    await db.insert(consultation).values([
      { companyId, status: 'resultado', finalScore: 80, completedAt: new Date() },
      { companyId, status: 'resultado', finalScore: 60, completedAt: new Date() },
      { companyId },
    ])
    expect(await adminMetrics(db)).toEqual({ companies: 1, completed: 2, avgScore: 70, upcoming: 0 })
  })

  it('edita preguntas y roles', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    await updateQuestion(db, 'd5-software', { weight: 3, active: false })
    const q = (await listQuestions(db)).find((x) => x.id === 'd5-software')
    expect(q).toMatchObject({ weight: 3, active: false })

    const u = await createUserWithPassword(db, { email: 'n@x.co', name: 'N', role: 'empresa', password: 'Clave12345!' })
    await setUserRole(db, u, 'consultor')
    expect((await listUsers(db)).find((x) => x.id === u)?.role).toBe('consultor')
  })

  it('convierte el formulario de ajustes', () => {
    const fd = new FormData()
    fd.set('smmlv', '1.750.905')
    fd.set('consultantThreshold', '65')
    fd.set('blend.diagnostic', '0,7')
    fd.set('severityPenalty.critica', '25')
    const s = settingsFromForm(fd, DEFAULT_SETTINGS)
    expect(s.smmlv).toBe(1_750_905)
    expect(s.consultantThreshold).toBe(65)
    expect(s.blend).toEqual({ diagnostic: 0.7, analysis: 0.3 })
    expect(s.severityPenalty.critica).toBe(25)
    expect(s.group1).toEqual(DEFAULT_SETTINGS.group1)
  })
})
