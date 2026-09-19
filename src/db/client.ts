import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// DATABASE_URL:
//   postgres://… o postgresql://…  → Postgres (Neon en producción)
//   pglite:<carpeta>               → PGlite local en disco (p. ej. pglite:.data/pglite)
//   memory://                      → PGlite en memoria (pruebas)
export type Db = PostgresJsDatabase<typeof schema>

export function isPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//.test(url)
}

export function createDb(url: string): Db {
  if (isPostgresUrl(url)) {
    // prepare: false → compatible con el pooler de Neon (PgBouncer)
    return drizzlePostgres({ client: postgres(url, { prepare: false, max: 5 }), schema })
  }
  const dataDir = url.startsWith('pglite:') ? url.slice('pglite:'.length) : url
  if (dataDir !== 'memory://') mkdirSync(dataDir, { recursive: true })
  // PGlite y postgres.js exponen la misma API de Drizzle para Postgres
  return drizzlePglite({ client: new PGlite(dataDir), schema }) as unknown as Db
}

export const DEFAULT_DATABASE_URL = 'pglite:.data/pglite'
