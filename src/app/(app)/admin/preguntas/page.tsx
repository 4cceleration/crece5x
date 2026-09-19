import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { listQuestions } from '@/services/admin'
import { DIMENSIONS } from '@/domain/types'
import { updateQuestionAction } from '../actions'

const select = 'h-9 rounded-md px-2 text-sm bg-white ring-1 ring-ink/15 outline-hidden transition-shadow duration-base hover:ring-ink/30 focus:ring-brand'

export default async function PreguntasPage() {
  await requireUser(['admin'])
  const questions = await listQuestions(db)
  return (
    <div className="space-y-14 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Preguntas</h1>
      {DIMENSIONS.map((d) => (
        <section key={d.key} className="space-y-2">
          <h2 className="text-lg font-semibold">{d.name}</h2>
          <ul className="divide-y divide-surface">
            {questions.filter((q) => q.dimension === d.key).map((q) => (
              <li key={q.id} id={q.id} className="space-y-3 py-4">
                <p className={q.active ? '' : 'text-muted line-through'}>{q.text}</p>
                <form action={updateQuestionAction.bind(null, q.id)} className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <label className="flex items-center gap-2">
                    Peso
                    <select name="weight" defaultValue={q.weight} className={select}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="active" defaultChecked={q.active} className="size-4 accent-brand-strong" />
                    Activa
                  </label>
                  <span>{q.niifSection}{q.requiresFlag ? ` · si ${q.requiresFlag}` : ''}</span>
                  <button className="font-medium text-ink underline underline-offset-4">Guardar</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
