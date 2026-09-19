import { describe, expect, it } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from './seed-data'
import { QUESTION_BANK } from './questions'
import { availability, question, user } from './schema'
import { getSettings, saveSettings } from '@/services/settings'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { LESSONS } from '@/academia/lessons'

describe('base de datos', () => {
  it('la semilla es idempotente', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    await seedDatabase(db)
    const [{ n }] = await db.select({ n: count() }).from(question)
    expect(n).toBe(QUESTION_BANK.length)
    const admins = await db.select().from(user).where(eq(user.role, 'admin'))
    expect(admins).toHaveLength(1)
    const [{ r }] = await db.select({ r: count() }).from(availability)
    expect(r).toBe(10)
  })

  it('cada pregunta apunta a una guía existente', () => {
    const slugs = new Set(LESSONS.map((l) => l.slug))
    for (const q of QUESTION_BANK) expect(slugs.has(q.lesson), q.id).toBe(true)
  })

  it('guarda y lee ajustes', async () => {
    const db = await makeTestDb()
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS)
    await saveSettings(db, { ...DEFAULT_SETTINGS, smmlv: 2_000_000 })
    expect((await getSettings(db)).smmlv).toBe(2_000_000)
  })
})
