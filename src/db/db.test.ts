import { describe, expect, it } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from './seed-data'
import { QUESTION_BANK } from './questions'
import { availability, question, user } from './schema'
import { getSettings, saveSettings } from '@/services/settings'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { LESSONS } from '@/academia/lessons'
import { FLAG_QUESTIONS } from '@/domain/flow'

describe('base de datos', () => {
  it('la semilla es idempotente', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    await seedDatabase(db)
    const [{ n }] = await db.select({ n: count() }).from(question)
    expect(n).toBe(QUESTION_BANK.length)
    const consultants = await db.select().from(user).where(eq(user.role, 'consultor'))
    expect(consultants).toHaveLength(1)
    const [{ r }] = await db.select({ r: count() }).from(availability)
    expect(r).toBe(10)
  })

  it('cada pregunta apunta a una guía existente', () => {
    const slugs = new Set(LESSONS.map((l) => l.slug))
    for (const q of QUESTION_BANK) expect(slugs.has(q.lesson), q.id).toBe(true)
  })

  it('cada pregunta tiene su versión para el empresario, distinta de la del contador', () => {
    for (const q of QUESTION_BANK) {
      expect(q.simpleText?.trim(), q.id).toBeTruthy()
      expect(q.simpleHelp?.trim(), q.id).toBeTruthy()
      expect(q.simpleText, q.id).not.toBe(q.text)
    }
    for (const f of FLAG_QUESTIONS) expect(f.simpleText, f.key).not.toBe(f.text)
  })

  it('la semilla guarda la versión del empresario', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    const bank = QUESTION_BANK.find((q) => q.id === 'd3-inv-medicion')!
    const row = await db.query.question.findFirst({ where: eq(question.id, bank.id) })
    expect(row).toMatchObject({ simpleText: bank.simpleText, simpleHelp: bank.simpleHelp })
  })

  it('cada pregunta de Sí/No abre al menos una pregunta y va justo antes de ellas', () => {
    const orden = [
      ...QUESTION_BANK.map((q) => ({ key: q.id, order: q.order })),
      ...FLAG_QUESTIONS.map((f) => ({ key: f.key as string, order: f.order })),
    ]
      .sort((a, b) => a.order - b.order)
      .map((x) => x.key)
    for (const f of FLAG_QUESTIONS) {
      const abre = QUESTION_BANK.filter((q) => q.requiresFlag === f.key).map((q) => q.id)
      const i = orden.indexOf(f.key)
      expect(abre.length, f.key).toBeGreaterThan(0)
      expect(orden.slice(i + 1, i + 1 + abre.length).sort(), f.key).toEqual([...abre].sort())
    }
  })

  it('guarda y lee ajustes', async () => {
    const db = await makeTestDb()
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS)
    await saveSettings(db, { ...DEFAULT_SETTINGS, smmlv: 2_000_000 })
    expect((await getSettings(db)).smmlv).toBe(2_000_000)
  })
})
