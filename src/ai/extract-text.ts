import { extractText, getDocumentProxy } from 'unpdf'
import * as XLSX from 'xlsx'

// Solo lee la capa de texto. Los PDFs escaneados se reconocen en el navegador (src/ui/browser-ocr.ts)
// y su texto llega guardado en la columna `text` del archivo subido.
export async function fileToText(data: Buffer, mime: string): Promise<string> {
  if (mime === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(data))
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  }
  const wb = XLSX.read(data, { type: 'buffer' })
  return wb.SheetNames.map((name) => `## Hoja: ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join('\n\n')
}
