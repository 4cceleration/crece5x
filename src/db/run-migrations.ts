import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import { isPostgresUrl, type Db } from './client'

export async function runMigrations(db: Db, url: string): Promise<void> {
  const config = { migrationsFolder: 'drizzle' }
  if (isPostgresUrl(url)) await migratePostgres(db, config)
  else await migratePglite(db as unknown as PgliteDatabase<Record<string, never>>, config)
}
