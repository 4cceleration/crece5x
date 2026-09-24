import Link from 'next/link'
import type { Guide } from '@/academia/guides'
import { GLOSSARY } from '@/academia/glossary'
import { getLesson, type LessonMeta } from '@/academia/lessons'
import { parseInline } from '@/academia/reading'
import { Icon } from '@/ui/icons'

// Guías de la Academia con jerarquía fija: título, resumen, secciones con subtítulo y recuadros
// para el ejemplo, el error frecuente y el detalle técnico. Todas se ven igual.

function Rich({ text }: { text: string }) {
  return parseInline(text).map((p, i) =>
    p.strong ? (
      <strong key={i} className="font-semibold text-ink">
        {p.text}
      </strong>
    ) : (
      p.text
    ),
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function Bullets({ items, tone = 'brand' }: { items: string[]; tone?: 'brand' | 'muted' }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden className={`mt-[0.7em] size-1.5 shrink-0 rounded-full ${tone === 'brand' ? 'bg-brand' : 'bg-muted/60'}`} />
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function Header({ title, lead, meta }: { title: string; lead: string; meta: string[] }) {
  return (
    <header className="space-y-5">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-xl leading-relaxed text-ink">
        <Rich text={lead} />
      </p>
      <ul className="flex flex-wrap gap-2 text-sm text-muted" aria-label="Sobre esta guía">
        {meta.map((m) => (
          <li key={m} className="rounded-full bg-card px-3 py-1 ring-1 ring-border">
            {m}
          </li>
        ))}
      </ul>
    </header>
  )
}

function metaFor(lesson: LessonMeta, minutes: number, done: boolean): string[] {
  return [
    ...(lesson.sections.length > 0 ? [`Sección ${lesson.sections.join(', ')}`] : []),
    `${minutes} min de lectura`,
    ...(done ? ['Leída'] : []),
  ]
}

export function GuideView({ lesson, guide, minutes, done }: { lesson: LessonMeta; guide: Guide; minutes: number; done: boolean }) {
  return (
    <div className="space-y-12 text-lg leading-relaxed">
      <Header title={lesson.title} lead={guide.lead} meta={metaFor(lesson, minutes, done)} />

      <Section title="Por qué le importa">
        <p>
          <Rich text={guide.why} />
        </p>
      </Section>

      <Section title="Lo que pide la norma">
        <Bullets items={guide.rules} />
      </Section>

      <section className="space-y-4 rounded-lg bg-brand-soft/70 p-5 ring-1 ring-brand/15 sm:p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Un ejemplo</h2>
        <p>
          <Rich text={guide.example.case} />
        </p>
        <dl className="divide-y divide-border overflow-hidden rounded-md bg-card text-base ring-1 ring-border">
          {guide.example.rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="text-muted">{label}</dt>
              <dd className="font-semibold tabular-nums sm:text-right">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-start gap-2 font-medium text-brand-strong">
          <Icon name="siguiente" size={20} className="mt-1" />
          <span>
            <Rich text={guide.example.result} />
          </span>
        </p>
      </section>

      <Section title="Paso a paso">
        <ol className="space-y-3">
          {guide.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong"
              >
                {i + 1}
              </span>
              <span className="pt-px">
                <Rich text={step} />
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Ámbar solo como énfasis puntual: el borde y el ícono, no el fondo */}
      <section className="space-y-3 rounded-lg border-l-4 border-accent bg-card p-5 ring-1 ring-border sm:p-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Icon name="alerta" size={24} className="text-accent" />
          Error frecuente
        </h2>
        <p>
          <Rich text={guide.mistake.text} />
        </p>
        <p className="text-muted">
          <span className="font-semibold text-ink">Cómo evitarlo:</span> <Rich text={guide.mistake.avoid} />
        </p>
      </section>

      <Section title="Revise antes del cierre">
        <ul className="space-y-3">
          {guide.checklist.map((item) => (
            <li key={item} className="flex gap-3">
              <Icon name="check" size={22} className="mt-1 text-ok" />
              <span>
                <Rich text={item} />
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <section className="space-y-3 rounded-lg bg-surface p-5 text-base text-muted ring-1 ring-border sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <Icon name="documento" size={20} className="text-brand-strong" />
          Para su contador
        </h2>
        <Bullets items={guide.technical} tone="muted" />
      </section>
    </div>
  )
}

export function GlossaryView({ lesson, minutes, done }: { lesson: LessonMeta; minutes: number; done: boolean }) {
  return (
    <div className="space-y-12 text-lg leading-relaxed">
      <Header
        title={lesson.title}
        lead="Las palabras que más se usan en la norma, explicadas sin tecnicismos y con un ejemplo."
        meta={metaFor(lesson, minutes, done)}
      />

      <nav aria-label="Temas del glosario">
        <ul className="flex flex-wrap gap-2 text-base">
          {GLOSSARY.map((g) => (
            <li key={g.id}>
              <a href={`#${g.id}`} className="inline-flex rounded-md bg-brand-soft px-3 py-1.5 font-medium text-brand-strong hover:bg-brand hover:text-on-accent">
                {g.group}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {GLOSSARY.map((g) => (
        <section key={g.id} id={g.id} className="scroll-mt-24 space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">{g.group}</h2>
          <dl className="divide-y divide-border rounded-lg bg-card ring-1 ring-border">
            {g.terms.map((t) => {
              const guide = t.lesson ? getLesson(t.lesson) : undefined
              return (
                <div key={t.term} className="space-y-1.5 px-5 py-4">
                  <dt className="text-xl font-semibold tracking-tight">{t.term}</dt>
                  <dd>{t.definition}</dd>
                  <dd className="text-base text-muted">
                    <span className="font-medium text-ink">Ejemplo:</span> {t.example}
                  </dd>
                  {guide && (
                    <dd className="text-base">
                      <Link href={`/academia/${guide.slug}`} className="inline-flex items-center gap-1 font-medium text-brand-strong hover:underline">
                        Ver la guía: {guide.title}
                        <Icon name="siguiente" size={16} />
                      </Link>
                    </dd>
                  )}
                </div>
              )
            })}
          </dl>
        </section>
      ))}
    </div>
  )
}
