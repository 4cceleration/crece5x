import type { ComponentProps } from 'react'

// Etiqueta flotante: va dentro del campo cuando está vacío y sin foco; sube al escribir o enfocar.
// Solo se animan translate y scale (no top ni tamaño de letra) para que el movimiento sea fluido.
export function Field({ label, hint, className = '', ...props }: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="relative block">
        <input
          {...props}
          placeholder=" "
          className={`peer h-14 w-full rounded-md bg-surface px-4 pb-2 pt-6 text-ink outline-hidden transition-shadow focus:ring-2 focus:ring-brand ${className}`}
        />
        <span className="pointer-events-none absolute left-4 top-1/2 origin-left -translate-y-[calc(50%+0.75rem)] scale-75 text-base text-muted transition-[translate,scale,color] duration-base peer-focus:text-brand-strong peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2 peer-[:placeholder-shown:not(:focus)]:scale-100">
          {label}
        </span>
      </span>
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}

// El check se dibuja al marcar (trazo animado) y el círculo cambia de color con transición
export function Check({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-ink">
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-full bg-surface ring-1 ring-muted/40 transition-[background-color,box-shadow] checked:bg-brand-strong checked:ring-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          {...props}
        />
        <svg
          viewBox="0 0 20 20"
          aria-hidden
          className="pointer-events-none absolute inset-0 size-5 text-white peer-checked:[&_path]:opacity-100 peer-checked:[&_path]:[stroke-dashoffset:0]"
        >
          <path
            d="M6 10.5l2.5 2.5L14 7.5"
            pathLength="1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-0 transition-[stroke-dashoffset,opacity] duration-base [stroke-dasharray:1] [stroke-dashoffset:1]"
          />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  )
}
