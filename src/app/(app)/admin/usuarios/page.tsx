import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { listUsers } from '@/services/admin'
import { createConsultantAction, setRoleAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

const select = 'h-9 rounded-md bg-surface px-2 text-sm outline-none focus:ring-2 focus:ring-brand'

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireUser(['admin'])
  const { error } = await searchParams
  const users = await listUsers(db)
  return (
    <div className="space-y-14 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Usuarios</h1>

      <details className="max-w-md">
        <summary className="cursor-pointer font-medium">Crear consultor</summary>
        <form action={createConsultantAction} className="mt-6 space-y-4">
          <Field label="Nombre" name="name" required />
          <Field label="Correo" name="email" type="email" required />
          <Field label="Contraseña temporal" name="password" type="text" minLength={8} required />
          {error && <p className="text-sm text-bad">Revise los datos.</p>}
          <SubmitButton pendingLabel="Creando…">Crear</SubmitButton>
        </form>
      </details>

      <ul className="divide-y divide-surface">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <span>
              <span className="block font-medium">{u.name}</span>
              <span className="text-sm text-muted">{u.email}</span>
            </span>
            {u.id === me.id ? (
              <span className="text-sm text-muted">admin (usted)</span>
            ) : (
              <form action={setRoleAction.bind(null, u.id)} className="flex items-center gap-3 text-sm">
                <select name="role" defaultValue={u.role} className={select} aria-label={`Rol de ${u.name}`}>
                  <option value="empresa">empresa</option>
                  <option value="consultor">consultor</option>
                  <option value="admin">admin</option>
                </select>
                <button className="font-medium underline underline-offset-4">Guardar</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
