'use client'
import { useState, useTransition } from 'react'
import { Icon } from '@/ui/icons'

type Status = { kind: 'idle' } | { kind: 'ocr'; file: string; page: number; pages: number } | { kind: 'subiendo' }

export function UploadForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()
  const busy = pending || status.kind !== 'idle'

  const label =
    status.kind === 'ocr'
      ? `Leyendo ${status.file} (página ${status.page} de ${status.pages})…`
      : busy
        ? 'Subiendo…'
        : 'Elegir archivos'

  // Se arma el envío a mano: el texto del OCR debe ir junto a los archivos, sin depender de un re-render
  async function onPick(list: FileList | null) {
    const files = Array.from(list ?? [])
    if (files.length === 0) return
    const fd = new FormData()
    for (const file of files) fd.append('files', file)

    for (const file of files) {
      if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) continue
      try {
        const { pdfTextInBrowser } = await import('@/ui/browser-ocr')
        const text = await pdfTextInBrowser(file, ({ page, pages }) => setStatus({ kind: 'ocr', file: file.name, page, pages }))
        if (text.trim()) fd.set(`texto:${file.name}`, text)
      } catch (e) {
        console.error('No se pudo leer el PDF en el navegador', e)
      }
    }

    setStatus({ kind: 'subiendo' })
    startTransition(async () => {
      await action(fd)
      setStatus({ kind: 'idle' })
    })
  }

  return (
    <label
      aria-busy={busy}
      className="flex h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink/20 bg-white/60 transition-colors hover:border-brand hover:bg-brand-soft"
    >
      <Icon name="subir" size={28} className="mb-1 text-brand-strong" />
      <span className="font-medium">{label}</span>
      <span className="text-sm text-muted">PDF o Excel · hasta 4 MB</span>
      <input
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => onPick(e.currentTarget.files)}
      />
    </label>
  )
}
