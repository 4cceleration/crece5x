import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { fileToText } from './extract-text'
import { Document, Page, Text, renderToBuffer } from '@react-pdf/renderer'
import React from 'react'

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

describe('PDF', () => {
  const pdfOf = (text: string) =>
    renderToBuffer(React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, text))))

  it('usa el texto del PDF cuando lo trae', async () => {
    const pdf = await pdfOf('TOTAL ACTIVO 1.000.000 '.repeat(20))
    const ocr = vi.fn()
    const text = await fileToText(pdf, 'application/pdf', { ocr })
    expect(text).toContain('TOTAL ACTIVO')
    expect(ocr).not.toHaveBeenCalled()
  })

  it('pasa por OCR cuando el PDF casi no tiene texto (escaneado)', async () => {
    const pdf = await pdfOf('.')
    const ocr = vi.fn().mockResolvedValue('## Página 1\nTOTAL ACTIVO 1.000.000')
    expect(await fileToText(pdf, 'application/pdf', { ocr })).toContain('TOTAL ACTIVO')
    expect(ocr).toHaveBeenCalledOnce()
  })

  it('si el OCR falla, devuelve lo que haya sin romper', async () => {
    const pdf = await pdfOf('.')
    const ocr = vi.fn().mockRejectedValue(new Error('sin idioma'))
    expect(await fileToText(pdf, 'application/pdf', { ocr })).toBeDefined()
  })
})
