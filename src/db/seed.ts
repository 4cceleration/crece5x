import 'dotenv/config'
import { db } from './index'
import { DEMO_ADMIN, DEMO_CONSULTANT, seedDatabase } from './seed-data'

// En producción: SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD y SEED_DEMO_CONSULTANT=false
const admin =
  process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD
    ? { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD }
    : undefined
const demoConsultant = process.env.SEED_DEMO_CONSULTANT !== 'false'

seedDatabase(db, { admin, demoConsultant })
  .then(() => {
    console.log('Semilla aplicada.')
    console.log(admin ? `Admin: ${admin.email}` : `Admin demo: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`)
    if (demoConsultant) console.log(`Consultor demo: ${DEMO_CONSULTANT.email} / ${DEMO_CONSULTANT.password}`)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
