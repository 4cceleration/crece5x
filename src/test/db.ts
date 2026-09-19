import { createDb, type Db } from '@/db/client'
import { runMigrations } from '@/db/run-migrations'

// Postgres en memoria (PGlite) por prueba: rápido, aislado y con el mismo SQL que Neon
export async function makeTestDb(): Promise<Db> {
  const db = createDb('memory://')
  await runMigrations(db, 'memory://')
  return db
}
