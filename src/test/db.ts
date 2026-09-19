import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb, type Db } from '@/db/client'

// Archivo temporal (no :memory:): con libsql cada transacción abre otra conexión
export async function makeTestDb(): Promise<Db> {
  const dir = mkdtempSync(join(tmpdir(), 'crece-'))
  const db = createDb(`file:${join(dir, 'test.db')}`)
  await migrate(db, { migrationsFolder: 'drizzle' })
  return db
}
