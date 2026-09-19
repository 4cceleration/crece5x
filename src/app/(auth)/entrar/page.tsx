'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default function EntrarPage() {
  const [state, action] = useActionState(signInAction, null)

  return (
    <form action={action} className="animate-enter space-y-5">
      <h1 className="text-3xl font-semibold">Entrar</h1>
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state?.error && (
        <p role="alert" className="animate-fade text-sm text-bad">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Primera vez?{' '}
        <Link href="/registro" className="text-ink underline underline-offset-4">
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}
