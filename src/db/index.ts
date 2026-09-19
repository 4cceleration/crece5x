import { createDb, DEFAULT_DATABASE_URL, type Db } from './client'

const globalForDb = globalThis as unknown as { crecDb?: Db }

function instance(): Db {
  if (!globalForDb.crecDb) globalForDb.crecDb = createDb(process.env.DATABASE_URL || DEFAULT_DATABASE_URL)
  return globalForDb.crecDb
}

// La conexión se abre en el primer uso (no al importar): el build no toca la base y PGlite no choca con otro proceso
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = instance()
    const value = Reflect.get(real, prop, real)
    return typeof value === 'function' ? value.bind(real) : value
  },
})

export type { Db }
