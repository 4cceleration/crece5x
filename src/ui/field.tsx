import type { ComponentProps } from 'react'

// Etiqueta flotante: dentro del campo cuando está vacío y sin foco; al escribir o enfocar se asienta sobre el borde superior
export function Field({ label, hint, className = '', ...props }: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="relative block">
        <input
          {...props}
          placeholder=" "
          className={`peer h-14 w-full rounded-md bg-white px-4 text-ink outline-none ring-1 ring-ink/15 transition-shadow duration-200 ease-out hover:ring-ink/30 focus:ring-brand focus-visible:outline-none ${className}`}
        />
        <span className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-xs text-muted transition-all duration-200 ease-out peer-focus:text-brand-strong peer-[:placeholder-shown:not(:focus)]:top-1/2 peer-[:placeholder-shown:not(:focus)]:text-base">
          {label}
        </span>
      </span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Check({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-ink">
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-full bg-surface ring-1 ring-muted/40 transition-colors checked:bg-brand-strong checked:ring-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          {...props}
        />
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="pointer-events-none absolute inset-0 size-5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        >
          <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  )
}
