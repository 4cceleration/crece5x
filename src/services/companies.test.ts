import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { createUserWithPassword } from './users'
import { companyEmails, createCompanyForUser, getCompany, getCompanyIdForUser } from './companies'

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
})
