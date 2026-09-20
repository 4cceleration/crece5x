import { extractText, getDocumentProxy } from 'unpdf'
import * as XLSX from 'xlsx'
import { ocrPdf } from './ocr'

// Un PDF con menos texto que esto se considera escaneado (imágenes) y se pasa por OCR
const SCANNED_THRESHOLD = 200

export async function fileToText(data: Buffer, mime: string, deps: { ocr?: (d: Buffer) => Promise<string> } = {}): Promise<string> {
  if (mime === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(data))
    const { text } = await extractText(pdf, { mergePages: true })
    if (text.replace(/\s/g, '').length >= SCANNED_THRESHOLD) return text
    // PDF escaneado: leerlo con OCR. Si el OCR falla, se devuelve lo poco que haya
    try {
      const ocr = deps.ocr ?? ocrPdf
      const recognized = await ocr(data)
      return recognized.replace(/\s/g, '').length > text.replace(/\s/g, '').length ? recognized : text
    } catch (e) {
      console.error('OCR falló', e)
      return text
    }
  }
  const wb = XLSX.read(data, { type: 'buffer' })
  return wb.SheetNames.map((name) => `## Hoja: ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join('\n\n')
}
