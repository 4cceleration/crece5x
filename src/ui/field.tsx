import type { ComponentProps } from 'react'

// Etiqueta flotante: va dentro del campo cuando está vacío y sin foco; sube al escribir o enfocar
export function Field({ label, hint, className = '', ...props }: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="relative block">
        <input
          {...props}
          placeholder=" "
          className={`peer h-14 w-full rounded-md bg-surface px-4 pb-2 pt-6 text-ink outline-none focus:ring-2 focus:ring-brand ${className}`}
        />
        <span className="pointer-events-none absolute left-4 top-2 text-xs text-muted transition-all duration-150 ease-out peer-[:placeholder-shown:not(:focus)]:top-1/2 peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2 peer-[:placeholder-shown:not(:focus)]:text-base">
          {label}
        </span>
      </span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Check({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex items-start gap-3 text-ink">
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-strong" {...props} />
      <span>{label}</span>
    </label>
  )
}
