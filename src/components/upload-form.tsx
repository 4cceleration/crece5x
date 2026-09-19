'use client'
import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@/ui/icons'

function DropArea({ onPick }: { onPick: () => void }) {
  const { pending } = useFormStatus()
  return (
    <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-ink/20 bg-white/60 transition-colors hover:border-brand hover:bg-brand-soft">
      <Icon name="subir" size={28} className="mb-1 text-brand-strong" />
      <span className="font-medium">{pending ? 'Subiendo…' : 'Elegir archivos'}</span>
      <span className="text-sm text-muted">PDF o Excel · hasta 4 MB</span>
      <input
        type="file"
        name="files"
        multiple
        accept=".pdf,.xlsx,.xls"
        className="sr-only"
        disabled={pending}
        onChange={onPick}
      />
    </label>
  )
}

export function UploadForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null)
  return (
    <form ref={ref} action={action}>
      <DropArea onPick={() => ref.current?.requestSubmit()} />
    </form>
  )
}
