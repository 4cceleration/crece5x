'use client'
import { useFormStatus } from 'react-dom'
import { Button } from './button'
import type { ComponentProps } from 'react'

export function SubmitButton({ pendingLabel, children, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
