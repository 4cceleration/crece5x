import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { adminMetrics } from '@/services/admin'

export default async function AdminPage() {
  await requireUser(['admin'])
  const m = await adminMetrics(db)
  const items = [
    { label: 'Empresas', value: m.companies },
    { label: 'Consultas terminadas', value: m.completed },
    { label: 'Índice promedio', value: m.avgScore ?? '—' },
    { label: 'Citas próximas', value: m.upcoming },
  ]
  return (
    <section className="space-y-10 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Resumen</h1>
      <dl className="grid grid-cols-2 gap-y-10">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="text-sm text-muted">{i.label}</dt>
            <dd className="text-5xl font-semibold tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
