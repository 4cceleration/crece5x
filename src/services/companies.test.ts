import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { createUserWithPassword } from './users'
import { setEmailPreferences } from './profile'
import { companyEmails, companyNotificationEmails, createCompanyForUser, getCompany, getCompanyIdForUser } from './companies'

describe('companies', () => {
  it('crea la empresa y vincula al usuario', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, {
      email: 'Ana@Ejemplo.co',
      name: 'Ana',
      role: 'empresa',
      password: 'Clave12345!',
    })

    expect(await getCompanyIdForUser(db, userId)).toBeNull()

    const companyId = await createCompanyForUser(db, {
      userId,
      name: 'La Espiga SAS',
      nit: '900123456',
    })

    expect(await getCompanyIdForUser(db, userId)).toBe(companyId)
    expect((await getCompany(db, companyId))?.name).toBe('La Espiga SAS')
    expect(await companyEmails(db, companyId)).toEqual(['ana@ejemplo.co'])
  })

  it('deja fuera de los avisos a quien los rechazó', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'ana@ejemplo.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'La Espiga SAS', nit: '900123456' })

    expect(await companyNotificationEmails(db, companyId)).toEqual(['ana@ejemplo.co'])

    await setEmailPreferences(db, userId, { notifyByEmail: false, marketingEmails: false })
    expect(await companyNotificationEmails(db, companyId)).toEqual([])
    // El reporte que la empresa pide en pantalla no depende de la preferencia
    expect(await companyEmails(db, companyId)).toEqual(['ana@ejemplo.co'])
  })
})
