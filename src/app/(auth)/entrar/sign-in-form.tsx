'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export function SignInForm({ reset }: { reset: boolean }) {
  const [state, action] = useActionState(signInAction, null)

  return (
    <form action={action} className="space-y-5">
      {reset && <p className="text-sm text-brand-strong">Contraseña actualizada. Inicie sesión con la nueva.</p>}
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <p className="-mt-2 text-right text-sm">
        <Link href="/recuperar" className="text-muted hover:text-ink">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      {state?.error && (
        <p role="alert" className="text-sm text-bad">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Iniciando sesión…">
        Iniciar sesión
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        <Link href="/registro" className="text-muted underline underline-offset-4 hover:text-ink">
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
