import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { fileToText } from './extract-text'

describe('fileToText', () => {
  it('convierte cada hoja de Excel a texto CSV', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Cuenta', '2025'], ['Activo total', 1000]]), 'Balance')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Ingresos', 1500]]), 'Resultados')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    const text = await fileToText(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(text).toContain('## Hoja: Balance')
    expect(text).toContain('Activo total,1000')
    expect(text).toContain('## Hoja: Resultados')
  })
})
