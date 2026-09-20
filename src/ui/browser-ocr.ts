// OCR en el navegador: los PDFs escaneados (sin capa de texto) se leen en el equipo del usuario.
// Se hace aquí y no en el servidor porque el proceso auxiliar de Tesseract no arranca en las funciones de Vercel.
const SCANNED_THRESHOLD = 200
export const OCR_MAX_PAGES = 5

export type OcrProgress = (info: { page: number; pages: number }) => void

/** Devuelve el texto del PDF: su capa de texto o, si viene escaneado, lo reconocido con OCR. */
export async function pdfTextInBrowser(file: File, onProgress?: OcrProgress): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer())
  const { getDocumentProxy, extractText, renderPageAsImage } = await import('unpdf')
  const pdf = await getDocumentProxy(data)
  const { text } = await extractText(pdf, { mergePages: true })
  if (text.replace(/\s/g, '').length >= SCANNED_THRESHOLD) return text

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('spa')
  try {
    const pages = Math.min(pdf.numPages, OCR_MAX_PAGES)
    const parts: string[] = []
    for (let page = 1; page <= pages; page++) {
      onProgress?.({ page, pages })
      const image = await renderPageAsImage(pdf, page, { scale: 2 })
      const { data: result } = await worker.recognize(new Blob([image]))
      parts.push(`## Página ${page}\n${result.text.trim()}`)
    }
    if (pdf.numPages > pages) parts.push(`(Se leyeron las primeras ${pages} de ${pdf.numPages} páginas.)`)
    const recognized = parts.join('\n\n')
    return recognized.replace(/\s/g, '').length > text.replace(/\s/g, '').length ? recognized : text
  } finally {
    await worker.terminate()
  }
}
