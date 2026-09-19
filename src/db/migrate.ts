import 'dotenv/config'
import { DEFAULT_DATABASE_URL } from './client'
import { db } from './index'
import { runMigrations } from './run-migrations'

runMigrations(db, process.env.DATABASE_URL || DEFAULT_DATABASE_URL)
  .then(() => {
    console.log('Migraciones aplicadas.')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
