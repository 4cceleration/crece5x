'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default function EntrarPage() {
  const [state, action] = useActionState(signInAction, null)

  return (
    <form action={action} className="space-y-5">
      <h1 className="sr-only">Iniciar sesión</h1>
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
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
