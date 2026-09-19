import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { setting } from '@/db/schema'
import { mergeSettings, type Settings } from '@/domain/settings'

const KEY = 'app'

export async function getSettings(db: Db): Promise<Settings> {
  const row = await db.query.setting.findFirst({ where: eq(setting.key, KEY) })
  return mergeSettings((row?.value as Partial<Settings> | undefined) ?? undefined)
}

export async function saveSettings(db: Db, s: Settings): Promise<void> {
  await db.insert(setting).values({ key: KEY, value: s }).onConflictDoUpdate({ target: setting.key, set: { value: s } })
}
