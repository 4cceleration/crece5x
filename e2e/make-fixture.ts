import { mkdirSync } from 'node:fs'
import * as XLSX from 'xlsx'

mkdirSync('.data', { recursive: true })
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['Estado de situación financiera', '2025', '2024'],
    ['Activo corriente', 600000000, 550000000],
    ['Activo no corriente', 400000000, 350000000],
    ['Total activo', 1000000000, 900000000],
    ['Total pasivo', 450000000, 420000000],
    ['Patrimonio', 550000000, 480000000],
  ]),
  'Balance',
)
XLSX.writeFile(wb, '.data/e2e-fixture.xlsx')
console.log('Fixture creado en .data/e2e-fixture.xlsx')
