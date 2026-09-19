import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from '@/db/seed-data'
import { consultation } from '@/db/schema'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { adminMetrics, flattenSettings, listQuestions, listUsers, parseNumber, setSetting, setUserRole, updateQuestion } from './admin'

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

  it('cambia ajustes por clave con validación', () => {
    let s = setSetting(DEFAULT_SETTINGS, 'smmlv', '1.750.905')
    s = setSetting(s, 'consultantThreshold', '65')
    s = setSetting(s, 'blend.diagnostic', '0,7')
    s = setSetting(s, 'severityPenalty.critica', '25')
    expect(s.smmlv).toBe(1_750_905)
    expect(s.consultantThreshold).toBe(65)
    expect(s.blend).toEqual({ diagnostic: 0.7, analysis: 0.3 })
    expect(s.severityPenalty.critica).toBe(25)
    expect(s.group1).toEqual(DEFAULT_SETTINGS.group1)
    expect(DEFAULT_SETTINGS.smmlv).toBe(1_423_500)
    expect(flattenSettings(s)['blend.diagnostic']).toBe(0.7)
  })

  it('rechaza claves desconocidas, valores fuera de rango y texto', () => {
    expect(() => setSetting(DEFAULT_SETTINGS, 'secreto', '1')).toThrow(/desconocida/)
    expect(() => setSetting(DEFAULT_SETTINGS, 'blend.diagnostic', '2')).toThrow(/entre 0 y 1/)
    expect(() => setSetting(DEFAULT_SETTINGS, 'smmlv', 'mucho')).toThrow(/no es un número/)
    expect(() => parseNumber('')).toThrow()
  })
})
