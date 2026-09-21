import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getProfile } from '@/services/profile'
import { getCompanyPlan } from '@/services/plans'
import { PLANS } from '@/domain/plans'
import { getCompanyIdForUser } from '@/services/companies'
import { OTP_LENGTH, OTP_MINUTES } from '@/domain/otp'
import {
  cancelEmailChangeAction,
  changePasswordAction,
  confirmEmailChangeAction,
  requestEmailChangeAction,
  savePreferencesAction,
} from './actions'
import { Check, Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'
import { ButtonLink, buttonClass } from '@/ui/button'
import { Icon } from '@/ui/icons'

const OK_MESSAGES: Record<string, string> = {
  codigo: 'Le enviamos un código al correo nuevo.',
  correo: 'Listo, su correo quedó cambiado.',
  clave: 'Listo, su contraseña quedó cambiada. Cerramos las demás sesiones.',
  preferencias: 'Guardamos sus preferencias de correo.',
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-5 rounded-lg p-6 text-left sm:p-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams
  const user = await requireUser()
  const profile = await getProfile(db, user.id)
  if (!profile) notFound()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const plan = companyId ? await getCompanyPlan(db, companyId) : null

  return (
    <div className="animate-enter space-y-6 pt-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Su perfil</h1>
        <p className="text-muted">{profile.name}</p>
      </header>

      {ok && OK_MESSAGES[ok] && (
        <p role="status" className="animate-fade flex items-center gap-2 rounded-md bg-brand-soft px-4 py-3 text-brand-strong">
          <Icon name="check" size={20} />
          {OK_MESSAGES[ok]}
        </p>
      )}
      {error && (
        <p role="alert" className="animate-fade flex items-center gap-2 rounded-md bg-bad/10 px-4 py-3 text-bad">
          <Icon name="alerta" size={20} />
          {error}
        </p>
      )}

      {plan && (
        <Card title="Su plan">
          <p className="text-sm text-muted">
            Está en <span className="text-ink">{PLANS[plan.plan].name}</span>.{' '}
            {plan.left === null
              ? 'Con análisis sin límite.'
              : plan.left === 1
                ? 'Le queda 1 análisis con IA.'
                : `Le quedan ${plan.left} análisis con IA.`}
          </p>
          <ButtonLink href="/planes" variant="ghost">
            Ver los planes
          </ButtonLink>
        </Card>
      )}

      <Card title="Correo">
        <p className="text-sm text-muted">
          Su correo actual es <span className="text-ink">{profile.email}</span>. Cambiarlo pide un código que enviamos a la
          dirección nueva.
        </p>
        {profile.pendingEmail ? (
          <form action={confirmEmailChangeAction} className="space-y-5">
            <p className="text-sm">
              Escriba el código de {OTP_LENGTH} dígitos que enviamos a{' '}
              <span className="font-medium">{profile.pendingEmail}</span>. Vence en {OTP_MINUTES} minutos.
            </p>
            <Field
              label="Código"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern={`\\d{${OTP_LENGTH}}`}
              maxLength={OTP_LENGTH}
              required
              className="tracking-[0.5em]"
            />
            <div className="flex flex-wrap items-center gap-5">
              <SubmitButton pendingLabel="Confirmando…">Confirmar correo</SubmitButton>
              <button formAction={cancelEmailChangeAction} className={buttonClass('link')}>
                Cancelar el cambio
              </button>
            </div>
          </form>
        ) : (
          <form action={requestEmailChangeAction} className="space-y-5">
            <Field label="Correo nuevo" icon="correo" name="email" type="email" autoComplete="email" required />
            <SubmitButton pendingLabel="Enviando…">Enviarme el código</SubmitButton>
          </form>
        )}
      </Card>

      <Card title="Contraseña">
        <form action={changePasswordAction} className="space-y-5">
          <Field
            label="Contraseña actual"
            icon="contrasena"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label="Contraseña nueva"
            icon="contrasena"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            hint="Al menos 8 caracteres."
          />
          <Field
            label="Repita la contraseña nueva"
            icon="contrasena"
            name="repeatPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <SubmitButton pendingLabel="Guardando…">Cambiar contraseña</SubmitButton>
        </form>
      </Card>

      <Card title="Correos que le enviamos">
        <form action={savePreferencesAction} className="space-y-5">
          <Check
            name="notifyByEmail"
            label="Avisos sobre mi consulta: resultados, citas y recordatorios."
            defaultChecked={profile.notifyByEmail}
          />
          <Check
            name="marketingEmails"
            label="Novedades, contenidos y ofertas de crece5x."
            defaultChecked={profile.marketingEmails}
          />
          <p className="text-xs text-muted">
            Aunque los desactive, le seguiremos escribiendo lo indispensable de su cuenta (por ejemplo, el código para
            cambiar el correo o restablecer la contraseña).
          </p>
          <SubmitButton pendingLabel="Guardando…">Guardar preferencias</SubmitButton>
        </form>
      </Card>
    </div>
  )
}
