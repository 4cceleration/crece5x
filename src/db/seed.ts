import 'dotenv/config'
import { db } from './index'
import { DEMO_CONSULTANT, seedDatabase } from './seed-data'

// En producción: SEED_DEMO_CONSULTANT=false (los consultores se crean con npm run admin)
const demoConsultant = process.env.SEED_DEMO_CONSULTANT !== 'false'

seedDatabase(db, { demoConsultant })
  .then(() => {
    console.log('Semilla aplicada.')
    if (demoConsultant) console.log(`Consultor demo: ${DEMO_CONSULTANT.email} / ${DEMO_CONSULTANT.password}`)
    console.log('Administración: npm run admin -- ayuda')
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
