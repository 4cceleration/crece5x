'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { resetPasswordAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null)
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <Field
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state?.error && (
        <p role="alert" className="animate-fade text-sm text-bad">
          {state.error}{' '}
          <Link href="/recuperar" className="underline underline-offset-4">
            Solicitar otro enlace
          </Link>
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Guardando…">
        Guardar contraseña
      </SubmitButton>
    </form>
  )
}
