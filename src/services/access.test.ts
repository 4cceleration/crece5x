import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { appointment } from '@/db/schema'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { startConsultation } from './consultations'
import { canViewConsultation } from './access'

describe('canViewConsultation', () => {
  it('permite a la empresa dueña y al consultor con cita; niega al resto', async () => {
    const db = await makeTestDb()
    const owner = await createUserWithPassword(db, { email: 'o@x.co', name: 'O', role: 'empresa', password: 'Clave12345!' })
    const other = await createUserWithPassword(db, { email: 'p@x.co', name: 'P', role: 'empresa', password: 'Clave12345!' })
    const cons = await createUserWithPassword(db, { email: 'c@x.co', name: 'C', role: 'consultor', password: 'Clave12345!' })
    const cons2 = await createUserWithPassword(db, { email: 'd@x.co', name: 'D', role: 'consultor', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId: owner, name: 'E', nit: '900' })
    await createCompanyForUser(db, { userId: other, name: 'F', nit: '901' })
    const id = await startConsultation(db, companyId)
    await db.insert(appointment).values({ consultantId: cons, companyId, consultationId: id, startsAt: new Date(), endsAt: new Date() })

    expect(await canViewConsultation(db, { id: owner, role: 'empresa' }, id)).toBe(true)
    expect(await canViewConsultation(db, { id: cons, role: 'consultor' }, id)).toBe(true)
    expect(await canViewConsultation(db, { id: other, role: 'empresa' }, id)).toBe(false)
    expect(await canViewConsultation(db, { id: cons2, role: 'consultor' }, id)).toBe(false)
    expect(await canViewConsultation(db, { id: owner, role: 'empresa' }, 'no-existe')).toBe(false)
  })
})
