import { getDocumentProxy, renderPageAsImage } from 'unpdf'

// OCR para PDFs escaneados (sin capa de texto): se renderiza cada página y se lee con Tesseract en español.
// Es lento (varios segundos por página), así que solo se usa cuando el PDF no trae texto y con un tope de páginas.
export const OCR_MAX_PAGES = 5
const OCR_SCALE = 2 // ~150 dpi: suficiente para cifras y mucho más rápido que 300 dpi

export async function ocrPdf(data: Buffer, maxPages = OCR_MAX_PAGES): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const pdf = await getDocumentProxy(new Uint8Array(data))
  const pages = Math.min(pdf.numPages, maxPages)
  // En Vercel solo /tmp es escribible: ahí se guardan los datos del idioma
  const worker = await createWorker('spa', undefined, { cachePath: process.env.VERCEL ? '/tmp' : '.data/tesseract' })
  try {
    const parts: string[] = []
    for (let page = 1; page <= pages; page++) {
      const image = await renderPageAsImage(pdf, page, {
        scale: OCR_SCALE,
        canvasImport: () => import('@napi-rs/canvas'),
      })
      const { data: result } = await worker.recognize(Buffer.from(image))
      parts.push(`## Página ${page}\n${result.text.trim()}`)
    }
    if (pdf.numPages > pages) parts.push(`(Se leyeron las primeras ${pages} de ${pdf.numPages} páginas.)`)
    return parts.join('\n\n')
  } finally {
    await worker.terminate()
  }
}
