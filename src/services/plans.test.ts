import { beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { analysis, consultation } from '@/db/schema'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { startConsultation } from './consultations'
import { companyCan, getCompanyPlan, setCompanyPlan } from './plans'
import { explainOnce, getExplanation } from './explanations'

let db: Db
let companyId: string

// Una consulta con su análisis en el estado indicado
async function withAnalysis(status: 'listo' | 'error'): Promise<string> {
  const id = await startConsultation(db, companyId)
  await db.update(consultation).set({ status: 'resultado' }).where(eq(consultation.id, id))
  await db.insert(analysis).values({ consultationId: id, status })
  return id
}

beforeEach(async () => {
  db = await makeTestDb()
  const userId = await createUserWithPassword(db, { email: 'ana@ejemplo.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  companyId = await createCompanyForUser(db, { userId, name: 'La Espiga SAS', nit: '900123456' })
})

describe('plan de la empresa', () => {
  it('empieza en gratis, con un análisis disponible', async () => {
    expect(await getCompanyPlan(db, companyId)).toMatchObject({ plan: 'gratis', used: 0, left: 1, canAnalyze: true })
  })

  it('el gratis se queda sin análisis después del primero', async () => {
    await withAnalysis('listo')
    expect(await getCompanyPlan(db, companyId)).toMatchObject({ used: 1, left: 0, canAnalyze: false })
  })

  it('un análisis que falló no gasta cupo', async () => {
    await withAnalysis('error')
    expect(await getCompanyPlan(db, companyId)).toMatchObject({ used: 0, canAnalyze: true })
  })

  it('cambiar de plan abre cupo y permisos', async () => {
    await withAnalysis('listo')
    expect(await companyCan(db, companyId, 'explicacion-ia')).toBe(false)

    await setCompanyPlan(db, companyId, 'monitoreo')
    expect(await getCompanyPlan(db, companyId)).toMatchObject({ plan: 'monitoreo', used: 1, left: 11, canAnalyze: true })
    expect(await companyCan(db, companyId, 'explicacion-ia')).toBe(true)
  })
})

describe('explicaciones guardadas', () => {
  it('se escribe una vez y después se relee', async () => {
    const consultationId = await withAnalysis('listo')
    const write = vi.fn(async () => 'Sus ingresos crecieron.')

    expect(await explainOnce(db, consultationId, 'cifras', write)).toBe('Sus ingresos crecieron.')
    expect(await explainOnce(db, consultationId, 'cifras', write)).toBe('Sus ingresos crecieron.')
    expect(write).toHaveBeenCalledTimes(1)
    expect(await getExplanation(db, consultationId, 'cifras')).toBe('Sus ingresos crecieron.')
  })

  it('cada gráfica tiene la suya', async () => {
    const consultationId = await withAnalysis('listo')
    await explainOnce(db, consultationId, 'cifras', async () => 'Cifras')
    await explainOnce(db, consultationId, 'flujo', async () => 'Flujo')
    expect(await getExplanation(db, consultationId, 'flujo')).toBe('Flujo')
  })
})
