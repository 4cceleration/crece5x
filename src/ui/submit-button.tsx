'use client'
import { useFormStatus } from 'react-dom'
import { Button } from './button'
import { Spinner } from './spinner'
import type { ComponentProps } from 'react'

const layer = 'col-start-1 row-start-1'

// Al enviar, el spinner se abre junto al texto (la ranura crece de 0 a 24 px con transición).
// Texto y pendingLabel comparten celda: el botón mide lo que el más largo y el ancho no salta al cambiar.
export function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()
  const swap = pending && !!pendingLabel
  return (
    <Button type="submit" aria-busy={pending} {...props} disabled={pending || disabled}>
      <span
        className={`overflow-hidden transition-[max-width,opacity] ${pending ? 'max-w-6 opacity-100' : 'max-w-0 opacity-0'}`}
      >
        <Spinner className="mr-2" />
      </span>
      <span className="grid justify-items-center">
        <span className={swap ? `${layer} invisible` : layer}>{children}</span>
        {pendingLabel && <span className={swap ? layer : `${layer} invisible`}>{pendingLabel}</span>}
      </span>
    </Button>
  )
}
