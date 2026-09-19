import type { ComponentProps } from 'react'
import { Icon, type IconName } from './icons'

// Etiqueta flotante: dentro del campo cuando está vacío y sin foco; al escribir o enfocar se asienta sobre el borde superior.
// Solo se animan translate y scale (no top ni tamaño de letra) para que el movimiento sea fluido.
// Con `icon`, el icono va a la izquierda dentro del campo y la etiqueta en reposo se corre a su derecha.
// Con `suffix` (p. ej. la moneda), el texto queda fijo a la derecha dentro del campo
export function Field({
  label,
  hint,
  icon,
  suffix,
  className = '',
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string; icon?: IconName; suffix?: string }) {
  const labelX = icon ? 'left-10 -translate-x-7 peer-[:placeholder-shown:not(:focus)]:translate-x-0' : 'left-3'
  return (
    <label className="block space-y-2">
      <span className="relative block">
        <input
          {...props}
          placeholder=" "
          className={`peer h-14 w-full rounded-md bg-white ${icon ? 'pl-11' : 'pl-4'} ${suffix ? 'pr-16' : 'pr-4'} text-ink outline-hidden ring-1 ring-ink/15 transition-shadow duration-base hover:ring-ink/30 focus:ring-brand ${className}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium tracking-wide text-muted transition-[color] duration-base peer-focus:text-brand-strong">
            {suffix}
          </span>
        )}
        {icon && (
          <Icon
            name={icon}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted transition-[color] duration-base peer-focus:text-brand-strong"
          />
        )}
        <span
          className={`pointer-events-none absolute ${labelX} top-1/2 origin-left -translate-y-[calc(50%+1.75rem)] scale-75 bg-[linear-gradient(to_bottom,var(--notch-bg,var(--color-canvas))_50%,#fff_50%)] px-1 text-base text-muted transition-[translate,scale,color] duration-base peer-focus:text-brand-strong peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2 peer-[:placeholder-shown:not(:focus)]:scale-100`}
        >
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
