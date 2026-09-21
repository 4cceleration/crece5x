'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Check, Field } from '@/ui/field'
import { PasswordField } from '@/ui/password-field'
import { Icon } from '@/ui/icons'
import { SubmitButton } from '@/ui/submit-button'

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, null)
  // Lo que ya había escrito vuelve con el error; solo la contraseña se pide de nuevo
  const v = state?.values
  const marcado = (name: string, inicial = false) => (v ? v[name] === 'on' : inicial)

  return (
    <form action={action} className="space-y-5">
      <Field label="Tu nombre" icon="persona" name="name" autoComplete="name" defaultValue={v?.name} required />
      <Field label="Empresa" icon="empresa" name="company" autoComplete="organization" defaultValue={v?.company} required />
      <Field label="NIT" icon="nit" name="nit" inputMode="numeric" defaultValue={v?.nit} required />
      <Field label="Correo" icon="correo" name="email" type="email" autoComplete="email" defaultValue={v?.email} required />
      <PasswordField label="Contraseña" icon="contrasena" name="password" autoComplete="new-password" minLength={8} required />
      <Check
        name="consent"
        label="Autorizo el tratamiento de mis datos según la Ley 1581 de 2012."
        defaultChecked={marcado('consent')}
        required
      />
      <Check
        name="notifications"
        label="Quiero recibir avisos de mi consulta: resultados, citas y recordatorios."
        defaultChecked={marcado('notifications', true)}
      />
      <Check
        name="marketing"
        label="Quiero recibir novedades y contenidos de crece5x."
        defaultChecked={marcado('marketing')}
      />
      {state?.error && (
        <p role="alert" className="animate-fade text-sm text-bad">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full gap-2" pendingLabel="Creando…">
        <Icon name="registrarse" size={20} />
        Crear cuenta
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        <Link href="/entrar" className="text-muted underline underline-offset-4 hover:text-ink">
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
