import { createDb, type Db } from './client'

const globalForDb = globalThis as unknown as { crecDb?: Db }

export const db: Db =
  globalForDb.crecDb ?? createDb(process.env.DATABASE_URL ?? 'file:local.db', process.env.DATABASE_AUTH_TOKEN)

if (process.env.NODE_ENV !== 'production') globalForDb.crecDb = db

export type { Db }
