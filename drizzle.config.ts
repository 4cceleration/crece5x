import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// Solo genera migraciones SQL a partir del esquema; se aplican con `npm run db:migrate`
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
})
