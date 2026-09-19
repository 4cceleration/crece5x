# CRECE — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la plataforma CRECE: consulta NIIF para pymes (clasificar → revisar → examinar con IA → comunicar → escalar/educar), con agenda de consultores, correo, academia y paneles de consultor y admin.

**Architecture:** Un solo proyecto Next.js 16 (App Router, Server Components, Server Actions). La lógica de negocio vive en funciones puras (`src/domain`) probadas con Vitest; el acceso a datos vive en servicios (`src/services`) que reciben `db` como parámetro para poder probarlos contra un SQLite temporal. Las integraciones externas (IA, archivos, correo) están detrás de interfaces con implementación local por defecto, así el proyecto corre completo sin cuentas externas.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Drizzle ORM 0.45 + `@libsql/client` (SQLite local / Turso en Vercel), Better Auth 1.7, Vercel AI SDK 7 (`ai`, modelos por AI Gateway), Zod 4, `unpdf`, SheetJS (`xlsx`), `@vercel/blob`, Resend, `@react-pdf/renderer`, `react-markdown`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-19-crece-niif-design.md`

## Global Constraints

- Idioma de la interfaz: español (Colombia). Textos cortos. Nada de descripciones de relleno.
- Sin landing page: `/` redirige a `/entrar` o al inicio del rol.
- Ley de Hick: **una acción principal por pantalla**; máximo 3 opciones visibles a la vez, salvo las 4 respuestas fijas del diagnóstico (Sí / Parcial / No / No sé). Una pregunta por pantalla.
- Minimal: sin bordes decorativos, sin tarjetas anidadas, sin sombras. Jerarquía con tipografía y espacio. Los campos usan fondo `surface`, no bordes.
- Paleta (tokens Tailwind en `globals.css`): `brand #F26B1D` (acento), `brand-strong #C2490F` (botón, texto blanco), `brand-deep #A93E0C` (hover), `brand-soft #FFF4EC`, `ink #14213D`, `muted #5B6477`, `surface #F7F7F5`, `ok #2F9E6B`, `warn #E0A100`, `bad #D64545`. Fondo blanco. Fuente Inter.
- Base de datos: `DATABASE_URL=file:local.db` en local; Turso (`libsql://…` + `DATABASE_AUTH_TOKEN`) en Vercel. Mismo esquema y migraciones (`drizzle/`).
- Proveedor de IA sin decidir: `AI_MODEL` vacío ⇒ analista simulado. Nunca importar SDKs de un proveedor concreto.
- Archivos: máximo 4 MB por archivo, PDF o Excel (`.pdf`, `.xlsx`, `.xls`).
- Zona horaria de negocio: America/Bogotá (UTC−5 fijo, sin horario de verano).
- Todo reporte incluye: "Este reporte es orientativo y no constituye una opinión de auditoría."
- Parámetros de rutas y `searchParams` en Next 16 son `Promise` y se hace `await`. `headers()` es asíncrono.
- Commits pequeños al final de cada tarea. Terminar cada mensaje de commit con `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Estructura de archivos

```
drizzle/                         migraciones generadas por drizzle-kit
drizzle.config.ts
e2e/consulta.spec.ts             recorrido completo (Playwright)
e2e/make-fixture.ts              genera el Excel de prueba
playwright.config.ts
vitest.config.ts
vercel.json                      cron de recordatorios
.env.example
src/
  app/
    layout.tsx  globals.css  page.tsx
    (auth)/layout.tsx  (auth)/entrar/page.tsx  (auth)/registro/page.tsx  (auth)/actions.ts
    (app)/layout.tsx
    (app)/inicio/page.tsx
    (app)/consulta/actions.ts
    (app)/consulta/[id]/clasificar/page.tsx
    (app)/consulta/[id]/revisar/page.tsx
    (app)/consulta/[id]/examinar/page.tsx
    (app)/consulta/[id]/resultado/page.tsx
    (app)/consulta/[id]/resultado/pdf/route.ts
    (app)/academia/page.tsx  (app)/academia/[slug]/page.tsx  (app)/academia/actions.ts
    (app)/agenda/page.tsx  (app)/agenda/actions.ts  (app)/agenda/[appointmentId]/ics/route.ts
    (app)/consultor/page.tsx  (app)/consultor/disponibilidad/page.tsx
    (app)/consultor/casos/[appointmentId]/page.tsx  (app)/consultor/actions.ts
    (app)/admin/page.tsx  (app)/admin/preguntas/page.tsx  (app)/admin/ajustes/page.tsx
    (app)/admin/usuarios/page.tsx  (app)/admin/actions.ts
    api/auth/[...all]/route.ts
    api/cron/recordatorios/route.ts
  domain/        lógica pura, sin I/O
    types.ts settings.ts classify.ts scoring.ts derivation.ts findings.ts flow.ts
    checks.ts ratios.ts slots.ts ics.ts dates.ts learning-path.ts
  academia/      lessons.ts (metadatos)  content.ts (textos markdown)
  db/            schema.ts index.ts migrate.ts seed.ts questions.ts
  services/      acceso a datos (reciben db)
    settings.ts users.ts companies.ts consultations.ts uploads.ts analysis.ts
    report.ts agenda.ts academia.ts audit.ts access.ts admin.ts
  ai/            schemas.ts analyst.ts mock-analyst.ts gateway-analyst.ts extract-text.ts
  storage/       storage.ts
  mail/          mailer.ts templates.ts
  report/        report-pdf.tsx
  lib/           auth.ts session.ts
  ui/            button.tsx submit-button.tsx field.tsx steps.tsx score.tsx nav.tsx
  components/    result-view.tsx
  test/          db.ts (helper de BD temporal)
```

Las pruebas unitarias viven junto al archivo: `src/domain/classify.test.ts`, etc.

---

### Task 1: Proyecto base, herramientas y sistema visual

**Files:**
- Create: todo el scaffold de Next.js en la raíz del repo, `vitest.config.ts`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore`, `next.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/ui/button.tsx`, `src/ui/submit-button.tsx`, `src/ui/field.tsx`

**Interfaces:**
- Produces: `Button`, `ButtonLink` (`variant?: 'primary' | 'ghost' | 'link'`), `SubmitButton` (`pending` label), `Field` (label + input). Tokens de color `brand`, `brand-strong`, `brand-deep`, `brand-soft`, `ink`, `muted`, `surface`, `ok`, `warn`, `bad` como clases Tailwind (`bg-brand`, `text-ink`…).

- [ ] **Step 1: Crear el scaffold en una carpeta temporal y copiarlo al repo** (el repo ya tiene `README.md` y `docs/`)

```bash
TMP=$(mktemp -d)
npx create-next-app@16 "$TMP/app" --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude README.md "$TMP/app/" ./
rm -rf "$TMP"
```

Si `create-next-app` rechaza algún flag, quitarlo y repetir; lo esencial es TypeScript, Tailwind, App Router y `src/`.

- [ ] **Step 2: Instalar dependencias**

```bash
npm i drizzle-orm @libsql/client better-auth ai zod unpdf https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz @vercel/blob resend @react-pdf/renderer react-markdown server-only dotenv
npm i -D drizzle-kit vitest vite-tsconfig-paths tsx @playwright/test
```

(SheetJS se instala desde su CDN oficial: la versión de npm está desactualizada y tiene vulnerabilidades.)

- [ ] **Step 3: Scripts en `package.json`** (agregar a `"scripts"` sin borrar los existentes)

```json
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx src/db/migrate.ts",
"db:seed": "tsx src/db/seed.ts",
"e2e": "playwright test"
```

- [ ] **Step 4: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    testTimeout: 20000,
  },
})
```

- [ ] **Step 5: `.gitignore` y `.env.example`**

Agregar al final de `.gitignore`:

```
!.env.example
/.data
*.db
*.db-journal
/test-results
/playwright-report
```

`.env.example`:

```
# Base de datos: SQLite local. En Vercel: libsql://<db>.turso.io
DATABASE_URL=file:local.db
DATABASE_AUTH_TOKEN=

# Auth
BETTER_AUTH_SECRET=cambia-esto-por-32-caracteres-aleatorios
BETTER_AUTH_URL=http://localhost:3000

# IA (vacío = analista simulado). Formato proveedor/modelo del AI Gateway
AI_MODEL=
AI_GATEWAY_API_KEY=

# Archivos (vacío = disco local en .data/uploads)
BLOB_READ_WRITE_TOKEN=

# Correo (vacío = archivos en .data/emails)
RESEND_API_KEY=
MAIL_FROM=CRECE <no-responder@tu-dominio.com>

# Cron de recordatorios
CRON_SECRET=cambia-esto
```

Copiarlo: `cp .env.example .env` y poner en `BETTER_AUTH_SECRET` el resultado de `openssl rand -base64 32`.

- [ ] **Step 6: `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'unpdf'],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
```

- [ ] **Step 7: Sistema visual en `src/app/globals.css`** (reemplazar todo el archivo)

```css
@import "tailwindcss";

@theme {
  --color-brand: #F26B1D;
  --color-brand-strong: #C2490F;
  --color-brand-deep: #A93E0C;
  --color-brand-soft: #FFF4EC;
  --color-ink: #14213D;
  --color-muted: #5B6477;
  --color-surface: #F7F7F5;
  --color-ok: #2F9E6B;
  --color-warn: #E0A100;
  --color-bad: #D64545;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

html { color-scheme: light; }
body { background: #ffffff; color: var(--color-ink); }
:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
```

- [ ] **Step 8: `src/app/layout.tsx`** (reemplazar)

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CRECE · Consulta NIIF',
  description: 'Diagnóstico y guía NIIF para pymes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: `src/app/page.tsx`** provisional (se reemplaza en la Task 7)

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/entrar')
}
```

Borrar los archivos de ejemplo que dejó el scaffold en `public/` (`*.svg`) si no se usan.

- [ ] **Step 10: Componentes base**

`src/ui/button.tsx`:

```tsx
import Link from 'next/link'
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'ghost' | 'link'

const styles: Record<Variant, string> = {
  primary:
    'inline-flex h-12 items-center justify-center rounded-full bg-brand-strong px-7 text-base font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-50',
  ghost:
    'inline-flex h-12 items-center justify-center rounded-full px-5 text-base font-medium text-ink transition-colors hover:bg-surface disabled:opacity-50',
  link: 'text-sm text-muted underline underline-offset-4 hover:text-ink',
}

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${styles[variant]} ${extra}`.trim()
}

export function Button({ variant = 'primary', className = '', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />
}

export function ButtonLink({ variant = 'primary', className = '', ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />
}
```

`src/ui/submit-button.tsx`:

```tsx
'use client'
import { useFormStatus } from 'react-dom'
import { Button } from './button'
import type { ComponentProps } from 'react'

export function SubmitButton({ pendingLabel, children, ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}
```

`src/ui/field.tsx`:

```tsx
import type { ComponentProps } from 'react'

export function Field({ label, hint, className = '', ...props }: ComponentProps<'input'> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      <input
        className={`h-12 w-full rounded-xl bg-surface px-4 text-ink outline-none placeholder:text-muted/60 focus:ring-2 focus:ring-brand ${className}`}
        {...props}
      />
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  )
}
```

- [ ] **Step 11: Verificar que compila**

Run: `npm run build`
Expected: build exitoso (la ruta `/` redirige).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: proyecto Next.js 16 base con sistema visual CRECE"
```

---

### Task 2: Tipos de dominio, ajustes y clasificador NIIF

**Files:**
- Create: `src/domain/types.ts`, `src/domain/settings.ts`, `src/domain/classify.ts`
- Test: `src/domain/classify.test.ts`

**Interfaces:**
- Produces:
  - `type Group = 1 | 2 | 3`, `type Dimension = 'D1'|'D2'|'D3'|'D4'|'D5'`, `type Flag = 'tieneEEFF'|'inventarios'|'activosFijos'|'arrendamientos'|'financiamiento'|'empleados'`, `type Flags = Record<Flag, boolean>`, `type AnswerValue = 'si'|'parcial'|'no'|'nose'`, `type Severity = 'critica'|'alta'|'media'|'baja'`, `type FindingSource = 'diagnostico'|'chequeo'|'ia'`, `type Light = 'verde'|'ambar'|'rojo'`, `type Role = 'empresa'|'consultor'|'admin'`
  - `type Question`, `type NewFinding` (ver código)
  - `DIMENSIONS`, `SEVERITY_ORDER`, `SEVERITY_LABEL`, `ANSWER_LABEL`
  - `type Settings`, `DEFAULT_SETTINGS`, `mergeSettings(stored?: Partial<Settings>): Settings`
  - `type ClassificationInput`, `classify(input, settings): { group: Group; reason: string }`, `GROUP_NAMES`

- [ ] **Step 1: `src/domain/types.ts`**

```ts
export type Group = 1 | 2 | 3
export type Dimension = 'D1' | 'D2' | 'D3' | 'D4' | 'D5'
export type Flag = 'tieneEEFF' | 'inventarios' | 'activosFijos' | 'arrendamientos' | 'financiamiento' | 'empleados'
export type Flags = Record<Flag, boolean>
export type AnswerValue = 'si' | 'parcial' | 'no' | 'nose'
export type Severity = 'critica' | 'alta' | 'media' | 'baja'
export type FindingSource = 'diagnostico' | 'chequeo' | 'ia'
export type Light = 'verde' | 'ambar' | 'rojo'
export type Role = 'empresa' | 'consultor' | 'admin'

export type Question = {
  id: string
  dimension: Dimension
  text: string
  help: string
  gap: string
  fix: string
  weight: number
  requiresFlag: Flag | null
  groups: Group[]
  niifSection: string
  lesson: string
  order: number
  active: boolean
}

export type NewFinding = {
  source: FindingSource
  title: string
  detail: string
  niifSection: string
  severity: Severity
  recommendation: string
  lesson: string | null
}

export const DIMENSIONS: { key: Dimension; name: string }[] = [
  { key: 'D1', name: 'Estados financieros' },
  { key: 'D2', name: 'Políticas contables' },
  { key: 'D3', name: 'Reconocimiento y medición' },
  { key: 'D4', name: 'Revelaciones' },
  { key: 'D5', name: 'Cierre contable' },
]

export const SEVERITY_ORDER: Severity[] = ['critica', 'alta', 'media', 'baja']

export const SEVERITY_LABEL: Record<Severity, string> = {
  critica: 'Crítico',
  alta: 'Alto',
  media: 'Medio',
  baja: 'Bajo',
}

export const ANSWER_LABEL: Record<AnswerValue, string> = {
  si: 'Sí',
  parcial: 'Parcial',
  no: 'No',
  nose: 'No sé',
}
```

- [ ] **Step 2: `src/domain/settings.ts`**

```ts
import type { Dimension, Severity } from './types'

export type Settings = {
  smmlv: number
  group1: { assetsSmmlv: number; employees: number }
  group3: { assetsSmmlv: number; revenueSmmlv: number; employees: number }
  dimensionWeights: Record<Dimension, number>
  severityPenalty: Record<Severity, number>
  blend: { diagnostic: number; analysis: number }
  consultantThreshold: number
  appointmentMinutes: number
}

export const DEFAULT_SETTINGS: Settings = {
  // Valor 2025. Actualizarlo cada año desde /admin/ajustes.
  smmlv: 1_423_500,
  group1: { assetsSmmlv: 30_000, employees: 200 },
  group3: { assetsSmmlv: 500, revenueSmmlv: 6_000, employees: 10 },
  dimensionWeights: { D1: 25, D2: 20, D3: 25, D4: 15, D5: 15 },
  severityPenalty: { critica: 20, alta: 10, media: 5, baja: 2 },
  blend: { diagnostic: 0.6, analysis: 0.4 },
  consultantThreshold: 60,
  appointmentMinutes: 60,
}

export function mergeSettings(stored?: Partial<Settings>): Settings {
  const s = stored ?? {}
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    group1: { ...DEFAULT_SETTINGS.group1, ...s.group1 },
    group3: { ...DEFAULT_SETTINGS.group3, ...s.group3 },
    dimensionWeights: { ...DEFAULT_SETTINGS.dimensionWeights, ...s.dimensionWeights },
    severityPenalty: { ...DEFAULT_SETTINGS.severityPenalty, ...s.severityPenalty },
    blend: { ...DEFAULT_SETTINGS.blend, ...s.blend },
  }
}
```

- [ ] **Step 3: Escribir la prueba que falla** — `src/domain/classify.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { classify } from './classify'
import { DEFAULT_SETTINGS, mergeSettings } from './settings'

const S = DEFAULT_SETTINGS
const base = { assets: 0, revenue: 0, employees: 0, issuesSecurities: false, publicInterest: false }
const smmlv = (n: number) => n * S.smmlv

describe('classify', () => {
  it('Grupo 1 si emite valores', () => {
    expect(classify({ ...base, issuesSecurities: true }, S).group).toBe(1)
  })

  it('Grupo 1 si es de interés público', () => {
    expect(classify({ ...base, publicInterest: true }, S).group).toBe(1)
  })

  it('Grupo 1 por activos sobre 30.000 SMMLV', () => {
    const r = classify({ ...base, assets: smmlv(30_001), employees: 50 }, S)
    expect(r.group).toBe(1)
    expect(r.reason).toContain('activos')
  })

  it('Grupo 1 por más de 200 empleados', () => {
    expect(classify({ ...base, assets: smmlv(1000), employees: 201 }, S).group).toBe(1)
  })

  it('Grupo 3 para microempresa', () => {
    const r = classify({ ...base, assets: smmlv(100), revenue: smmlv(1000), employees: 4 }, S)
    expect(r.group).toBe(3)
  })

  it('Grupo 2 si supera un límite de microempresa', () => {
    expect(classify({ ...base, assets: smmlv(100), revenue: smmlv(1000), employees: 11 }, S).group).toBe(2)
    expect(classify({ ...base, assets: smmlv(600), revenue: smmlv(1000), employees: 4 }, S).group).toBe(2)
    expect(classify({ ...base, assets: smmlv(100), revenue: smmlv(7000), employees: 4 }, S).group).toBe(2)
  })

  it('usa el SMMLV configurado', () => {
    const s = mergeSettings({ smmlv: 2_000_000 })
    expect(classify({ ...base, assets: 30_001 * 2_000_000, employees: 20 }, s).group).toBe(1)
    expect(classify({ ...base, assets: 30_001 * 1_423_500, employees: 20 }, s).group).toBe(2)
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que falla**

Run: `npx vitest run src/domain/classify.test.ts`
Expected: FAIL — no se puede resolver `./classify`.

- [ ] **Step 5: Implementar `src/domain/classify.ts`**

```ts
import type { Group } from './types'
import type { Settings } from './settings'

export type ClassificationInput = {
  assets: number
  revenue: number
  employees: number
  issuesSecurities: boolean
  publicInterest: boolean
}

export const GROUP_NAMES: Record<Group, string> = {
  1: 'NIIF Plenas',
  2: 'NIIF para Pymes',
  3: 'Contabilidad simplificada para microempresas',
}

const n = (v: number) => v.toLocaleString('es-CO')

export function classify(
  input: ClassificationInput,
  s: Pick<Settings, 'smmlv' | 'group1' | 'group3'>,
): { group: Group; reason: string } {
  if (input.issuesSecurities) return { group: 1, reason: 'Emite valores en el mercado público.' }
  if (input.publicInterest) return { group: 1, reason: 'Es una entidad de interés público.' }

  const assets = input.assets / s.smmlv
  const revenue = input.revenue / s.smmlv

  if (assets > s.group1.assetsSmmlv) {
    return { group: 1, reason: `Sus activos superan ${n(s.group1.assetsSmmlv)} salarios mínimos.` }
  }
  if (input.employees > s.group1.employees) {
    return { group: 1, reason: `Tiene más de ${n(s.group1.employees)} empleados.` }
  }
  if (
    input.employees <= s.group3.employees &&
    assets < s.group3.assetsSmmlv &&
    revenue < s.group3.revenueSmmlv
  ) {
    return {
      group: 3,
      reason: `Tiene hasta ${s.group3.employees} empleados, activos menores a ${n(s.group3.assetsSmmlv)} e ingresos menores a ${n(s.group3.revenueSmmlv)} salarios mínimos.`,
    }
  }
  return { group: 2, reason: 'No cumple las condiciones del Grupo 1 ni las de microempresa.' }
}
```

- [ ] **Step 6: Ejecutar y verificar que pasa**

Run: `npx vitest run src/domain/classify.test.ts`
Expected: PASS (7 pruebas).

- [ ] **Step 7: Commit**

```bash
git add src/domain
git commit -m "feat(dominio): tipos, ajustes y clasificador NIIF"
```

---

### Task 3: Índice CRECE, derivación, hallazgos del diagnóstico y flujo de preguntas

**Files:**
- Create: `src/domain/scoring.ts`, `src/domain/derivation.ts`, `src/domain/findings.ts`, `src/domain/flow.ts`
- Test: `src/domain/scoring.test.ts`, `src/domain/derivation.test.ts`, `src/domain/findings.test.ts`, `src/domain/flow.test.ts`

**Interfaces:**
- Consumes: tipos de `src/domain/types.ts`, `Settings`.
- Produces:
  - `isApplicable(q: Question, flags: Partial<Flags>, group: Group): boolean`
  - `scoreDiagnostic(questions: Question[], answers: Record<string, AnswerValue>, flags: Partial<Flags>, group: Group, weights: Record<Dimension, number>): { dimensions: Record<Dimension, number | null>; total: number }`
  - `scoreAnalysis(findings: { severity: Severity }[], penalty: Record<Severity, number>): number`
  - `finalIndex(diagnostic: number, analysis: number | null, blend: { diagnostic: number; analysis: number }): number`
  - `trafficLight(score: number): Light`, `LIGHT_LABEL: Record<Light, string>`
  - `needsConsultant(i: { hasFinancialStatements: boolean; finalScore: number; findings: { severity: Severity }[]; threshold: number }): boolean`
  - `diagnosticFindings(questions, answers, flags, group): NewFinding[]`
  - `FLAG_QUESTIONS: { key: Flag; text: string }[]`
  - `type Step`, `nextStep(questions, flags, answers, group): Step`, `previousTarget(questions, flags, answers, group): { kind: 'answer'; questionId: string } | { kind: 'flag'; flag: Flag } | null`

- [ ] **Step 1: Fábrica de preguntas para pruebas** — crear `src/domain/test-helpers.ts`

```ts
import type { Question } from './types'

export function q(partial: Partial<Question> & Pick<Question, 'id' | 'dimension'>): Question {
  return {
    text: `Pregunta ${partial.id}`,
    help: '',
    gap: `Brecha ${partial.id}`,
    fix: `Arreglo ${partial.id}`,
    weight: 1,
    requiresFlag: null,
    groups: [1, 2, 3],
    niifSection: 'Sección 3',
    lesson: 'presentacion',
    order: 0,
    active: true,
    ...partial,
  }
}

export const ALL_FLAGS = {
  tieneEEFF: true,
  inventarios: true,
  activosFijos: true,
  arrendamientos: true,
  financiamiento: true,
  empleados: true,
}
```

- [ ] **Step 2: Pruebas que fallan** — `src/domain/scoring.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { finalIndex, isApplicable, scoreAnalysis, scoreDiagnostic, trafficLight } from './scoring'
import { DEFAULT_SETTINGS } from './settings'
import { ALL_FLAGS, q } from './test-helpers'

const W = DEFAULT_SETTINGS.dimensionWeights

describe('isApplicable', () => {
  it('respeta bandera, grupo y activo', () => {
    expect(isApplicable(q({ id: 'a', dimension: 'D3', requiresFlag: 'inventarios' }), { inventarios: false }, 2)).toBe(false)
    expect(isApplicable(q({ id: 'a', dimension: 'D3', requiresFlag: 'inventarios' }), { inventarios: true }, 2)).toBe(true)
    expect(isApplicable(q({ id: 'a', dimension: 'D1', groups: [1, 2] }), ALL_FLAGS, 3)).toBe(false)
    expect(isApplicable(q({ id: 'a', dimension: 'D1', active: false }), ALL_FLAGS, 2)).toBe(false)
  })
})

describe('scoreDiagnostic', () => {
  it('pondera respuestas dentro de la dimensión', () => {
    const qs = [q({ id: 'a', dimension: 'D1', weight: 3 }), q({ id: 'b', dimension: 'D1', weight: 1 })]
    const r = scoreDiagnostic(qs, { a: 'si', b: 'no' }, ALL_FLAGS, 2, W)
    expect(r.dimensions.D1).toBe(75)
    expect(r.total).toBe(75)
  })

  it('parcial vale medio y sin respuesta vale cero', () => {
    const qs = [q({ id: 'a', dimension: 'D1' }), q({ id: 'b', dimension: 'D1' })]
    expect(scoreDiagnostic(qs, { a: 'parcial' }, ALL_FLAGS, 2, W).dimensions.D1).toBe(25)
  })

  it('renormaliza cuando una dimensión no tiene preguntas aplicables', () => {
    const qs = [
      q({ id: 'a', dimension: 'D1' }),
      q({ id: 'b', dimension: 'D2' }),
      q({ id: 'c', dimension: 'D3', requiresFlag: 'inventarios' }),
    ]
    const r = scoreDiagnostic(qs, { a: 'si', b: 'no' }, { ...ALL_FLAGS, inventarios: false }, 2, W)
    expect(r.dimensions.D3).toBeNull()
    // (100*25 + 0*20) / 45
    expect(r.total).toBe(55.6)
  })
})

describe('scoreAnalysis', () => {
  it('resta penalizaciones y no baja de cero', () => {
    const P = DEFAULT_SETTINGS.severityPenalty
    expect(scoreAnalysis([{ severity: 'alta' }, { severity: 'media' }], P)).toBe(85)
    expect(scoreAnalysis(Array(6).fill({ severity: 'critica' }), P)).toBe(0)
    expect(scoreAnalysis([], P)).toBe(100)
  })
})

describe('finalIndex y semáforo', () => {
  it('mezcla 60/40 cuando hay análisis', () => {
    expect(finalIndex(100, 85, DEFAULT_SETTINGS.blend)).toBe(94)
    expect(finalIndex(72.4, null, DEFAULT_SETTINGS.blend)).toBe(72)
  })
  it('asigna color', () => {
    expect(trafficLight(80)).toBe('verde')
    expect(trafficLight(79)).toBe('ambar')
    expect(trafficLight(60)).toBe('ambar')
    expect(trafficLight(59)).toBe('rojo')
  })
})
```

`src/domain/derivation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { needsConsultant } from './derivation'

const ok = { hasFinancialStatements: true, finalScore: 85, findings: [], threshold: 60 }

describe('needsConsultant', () => {
  it('no deriva a una empresa sana', () => expect(needsConsultant(ok)).toBe(false))
  it('deriva sin estados financieros', () => expect(needsConsultant({ ...ok, hasFinancialStatements: false })).toBe(true))
  it('deriva con índice bajo el umbral', () => expect(needsConsultant({ ...ok, finalScore: 59 })).toBe(true))
  it('deriva con hallazgo crítico', () =>
    expect(needsConsultant({ ...ok, findings: [{ severity: 'critica' as const }] })).toBe(true))
})
```

`src/domain/findings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { diagnosticFindings } from './findings'
import { ALL_FLAGS, q } from './test-helpers'

describe('diagnosticFindings', () => {
  const qs = [
    q({ id: 'w3', dimension: 'D1', weight: 3, niifSection: 'Sección 7', lesson: 'flujo-efectivo' }),
    q({ id: 'w2', dimension: 'D2', weight: 2 }),
    q({ id: 'w1', dimension: 'D2', weight: 1 }),
    q({ id: 'inv', dimension: 'D3', weight: 3, requiresFlag: 'inventarios' }),
  ]

  it('genera hallazgo alto para peso 3 y medio para peso 2 cuando la respuesta es No o No sé', () => {
    const f = diagnosticFindings(qs, { w3: 'no', w2: 'nose', w1: 'no', inv: 'no' }, { ...ALL_FLAGS, inventarios: false }, 2)
    expect(f).toHaveLength(2)
    expect(f[0]).toMatchObject({ source: 'diagnostico', severity: 'alta', title: 'Brecha w3', recommendation: 'Arreglo w3', niifSection: 'Sección 7', lesson: 'flujo-efectivo' })
    expect(f[1]).toMatchObject({ severity: 'media', title: 'Brecha w2' })
  })

  it('no genera hallazgos para Sí o Parcial', () => {
    expect(diagnosticFindings(qs, { w3: 'si', w2: 'parcial' }, ALL_FLAGS, 2)).toHaveLength(0)
  })
})
```

`src/domain/flow.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FLAG_QUESTIONS, nextStep, previousTarget } from './flow'
import { ALL_FLAGS, q } from './test-helpers'

const qs = [
  q({ id: 'b', dimension: 'D1', order: 2 }),
  q({ id: 'a', dimension: 'D1', order: 1 }),
  q({ id: 'inv', dimension: 'D3', order: 3, requiresFlag: 'inventarios' }),
]

describe('nextStep', () => {
  it('pregunta primero las banderas en orden', () => {
    const s = nextStep(qs, {}, {}, 2)
    expect(s).toMatchObject({ kind: 'flag', flag: FLAG_QUESTIONS[0].key, position: 1, total: FLAG_QUESTIONS.length })
  })

  it('luego las preguntas aplicables por orden', () => {
    const s = nextStep(qs, { ...ALL_FLAGS, inventarios: false }, {}, 2)
    expect(s).toMatchObject({ kind: 'question', position: 1, total: 2 })
    if (s.kind === 'question') expect(s.question.id).toBe('a')
  })

  it('termina cuando todo está respondido', () => {
    expect(nextStep(qs, { ...ALL_FLAGS, inventarios: false }, { a: 'si', b: 'no' }, 2)).toEqual({ kind: 'done' })
  })
})

describe('previousTarget', () => {
  it('deshace la última respuesta', () => {
    expect(previousTarget(qs, ALL_FLAGS, { a: 'si', b: 'no' }, 2)).toEqual({ kind: 'answer', questionId: 'b' })
  })
  it('sin respuestas deshace la última bandera', () => {
    expect(previousTarget(qs, { tieneEEFF: true, inventarios: false }, {}, 2)).toEqual({ kind: 'flag', flag: 'inventarios' })
  })
  it('al inicio no hay nada que deshacer', () => {
    expect(previousTarget(qs, {}, {}, 2)).toBeNull()
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que fallan**

Run: `npx vitest run src/domain`
Expected: FAIL — módulos `./scoring`, `./derivation`, `./findings`, `./flow` no existen.

- [ ] **Step 4: Implementar `src/domain/scoring.ts`**

```ts
import { DIMENSIONS } from './types'
import type { AnswerValue, Dimension, Flags, Group, Light, Question, Severity } from './types'

const VALUE_SCORE: Record<AnswerValue, number> = { si: 1, parcial: 0.5, no: 0, nose: 0 }

const round1 = (n: number) => Math.round(n * 10) / 10

export function isApplicable(q: Question, flags: Partial<Flags>, group: Group): boolean {
  if (!q.active) return false
  if (!q.groups.includes(group)) return false
  return q.requiresFlag === null || flags[q.requiresFlag] === true
}

export function scoreDiagnostic(
  questions: Question[],
  answers: Record<string, AnswerValue>,
  flags: Partial<Flags>,
  group: Group,
  weights: Record<Dimension, number>,
): { dimensions: Record<Dimension, number | null>; total: number } {
  const dimensions = {} as Record<Dimension, number | null>
  for (const { key } of DIMENSIONS) {
    const qs = questions.filter((q) => q.dimension === key && isApplicable(q, flags, group))
    const wsum = qs.reduce((acc, q) => acc + q.weight, 0)
    dimensions[key] =
      wsum === 0
        ? null
        : round1((qs.reduce((acc, q) => acc + q.weight * VALUE_SCORE[answers[q.id] ?? 'nose'], 0) / wsum) * 100)
  }

  let num = 0
  let den = 0
  for (const { key } of DIMENSIONS) {
    const v = dimensions[key]
    if (v === null) continue
    num += v * weights[key]
    den += weights[key]
  }
  return { dimensions, total: den === 0 ? 0 : round1(num / den) }
}

export function scoreAnalysis(findings: { severity: Severity }[], penalty: Record<Severity, number>): number {
  return Math.max(0, 100 - findings.reduce((acc, f) => acc + penalty[f.severity], 0))
}

export function finalIndex(
  diagnostic: number,
  analysis: number | null,
  blend: { diagnostic: number; analysis: number },
): number {
  return Math.round(analysis === null ? diagnostic : blend.diagnostic * diagnostic + blend.analysis * analysis)
}

export function trafficLight(score: number): Light {
  if (score >= 80) return 'verde'
  if (score >= 60) return 'ambar'
  return 'rojo'
}

export const LIGHT_LABEL: Record<Light, string> = {
  verde: 'Saludable',
  ambar: 'Requiere atención',
  rojo: 'En riesgo',
}
```

- [ ] **Step 5: Implementar `src/domain/derivation.ts`**

```ts
import type { Severity } from './types'

export function needsConsultant(i: {
  hasFinancialStatements: boolean
  finalScore: number
  findings: { severity: Severity }[]
  threshold: number
}): boolean {
  return !i.hasFinancialStatements || i.finalScore < i.threshold || i.findings.some((f) => f.severity === 'critica')
}
```

- [ ] **Step 6: Implementar `src/domain/findings.ts`**

```ts
import { isApplicable } from './scoring'
import type { AnswerValue, Flags, Group, NewFinding, Question } from './types'

export function diagnosticFindings(
  questions: Question[],
  answers: Record<string, AnswerValue>,
  flags: Partial<Flags>,
  group: Group,
): NewFinding[] {
  return questions
    .filter((q) => isApplicable(q, flags, group) && q.weight >= 2)
    .filter((q) => answers[q.id] === 'no' || answers[q.id] === 'nose')
    .sort((a, b) => b.weight - a.weight || a.order - b.order)
    .map((q): NewFinding => ({
      source: 'diagnostico',
      title: q.gap,
      detail: answers[q.id] === 'nose' ? 'La empresa no sabe si lo cumple.' : 'La empresa indica que no lo cumple.',
      niifSection: q.niifSection,
      severity: q.weight >= 3 ? 'alta' : 'media',
      recommendation: q.fix,
      lesson: q.lesson,
    }))
}
```

- [ ] **Step 7: Implementar `src/domain/flow.ts`**

```ts
import { isApplicable } from './scoring'
import type { AnswerValue, Flag, Flags, Group, Question } from './types'

export const FLAG_QUESTIONS: { key: Flag; text: string }[] = [
  { key: 'tieneEEFF', text: '¿Tiene estados financieros del último cierre contable?' },
  { key: 'inventarios', text: '¿Maneja inventarios?' },
  { key: 'activosFijos', text: '¿Tiene activos fijos como maquinaria, vehículos, equipos o inmuebles?' },
  { key: 'arrendamientos', text: '¿Tiene contratos de arriendo o leasing?' },
  { key: 'financiamiento', text: '¿Tiene préstamos o cuentas por cobrar a clientes?' },
  { key: 'empleados', text: '¿Tiene empleados con contrato laboral?' },
]

export type Step =
  | { kind: 'flag'; flag: Flag; text: string; position: number; total: number }
  | { kind: 'question'; question: Question; position: number; total: number }
  | { kind: 'done' }

function applicableInOrder(questions: Question[], flags: Partial<Flags>, group: Group) {
  return questions.filter((q) => isApplicable(q, flags, group)).sort((a, b) => a.order - b.order)
}

export function nextStep(
  questions: Question[],
  flags: Partial<Flags>,
  answers: Record<string, AnswerValue>,
  group: Group,
): Step {
  const fi = FLAG_QUESTIONS.findIndex((f) => flags[f.key] === undefined)
  if (fi >= 0) {
    const f = FLAG_QUESTIONS[fi]
    return { kind: 'flag', flag: f.key, text: f.text, position: fi + 1, total: FLAG_QUESTIONS.length }
  }
  const list = applicableInOrder(questions, flags, group)
  const qi = list.findIndex((q) => answers[q.id] === undefined)
  if (qi < 0) return { kind: 'done' }
  return { kind: 'question', question: list[qi], position: qi + 1, total: list.length }
}

export function previousTarget(
  questions: Question[],
  flags: Partial<Flags>,
  answers: Record<string, AnswerValue>,
  group: Group,
): { kind: 'answer'; questionId: string } | { kind: 'flag'; flag: Flag } | null {
  const answered = applicableInOrder(questions, flags, group).filter((q) => answers[q.id] !== undefined)
  if (answered.length > 0) return { kind: 'answer', questionId: answered[answered.length - 1].id }
  const lastFlag = [...FLAG_QUESTIONS].reverse().find((f) => flags[f.key] !== undefined)
  return lastFlag ? { kind: 'flag', flag: lastFlag.key } : null
}
```

- [ ] **Step 8: Ejecutar y verificar que pasan**

Run: `npx vitest run src/domain`
Expected: PASS (todas).

- [ ] **Step 9: Commit**

```bash
git add src/domain
git commit -m "feat(dominio): índice CRECE, derivación, hallazgos y flujo del diagnóstico"
```

---

### Task 4: Chequeos determinísticos e indicadores financieros

**Files:**
- Create: `src/ai/schemas.ts`, `src/domain/fixtures.ts`, `src/domain/checks.ts`, `src/domain/ratios.ts`
- Test: `src/domain/checks.test.ts`, `src/domain/ratios.test.ts`

**Interfaces:**
- Produces:
  - `healthyExtracted: Extracted` (fixture en `src/domain/fixtures.ts`)
  - `extractedSchema` (Zod) y `type Extracted`, `type Period`, `judgeSchema` y `type AiFinding`
  - `runChecks(e: Extracted, group: Group): NewFinding[]`
  - `type Ratios = { currentRatio; quickRatio; debtRatio; netMargin; roa }` (todos `number | null`), `computeRatios(p: Period): Ratios`, `RATIO_LABELS: { key: keyof Ratios; label: string; percent: boolean }[]`

- [ ] **Step 1: `src/ai/schemas.ts`**

```ts
import { z } from 'zod'

const money = z.number().nullable()

export const periodSchema = z.object({
  label: z.string().describe('Año o fecha de corte, p. ej. "2025"'),
  totalAssets: money,
  currentAssets: money,
  nonCurrentAssets: money,
  totalLiabilities: money,
  currentLiabilities: money,
  nonCurrentLiabilities: money,
  equity: money,
  cash: money.describe('Efectivo y equivalentes al cierre'),
  inventories: money,
  revenue: money.describe('Ingresos de actividades ordinarias'),
  netIncome: money.describe('Resultado del ejercicio'),
})

export const extractedSchema = z.object({
  statements: z.object({
    esf: z.boolean().describe('Estado de situación financiera / balance general'),
    eri: z.boolean().describe('Estado de resultados (integral)'),
    flujo: z.boolean().describe('Estado de flujos de efectivo'),
    patrimonio: z.boolean().describe('Estado de cambios en el patrimonio'),
    notas: z.boolean().describe('Notas a los estados financieros'),
  }),
  periods: z.array(periodSchema).min(1).describe('Del más reciente al más antiguo'),
  cashFlow: z
    .object({
      openingCash: money,
      operating: money,
      investing: money,
      financing: money,
      closingCash: money,
    })
    .nullable()
    .describe('Del período más reciente; null si no hay flujo de efectivo'),
  currency: z.string().nullable(),
})

export const judgeSchema = z.object({
  findings: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        niifSection: z.string().describe('p. ej. "Sección 13"'),
        severity: z.enum(['critica', 'alta', 'media', 'baja']),
        recommendation: z.string(),
      }),
    )
    .max(8),
})

export type Extracted = z.infer<typeof extractedSchema>
export type Period = z.infer<typeof periodSchema>
export type AiFinding = z.infer<typeof judgeSchema>['findings'][number]
```

- [ ] **Step 2: Datos de ejemplo compartidos** — `src/domain/fixtures.ts` (lo usan las pruebas y el analista simulado de la Task 10)

```ts
import type { Extracted } from '@/ai/schemas'

const M = 1_000_000

export const healthyExtracted: Extracted = {
  statements: { esf: true, eri: true, flujo: true, patrimonio: true, notas: true },
  periods: [
    { label: '2025', totalAssets: 1000 * M, currentAssets: 600 * M, nonCurrentAssets: 400 * M, totalLiabilities: 450 * M, currentLiabilities: 300 * M, nonCurrentLiabilities: 150 * M, equity: 550 * M, cash: 120 * M, inventories: 200 * M, revenue: 1500 * M, netIncome: 90 * M },
    { label: '2024', totalAssets: 900 * M, currentAssets: 550 * M, nonCurrentAssets: 350 * M, totalLiabilities: 420 * M, currentLiabilities: 280 * M, nonCurrentLiabilities: 140 * M, equity: 480 * M, cash: 100 * M, inventories: 180 * M, revenue: 1300 * M, netIncome: 70 * M },
  ],
  cashFlow: { openingCash: 100 * M, operating: 60 * M, investing: -30 * M, financing: -10 * M, closingCash: 120 * M },
  currency: 'COP',
}
```

- [ ] **Step 3: Pruebas que fallan** — `src/domain/checks.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { runChecks } from './checks'
import { healthyExtracted as healthy } from './fixtures'
import type { Extracted } from '@/ai/schemas'

const M = 1_000_000

const titles = (e: Extracted, g: 1 | 2 | 3 = 2) => runChecks(e, g).map((f) => f.title)

describe('runChecks', () => {
  it('no genera hallazgos para estados sanos', () => {
    expect(runChecks(healthy, 2)).toEqual([])
  })

  it('detecta balance descuadrado como crítico', () => {
    const e = structuredClone(healthy)
    e.periods[0].equity = 500 * M
    const f = runChecks(e, 2)
    expect(f[0]).toMatchObject({ severity: 'critica', source: 'chequeo', niifSection: 'Sección 4' })
  })

  it('detecta estados obligatorios faltantes según grupo', () => {
    const e = structuredClone(healthy)
    e.statements.flujo = false
    e.cashFlow = null
    expect(titles(e, 2)).toContain('Falta el estado de flujos de efectivo')
    expect(titles(e, 3)).not.toContain('Falta el estado de flujos de efectivo')
  })

  it('detecta falta de comparativo', () => {
    const e = structuredClone(healthy)
    e.periods = [e.periods[0]]
    expect(titles(e)).toContain('No presenta información comparativa')
  })

  it('detecta subtotales que no suman', () => {
    const e = structuredClone(healthy)
    e.periods[0].currentAssets = 500 * M
    expect(titles(e)).toContain('Los subtotales del activo no suman el total')
  })

  it('detecta efectivo inconsistente y flujo que no cuadra', () => {
    const e = structuredClone(healthy)
    e.cashFlow!.closingCash = 130 * M
    const t = titles(e)
    expect(t).toContain('El efectivo del flujo no coincide con el del balance')
    expect(t).toContain('El flujo de efectivo no cuadra')
  })

  it('omite chequeos cuando faltan cifras', () => {
    const e = structuredClone(healthy)
    e.periods[0].totalAssets = null
    e.periods[0].currentAssets = null
    expect(runChecks(e, 2)).toEqual([])
  })
})
```

`src/domain/ratios.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeRatios } from './ratios'
import { healthyExtracted as healthy } from './fixtures'

describe('computeRatios', () => {
  it('calcula indicadores del período más reciente', () => {
    expect(computeRatios(healthy.periods[0])).toEqual({
      currentRatio: 2,
      quickRatio: 1.33,
      debtRatio: 0.45,
      netMargin: 0.06,
      roa: 0.09,
    })
  })

  it('devuelve null si falta el denominador o el dato', () => {
    const r = computeRatios({ ...healthy.periods[0], currentLiabilities: 0, inventories: null, revenue: null })
    expect(r.currentRatio).toBeNull()
    expect(r.quickRatio).toBeNull()
    expect(r.netMargin).toBeNull()
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que fallan**

Run: `npx vitest run src/domain/checks.test.ts src/domain/ratios.test.ts`
Expected: FAIL — `./checks` y `./ratios` no existen.

- [ ] **Step 5: Implementar `src/domain/checks.ts`**

```ts
import type { Extracted } from '@/ai/schemas'
import type { Group, NewFinding, Severity } from './types'

const TOLERANCE = 0.005

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > TOLERANCE * Math.max(Math.abs(a), Math.abs(b), 1)
}

const fmt = (v: number) => v.toLocaleString('es-CO', { maximumFractionDigits: 0 })

function f(
  severity: Severity,
  title: string,
  detail: string,
  niifSection: string,
  recommendation: string,
  lesson: string,
): NewFinding {
  return { source: 'chequeo', severity, title, detail, niifSection, recommendation, lesson }
}

const REQUIRED: { key: keyof Extracted['statements']; groups: Group[]; finding: NewFinding }[] = [
  { key: 'esf', groups: [1, 2, 3], finding: f('critica', 'Falta el estado de situación financiera', 'No se encontró en los archivos cargados.', 'Sección 4', 'Incluya el estado de situación financiera del cierre.', 'presentacion') },
  { key: 'eri', groups: [1, 2, 3], finding: f('critica', 'Falta el estado de resultados', 'No se encontró en los archivos cargados.', 'Sección 5', 'Incluya el estado de resultados del período.', 'presentacion') },
  { key: 'flujo', groups: [1, 2], finding: f('alta', 'Falta el estado de flujos de efectivo', 'Es obligatorio para su grupo.', 'Sección 7', 'Prepare el estado de flujos de efectivo por actividades.', 'flujo-efectivo') },
  { key: 'patrimonio', groups: [1, 2], finding: f('alta', 'Falta el estado de cambios en el patrimonio', 'Es obligatorio para su grupo.', 'Sección 6', 'Prepare el estado de cambios en el patrimonio.', 'presentacion') },
  { key: 'notas', groups: [1, 2, 3], finding: f('alta', 'Faltan las notas a los estados financieros', 'No se encontraron notas explicativas.', 'Sección 8', 'Redacte notas con políticas, juicios y detalle de partidas.', 'notas') },
]

export function runChecks(e: Extracted, group: Group): NewFinding[] {
  const out: NewFinding[] = []

  for (const r of REQUIRED) {
    if (r.groups.includes(group) && !e.statements[r.key]) out.push(r.finding)
  }

  const p = e.periods[0]
  if (p) {
    if (p.totalAssets !== null && p.totalLiabilities !== null && p.equity !== null) {
      const right = p.totalLiabilities + p.equity
      if (differs(p.totalAssets, right)) {
        out.push(f('critica', 'El estado de situación financiera no cuadra', `Activo ${fmt(p.totalAssets)} frente a pasivo más patrimonio ${fmt(right)}.`, 'Sección 4', 'Revise saldos y reclasificaciones hasta que activo = pasivo + patrimonio.', 'presentacion'))
      }
    }
    if (p.totalAssets !== null && p.currentAssets !== null && p.nonCurrentAssets !== null && differs(p.totalAssets, p.currentAssets + p.nonCurrentAssets)) {
      out.push(f('media', 'Los subtotales del activo no suman el total', 'Corriente más no corriente difiere del total del activo.', 'Sección 4', 'Revise la clasificación corriente y no corriente.', 'presentacion'))
    }
    if (p.totalLiabilities !== null && p.currentLiabilities !== null && p.nonCurrentLiabilities !== null && differs(p.totalLiabilities, p.currentLiabilities + p.nonCurrentLiabilities)) {
      out.push(f('media', 'Los subtotales del pasivo no suman el total', 'Corriente más no corriente difiere del total del pasivo.', 'Sección 4', 'Revise la clasificación corriente y no corriente.', 'presentacion'))
    }
  }

  if (e.periods.length < 2) {
    out.push(f('media', 'No presenta información comparativa', 'Solo se encontró un período.', 'Sección 3', 'Presente las cifras del año anterior junto a las del año actual.', 'presentacion'))
  }

  const cf = e.cashFlow
  if (cf && p) {
    if (cf.closingCash !== null && p.cash !== null && differs(cf.closingCash, p.cash)) {
      out.push(f('alta', 'El efectivo del flujo no coincide con el del balance', `Flujo ${fmt(cf.closingCash)} frente a balance ${fmt(p.cash)}.`, 'Sección 7', 'Concilie el efectivo final del flujo con el estado de situación financiera.', 'flujo-efectivo'))
    }
    if (cf.openingCash !== null && cf.operating !== null && cf.investing !== null && cf.financing !== null && cf.closingCash !== null) {
      const computed = cf.openingCash + cf.operating + cf.investing + cf.financing
      if (differs(computed, cf.closingCash)) {
        out.push(f('alta', 'El flujo de efectivo no cuadra', `Efectivo inicial más flujos da ${fmt(computed)}, pero el final reportado es ${fmt(cf.closingCash)}.`, 'Sección 7', 'Revise la suma de actividades de operación, inversión y financiación.', 'flujo-efectivo'))
      }
    }
  }

  return out
}
```

- [ ] **Step 6: Implementar `src/domain/ratios.ts`**

```ts
import type { Period } from '@/ai/schemas'

export type Ratios = {
  currentRatio: number | null
  quickRatio: number | null
  debtRatio: number | null
  netMargin: number | null
  roa: number | null
}

export const RATIO_LABELS: { key: keyof Ratios; label: string; percent: boolean }[] = [
  { key: 'currentRatio', label: 'Razón corriente', percent: false },
  { key: 'quickRatio', label: 'Prueba ácida', percent: false },
  { key: 'debtRatio', label: 'Endeudamiento', percent: true },
  { key: 'netMargin', label: 'Margen neto', percent: true },
  { key: 'roa', label: 'Rentabilidad del activo', percent: true },
]

function div(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null
  return Math.round((a / b) * 100) / 100
}

export function computeRatios(p: Period): Ratios {
  return {
    currentRatio: div(p.currentAssets, p.currentLiabilities),
    quickRatio: p.inventories === null || p.currentAssets === null ? null : div(p.currentAssets - p.inventories, p.currentLiabilities),
    debtRatio: div(p.totalLiabilities, p.totalAssets),
    netMargin: div(p.netIncome, p.revenue),
    roa: div(p.netIncome, p.totalAssets),
  }
}
```

- [ ] **Step 7: Ejecutar y verificar que pasan**

Run: `npx vitest run src/domain`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/ai/schemas.ts src/domain
git commit -m "feat(dominio): chequeos determinísticos e indicadores financieros"
```

---

### Task 5: Agenda (franjas), invitación .ics, fechas, catálogo de la Academia y ruta de aprendizaje

**Files:**
- Create: `src/domain/dates.ts`, `src/domain/slots.ts`, `src/domain/ics.ts`, `src/academia/lessons.ts`, `src/domain/learning-path.ts`
- Test: `src/domain/slots.test.ts`, `src/domain/ics.test.ts`, `src/domain/learning-path.test.ts`

**Interfaces:**
- Produces:
  - `BOGOTA_OFFSET_MIN = -300`, `formatDateTime(d: Date): string`, `formatDay(d: Date): string`, `formatTime(d: Date): string`, `localDayKey(d: Date, offsetMin?: number): string` (`YYYY-MM-DD`)
  - `type AvailabilityRule = { consultantId: string; weekday: number; startMinute: number; endMinute: number }`, `type Busy = { consultantId: string; startsAt: Date; endsAt: Date }`, `type Slot = { consultantId: string; startsAt: Date }`
  - `availableSlots(i: { rules: AvailabilityRule[]; busy: Busy[]; now: Date; days: number; durationMin: number; offsetMin: number; minNoticeMin?: number }): Slot[]`
  - `uniqueTimes(slots: Slot[]): Date[]` (una entrada por hora aunque haya varios consultores)
  - `buildIcs(e: { uid: string; start: Date; end: Date; summary: string; description: string }): string`
  - `type LessonMeta = { slug: string; title: string; sections: number[]; minutes: number }`, `LESSONS: LessonMeta[]`, `getLesson(slug): LessonMeta | undefined`
  - `learningPath(findings: { lesson: string | null; severity: Severity }[], lessons: LessonMeta[]): LessonMeta[]`, `lessonForSection(section: string, lessons: LessonMeta[]): string | null`

- [ ] **Step 1: `src/domain/dates.ts`**

```ts
export const BOGOTA_OFFSET_MIN = -300
const TZ = 'America/Bogota'

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, dateStyle: 'full', timeStyle: 'short' }).format(d)
}

export function formatDay(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d)
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d)
}

export function localDayKey(d: Date, offsetMin = BOGOTA_OFFSET_MIN): string {
  return new Date(d.getTime() + offsetMin * 60_000).toISOString().slice(0, 10)
}
```

- [ ] **Step 2: Pruebas que fallan** — `src/domain/slots.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { availableSlots, uniqueTimes } from './slots'

// Lunes 21 sep 2026, 08:00 en Bogotá = 13:00 UTC
const now = new Date('2026-09-21T13:00:00Z')
const rules = [{ consultantId: 'c1', weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60 }]

describe('availableSlots', () => {
  it('genera franjas y exige 2 horas de anticipación', () => {
    const s = availableSlots({ rules, busy: [], now, days: 1, durationMin: 60, offsetMin: -300 })
    // 9:00 y 10:00 están a menos de 2 h; solo queda 11:00 (16:00 UTC)
    expect(s.map((x) => x.startsAt.toISOString())).toEqual(['2026-09-21T16:00:00.000Z'])
  })

  it('incluye la semana siguiente y excluye franjas ocupadas', () => {
    const busy = [{ consultantId: 'c1', startsAt: new Date('2026-09-28T14:00:00Z'), endsAt: new Date('2026-09-28T15:00:00Z') }]
    const s = availableSlots({ rules, busy, now, days: 8, durationMin: 60, offsetMin: -300 })
    expect(s.map((x) => x.startsAt.toISOString())).toEqual([
      '2026-09-21T16:00:00.000Z',
      '2026-09-28T15:00:00.000Z',
      '2026-09-28T16:00:00.000Z',
    ])
  })

  it('uniqueTimes deduplica horas con varios consultores', () => {
    const two = [...rules, { ...rules[0], consultantId: 'c2' }]
    const s = availableSlots({ rules: two, busy: [], now, days: 1, durationMin: 60, offsetMin: -300 })
    expect(s).toHaveLength(2)
    expect(uniqueTimes(s)).toHaveLength(1)
  })
})
```

`src/domain/ics.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildIcs } from './ics'

describe('buildIcs', () => {
  it('genera un evento válido con fechas UTC y texto escapado', () => {
    const ics = buildIcs({
      uid: 'abc',
      start: new Date('2026-09-28T15:00:00Z'),
      end: new Date('2026-09-28T16:00:00Z'),
      summary: 'Consulta NIIF, CRECE',
      description: 'Línea 1\nLínea 2',
    })
    expect(ics).toContain('BEGIN:VCALENDAR\r\n')
    expect(ics).toContain('DTSTART:20260928T150000Z')
    expect(ics).toContain('DTEND:20260928T160000Z')
    expect(ics).toContain('SUMMARY:Consulta NIIF\\, CRECE')
    expect(ics).toContain('DESCRIPTION:Línea 1\\nLínea 2')
    expect(ics).toContain('UID:abc@crece')
  })
})
```

`src/domain/learning-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { learningPath, lessonForSection } from './learning-path'
import { LESSONS } from '@/academia/lessons'

describe('learningPath', () => {
  it('ordena por severidad y elimina duplicados', () => {
    const path = learningPath(
      [
        { lesson: 'notas', severity: 'media' },
        { lesson: 'inventarios', severity: 'critica' },
        { lesson: 'notas', severity: 'alta' },
        { lesson: null, severity: 'alta' },
        { lesson: 'no-existe', severity: 'alta' },
      ],
      LESSONS,
    )
    expect(path.map((l) => l.slug)).toEqual(['inventarios', 'notas'])
  })
})

describe('lessonForSection', () => {
  it('encuentra la guía por número de sección', () => {
    expect(lessonForSection('Sección 13', LESSONS)).toBe('inventarios')
    expect(lessonForSection('Sección 4', LESSONS)).toBe('presentacion')
    expect(lessonForSection('Control interno', LESSONS)).toBeNull()
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que fallan**

Run: `npx vitest run src/domain`
Expected: FAIL — `./slots`, `./ics`, `./learning-path`, `@/academia/lessons` no existen.

- [ ] **Step 4: Implementar `src/domain/slots.ts`**

```ts
export type AvailabilityRule = { consultantId: string; weekday: number; startMinute: number; endMinute: number }
export type Busy = { consultantId: string; startsAt: Date; endsAt: Date }
export type Slot = { consultantId: string; startsAt: Date }

const DAY = 86_400_000
const MIN = 60_000

export function availableSlots(i: {
  rules: AvailabilityRule[]
  busy: Busy[]
  now: Date
  days: number
  durationMin: number
  offsetMin: number
  minNoticeMin?: number
}): Slot[] {
  const notice = (i.minNoticeMin ?? 120) * MIN
  const nowLocal = new Date(i.now.getTime() + i.offsetMin * MIN)
  const firstDay = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate())
  const out: Slot[] = []

  for (let d = 0; d < i.days; d++) {
    const dayLocal = firstDay + d * DAY
    const weekday = new Date(dayLocal).getUTCDay()
    for (const r of i.rules) {
      if (r.weekday !== weekday) continue
      for (let m = r.startMinute; m + i.durationMin <= r.endMinute; m += i.durationMin) {
        const start = dayLocal + m * MIN - i.offsetMin * MIN
        if (start <= i.now.getTime() + notice) continue
        const end = start + i.durationMin * MIN
        const taken = i.busy.some(
          (b) => b.consultantId === r.consultantId && b.startsAt.getTime() < end && b.endsAt.getTime() > start,
        )
        if (!taken) out.push({ consultantId: r.consultantId, startsAt: new Date(start) })
      }
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function uniqueTimes(slots: Slot[]): Date[] {
  const seen = new Set<number>()
  const out: Date[] = []
  for (const s of slots) {
    const t = s.startsAt.getTime()
    if (!seen.has(t)) {
      seen.add(t)
      out.push(s.startsAt)
    }
  }
  return out
}
```

- [ ] **Step 5: Implementar `src/domain/ics.ts`**

```ts
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function buildIcs(e: { uid: string; start: Date; end: Date; summary: string; description: string }): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRECE//Consulta NIIF//ES',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@crece`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
```

- [ ] **Step 6: `src/academia/lessons.ts`**

```ts
export type LessonMeta = { slug: string; title: string; sections: number[]; minutes: number }

export const LESSONS: LessonMeta[] = [
  { slug: 'presentacion', title: 'Estados financieros completos', sections: [3, 4, 5, 6], minutes: 5 },
  { slug: 'flujo-efectivo', title: 'Estado de flujos de efectivo', sections: [7], minutes: 4 },
  { slug: 'notas', title: 'Notas a los estados financieros', sections: [8], minutes: 4 },
  { slug: 'politicas', title: 'Políticas, estimaciones y errores', sections: [10], minutes: 4 },
  { slug: 'instrumentos-financieros', title: 'Cartera, préstamos e instrumentos básicos', sections: [11, 12], minutes: 5 },
  { slug: 'inventarios', title: 'Inventarios', sections: [13], minutes: 4 },
  { slug: 'propiedad-planta-equipo', title: 'Propiedades, planta y equipo', sections: [17], minutes: 5 },
  { slug: 'arrendamientos', title: 'Arrendamientos', sections: [20], minutes: 4 },
  { slug: 'provisiones', title: 'Provisiones y contingencias', sections: [21], minutes: 4 },
  { slug: 'ingresos', title: 'Ingresos de actividades ordinarias', sections: [23], minutes: 4 },
  { slug: 'deterioro', title: 'Deterioro del valor de los activos', sections: [27], minutes: 4 },
  { slug: 'beneficios-empleados', title: 'Beneficios a los empleados', sections: [28], minutes: 3 },
  { slug: 'impuesto-ganancias', title: 'Impuesto a las ganancias', sections: [29], minutes: 5 },
  { slug: 'hechos-posteriores', title: 'Hechos posteriores al cierre', sections: [32], minutes: 3 },
  { slug: 'partes-relacionadas', title: 'Partes relacionadas', sections: [33], minutes: 3 },
  { slug: 'cierre-contable', title: 'Un cierre contable ordenado', sections: [], minutes: 4 },
  { slug: 'glosario', title: 'Glosario', sections: [], minutes: 3 },
]

export function getLesson(slug: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.slug === slug)
}
```

- [ ] **Step 7: Implementar `src/domain/learning-path.ts`**

```ts
import type { LessonMeta } from '@/academia/lessons'
import { SEVERITY_ORDER } from './types'
import type { Severity } from './types'

export function learningPath(findings: { lesson: string | null; severity: Severity }[], lessons: LessonMeta[]): LessonMeta[] {
  const ordered = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
  const seen = new Set<string>()
  const out: LessonMeta[] = []
  for (const f of ordered) {
    if (!f.lesson || seen.has(f.lesson)) continue
    const lesson = lessons.find((l) => l.slug === f.lesson)
    if (!lesson) continue
    seen.add(f.lesson)
    out.push(lesson)
  }
  return out
}

export function lessonForSection(section: string, lessons: LessonMeta[]): string | null {
  const m = section.match(/\d+/)
  if (!m) return null
  const n = Number(m[0])
  return lessons.find((l) => l.sections.includes(n))?.slug ?? null
}
```

- [ ] **Step 8: Ejecutar y verificar que pasan**

Run: `npx vitest run src/domain`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain src/academia/lessons.ts
git commit -m "feat(dominio): franjas de agenda, invitación ics y ruta de aprendizaje"
```

---
### Task 6: Base de datos (esquema, migraciones, banco de preguntas, semilla, ajustes)

**Files:**
- Create: `drizzle.config.ts`, `src/db/client.ts`, `src/db/index.ts`, `src/db/schema.ts`, `src/db/questions.ts`, `src/db/seed-data.ts`, `src/db/seed.ts`, `src/db/migrate.ts`, `src/test/db.ts`, `src/services/settings.ts`, `src/services/users.ts`
- Create (generado): `drizzle/*.sql`
- Test: `src/db/db.test.ts`

**Interfaces:**
- Consumes: tipos de `src/domain/types.ts`, `Settings`/`mergeSettings`, `ClassificationInput`, `Extracted`, `Ratios`.
- Produces:
  - `createDb(url: string, authToken?: string)` y `type Db` en `@/db/client`; singleton `db` en `@/db`
  - Tablas: `user, session, account, verification, company, companyMember, consultation, question, answer, upload, analysis, finding, availability, appointment, lessonProgress, setting, auditLog`
  - Tipos: `ConsultationStatus = 'clasificar'|'revisar'|'examinar'|'resultado'`, `AnalysisStatus = 'pendiente'|'procesando'|'listo'|'error'`, `AppointmentStatus = 'reservada'|'cancelada'|'realizada'`
  - `QUESTION_BANK: Omit<Question, 'active'>[]` (32 preguntas)
  - `seedDatabase(db: Db, opts?: { admin?: { email; password }; demoConsultant?: boolean }): Promise<void>` (idempotente), `DEMO_ADMIN`, `DEMO_CONSULTANT`
  - `getSettings(db): Promise<Settings>`, `saveSettings(db, s: Settings): Promise<void>`
  - `createUserWithPassword(db, i: { email: string; name: string; role: Role; password: string }): Promise<string>`, `getUserRole(db, userId): Promise<Role>`
  - `makeTestDb(): Promise<Db>` (SQLite temporal ya migrado)

- [ ] **Step 1: `drizzle.config.ts`**

```ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
})
```

- [ ] **Step 2: `src/db/schema.ts`**

```ts
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Extracted } from '@/ai/schemas'
import type { ClassificationInput } from '@/domain/classify'
import type { Ratios } from '@/domain/ratios'
import type { AnswerValue, Dimension, FindingSource, Flag, Flags, Group, Role, Severity } from '@/domain/types'

export type ConsultationStatus = 'clasificar' | 'revisar' | 'examinar' | 'resultado'
export type AnalysisStatus = 'pendiente' | 'procesando' | 'listo' | 'error'
export type AppointmentStatus = 'reservada' | 'cancelada' | 'realizada'

const ts = (name: string) => integer(name, { mode: 'timestamp_ms' })
const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const createdAt = () => ts('created_at').notNull().$defaultFn(() => new Date())

// ── Better Auth ────────────────────────────────────────────────
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  role: text('role').$type<Role>().notNull().default('empresa'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: ts('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: ts('access_token_expires_at'),
  refreshTokenExpiresAt: ts('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

// ── Empresas ───────────────────────────────────────────────────
export const company = sqliteTable('company', {
  id: uuid(),
  nit: text('nit').notNull(),
  name: text('name').notNull(),
  country: text('country').notNull().default('CO'),
  consentAt: ts('consent_at').notNull(),
  createdAt: createdAt(),
})

export const companyMember = sqliteTable(
  'company_member',
  {
    companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.userId] })],
)

// ── Consulta ───────────────────────────────────────────────────
export const consultation = sqliteTable(
  'consultation',
  {
    id: uuid(),
    companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
    status: text('status').$type<ConsultationStatus>().notNull().default('clasificar'),
    group: integer('niif_group').$type<Group>(),
    groupReason: text('group_reason'),
    classificationInput: text('classification_input', { mode: 'json' }).$type<ClassificationInput>(),
    flags: text('flags', { mode: 'json' }).$type<Partial<Flags>>().notNull().$defaultFn(() => ({})),
    diagnosticScore: real('diagnostic_score'),
    analysisScore: real('analysis_score'),
    finalScore: real('final_score'),
    needsConsultant: integer('needs_consultant', { mode: 'boolean' }),
    createdAt: createdAt(),
    completedAt: ts('completed_at'),
  },
  (t) => [index('consultation_company_idx').on(t.companyId)],
)

export const question = sqliteTable('question', {
  id: text('id').primaryKey(),
  dimension: text('dimension').$type<Dimension>().notNull(),
  text: text('text').notNull(),
  help: text('help').notNull(),
  gap: text('gap').notNull(),
  fix: text('fix').notNull(),
  weight: integer('weight').notNull(),
  requiresFlag: text('requires_flag').$type<Flag>(),
  groups: text('groups', { mode: 'json' }).$type<Group[]>().notNull(),
  niifSection: text('niif_section').notNull(),
  lesson: text('lesson').notNull(),
  order: integer('sort_order').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
})

export const answer = sqliteTable(
  'answer',
  {
    consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
    value: text('value').$type<AnswerValue>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.consultationId, t.questionId] })],
)

export const upload = sqliteTable('upload', {
  id: uuid(),
  consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: createdAt(),
})

export const analysis = sqliteTable('analysis', {
  id: uuid(),
  consultationId: text('consultation_id').notNull().unique().references(() => consultation.id, { onDelete: 'cascade' }),
  status: text('status').$type<AnalysisStatus>().notNull().default('pendiente'),
  extracted: text('extracted', { mode: 'json' }).$type<Extracted>(),
  ratios: text('ratios', { mode: 'json' }).$type<Ratios>(),
  error: text('error'),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

export const finding = sqliteTable(
  'finding',
  {
    id: uuid(),
    consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
    source: text('source').$type<FindingSource>().notNull(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    niifSection: text('niif_section').notNull(),
    severity: text('severity').$type<Severity>().notNull(),
    recommendation: text('recommendation').notNull(),
    lesson: text('lesson'),
  },
  (t) => [index('finding_consultation_idx').on(t.consultationId)],
)

// ── Agenda ─────────────────────────────────────────────────────
export const availability = sqliteTable('availability', {
  id: uuid(),
  consultantId: text('consultant_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
})

export const appointment = sqliteTable(
  'appointment',
  {
    id: uuid(),
    consultantId: text('consultant_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
    consultationId: text('consultation_id').references(() => consultation.id, { onDelete: 'set null' }),
    startsAt: ts('starts_at').notNull(),
    endsAt: ts('ends_at').notNull(),
    status: text('status').$type<AppointmentStatus>().notNull().default('reservada'),
    notes: text('notes'),
    remindedAt: ts('reminded_at'),
    createdAt: createdAt(),
  },
  (t) => [index('appointment_consultant_idx').on(t.consultantId, t.startsAt)],
)

// ── Academia, ajustes y auditoría ──────────────────────────────
export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    lessonSlug: text('lesson_slug').notNull(),
    completedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })],
)

export const setting = sqliteTable('setting', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
})

export const auditLog = sqliteTable('audit_log', {
  id: uuid(),
  userId: text('user_id'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  at: ts('at').notNull().$defaultFn(() => new Date()),
})
```

- [ ] **Step 3: Cliente de BD**

`src/db/client.ts`:

```ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export function createDb(url: string, authToken?: string) {
  return drizzle({ client: createClient({ url, authToken: authToken || undefined }), schema })
}

export type Db = ReturnType<typeof createDb>
```

`src/db/index.ts`:

```ts
import { createDb, type Db } from './client'

const globalForDb = globalThis as unknown as { crecDb?: Db }

export const db: Db =
  globalForDb.crecDb ?? createDb(process.env.DATABASE_URL ?? 'file:local.db', process.env.DATABASE_AUTH_TOKEN)

if (process.env.NODE_ENV !== 'production') globalForDb.crecDb = db

export type { Db }
```

- [ ] **Step 4: Generar la migración inicial**

Run: `npm run db:generate`
Expected: se crea `drizzle/0000_*.sql` con las 17 tablas.

- [ ] **Step 5: `src/db/questions.ts`** (banco de preguntas)

```ts
import type { Question } from '@/domain/types'

type Q = Omit<Question, 'active'>
const ALL: Q['groups'] = [1, 2, 3]

export const QUESTION_BANK: Q[] = [
  // D1 · Estados financieros
  { id: 'd1-esf', dimension: 'D1', order: 10, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Sección 4', lesson: 'presentacion',
    text: '¿Prepara el estado de situación financiera (balance general) al cierre de cada año?',
    help: 'Muestra lo que la empresa tiene, lo que debe y su patrimonio en una fecha.',
    gap: 'No prepara el estado de situación financiera',
    fix: 'Prepare el estado de situación financiera al cierre, separando partidas corrientes y no corrientes.' },
  { id: 'd1-eri', dimension: 'D1', order: 20, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Sección 5', lesson: 'presentacion',
    text: '¿Prepara el estado de resultados del año?',
    help: 'Muestra ingresos, costos, gastos y la utilidad o pérdida del período.',
    gap: 'No prepara el estado de resultados',
    fix: 'Prepare el estado de resultados del período con ingresos, costos y gastos.' },
  { id: 'd1-flujo', dimension: 'D1', order: 30, weight: 2, requiresFlag: null, groups: [1, 2], niifSection: 'Sección 7', lesson: 'flujo-efectivo',
    text: '¿Prepara el estado de flujos de efectivo?',
    help: 'Explica de dónde vino y en qué se usó el efectivo: operación, inversión y financiación.',
    gap: 'No prepara el estado de flujos de efectivo',
    fix: 'Prepare el estado de flujos de efectivo por el método indirecto, a partir del balance y el estado de resultados.' },
  { id: 'd1-patrimonio', dimension: 'D1', order: 40, weight: 2, requiresFlag: null, groups: [1, 2], niifSection: 'Sección 6', lesson: 'presentacion',
    text: '¿Prepara el estado de cambios en el patrimonio?',
    help: 'Muestra cómo cambiaron el capital, las reservas y las utilidades acumuladas.',
    gap: 'No prepara el estado de cambios en el patrimonio',
    fix: 'Prepare el estado de cambios en el patrimonio con los movimientos de cada componente.' },
  { id: 'd1-notas', dimension: 'D1', order: 50, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Sección 8', lesson: 'notas',
    text: '¿Sus estados financieros incluyen notas explicativas?',
    help: 'Las notas explican las políticas usadas y el detalle de las cifras.',
    gap: 'Los estados financieros no tienen notas',
    fix: 'Redacte notas con las políticas contables, los juicios y el detalle de las partidas importantes.' },
  { id: 'd1-comparativos', dimension: 'D1', order: 60, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 3', lesson: 'presentacion',
    text: '¿Presenta las cifras del año actual junto a las del año anterior?',
    help: 'La norma exige información comparativa de al menos un período anterior.',
    gap: 'No presenta información comparativa',
    fix: 'Presente cada estado con la columna del año anterior.' },
  { id: 'd1-aprobacion', dimension: 'D1', order: 70, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Sección 3', lesson: 'presentacion',
    text: '¿La asamblea o junta de socios aprueba los estados financieros?',
    help: 'La aprobación formal da validez a las cifras frente a terceros.',
    gap: 'Los estados financieros no se aprueban formalmente',
    fix: 'Presente los estados financieros para aprobación del máximo órgano social cada año.' },

  // D2 · Políticas contables
  { id: 'd2-manual', dimension: 'D2', order: 110, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Sección 10', lesson: 'politicas',
    text: '¿Tiene un manual de políticas contables por escrito?',
    help: 'Define cómo la empresa reconoce y mide cada partida bajo NIIF.',
    gap: 'No tiene manual de políticas contables',
    fix: 'Redacte un manual de políticas contables basado en las secciones que aplican a su empresa.' },
  { id: 'd2-aprobado', dimension: 'D2', order: 120, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Sección 10', lesson: 'politicas',
    text: '¿La gerencia o la junta aprobó ese manual?',
    help: 'Si no tiene manual, responda No.',
    gap: 'El manual de políticas no está aprobado',
    fix: 'Someta el manual a aprobación de la gerencia o la junta.' },
  { id: 'd2-aplicado', dimension: 'D2', order: 130, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 10', lesson: 'politicas',
    text: '¿El equipo contable aplica las políticas en el día a día?',
    help: 'Un manual que no se usa no cambia las cifras.',
    gap: 'Las políticas no se aplican en la práctica',
    fix: 'Capacite al equipo y revise en cada cierre que los registros sigan las políticas.' },
  { id: 'd2-actualizado', dimension: 'D2', order: 140, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Sección 10', lesson: 'politicas',
    text: '¿Actualiza las políticas cuando cambian las normas o el negocio?',
    help: 'Por ejemplo, al empezar a manejar inventarios o a tomar un leasing.',
    gap: 'Las políticas no se actualizan',
    fix: 'Revise el manual al menos una vez al año.' },
  { id: 'd2-errores', dimension: 'D2', order: 150, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 10', lesson: 'politicas',
    text: '¿Corrige los errores de años anteriores ajustando las cifras comparativas?',
    help: 'Los errores importantes de años anteriores se corrigen hacia atrás, no contra la utilidad del año.',
    gap: 'Los errores de períodos anteriores no se corrigen de forma retroactiva',
    fix: 'Corrija los errores materiales reexpresando la información comparativa y revélelo en notas.' },

  // D3 · Reconocimiento y medición
  { id: 'd3-inv-medicion', dimension: 'D3', order: 210, weight: 3, requiresFlag: 'inventarios', groups: ALL, niifSection: 'Sección 13', lesson: 'inventarios',
    text: '¿Mide sus inventarios al menor valor entre su costo y su precio de venta menos los costos para venderlos?',
    help: 'Si un producto se venderá por menos de lo que costó, hay que reducir su valor en libros.',
    gap: 'Los inventarios no se miden al menor entre costo y precio de venta menos costos de venta',
    fix: 'Compare al cierre el costo de cada línea con su precio de venta estimado menos costos de venta y ajuste la diferencia.' },
  { id: 'd3-inv-conteo', dimension: 'D3', order: 220, weight: 2, requiresFlag: 'inventarios', groups: ALL, niifSection: 'Sección 13', lesson: 'inventarios',
    text: '¿Hace conteos físicos de inventario y ajusta las diferencias?',
    help: 'Confirma que lo registrado existe de verdad.',
    gap: 'No se hacen conteos físicos de inventario',
    fix: 'Haga al menos un conteo físico al año y registre los ajustes.' },
  { id: 'd3-ppe-vida-util', dimension: 'D3', order: 230, weight: 3, requiresFlag: 'activosFijos', groups: ALL, niifSection: 'Sección 17', lesson: 'propiedad-planta-equipo',
    text: '¿Deprecia sus activos fijos según su vida útil real y no solo según las tasas fiscales?',
    help: 'La vida útil contable refleja cuánto tiempo usará realmente el activo.',
    gap: 'La depreciación sigue tasas fiscales y no la vida útil real',
    fix: 'Estime la vida útil y el valor residual de cada grupo de activos y deprécielos con esas estimaciones.' },
  { id: 'd3-ppe-deterioro', dimension: 'D3', order: 240, weight: 2, requiresFlag: 'activosFijos', groups: ALL, niifSection: 'Sección 27', lesson: 'deterioro',
    text: '¿Revisa al cierre si algún activo perdió valor por daño, obsolescencia o poco uso?',
    help: 'Esa pérdida se llama deterioro de valor.',
    gap: 'No se evalúa el deterioro de los activos',
    fix: 'Al cierre, revise indicios de deterioro y, si existen, calcule el importe recuperable del activo.' },
  { id: 'd3-arrendamientos', dimension: 'D3', order: 250, weight: 2, requiresFlag: 'arrendamientos', groups: ALL, niifSection: 'Sección 20', lesson: 'arrendamientos',
    text: '¿Clasifica sus arriendos y leasings como financieros u operativos y los registra según esa clasificación?',
    help: 'Un leasing financiero se registra como activo y deuda, no solo como gasto mensual.',
    gap: 'Los arrendamientos no se clasifican ni registran según la norma',
    fix: 'Analice cada contrato: si transfiere los riesgos y ventajas del activo, regístrelo como activo y pasivo.' },
  { id: 'd3-cartera', dimension: 'D3', order: 260, weight: 3, requiresFlag: 'financiamiento', groups: ALL, niifSection: 'Sección 11', lesson: 'instrumentos-financieros',
    text: '¿Evalúa al cierre si hay cartera de difícil cobro y registra su deterioro?',
    help: 'Cuentas por cobrar que probablemente no se pagarán.',
    gap: 'No se registra el deterioro de la cartera',
    fix: 'Analice la cartera vencida al cierre y reconozca una pérdida por deterioro cuando haya evidencia de no pago.' },
  { id: 'd3-prestamos', dimension: 'D3', order: 270, weight: 2, requiresFlag: 'financiamiento', groups: ALL, niifSection: 'Sección 11', lesson: 'instrumentos-financieros',
    text: '¿Registra sus préstamos al costo amortizado, incluyendo intereses y costos de la operación?',
    help: 'El costo amortizado reparte intereses y comisiones a lo largo del crédito.',
    gap: 'Los préstamos no se miden al costo amortizado',
    fix: 'Calcule la tasa de interés efectiva de cada préstamo y registre los intereses con ella.' },
  { id: 'd3-ingresos', dimension: 'D3', order: 280, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Sección 23', lesson: 'ingresos',
    text: '¿Registra los ingresos cuando entrega el bien o presta el servicio, y no cuando cobra?',
    help: 'El momento del cobro no define cuándo hay ingreso.',
    gap: 'Los ingresos no se reconocen cuando se entrega el bien o servicio',
    fix: 'Registre el ingreso al transferir el bien o prestar el servicio, sin importar cuándo se cobre.' },
  { id: 'd3-impuesto-diferido', dimension: 'D3', order: 290, weight: 2, requiresFlag: null, groups: [1, 2], niifSection: 'Sección 29', lesson: 'impuesto-ganancias',
    text: '¿Calcula el impuesto diferido?',
    help: 'Surge de diferencias entre el valor contable y el valor fiscal de activos y pasivos.',
    gap: 'No se calcula el impuesto diferido',
    fix: 'Compare saldos contables y fiscales al cierre y reconozca el impuesto diferido por las diferencias temporarias.' },
  { id: 'd3-beneficios', dimension: 'D3', order: 300, weight: 2, requiresFlag: 'empleados', groups: ALL, niifSection: 'Sección 28', lesson: 'beneficios-empleados',
    text: '¿Registra al cierre las prestaciones sociales y vacaciones que debe a sus empleados?',
    help: 'Cesantías, intereses, prima y vacaciones se registran a medida que se causan.',
    gap: 'Las obligaciones laborales no se registran al cierre',
    fix: 'Consolide y registre al cierre las prestaciones y vacaciones causadas y no pagadas.' },
  { id: 'd3-provisiones', dimension: 'D3', order: 310, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 21', lesson: 'provisiones',
    text: '¿Registra provisiones por demandas, garantías u otras obligaciones probables?',
    help: 'Si no tiene ninguna, responda Sí.',
    gap: 'No se evalúan provisiones por obligaciones probables',
    fix: 'Revise al cierre los procesos y compromisos, y registre provisiones cuando el pago sea probable y medible.' },

  // D4 · Revelaciones
  { id: 'd4-politicas', dimension: 'D4', order: 410, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 8', lesson: 'notas',
    text: '¿Las notas describen las políticas contables que aplica?',
    help: 'Por ejemplo, cómo mide inventarios o cuánto dura cada tipo de activo.',
    gap: 'Las notas no describen las políticas contables',
    fix: 'Incluya una nota de políticas contables significativas.' },
  { id: 'd4-juicios', dimension: 'D4', order: 420, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 8', lesson: 'notas',
    text: '¿Revela los juicios y estimaciones importantes, como vidas útiles, deterioros y provisiones?',
    help: 'Explican las decisiones que más afectan las cifras.',
    gap: 'No se revelan juicios ni estimaciones clave',
    fix: 'Agregue una nota con los juicios y las fuentes de incertidumbre en las estimaciones.' },
  { id: 'd4-hechos', dimension: 'D4', order: 430, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Sección 32', lesson: 'hechos-posteriores',
    text: '¿Revisa y revela los hechos ocurridos después del cierre que afectan las cifras?',
    help: 'Por ejemplo, la quiebra de un cliente importante en enero.',
    gap: 'No se revisan los hechos posteriores al cierre',
    fix: 'Antes de aprobar los estados, revise hechos posteriores y ajuste o revele según corresponda.' },
  { id: 'd4-partes', dimension: 'D4', order: 440, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 33', lesson: 'partes-relacionadas',
    text: '¿Revela las operaciones con socios, sus familiares y empresas relacionadas?',
    help: 'Préstamos a socios, compras a empresas de la familia, salarios de la gerencia.',
    gap: 'No se revelan las operaciones con partes relacionadas',
    fix: 'Identifique las partes relacionadas y revele saldos, transacciones y la remuneración de la gerencia.' },

  // D5 · Cierre contable
  { id: 'd5-conciliaciones', dimension: 'D5', order: 510, weight: 3, requiresFlag: null, groups: ALL, niifSection: 'Control interno', lesson: 'cierre-contable',
    text: '¿Concilia bancos, cartera y proveedores cada mes?',
    help: 'Comparar sus registros con extractos y estados de cuenta.',
    gap: 'No se hacen conciliaciones mensuales',
    fix: 'Concilie cada mes bancos, cartera y proveedores y corrija las diferencias.' },
  { id: 'd5-cierre', dimension: 'D5', order: 520, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Control interno', lesson: 'cierre-contable',
    text: '¿Hace un cierre contable cada mes?',
    help: 'Dejar el mes cuadrado antes de empezar el siguiente.',
    gap: 'No se hace cierre contable mensual',
    fix: 'Defina un calendario de cierre mensual con responsables y fechas.' },
  { id: 'd5-software', dimension: 'D5', order: 530, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Control interno', lesson: 'cierre-contable',
    text: '¿Lleva la contabilidad en un software contable y no solo en hojas de cálculo?',
    help: 'Reduce errores y deja rastro de cada cambio.',
    gap: 'La contabilidad depende de hojas de cálculo',
    fix: 'Use un software contable con plan de cuentas bajo NIIF.' },
  { id: 'd5-fiscal', dimension: 'D5', order: 540, weight: 2, requiresFlag: null, groups: ALL, niifSection: 'Sección 29', lesson: 'impuesto-ganancias',
    text: '¿Separa la contabilidad NIIF de los ajustes para la declaración de renta?',
    help: 'Las cifras fiscales y las contables pueden ser distintas; se concilian, no se mezclan.',
    gap: 'Las cifras contables se mezclan con criterios fiscales',
    fix: 'Lleve la contabilidad bajo NIIF y prepare aparte la conciliación fiscal.' },
  { id: 'd5-soportes', dimension: 'D5', order: 550, weight: 1, requiresFlag: null, groups: ALL, niifSection: 'Control interno', lesson: 'cierre-contable',
    text: '¿Todos los registros tienen su soporte documental organizado?',
    help: 'Facturas, contratos, extractos y actas.',
    gap: 'Los registros no tienen soportes organizados',
    fix: 'Archive digitalmente el soporte de cada registro.' },
]
```

- [ ] **Step 6: Servicios de ajustes y usuarios**

`src/services/settings.ts`:

```ts
import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { setting } from '@/db/schema'
import { mergeSettings, type Settings } from '@/domain/settings'

const KEY = 'app'

export async function getSettings(db: Db): Promise<Settings> {
  const row = await db.query.setting.findFirst({ where: eq(setting.key, KEY) })
  return mergeSettings((row?.value as Partial<Settings> | undefined) ?? undefined)
}

export async function saveSettings(db: Db, s: Settings): Promise<void> {
  await db.insert(setting).values({ key: KEY, value: s }).onConflictDoUpdate({ target: setting.key, set: { value: s } })
}
```

`src/services/users.ts`:

```ts
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { account, user } from '@/db/schema'
import type { Role } from '@/domain/types'

export async function createUserWithPassword(
  db: Db,
  i: { email: string; name: string; role: Role; password: string },
): Promise<string> {
  const email = i.email.trim().toLowerCase()
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) })
  if (existing) return existing.id
  const id = crypto.randomUUID()
  const now = new Date()
  await db.insert(user).values({ id, email, name: i.name, role: i.role, emailVerified: true, createdAt: now, updatedAt: now })
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: await hashPassword(i.password),
    createdAt: now,
    updatedAt: now,
  })
  return id
}

export async function getUserRole(db: Db, userId: string): Promise<Role> {
  const u = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { role: true } })
  return u?.role ?? 'empresa'
}
```

- [ ] **Step 7: Semilla** — `src/db/seed-data.ts`

```ts
import { eq } from 'drizzle-orm'
import type { Db } from './client'
import { availability, question, setting } from './schema'
import { QUESTION_BANK } from './questions'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { createUserWithPassword } from '@/services/users'

export const DEMO_ADMIN = { email: 'admin@crece.local', password: 'Admin12345!' }
export const DEMO_CONSULTANT = { email: 'consultor@crece.local', password: 'Consultor123!' }

export type SeedOptions = {
  admin?: { email: string; password: string }
  demoConsultant?: boolean
}

export async function seedDatabase(db: Db, opts: SeedOptions = {}): Promise<void> {
  for (const q of QUESTION_BANK) {
    const { id: _id, ...rest } = q
    await db.insert(question).values({ ...q, active: true }).onConflictDoUpdate({ target: question.id, set: rest })
  }

  await db.insert(setting).values({ key: 'app', value: DEFAULT_SETTINGS }).onConflictDoNothing()

  await createUserWithPassword(db, { ...(opts.admin ?? DEMO_ADMIN), name: 'Administración CRECE', role: 'admin' })
  if (opts.demoConsultant === false) return

  const consultantId = await createUserWithPassword(db, { ...DEMO_CONSULTANT, name: 'Laura Consultora', role: 'consultor' })

  const hasRules = await db.query.availability.findFirst({ where: eq(availability.consultantId, consultantId) })
  if (!hasRules) {
    const rules = [1, 2, 3, 4, 5].flatMap((weekday) => [
      { consultantId, weekday, startMinute: 8 * 60, endMinute: 12 * 60 },
      { consultantId, weekday, startMinute: 14 * 60, endMinute: 17 * 60 },
    ])
    await db.insert(availability).values(rules)
  }
}
```

`src/db/seed.ts`:

```ts
import 'dotenv/config'
import { db } from './index'
import { DEMO_ADMIN, DEMO_CONSULTANT, seedDatabase } from './seed-data'

// En producción: SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD y SEED_DEMO_CONSULTANT=false
const admin =
  process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD
    ? { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD }
    : undefined
const demoConsultant = process.env.SEED_DEMO_CONSULTANT !== 'false'

seedDatabase(db, { admin, demoConsultant })
  .then(() => {
    console.log('Semilla aplicada.')
    console.log(admin ? `Admin: ${admin.email}` : `Admin demo: ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`)
    if (demoConsultant) console.log(`Consultor demo: ${DEMO_CONSULTANT.email} / ${DEMO_CONSULTANT.password}`)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

`src/db/migrate.ts`:

```ts
import 'dotenv/config'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from './index'

migrate(db, { migrationsFolder: 'drizzle' })
  .then(() => console.log('Migraciones aplicadas.'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

`src/test/db.ts`:

```ts
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createDb, type Db } from '@/db/client'

// Archivo temporal (no :memory:): con libsql cada transacción abre otra conexión
export async function makeTestDb(): Promise<Db> {
  const dir = mkdtempSync(join(tmpdir(), 'crece-'))
  const db = createDb(`file:${join(dir, 'test.db')}`)
  await migrate(db, { migrationsFolder: 'drizzle' })
  return db
}
```

- [ ] **Step 8: Prueba** — `src/db/db.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from './seed-data'
import { QUESTION_BANK } from './questions'
import { availability, question, user } from './schema'
import { getSettings, saveSettings } from '@/services/settings'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { LESSONS } from '@/academia/lessons'

describe('base de datos', () => {
  it('la semilla es idempotente', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    await seedDatabase(db)
    const [{ n }] = await db.select({ n: count() }).from(question)
    expect(n).toBe(QUESTION_BANK.length)
    const admins = await db.select().from(user).where(eq(user.role, 'admin'))
    expect(admins).toHaveLength(1)
    const [{ r }] = await db.select({ r: count() }).from(availability)
    expect(r).toBe(10)
  })

  it('cada pregunta apunta a una guía existente', () => {
    const slugs = new Set(LESSONS.map((l) => l.slug))
    for (const q of QUESTION_BANK) expect(slugs.has(q.lesson), q.id).toBe(true)
  })

  it('guarda y lee ajustes', async () => {
    const db = await makeTestDb()
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS)
    await saveSettings(db, { ...DEFAULT_SETTINGS, smmlv: 2_000_000 })
    expect((await getSettings(db)).smmlv).toBe(2_000_000)
  })
})
```

- [ ] **Step 9: Ejecutar**

Run: `npx vitest run src/db`
Expected: PASS (3 pruebas).

- [ ] **Step 10: Migrar y sembrar la BD local**

Run: `npm run db:migrate && npm run db:seed`
Expected: "Migraciones aplicadas." y "Semilla aplicada." con las credenciales demo; se crea `local.db`.

- [ ] **Step 11: Commit**

```bash
git add drizzle drizzle.config.ts src/db src/services src/test
git commit -m "feat(db): esquema SQLite/libSQL, banco de 32 preguntas y semilla"
```

---

### Task 7: Autenticación, empresa, roles y estructura de la app

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/session.ts`, `src/app/api/auth/[...all]/route.ts`, `src/services/companies.ts`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/actions.ts`, `src/app/(auth)/entrar/page.tsx`, `src/app/(auth)/registro/page.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/inicio/page.tsx`, `src/ui/nav.tsx`, `src/ui/nav-link.tsx`
- Modify: `src/app/page.tsx`, `src/ui/field.tsx` (agregar `Check`)
- Test: `src/services/companies.test.ts`

**Interfaces:**
- Consumes: `db`, `createUserWithPassword`, `getUserRole`, tablas `company`, `companyMember`.
- Produces:
  - `auth` (Better Auth)
  - `getCurrentUser(): Promise<CurrentUser | null>`, `type CurrentUser = { id: string; name: string; email: string; role: Role }`
  - `requireUser(roles?: Role[]): Promise<CurrentUser>` (redirige a `/entrar` o al inicio de su rol)
  - `requireCompany(): Promise<{ user: CurrentUser; companyId: string }>`
  - `homeFor(role: Role): string`
  - `createCompanyForUser(db, i: { userId: string; name: string; nit: string }): Promise<string>`, `getCompanyIdForUser(db, userId): Promise<string | null>`, `getCompany(db, id)`, `companyEmails(db, companyId): Promise<string[]>`
  - `signOutAction()` (server action)
  - `Check` (checkbox con etiqueta)

- [ ] **Step 1: Prueba que falla** — `src/services/companies.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { createUserWithPassword } from './users'
import { companyEmails, createCompanyForUser, getCompany, getCompanyIdForUser } from './companies'

describe('companies', () => {
  it('crea la empresa y vincula al usuario', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'Ana@Ejemplo.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
    expect(await getCompanyIdForUser(db, userId)).toBeNull()
    const companyId = await createCompanyForUser(db, { userId, name: 'La Espiga SAS', nit: '900123456' })
    expect(await getCompanyIdForUser(db, userId)).toBe(companyId)
    expect((await getCompany(db, companyId))?.name).toBe('La Espiga SAS')
    expect(await companyEmails(db, companyId)).toEqual(['ana@ejemplo.co'])
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/companies.test.ts`
Expected: FAIL — `./companies` no existe.

- [ ] **Step 3: `src/services/companies.ts`**

```ts
import { eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { company, companyMember, user } from '@/db/schema'

export async function createCompanyForUser(db: Db, i: { userId: string; name: string; nit: string }): Promise<string> {
  const [row] = await db
    .insert(company)
    .values({ name: i.name.trim(), nit: i.nit.trim(), consentAt: new Date() })
    .returning({ id: company.id })
  await db.insert(companyMember).values({ companyId: row.id, userId: i.userId })
  return row.id
}

export async function getCompanyIdForUser(db: Db, userId: string): Promise<string | null> {
  const m = await db.query.companyMember.findFirst({ where: eq(companyMember.userId, userId) })
  return m?.companyId ?? null
}

export async function getCompany(db: Db, id: string) {
  return db.query.company.findFirst({ where: eq(company.id, id) })
}

export async function companyEmails(db: Db, companyId: string): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(companyMember)
    .innerJoin(user, eq(user.id, companyMember.userId))
    .where(eq(companyMember.companyId, companyId))
  return rows.map((r) => r.email)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/companies.test.ts`
Expected: PASS.

- [ ] **Step 5: `src/lib/auth.ts` y ruta de API**

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'empresa', input: false },
    },
  },
  plugins: [nextCookies()],
})
```

`src/app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 6: `src/lib/session.ts`**

```ts
import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { auth } from './auth'
import { db } from '@/db'
import { getCompanyIdForUser } from '@/services/companies'
import type { Role } from '@/domain/types'

export type CurrentUser = { id: string; name: string; email: string; role: Role }

export function homeFor(role: Role): string {
  if (role === 'consultor') return '/consultor'
  if (role === 'admin') return '/admin'
  return '/inicio'
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const s = await auth.api.getSession({ headers: await headers() })
  if (!s?.user) return null
  return {
    id: s.user.id,
    name: s.user.name,
    email: s.user.email,
    role: ((s.user as { role?: string }).role ?? 'empresa') as Role,
  }
})

export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const u = await getCurrentUser()
  if (!u) redirect('/entrar')
  if (roles && !roles.includes(u.role)) redirect(homeFor(u.role))
  return u
}

export async function requireCompany(): Promise<{ user: CurrentUser; companyId: string }> {
  const user = await requireUser(['empresa'])
  const companyId = await getCompanyIdForUser(db, user.id)
  if (!companyId) redirect('/entrar')
  return { user, companyId }
}
```

- [ ] **Step 7: `Check` en `src/ui/field.tsx`** (agregar al final del archivo)

```tsx
export function Check({ label, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex items-start gap-3 text-ink">
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-brand-strong" {...props} />
      <span>{label}</span>
    </label>
  )
}
```

- [ ] **Step 8: Acciones de autenticación** — `src/app/(auth)/actions.ts`

```ts
'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { homeFor } from '@/lib/session'
import { db } from '@/db'
import { createCompanyForUser } from '@/services/companies'
import { getUserRole } from '@/services/users'

export type FormState = { error: string } | null

const registerSchema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  nit: z.string().trim().min(5),
  email: z.email(),
  password: z.string().min(8),
  consent: z.literal('on'),
})

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd))
  if (!parsed.success) {
    return { error: 'Revise los datos. La contraseña necesita 8 caracteres y debe autorizar el tratamiento de datos.' }
  }
  const { name, company, nit, email, password } = parsed.data
  try {
    const res = await auth.api.signUpEmail({ body: { name, email: email.toLowerCase(), password }, headers: await headers() })
    await createCompanyForUser(db, { userId: res.user.id, name: company, nit })
  } catch {
    return { error: 'No pudimos crear la cuenta. Puede que el correo ya esté registrado.' }
  }
  redirect('/inicio')
}

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get('email') ?? '').toLowerCase()
  const password = String(fd.get('password') ?? '')
  let userId: string
  try {
    const res = await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
    userId = res.user.id
  } catch {
    return { error: 'Correo o contraseña incorrectos.' }
  }
  redirect(homeFor(await getUserRole(db, userId)))
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/entrar')
}
```

- [ ] **Step 9: Pantallas de acceso**

`src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-12">
      <p className="mb-12 text-lg font-semibold tracking-tight">
        crece<span className="text-brand">.</span>
      </p>
      {children}
    </main>
  )
}
```

`src/app/(auth)/entrar/page.tsx`:

```tsx
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
      <h1 className="text-3xl font-semibold">Entrar</h1>
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <SubmitButton className="w-full" pendingLabel="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Primera vez?{' '}
        <Link href="/registro" className="text-ink underline underline-offset-4">Crear cuenta</Link>
      </p>
    </form>
  )
}
```

`src/app/(auth)/registro/page.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction } from '../actions'
import { Check, Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default function RegistroPage() {
  const [state, action] = useActionState(registerAction, null)
  return (
    <form action={action} className="space-y-5">
      <h1 className="text-3xl font-semibold">Crear cuenta</h1>
      <Field label="Tu nombre" name="name" autoComplete="name" required />
      <Field label="Empresa" name="company" autoComplete="organization" required />
      <Field label="NIT" name="nit" inputMode="numeric" required />
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <Check name="consent" label="Autorizo el tratamiento de mis datos según la Ley 1581 de 2012." required />
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <SubmitButton className="w-full" pendingLabel="Creando…">Crear cuenta</SubmitButton>
      <p className="text-center text-sm text-muted">
        ¿Ya tiene cuenta?{' '}
        <Link href="/entrar" className="text-ink underline underline-offset-4">Entrar</Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 10: Navegación**

`src/ui/nav-link.tsx`:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname()
  const active = path === href || (href !== '/admin' && href !== '/consultor' && path.startsWith(href + '/'))
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full px-3 py-2 transition-colors ${active ? 'text-ink font-medium' : 'text-muted hover:text-ink'}`}
    >
      {children}
    </Link>
  )
}
```

`src/ui/nav.tsx`:

```tsx
import Link from 'next/link'
import { signOutAction } from '@/app/(auth)/actions'
import type { Role } from '@/domain/types'
import { NavLink } from './nav-link'

const NAV: Record<Role, { href: string; label: string }[]> = {
  empresa: [
    { href: '/inicio', label: 'Inicio' },
    { href: '/academia', label: 'Academia' },
    { href: '/agenda', label: 'Agenda' },
  ],
  consultor: [
    { href: '/consultor', label: 'Agenda' },
    { href: '/consultor/disponibilidad', label: 'Disponibilidad' },
  ],
  admin: [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/preguntas', label: 'Preguntas' },
    { href: '/admin/ajustes', label: 'Ajustes' },
    { href: '/admin/usuarios', label: 'Usuarios' },
  ],
}

export function Nav({ role }: { role: Role }) {
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        crece<span className="text-brand">.</span>
      </Link>
      <nav className="-mr-3 flex items-center overflow-x-auto text-sm">
        {NAV[role].map((i) => (
          <NavLink key={i.href} href={i.href}>{i.label}</NavLink>
        ))}
        <form action={signOutAction}>
          <button className="rounded-full px-3 py-2 text-muted hover:text-ink">Salir</button>
        </form>
      </nav>
    </header>
  )
}
```

- [ ] **Step 11: Layout de la app, raíz e inicio provisional**

`src/app/(app)/layout.tsx`:

```tsx
import { requireUser } from '@/lib/session'
import { Nav } from '@/ui/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <>
      <Nav role={user.role} />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
    </>
  )
}
```

`src/app/page.tsx` (reemplazar):

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUser, homeFor } from '@/lib/session'

export default async function Home() {
  const user = await getCurrentUser()
  redirect(user ? homeFor(user.role) : '/entrar')
}
```

`src/app/(app)/inicio/page.tsx` (provisional; la Task 8 lo completa):

```tsx
import { requireCompany } from '@/lib/session'

export default async function InicioPage() {
  const { user } = await requireCompany()
  return <h1 className="text-3xl font-semibold">Hola, {user.name.split(' ')[0]}</h1>
}
```

- [ ] **Step 12: Verificar en el navegador**

Run: `npm run dev` y abrir `http://localhost:3000`.
Expected: redirige a `/entrar`. Crear cuenta en `/registro` lleva a `/inicio` con "Hola, <nombre>". "Salir" vuelve a `/entrar`. Entrar con `consultor@crece.local / Consultor123!` lleva a `/consultor` (404 por ahora; es esperado).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(auth): registro con empresa y consentimiento, sesión, roles y navegación"
```

---

### Task 8: Consulta — pasos Clasificar y Revisar

**Files:**
- Create: `src/services/consultations.ts`, `src/app/(app)/consulta/actions.ts`, `src/app/(app)/consulta/[id]/clasificar/page.tsx`, `src/app/(app)/consulta/[id]/revisar/page.tsx`, `src/ui/steps.tsx`
- Modify: `src/app/(app)/inicio/page.tsx`
- Test: `src/services/consultations.test.ts`

**Interfaces:**
- Consumes: `classify`, `nextStep`, `previousTarget`, `getSettings`, tablas.
- Produces:
  - `startConsultation(db, companyId): Promise<string>` (reutiliza la consulta abierta)
  - `getOwnedConsultation(db, id, companyId)` → fila de `consultation` o `undefined`
  - `stepPath(id: string, status: ConsultationStatus): string`
  - `saveClassification(db, id, input: ClassificationInput): Promise<void>`
  - `getActiveQuestions(db): Promise<Question[]>`
  - `loadDiagnosticState(db, id): Promise<{ questions: Question[]; answers: Record<string, AnswerValue>; flags: Partial<Flags>; group: Group }>`
  - `setFlag(db, id, flag: Flag, value: boolean)`, `saveAnswer(db, id, questionId, value: AnswerValue)`, `undoLast(db, id)`
  - `completeReviewIfDone(db, id): Promise<boolean>`
  - `latestConsultation(db, companyId)` → la consulta más reciente o `undefined`
  - `Steps({ current: 0..4 })`

- [ ] **Step 1: Prueba que falla** — `src/services/consultations.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase } from '@/db/seed-data'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import {
  completeReviewIfDone,
  getOwnedConsultation,
  loadDiagnosticState,
  saveAnswer,
  saveClassification,
  setFlag,
  startConsultation,
  undoLast,
} from './consultations'
import { FLAG_QUESTIONS, nextStep } from '@/domain/flow'

let db: Db
let companyId: string

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  companyId = await createCompanyForUser(db, { userId, name: 'Espiga', nit: '900' })
})

const input = { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false }

describe('consultations', () => {
  it('reutiliza la consulta abierta', async () => {
    const a = await startConsultation(db, companyId)
    const b = await startConsultation(db, companyId)
    expect(a).toBe(b)
  })

  it('no deja ver consultas de otra empresa', async () => {
    const id = await startConsultation(db, companyId)
    expect(await getOwnedConsultation(db, id, 'otra')).toBeUndefined()
  })

  it('clasifica y avanza a revisar', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    const c = await getOwnedConsultation(db, id, companyId)
    expect(c).toMatchObject({ group: 2, status: 'revisar' })
  })

  it('recorre el diagnóstico completo, permite deshacer y pasa a examinar', async () => {
    const id = await startConsultation(db, companyId)
    await saveClassification(db, id, input)
    for (const f of FLAG_QUESTIONS) await setFlag(db, id, f.key, f.key !== 'arrendamientos')

    let s = await loadDiagnosticState(db, id)
    let step = nextStep(s.questions, s.flags, s.answers, s.group)
    expect(step.kind).toBe('question')
    if (step.kind === 'question') {
      expect(step.total).toBe(31) // 32 − 1 de arrendamientos
      await saveAnswer(db, id, step.question.id, 'si')
      await undoLast(db, id)
      s = await loadDiagnosticState(db, id)
      expect(Object.keys(s.answers)).toHaveLength(0)
    }

    expect(await completeReviewIfDone(db, id)).toBe(false)
    for (;;) {
      s = await loadDiagnosticState(db, id)
      step = nextStep(s.questions, s.flags, s.answers, s.group)
      if (step.kind !== 'question') break
      await saveAnswer(db, id, step.question.id, 'si')
    }
    expect(await completeReviewIfDone(db, id)).toBe(true)
    expect((await getOwnedConsultation(db, id, companyId))?.status).toBe('examinar')
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/consultations.test.ts`
Expected: FAIL — `./consultations` no existe.

- [ ] **Step 3: `src/services/consultations.ts`**

```ts
import { and, asc, desc, eq, ne } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { answer, consultation, question, type ConsultationStatus } from '@/db/schema'
import { classify, type ClassificationInput } from '@/domain/classify'
import { nextStep, previousTarget } from '@/domain/flow'
import type { AnswerValue, Flag, Flags, Group, Question } from '@/domain/types'
import { getSettings } from './settings'

export function stepPath(id: string, status: ConsultationStatus): string {
  return `/consulta/${id}/${status}`
}

export async function startConsultation(db: Db, companyId: string): Promise<string> {
  const open = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, companyId), ne(consultation.status, 'resultado')),
    orderBy: desc(consultation.createdAt),
  })
  if (open) return open.id
  const [row] = await db.insert(consultation).values({ companyId }).returning({ id: consultation.id })
  return row.id
}

export async function getOwnedConsultation(db: Db, id: string, companyId: string) {
  return db.query.consultation.findFirst({
    where: and(eq(consultation.id, id), eq(consultation.companyId, companyId)),
  })
}

export async function latestConsultation(db: Db, companyId: string) {
  return db.query.consultation.findFirst({
    where: eq(consultation.companyId, companyId),
    orderBy: desc(consultation.createdAt),
  })
}

export async function saveClassification(db: Db, id: string, input: ClassificationInput): Promise<void> {
  const settings = await getSettings(db)
  const { group, reason } = classify(input, settings)
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  await db
    .update(consultation)
    .set({ group, groupReason: reason, classificationInput: input, status: c.status === 'clasificar' ? 'revisar' : c.status })
    .where(eq(consultation.id, id))
}

export async function getActiveQuestions(db: Db): Promise<Question[]> {
  return db.select().from(question).where(eq(question.active, true)).orderBy(asc(question.order))
}

export async function loadDiagnosticState(db: Db, id: string) {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const questions = await getActiveQuestions(db)
  const rows = await db.select().from(answer).where(eq(answer.consultationId, id))
  const answers: Record<string, AnswerValue> = Object.fromEntries(rows.map((r) => [r.questionId, r.value]))
  return { questions, answers, flags: c.flags, group: (c.group ?? 2) as Group }
}

export async function setFlag(db: Db, id: string, flag: Flag, value: boolean): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const flags: Partial<Flags> = { ...c.flags, [flag]: value }
  await db.update(consultation).set({ flags }).where(eq(consultation.id, id))
}

export async function saveAnswer(db: Db, id: string, questionId: string, value: AnswerValue): Promise<void> {
  await db
    .insert(answer)
    .values({ consultationId: id, questionId, value })
    .onConflictDoUpdate({ target: [answer.consultationId, answer.questionId], set: { value } })
}

export async function undoLast(db: Db, id: string): Promise<void> {
  const s = await loadDiagnosticState(db, id)
  const target = previousTarget(s.questions, s.flags, s.answers, s.group)
  if (!target) return
  if (target.kind === 'answer') {
    await db.delete(answer).where(and(eq(answer.consultationId, id), eq(answer.questionId, target.questionId)))
    return
  }
  const flags = { ...s.flags }
  delete flags[target.flag]
  await db.update(consultation).set({ flags }).where(eq(consultation.id, id))
}

export async function completeReviewIfDone(db: Db, id: string): Promise<boolean> {
  const s = await loadDiagnosticState(db, id)
  if (nextStep(s.questions, s.flags, s.answers, s.group).kind !== 'done') return false
  await db
    .update(consultation)
    .set({ status: 'examinar' })
    .where(and(eq(consultation.id, id), eq(consultation.status, 'revisar')))
  return true
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/consultations.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 5: Barra de progreso** — `src/ui/steps.tsx`

```tsx
const STEPS = ['Clasificar', 'Revisar', 'Examinar', 'Comunicar', 'Escalar']

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-12 flex gap-2" aria-label="Progreso de la consulta">
      {STEPS.map((label, i) => (
        <li key={label} className="flex-1" aria-current={i === current ? 'step' : undefined}>
          <div className={`h-1 rounded-full ${i <= current ? 'bg-brand' : 'bg-surface'}`} />
          <span className={`mt-2 block text-xs ${i === current ? 'font-medium text-ink' : 'text-muted max-sm:sr-only'}`}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 6: Acciones** — `src/app/(app)/consulta/actions.ts`

```ts
'use server'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import {
  completeReviewIfDone,
  getOwnedConsultation,
  saveAnswer,
  saveClassification,
  setFlag,
  startConsultation,
  stepPath,
  undoLast,
} from '@/services/consultations'
import type { AnswerValue, Flag } from '@/domain/types'

async function owned(id: string) {
  const { companyId, user } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  return { c, companyId, user }
}

const money = (v: FormDataEntryValue | null) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0

export async function startConsultationAction() {
  const { companyId } = await requireCompany()
  const id = await startConsultation(db, companyId)
  const c = await getOwnedConsultation(db, id, companyId)
  redirect(stepPath(id, c!.status))
}

export async function classifyAction(id: string, fd: FormData) {
  await owned(id)
  await saveClassification(db, id, {
    assets: money(fd.get('assets')),
    revenue: money(fd.get('revenue')),
    employees: money(fd.get('employees')),
    issuesSecurities: fd.get('issuesSecurities') === 'on',
    publicInterest: fd.get('publicInterest') === 'on',
  })
  redirect(`/consulta/${id}/clasificar`)
}

async function goNext(id: string) {
  const done = await completeReviewIfDone(db, id)
  redirect(done ? `/consulta/${id}/examinar` : `/consulta/${id}/revisar`)
}

export async function flagAction(id: string, flag: Flag, fd: FormData) {
  await owned(id)
  await setFlag(db, id, flag, fd.get('value') === 'si')
  await goNext(id)
}

const ANSWERS: AnswerValue[] = ['si', 'parcial', 'no', 'nose']

export async function answerAction(id: string, questionId: string, fd: FormData) {
  await owned(id)
  const value = fd.get('value') as AnswerValue
  if (!ANSWERS.includes(value)) redirect(`/consulta/${id}/revisar`)
  await saveAnswer(db, id, questionId, value)
  await goNext(id)
}

export async function undoAction(id: string) {
  await owned(id)
  await undoLast(db, id)
  redirect(`/consulta/${id}/revisar`)
}
```

- [ ] **Step 7: Pantalla Clasificar** — `src/app/(app)/consulta/[id]/clasificar/page.tsx`

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation } from '@/services/consultations'
import { GROUP_NAMES } from '@/domain/classify'
import { classifyAction } from '../../actions'
import { Steps } from '@/ui/steps'
import { Check, Field } from '@/ui/field'
import { ButtonLink, buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

export default async function ClasificarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editar?: string }>
}) {
  const { id } = await params
  const { editar } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()

  const input = c.classificationInput
  if (c.group !== null && editar === undefined) {
    return (
      <>
        <Steps current={0} />
        <section className="space-y-5">
          <p className="text-sm text-muted">Su marco contable</p>
          <h1 className="text-5xl font-semibold tracking-tight">Grupo {c.group}</h1>
          <p className="text-xl">{GROUP_NAMES[c.group]}</p>
          <p className="max-w-prose text-muted">{c.groupReason}</p>
          <div className="flex items-center gap-6 pt-6">
            <ButtonLink href={`/consulta/${id}/revisar`}>Continuar</ButtonLink>
            <Link href="?editar=1" className={buttonClass('link')}>Cambiar datos</Link>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Steps current={0} />
      <form action={classifyAction.bind(null, id)} className="space-y-6">
        <h1 className="text-3xl font-semibold">¿Qué tamaño tiene su empresa?</h1>
        <Field label="Activos totales (COP)" name="assets" inputMode="numeric" required defaultValue={input?.assets} />
        <Field label="Ingresos del último año (COP)" name="revenue" inputMode="numeric" required defaultValue={input?.revenue} />
        <Field label="Número de empleados" name="employees" type="number" min={0} required defaultValue={input?.employees} />
        <div className="space-y-3 pt-2">
          <Check name="issuesSecurities" label="Emite acciones o bonos en la bolsa de valores" defaultChecked={input?.issuesSecurities} />
          <Check name="publicInterest" label="Es entidad de interés público (banca, seguros, fondos)" defaultChecked={input?.publicInterest} />
        </div>
        <SubmitButton pendingLabel="Clasificando…">Clasificar</SubmitButton>
      </form>
    </>
  )
}
```

- [ ] **Step 8: Pantalla Revisar** — `src/app/(app)/consulta/[id]/revisar/page.tsx`

```tsx
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, loadDiagnosticState } from '@/services/consultations'
import { nextStep, previousTarget } from '@/domain/flow'
import { ANSWER_LABEL, DIMENSIONS, type AnswerValue } from '@/domain/types'
import { answerAction, flagAction, undoAction } from '../../actions'
import { Steps } from '@/ui/steps'
import { buttonClass } from '@/ui/button'

const option =
  'h-14 rounded-2xl bg-surface text-lg font-medium text-ink transition-colors hover:bg-brand-soft focus-visible:bg-brand-soft'

export default async function RevisarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.group === null) redirect(`/consulta/${id}/clasificar`)

  const s = await loadDiagnosticState(db, id)
  const step = nextStep(s.questions, s.flags, s.answers, s.group)
  if (step.kind === 'done') redirect(`/consulta/${id}/examinar`)
  const canGoBack = previousTarget(s.questions, s.flags, s.answers, s.group) !== null

  const isFlag = step.kind === 'flag'
  const key = isFlag ? step.flag : step.question.id
  const title = isFlag ? step.text : step.question.text
  const help = isFlag ? null : step.question.help
  const context = isFlag
    ? `Antes de empezar · ${step.position} de ${step.total}`
    : `${DIMENSIONS.find((d) => d.key === step.question.dimension)?.name} · ${step.position} de ${step.total}`

  return (
    <>
      <Steps current={1} />
      <div data-step={key} className="space-y-10">
        <div className="space-y-4">
          <p className="text-sm text-muted">{context}</p>
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{title}</h1>
          {help && (
            <details className="text-muted">
              <summary className="cursor-pointer text-sm">¿Qué significa?</summary>
              <p className="mt-2 max-w-prose">{help}</p>
            </details>
          )}
        </div>

        {isFlag ? (
          <form action={flagAction.bind(null, id, step.flag)} className="grid grid-cols-2 gap-3">
            <button name="value" value="si" className={option}>Sí</button>
            <button name="value" value="no" className={option}>No</button>
          </form>
        ) : (
          <form action={answerAction.bind(null, id, step.question.id)} className="grid grid-cols-2 gap-3">
            {(['si', 'parcial', 'no', 'nose'] as AnswerValue[]).map((v) => (
              <button key={v} name="value" value={v} className={option}>{ANSWER_LABEL[v]}</button>
            ))}
          </form>
        )}

        {canGoBack && (
          <form action={undoAction.bind(null, id)}>
            <button className={buttonClass('link')}>Atrás</button>
          </form>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 9: Inicio con acción principal** — reemplazar `src/app/(app)/inicio/page.tsx` (la Task 12 agrega el último resultado)

```tsx
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { latestConsultation } from '@/services/consultations'
import { startConsultationAction } from '../consulta/actions'
import { SubmitButton } from '@/ui/submit-button'

export default async function InicioPage() {
  const { user, companyId } = await requireCompany()
  const last = await latestConsultation(db, companyId)
  const inProgress = last && last.status !== 'resultado'
  return (
    <section className="space-y-6 pt-10">
      <h1 className="text-4xl font-semibold tracking-tight">Hola, {user.name.split(' ')[0]}</h1>
      <p className="max-w-prose text-lg text-muted">Su consulta NIIF toma unos 15 minutos.</p>
      <form action={startConsultationAction}>
        <SubmitButton>{inProgress ? 'Continuar consulta' : 'Iniciar consulta'}</SubmitButton>
      </form>
    </section>
  )
}
```

- [ ] **Step 10: Verificar en el navegador**

Run: `npm run dev`. Crear una cuenta, "Iniciar consulta", clasificar (activos 800000000, ingresos 1500000000, 25 empleados).
Expected: muestra "Grupo 2 · NIIF para Pymes"; "Continuar" lleva a las 6 banderas y luego a las preguntas, una por pantalla; "Atrás" deshace la última respuesta; al terminar redirige a `/consulta/<id>/examinar` (404 por ahora, esperado).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(consulta): pasos Clasificar y Revisar con una pregunta por pantalla"
```

---
### Task 9: Almacenamiento de archivos, carga y extracción de texto

**Files:**
- Create: `src/storage/storage.ts`, `src/services/uploads.ts`, `src/ai/extract-text.ts`
- Test: `src/services/uploads.test.ts`, `src/ai/extract-text.test.ts`

**Interfaces:**
- Produces:
  - `interface Storage { put(key: string, data: Buffer, contentType: string): Promise<void>; read(key: string): Promise<Buffer> }`
  - `diskStorage(dir: string): Storage`, `blobStorage(): Storage`, `getStorage(): Storage` (Blob si existe `BLOB_READ_WRITE_TOKEN`; si no, disco en `UPLOAD_DIR` o `.data/uploads`)
  - `MAX_UPLOAD_BYTES = 4 * 1024 * 1024`, `validateFile(f: { name: string; size: number }): string | null`
  - `saveUpload(db, storage, i: { consultationId: string; name: string; size: number; bytes: Buffer }): Promise<{ ok: true; id: string } | { ok: false; error: string }>`
  - `listUploads(db, consultationId)`, `removeUpload(db, consultationId, uploadId)`
  - `fileToText(data: Buffer, mime: string): Promise<string>`

- [ ] **Step 1: Pruebas que fallan**

`src/ai/extract-text.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { fileToText } from './extract-text'

describe('fileToText', () => {
  it('convierte cada hoja de Excel a texto CSV', async () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Cuenta', '2025'], ['Activo total', 1000]]), 'Balance')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Ingresos', 1500]]), 'Resultados')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    const text = await fileToText(buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(text).toContain('## Hoja: Balance')
    expect(text).toContain('Activo total,1000')
    expect(text).toContain('## Hoja: Resultados')
  })
})
```

`src/services/uploads.test.ts`:

```ts
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { diskStorage } from '@/storage/storage'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { startConsultation } from './consultations'
import { listUploads, removeUpload, saveUpload, validateFile, MAX_UPLOAD_BYTES } from './uploads'

describe('validateFile', () => {
  it('acepta PDF y Excel dentro del límite', () => {
    expect(validateFile({ name: 'eeff.PDF', size: 10 })).toBeNull()
    expect(validateFile({ name: 'eeff.xlsx', size: 10 })).toBeNull()
  })
  it('rechaza otros tipos, vacíos y grandes', () => {
    expect(validateFile({ name: 'foto.png', size: 10 })).toMatch(/PDF o Excel/)
    expect(validateFile({ name: 'a.pdf', size: 0 })).toMatch(/vacío/)
    expect(validateFile({ name: 'a.pdf', size: MAX_UPLOAD_BYTES + 1 })).toMatch(/4 MB/)
  })
})

describe('saveUpload', () => {
  it('guarda el archivo y lo registra', async () => {
    const db = await makeTestDb()
    const storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-up-')))
    const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
    const consultationId = await startConsultation(db, companyId)

    const r = await saveUpload(db, storage, { consultationId, name: 'eeff.pdf', size: 4, bytes: Buffer.from('%PDF') })
    expect(r.ok).toBe(true)
    const files = await listUploads(db, consultationId)
    expect(files).toHaveLength(1)
    expect((await storage.read(files[0].storageKey)).toString()).toBe('%PDF')

    await removeUpload(db, consultationId, files[0].id)
    expect(await listUploads(db, consultationId)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que fallan**

Run: `npx vitest run src/services/uploads.test.ts src/ai/extract-text.test.ts`
Expected: FAIL — módulos no existen.

- [ ] **Step 3: `src/storage/storage.ts`**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { get, put } from '@vercel/blob'

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>
  read(key: string): Promise<Buffer>
}

export function diskStorage(dir: string): Storage {
  return {
    async put(key, data) {
      const path = join(dir, key)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, data)
    },
    async read(key) {
      return readFile(join(dir, key))
    },
  }
}

export function blobStorage(): Storage {
  return {
    async put(key, data, contentType) {
      await put(key, data, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true })
    },
    async read(key) {
      const r = await get(key, { access: 'private' })
      if (!r || r.statusCode !== 200) throw new Error(`Archivo no encontrado: ${key}`)
      return Buffer.from(await new Response(r.stream).arrayBuffer())
    },
  }
}

export function getStorage(): Storage {
  return process.env.BLOB_READ_WRITE_TOKEN ? blobStorage() : diskStorage(process.env.UPLOAD_DIR ?? '.data/uploads')
}
```

- [ ] **Step 4: `src/services/uploads.ts`**

```ts
import { and, asc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { upload } from '@/db/schema'
import type { Storage } from '@/storage/storage'

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

export function validateFile(f: { name: string; size: number }): string | null {
  if (!(extOf(f.name) in MIME)) return 'Solo se aceptan archivos PDF o Excel.'
  if (f.size === 0) return 'El archivo está vacío.'
  if (f.size > MAX_UPLOAD_BYTES) return 'El archivo supera 4 MB.'
  return null
}

export async function saveUpload(
  db: Db,
  storage: Storage,
  i: { consultationId: string; name: string; size: number; bytes: Buffer },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const error = validateFile(i)
  if (error) return { ok: false, error }
  const ext = extOf(i.name)
  const id = crypto.randomUUID()
  const storageKey = `consultas/${i.consultationId}/${id}.${ext}`
  await storage.put(storageKey, i.bytes, MIME[ext])
  await db.insert(upload).values({ id, consultationId: i.consultationId, fileName: i.name, storageKey, mime: MIME[ext], size: i.size })
  return { ok: true, id }
}

export async function listUploads(db: Db, consultationId: string) {
  return db.select().from(upload).where(eq(upload.consultationId, consultationId)).orderBy(asc(upload.createdAt))
}

export async function removeUpload(db: Db, consultationId: string, uploadId: string): Promise<void> {
  await db.delete(upload).where(and(eq(upload.id, uploadId), eq(upload.consultationId, consultationId)))
}
```

- [ ] **Step 5: `src/ai/extract-text.ts`**

```ts
import { extractText, getDocumentProxy } from 'unpdf'
import * as XLSX from 'xlsx'

export async function fileToText(data: Buffer, mime: string): Promise<string> {
  if (mime === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(data))
    const { text } = await extractText(pdf, { mergePages: true })
    return text
  }
  const wb = XLSX.read(data, { type: 'buffer' })
  return wb.SheetNames.map((name) => `## Hoja: ${name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[name])}`).join('\n\n')
}
```

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `npx vitest run src/services/uploads.test.ts src/ai/extract-text.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/storage src/services/uploads.ts src/services/uploads.test.ts src/ai/extract-text.ts src/ai/extract-text.test.ts
git commit -m "feat(carga): almacenamiento local/Blob, validación de archivos y extracción de texto"
```

---

### Task 10: Agente analista IA (proveedor agnóstico) y pipeline de análisis

**Files:**
- Create: `src/ai/analyst.ts`, `src/ai/mock-analyst.ts`, `src/ai/gateway-analyst.ts`, `src/services/analysis.ts`
- Test: `src/services/analysis.test.ts`

**Interfaces:**
- Consumes: `extractedSchema`, `judgeSchema`, `Extracted`, `AiFinding`, `healthyExtracted`, `runChecks`, `computeRatios`, `lessonForSection`, `LESSONS`, `Storage`, `listUploads`, `fileToText`.
- Produces:
  - `interface Analyst { extract(text: string): Promise<Extracted>; judge(i: { text: string; extracted: Extracted; group: Group }): Promise<AiFinding[]> }`
  - `mockAnalyst: Analyst`, `MOCK_FINDINGS: AiFinding[]`, `gatewayAnalyst(model: string): Analyst`, `getAnalyst(): Analyst`, `isMockAnalyst(): boolean`
  - `runAnalysis(db, consultationId, deps: { analyst: Analyst; storage: Storage }): Promise<'listo' | 'error'>`
  - `getAnalysis(db, consultationId)` → fila de `analysis` o `undefined`

- [ ] **Step 1: `src/ai/analyst.ts`**

```ts
import type { Group } from '@/domain/types'
import type { AiFinding, Extracted } from './schemas'
import { gatewayAnalyst } from './gateway-analyst'
import { mockAnalyst } from './mock-analyst'

export interface Analyst {
  extract(text: string): Promise<Extracted>
  judge(i: { text: string; extracted: Extracted; group: Group }): Promise<AiFinding[]>
}

export function isMockAnalyst(): boolean {
  return !process.env.AI_MODEL?.trim()
}

export function getAnalyst(): Analyst {
  const model = process.env.AI_MODEL?.trim()
  return model ? gatewayAnalyst(model) : mockAnalyst
}
```

- [ ] **Step 2: `src/ai/mock-analyst.ts`**

```ts
import { healthyExtracted } from '@/domain/fixtures'
import type { Analyst } from './analyst'
import type { AiFinding } from './schemas'

export const MOCK_FINDINGS: AiFinding[] = [
  {
    title: 'No se evidencia el cálculo del impuesto diferido',
    detail: 'Las notas no mencionan diferencias temporarias ni saldos de impuesto diferido.',
    niifSection: 'Sección 29',
    severity: 'alta',
    recommendation: 'Calcule el impuesto diferido comparando las bases contables y fiscales al cierre.',
  },
  {
    title: 'Las notas no detallan cómo se miden los inventarios',
    detail: 'No se indica la fórmula de costo ni la comparación con el precio de venta.',
    niifSection: 'Sección 13',
    severity: 'media',
    recommendation: 'Revele la fórmula de costo usada (promedio ponderado o PEPS) y los ajustes al precio de venta menos costos.',
  },
]

// Analista simulado: se usa cuando AI_MODEL está vacío (desarrollo, pruebas, demo)
export const mockAnalyst: Analyst = {
  async extract() {
    return structuredClone(healthyExtracted)
  },
  async judge() {
    return structuredClone(MOCK_FINDINGS)
  },
}
```

- [ ] **Step 3: `src/ai/gateway-analyst.ts`**

```ts
import { generateText, Output } from 'ai'
import type { Analyst } from './analyst'
import { extractedSchema, judgeSchema } from './schemas'

const EXTRACT_SYSTEM = `Eres contador público experto en NIIF para pymes en Colombia.
Extrae las cifras de los estados financieros del texto.
- Usa solo lo que aparece en el texto. Si un dato no aparece, usa null. No inventes cifras.
- Expresa los valores en unidades monetarias completas: si el documento dice "en miles de pesos", multiplica por 1000.
- Ordena los períodos del más reciente al más antiguo.
- Marca cada estado financiero como presente solo si el texto lo contiene.`

const JUDGE_SYSTEM = `Eres revisor de estados financieros bajo NIIF en Colombia.
Recibes el grupo NIIF de la empresa (1: NIIF plenas, 2: NIIF para Pymes, 3: marco simplificado de microempresas), las cifras extraídas y el texto original.
Identifica hasta 8 hallazgos sobre presentación, revelaciones y señales de tratamientos contables que no siguen el marco que le aplica.
- No repitas errores aritméticos ni estados faltantes: se revisan aparte.
- Cita la sección de la NIIF para Pymes en niifSection, por ejemplo "Sección 13".
- Severidad: "critica" solo si las cifras no son confiables; "alta" si incumple un requerimiento importante; "media" para revelaciones incompletas; "baja" para mejoras de forma.
- Escribe en español claro, para el gerente de una pyme. Frases cortas.`

export function gatewayAnalyst(model: string): Analyst {
  return {
    async extract(text) {
      const { output } = await generateText({
        model,
        system: EXTRACT_SYSTEM,
        prompt: text.slice(0, 60_000),
        output: Output.object({ schema: extractedSchema }),
      })
      return output
    },
    async judge({ text, extracted, group }) {
      const { output } = await generateText({
        model,
        system: JUDGE_SYSTEM,
        prompt: JSON.stringify({ grupo: group, cifras: extracted, texto: text.slice(0, 30_000) }),
        output: Output.object({ schema: judgeSchema }),
      })
      return output.findings
    },
  }
}
```

Nota: `model` es un texto `proveedor/modelo` (por ejemplo el que se elija más adelante); el AI SDK lo enruta por AI Gateway usando `AI_GATEWAY_API_KEY` en local o la autenticación OIDC de Vercel en producción. Si al compilar TypeScript indica que `output` puede ser `undefined`, lanzar `new Error('El modelo no devolvió datos')` en ese caso.

- [ ] **Step 4: Prueba que falla** — `src/services/analysis.test.ts`

```ts
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { diskStorage, type Storage } from '@/storage/storage'
import { mockAnalyst } from '@/ai/mock-analyst'
import type { Analyst } from '@/ai/analyst'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { saveClassification, startConsultation } from './consultations'
import { saveUpload } from './uploads'
import { getAnalysis, runAnalysis } from './analysis'
import { finding } from '@/db/schema'
import { eq } from 'drizzle-orm'

let db: Db
let storage: Storage
let consultationId: string

function xlsx(): Buffer {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estado de situación financiera', '2025'], ['Activo total', 1000000000]]), 'Balance')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

beforeEach(async () => {
  db = await makeTestDb()
  storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-an-')))
  const userId = await createUserWithPassword(db, { email: 'a@b.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
  const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
  consultationId = await startConsultation(db, companyId)
  await saveClassification(db, consultationId, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
})

describe('runAnalysis', () => {
  it('extrae, chequea, juzga y guarda hallazgos e indicadores', async () => {
    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    expect(await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })).toBe('listo')

    const a = await getAnalysis(db, consultationId)
    expect(a?.status).toBe('listo')
    expect(a?.ratios?.currentRatio).toBe(2)

    const f = await db.select().from(finding).where(eq(finding.consultationId, consultationId))
    expect(f.map((x) => [x.source, x.lesson])).toEqual([
      ['ia', 'impuesto-ganancias'],
      ['ia', 'inventarios'],
    ])
  })

  it('reemplaza los hallazgos al volver a analizar', async () => {
    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })
    await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })
    const f = await db.select().from(finding).where(eq(finding.consultationId, consultationId))
    expect(f).toHaveLength(2)
  })

  it('marca error sin archivos o si el modelo falla', async () => {
    expect(await runAnalysis(db, consultationId, { analyst: mockAnalyst, storage })).toBe('error')
    expect((await getAnalysis(db, consultationId))?.error).toMatch(/No hay archivos/)

    const bytes = xlsx()
    await saveUpload(db, storage, { consultationId, name: 'eeff.xlsx', size: bytes.length, bytes })
    const broken: Analyst = { ...mockAnalyst, extract: async () => { throw new Error('modelo caído') } }
    expect(await runAnalysis(db, consultationId, { analyst: broken, storage })).toBe('error')
    expect((await getAnalysis(db, consultationId))?.error).toBe('modelo caído')
  })
})
```

- [ ] **Step 5: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/analysis.test.ts`
Expected: FAIL — `./analysis` no existe.

- [ ] **Step 6: `src/services/analysis.ts`**

```ts
import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { analysis, consultation, finding } from '@/db/schema'
import type { Analyst } from '@/ai/analyst'
import { fileToText } from '@/ai/extract-text'
import type { Storage } from '@/storage/storage'
import { runChecks } from '@/domain/checks'
import { computeRatios } from '@/domain/ratios'
import { lessonForSection } from '@/domain/learning-path'
import { LESSONS } from '@/academia/lessons'
import type { Group, NewFinding } from '@/domain/types'
import { listUploads } from './uploads'

export async function getAnalysis(db: Db, consultationId: string) {
  return db.query.analysis.findFirst({ where: eq(analysis.consultationId, consultationId) })
}

async function setStatus(db: Db, consultationId: string, values: Partial<typeof analysis.$inferInsert>) {
  await db.update(analysis).set({ ...values, updatedAt: new Date() }).where(eq(analysis.consultationId, consultationId))
}

export async function runAnalysis(
  db: Db,
  consultationId: string,
  deps: { analyst: Analyst; storage: Storage },
): Promise<'listo' | 'error'> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) throw new Error('Consulta no encontrada')

  await db
    .insert(analysis)
    .values({ consultationId, status: 'procesando' })
    .onConflictDoUpdate({ target: analysis.consultationId, set: { status: 'procesando', error: null, updatedAt: new Date() } })
  await db
    .delete(finding)
    .where(and(eq(finding.consultationId, consultationId), inArray(finding.source, ['chequeo', 'ia'])))

  try {
    const files = await listUploads(db, consultationId)
    if (files.length === 0) throw new Error('No hay archivos para analizar.')

    const parts: string[] = []
    for (const f of files) {
      parts.push(`# Archivo: ${f.fileName}\n${await fileToText(await deps.storage.read(f.storageKey), f.mime)}`)
    }
    const text = parts.join('\n\n')
    if (text.replace(/\s/g, '').length < 50) {
      throw new Error('No encontramos texto en los archivos. Si el PDF es escaneado, súbalo en Excel o en PDF digital.')
    }

    const group = (c.group ?? 2) as Group
    const extracted = await deps.analyst.extract(text)
    const checks = runChecks(extracted, group)
    const ai = await deps.analyst.judge({ text, extracted, group })
    const aiFindings = ai.map((f): NewFinding => ({ ...f, source: 'ia', lesson: lessonForSection(f.niifSection, LESSONS) }))

    const all = [...checks, ...aiFindings]
    if (all.length > 0) await db.insert(finding).values(all.map((f) => ({ ...f, consultationId })))

    await setStatus(db, consultationId, { status: 'listo', extracted, ratios: computeRatios(extracted.periods[0]) })
    return 'listo'
  } catch (e) {
    await setStatus(db, consultationId, { status: 'error', error: e instanceof Error ? e.message : 'Error desconocido' })
    return 'error'
  }
}
```

- [ ] **Step 7: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/analysis.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 8: Commit**

```bash
git add src/ai src/services/analysis.ts src/services/analysis.test.ts
git commit -m "feat(ia): analista agnóstico al proveedor, simulado por defecto, y pipeline de análisis"
```

---

### Task 11: Correo, reporte PDF y cierre de la consulta (Comunicar)

**Files:**
- Create: `src/mail/mailer.ts`, `src/mail/templates.ts`, `src/report/report-pdf.tsx`, `src/services/report.ts`
- Test: `src/services/report.test.ts`, `src/mail/templates.test.ts`

**Interfaces:**
- Consumes: todo el dominio, `getSettings`, `loadDiagnosticState`, `getAnalysis`, `companyEmails`, `getCompany`, `LESSONS`.
- Produces:
  - `type Mail = { to: string[]; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }`, `interface Mailer { send(m: Mail): Promise<void> }`
  - `fileMailer(dir)`, `resendMailer(apiKey, from)`, `consoleMailer`, `getMailer(): Mailer`
  - `reportEmail(d): { subject: string; html: string }`, `appointmentEmail(d): { subject: string; html: string }`
  - `type ResultData` (ver código), `getResultData(db, id): Promise<ResultData | null>`
  - `finalizeConsultation(db, id, deps: { mailer: Mailer; renderPdf: (d: ResultData) => Promise<Buffer>; baseUrl: string }): Promise<void>`
  - `renderReportPdf(d: ResultData): Promise<Buffer>`
  - `appUrl(): string` (en `src/mail/mailer.ts`; `BETTER_AUTH_URL` o `http://localhost:3000`)

- [ ] **Step 1: `src/mail/mailer.ts`**

```ts
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Resend } from 'resend'

export type Mail = { to: string[]; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }

export interface Mailer {
  send(mail: Mail): Promise<void>
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)

// Desarrollo: cada correo queda como archivo HTML (y sus adjuntos) en la carpeta indicada
export function fileMailer(dir: string): Mailer {
  return {
    async send(m) {
      await mkdir(dir, { recursive: true })
      const base = `${Date.now()}-${slug(m.subject)}`
      await writeFile(join(dir, `${base}.html`), `<!-- Para: ${m.to.join(', ')} -->\n${m.html}`)
      for (const a of m.attachments ?? []) await writeFile(join(dir, `${base}-${a.filename}`), a.content)
    },
  }
}

export function resendMailer(apiKey: string, from: string): Mailer {
  const resend = new Resend(apiKey)
  return {
    async send(m) {
      const { error } = await resend.emails.send({
        from,
        to: m.to,
        subject: m.subject,
        html: m.html,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      })
      if (error) throw new Error(error.message)
    },
  }
}

export const consoleMailer: Mailer = {
  async send(m) {
    console.log(`[correo] ${m.subject} → ${m.to.join(', ')}`)
  },
}

export function getMailer(): Mailer {
  if (process.env.RESEND_API_KEY) {
    return resendMailer(process.env.RESEND_API_KEY, process.env.MAIL_FROM ?? 'CRECE <onboarding@resend.dev>')
  }
  if (process.env.NODE_ENV !== 'production') return fileMailer(process.env.MAIL_DIR ?? '.data/emails')
  return consoleMailer
}

export function appUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}
```

- [ ] **Step 2: Prueba que falla** — `src/mail/templates.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { appointmentEmail, reportEmail } from './templates'

describe('plantillas de correo', () => {
  it('reporte: puntaje, hallazgos escapados, enlace y aviso legal', () => {
    const { subject, html } = reportEmail({
      companyName: 'La Espiga <SAS>',
      score: 72,
      lightLabel: 'Requiere atención',
      findings: [{ title: 'Falta flujo & notas', severity: 'alta' }],
      url: 'https://crece.app/consulta/1/resultado',
      needsConsultant: true,
    })
    expect(subject).toBe('Su resultado CRECE: 72/100')
    expect(html).toContain('La Espiga &lt;SAS&gt;')
    expect(html).toContain('Falta flujo &amp; notas')
    expect(html).toContain('https://crece.app/consulta/1/resultado')
    expect(html).toContain('Agendar con un consultor')
    expect(html).toContain('no constituye una opinión de auditoría')
  })

  it('cita: asunto según tipo', () => {
    const d = { when: 'lunes, 28 de septiembre de 2026, 10:00', companyName: 'Espiga', consultantName: 'Laura', url: 'https://x' }
    expect(appointmentEmail({ ...d, kind: 'confirmada' }).subject).toBe('Cita confirmada: lunes, 28 de septiembre de 2026, 10:00')
    expect(appointmentEmail({ ...d, kind: 'recordatorio' }).subject).toMatch(/^Recordatorio/)
    expect(appointmentEmail({ ...d, kind: 'cancelada' }).subject).toMatch(/^Cita cancelada/)
    expect(appointmentEmail({ ...d, kind: 'asignada' }).subject).toMatch(/^Nueva cita/)
  })
})
```

- [ ] **Step 3: Ejecutar y verificar que falla**

Run: `npx vitest run src/mail`
Expected: FAIL — `./templates` no existe.

- [ ] **Step 4: `src/mail/templates.ts`**

```ts
import { SEVERITY_LABEL, type Severity } from '@/domain/types'

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const DISCLAIMER = 'Este reporte es orientativo y no constituye una opinión de auditoría.'

function layout(body: string, disclaimer = false): string {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#ffffff;font-family:Inter,Arial,sans-serif;color:#14213D">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="font-size:18px;font-weight:600;margin:0 0 32px">crece<span style="color:#F26B1D">.</span></p>
${body}
${disclaimer ? `<p style="margin-top:40px;font-size:12px;color:#5B6477">${DISCLAIMER}</p>` : ''}
</div></body></html>`
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#C2490F;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">${esc(label)}</a>`

export function reportEmail(d: {
  companyName: string
  score: number
  lightLabel: string
  findings: { title: string; severity: Severity }[]
  url: string
  needsConsultant: boolean
}): { subject: string; html: string } {
  const items = d.findings
    .slice(0, 5)
    .map((f) => `<li style="margin:0 0 8px"><span style="color:#5B6477">${SEVERITY_LABEL[f.severity]} ·</span> ${esc(f.title)}</li>`)
    .join('')
  const body = `
<p style="margin:0;color:#5B6477">${esc(d.companyName)}</p>
<p style="font-size:56px;font-weight:600;margin:8px 0 0">${d.score}<span style="font-size:20px;color:#5B6477">/100</span></p>
<p style="margin:4px 0 32px;color:#5B6477">${esc(d.lightLabel)}</p>
${items ? `<p style="font-weight:600;margin:0 0 12px">Lo más importante</p><ul style="padding-left:18px;margin:0 0 32px">${items}</ul>` : ''}
${button(d.url, d.needsConsultant ? 'Agendar con un consultor' : 'Ver el reporte completo')}
<p style="margin-top:16px;font-size:14px;color:#5B6477">Adjuntamos el reporte en PDF.</p>`
  return { subject: `Su resultado CRECE: ${d.score}/100`, html: layout(body, true) }
}

type AppointmentKind = 'confirmada' | 'recordatorio' | 'cancelada' | 'asignada'

export function appointmentEmail(d: {
  kind: AppointmentKind
  when: string
  companyName: string
  consultantName: string
  url: string
}): { subject: string; html: string } {
  const subject = {
    confirmada: `Cita confirmada: ${d.when}`,
    recordatorio: `Recordatorio: su cita es ${d.when}`,
    cancelada: `Cita cancelada: ${d.when}`,
    asignada: `Nueva cita con ${d.companyName}: ${d.when}`,
  }[d.kind]
  const lead = {
    confirmada: `Su consulta con ${esc(d.consultantName)} quedó agendada.`,
    recordatorio: `Le recordamos su consulta con ${esc(d.consultantName)}.`,
    cancelada: 'La cita fue cancelada. Puede agendar otra cuando quiera.',
    asignada: `${esc(d.companyName)} agendó una consulta con usted.`,
  }[d.kind]
  const body = `
<p style="font-size:22px;font-weight:600;margin:0 0 8px">${esc(d.when)}</p>
<p style="margin:0 0 32px;color:#5B6477">${lead}</p>
${button(d.url, d.kind === 'asignada' ? 'Ver el caso' : 'Ver mi agenda')}`
  return { subject, html: layout(body) }
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run src/mail`
Expected: PASS.

- [ ] **Step 6: Prueba que falla** — `src/services/report.test.ts`

```ts
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase } from '@/db/seed-data'
import { fileMailer } from '@/mail/mailer'
import { diskStorage } from '@/storage/storage'
import { mockAnalyst } from '@/ai/mock-analyst'
import { FLAG_QUESTIONS, nextStep } from '@/domain/flow'
import type { AnswerValue } from '@/domain/types'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { completeReviewIfDone, loadDiagnosticState, saveAnswer, saveClassification, setFlag, startConsultation } from './consultations'
import { saveUpload } from './uploads'
import { runAnalysis } from './analysis'
import { finalizeConsultation, getResultData } from './report'

let db: Db
let id: string
let mailDir: string

async function answerAll(value: AnswerValue, hasEEFF: boolean) {
  for (const f of FLAG_QUESTIONS) await setFlag(db, id, f.key, f.key === 'tieneEEFF' ? hasEEFF : true)
  for (;;) {
    const s = await loadDiagnosticState(db, id)
    const step = nextStep(s.questions, s.flags, s.answers, s.group)
    if (step.kind !== 'question') break
    await saveAnswer(db, id, step.question.id, value)
  }
  await completeReviewIfDone(db, id)
}

const deps = () => ({ mailer: fileMailer(mailDir), renderPdf: async () => Buffer.from('%PDF-prueba'), baseUrl: 'https://crece.test' })

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  mailDir = mkdtempSync(join(tmpdir(), 'crece-mail-'))
  const userId = await createUserWithPassword(db, { email: 'gerente@espiga.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
  const companyId = await createCompanyForUser(db, { userId, name: 'La Espiga', nit: '900' })
  id = await startConsultation(db, companyId)
  await saveClassification(db, id, { assets: 800_000_000, revenue: 1_500_000_000, employees: 25, issuesSecurities: false, publicInterest: false })
})

describe('finalizeConsultation', () => {
  it('sin análisis: diagnóstico 100, sin derivación y un solo correo con PDF', async () => {
    await answerAll('si', true)
    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data).not.toBeNull()
    expect(data!.diagnosticScore).toBe(100)
    expect(data!.finalScore).toBe(100)
    expect(data!.needsConsultant).toBe(false)
    expect(data!.companyName).toBe('La Espiga')
    expect(data!.dimensions).toHaveLength(5)

    await finalizeConsultation(db, id, deps())
    const files = readdirSync(mailDir)
    expect(files.filter((f) => f.endsWith('.html'))).toHaveLength(1)
    expect(files.some((f) => f.endsWith('reporte-crece.pdf'))).toBe(true)
  })

  it('con análisis simulado listo, el índice final es 0.6·100 + 0.4·85 = 94', async () => {
    await answerAll('si', true)
    const storage = diskStorage(mkdtempSync(join(tmpdir(), 'crece-st-')))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estado de situación financiera 2025'], ['Activo total', 1000000000]]), 'Balance')
    const bytes = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    await saveUpload(db, storage, { consultationId: id, name: 'eeff.xlsx', size: bytes.length, bytes })
    expect(await runAnalysis(db, id, { analyst: mockAnalyst, storage })).toBe('listo')

    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data!.analysisScore).toBe(85)
    expect(data!.finalScore).toBe(94)
    expect(data!.needsConsultant).toBe(false)
    expect(data!.ratios?.currentRatio).toBe(2)
    expect(data!.findings.map((f) => f.source)).toEqual(['ia', 'ia'])
  })

  it('sin estados financieros deriva al consultor y genera hallazgos del diagnóstico', async () => {
    await answerAll('no', false)
    await finalizeConsultation(db, id, deps())
    const data = await getResultData(db, id)
    expect(data!.needsConsultant).toBe(true)
    expect(data!.analysisScore).toBeNull()
    expect(data!.finalScore).toBe(0)
    expect(data!.findings.every((f) => f.source === 'diagnostico')).toBe(true)
    expect(data!.findings[0].severity).toBe('alta')
    expect(data!.path.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 7: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/report.test.ts`
Expected: FAIL — `./report` no existe.

- [ ] **Step 8: `src/services/report.ts`**

```ts
import { and, eq, inArray } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { consultation, finding, type AnalysisStatus } from '@/db/schema'
import { GROUP_NAMES } from '@/domain/classify'
import { needsConsultant } from '@/domain/derivation'
import { diagnosticFindings } from '@/domain/findings'
import { learningPath } from '@/domain/learning-path'
import type { Ratios } from '@/domain/ratios'
import { finalIndex, LIGHT_LABEL, scoreAnalysis, scoreDiagnostic, trafficLight } from '@/domain/scoring'
import { DIMENSIONS, SEVERITY_ORDER, type Dimension, type Group, type Light, type NewFinding } from '@/domain/types'
import { LESSONS, type LessonMeta } from '@/academia/lessons'
import type { Mailer } from '@/mail/mailer'
import { reportEmail } from '@/mail/templates'
import { getAnalysis } from './analysis'
import { companyEmails, getCompany } from './companies'
import { loadDiagnosticState } from './consultations'
import { getSettings } from './settings'

export type ResultData = {
  consultationId: string
  companyId: string
  companyName: string
  group: Group
  groupName: string
  finalScore: number
  light: Light
  diagnosticScore: number
  analysisScore: number | null
  dimensions: { key: Dimension; name: string; score: number | null }[]
  findings: (NewFinding & { id: string })[]
  ratios: Ratios | null
  analysisStatus: AnalysisStatus | null
  analysisError: string | null
  needsConsultant: boolean
  completedAt: Date
  path: LessonMeta[]
}

type Deps = { mailer: Mailer; renderPdf: (d: ResultData) => Promise<Buffer>; baseUrl: string }

export async function finalizeConsultation(db: Db, id: string, deps: Deps): Promise<void> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c) throw new Error('Consulta no encontrada')
  const settings = await getSettings(db)
  const s = await loadDiagnosticState(db, id)

  const diag = scoreDiagnostic(s.questions, s.answers, s.flags, s.group, settings.dimensionWeights)
  const diagFindings = diagnosticFindings(s.questions, s.answers, s.flags, s.group)
  await db.delete(finding).where(and(eq(finding.consultationId, id), eq(finding.source, 'diagnostico')))
  if (diagFindings.length > 0) await db.insert(finding).values(diagFindings.map((f) => ({ ...f, consultationId: id })))

  const a = await getAnalysis(db, id)
  const analysisFindings =
    a?.status === 'listo'
      ? await db.select().from(finding).where(and(eq(finding.consultationId, id), inArray(finding.source, ['chequeo', 'ia'])))
      : []
  const analysisScore = a?.status === 'listo' ? scoreAnalysis(analysisFindings, settings.severityPenalty) : null
  const finalScore = finalIndex(diag.total, analysisScore, settings.blend)
  const needs = needsConsultant({
    hasFinancialStatements: s.flags.tieneEEFF === true,
    finalScore,
    findings: [...diagFindings, ...analysisFindings],
    threshold: settings.consultantThreshold,
  })

  const firstTime = c.completedAt === null
  await db
    .update(consultation)
    .set({
      status: 'resultado',
      diagnosticScore: diag.total,
      analysisScore,
      finalScore,
      needsConsultant: needs,
      completedAt: c.completedAt ?? new Date(),
    })
    .where(eq(consultation.id, id))

  if (firstTime) {
    try {
      await sendReport(db, id, deps)
    } catch (e) {
      console.error('No se pudo enviar el reporte', e)
    }
  }
}

async function sendReport(db: Db, id: string, deps: Deps): Promise<void> {
  const data = await getResultData(db, id)
  if (!data) return
  const to = await companyEmails(db, data.companyId)
  if (to.length === 0) return
  const { subject, html } = reportEmail({
    companyName: data.companyName,
    score: data.finalScore,
    lightLabel: LIGHT_LABEL[data.light],
    findings: data.findings,
    url: `${deps.baseUrl}/consulta/${id}/resultado`,
    needsConsultant: data.needsConsultant,
  })
  const pdf = await deps.renderPdf(data)
  await deps.mailer.send({ to, subject, html, attachments: [{ filename: 'reporte-crece.pdf', content: pdf }] })
}

export async function getResultData(db: Db, id: string): Promise<ResultData | null> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, id) })
  if (!c || c.status !== 'resultado' || c.finalScore === null || c.completedAt === null) return null
  const settings = await getSettings(db)
  const s = await loadDiagnosticState(db, id)
  const company = await getCompany(db, c.companyId)
  const a = await getAnalysis(db, id)
  const diag = scoreDiagnostic(s.questions, s.answers, s.flags, s.group, settings.dimensionWeights)

  const rows = await db.select().from(finding).where(eq(finding.consultationId, id))
  const findings = rows
    .filter((f) => f.source === 'diagnostico' || a?.status === 'listo')
    .sort((x, y) => SEVERITY_ORDER.indexOf(x.severity) - SEVERITY_ORDER.indexOf(y.severity))

  return {
    consultationId: id,
    companyId: c.companyId,
    companyName: company?.name ?? '',
    group: s.group,
    groupName: GROUP_NAMES[s.group],
    finalScore: c.finalScore,
    light: trafficLight(c.finalScore),
    diagnosticScore: c.diagnosticScore ?? diag.total,
    analysisScore: c.analysisScore,
    dimensions: DIMENSIONS.map((d) => ({ key: d.key, name: d.name, score: diag.dimensions[d.key] })),
    findings,
    ratios: a?.status === 'listo' ? (a.ratios ?? null) : null,
    analysisStatus: a?.status ?? null,
    analysisError: a?.status === 'error' ? a.error : null,
    needsConsultant: c.needsConsultant ?? false,
    completedAt: c.completedAt,
    path: learningPath(findings, LESSONS),
  }
}
```

- [ ] **Step 9: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/report.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 10: PDF** — `src/report/report-pdf.tsx`

```tsx
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { ResultData } from '@/services/report'
import { LIGHT_LABEL } from '@/domain/scoring'
import { SEVERITY_LABEL } from '@/domain/types'
import { RATIO_LABELS } from '@/domain/ratios'
import { formatDateTime } from '@/domain/dates'

const INK = '#14213D'
const MUTED = '#5B6477'
const LIGHT_COLOR = { verde: '#2F9E6B', ambar: '#E0A100', rojo: '#D64545' } as const

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, color: INK, fontFamily: 'Helvetica', lineHeight: 1.4 },
  brand: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 28 },
  muted: { color: MUTED },
  score: { fontSize: 54, fontFamily: 'Helvetica-Bold', marginTop: 18 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 26, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  finding: { marginBottom: 10 },
  bold: { fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 8.5, color: MUTED },
})

function fmtRatio(v: number, percent: boolean) {
  return percent ? `${Math.round(v * 100)} %` : v.toFixed(2)
}

export function ReportPdf({ data }: { data: ResultData }) {
  return (
    <Document title={`CRECE · ${data.companyName}`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.brand}>crece.</Text>
        <Text style={s.muted}>{data.companyName} · Grupo {data.group} · {data.groupName}</Text>
        <Text style={s.muted}>{formatDateTime(data.completedAt)}</Text>
        <Text style={s.score}>{data.finalScore}/100</Text>
        <Text style={{ color: LIGHT_COLOR[data.light] }}>{LIGHT_LABEL[data.light]}</Text>

        <Text style={s.h2}>Por dimensión</Text>
        {data.dimensions.map((d) => (
          <View key={d.key} style={s.row}>
            <Text>{d.name}</Text>
            <Text>{d.score === null ? 'No aplica' : Math.round(d.score)}</Text>
          </View>
        ))}

        <Text style={s.h2}>Hallazgos y plan de acción</Text>
        {data.findings.length === 0 && <Text style={s.muted}>Sin hallazgos relevantes.</Text>}
        {data.findings.map((f) => (
          <View key={f.id} style={s.finding} wrap={false}>
            <Text>
              <Text style={s.bold}>{SEVERITY_LABEL[f.severity]} · </Text>
              {f.title}
            </Text>
            <Text style={s.muted}>{f.recommendation} ({f.niifSection})</Text>
          </View>
        ))}

        {data.ratios && (
          <>
            <Text style={s.h2}>Indicadores</Text>
            {RATIO_LABELS.map((r) => {
              const v = data.ratios![r.key]
              return v === null ? null : (
                <View key={r.key} style={s.row}>
                  <Text>{r.label}</Text>
                  <Text>{fmtRatio(v, r.percent)}</Text>
                </View>
              )
            })}
          </>
        )}

        <Text style={s.footer} fixed>
          Este reporte es orientativo y no constituye una opinión de auditoría.
        </Text>
      </Page>
    </Document>
  )
}

export function renderReportPdf(data: ResultData): Promise<Buffer> {
  return renderToBuffer(<ReportPdf data={data} />)
}
```

- [ ] **Step 11: Prueba rápida del PDF** — agregar a `src/services/report.test.ts` dentro del `describe`

```ts
  it('renderiza el PDF real', async () => {
    const { renderReportPdf } = await import('@/report/report-pdf')
    await answerAll('parcial', true)
    await finalizeConsultation(db, id, deps())
    const pdf = await renderReportPdf((await getResultData(db, id))!)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  })
```

Run: `npx vitest run src/services/report.test.ts`
Expected: PASS (4 pruebas).

- [ ] **Step 12: Commit**

```bash
git add src/mail src/report src/services/report.ts src/services/report.test.ts
git commit -m "feat(reporte): índice final, derivación, PDF y correo del resultado"
```

---

### Task 12: Pantallas Examinar y Resultado, descarga del PDF, acceso y auditoría

**Files:**
- Create: `src/services/access.ts`, `src/services/audit.ts`, `src/ui/score.tsx`, `src/components/result-view.tsx`, `src/components/upload-form.tsx`, `src/app/(app)/consulta/[id]/examinar/page.tsx`, `src/app/(app)/consulta/[id]/resultado/page.tsx`, `src/app/(app)/consulta/[id]/resultado/pdf/route.ts`
- Modify: `src/app/(app)/consulta/actions.ts` (acciones de carga, análisis y cierre), `src/app/(app)/inicio/page.tsx`
- Test: `src/services/access.test.ts`

**Interfaces:**
- Consumes: `ResultData`, `getResultData`, `finalizeConsultation`, `renderReportPdf`, `getMailer`, `appUrl`, `getStorage`, `getAnalyst`, `isMockAnalyst`, `runAnalysis`, `saveUpload`, `listUploads`, `removeUpload`.
- Produces:
  - `canViewConsultation(db, u: { id: string; role: Role }, consultationId: string): Promise<boolean>`
  - `audit(db, e: { userId: string | null; action: string; entity: string; entityId: string }): Promise<void>`
  - `Score({ value, size? })`, `ResultView({ data, actions, pdfHref })`, `UploadForm({ action })`
  - acciones: `uploadAction(id, fd)`, `removeUploadAction(id, uploadId)`, `analyzeAction(id)`, `finalizeAction(id)`

- [ ] **Step 1: Prueba que falla** — `src/services/access.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { appointment } from '@/db/schema'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { startConsultation } from './consultations'
import { canViewConsultation } from './access'

describe('canViewConsultation', () => {
  it('permite a la empresa dueña, al admin y al consultor con cita; niega al resto', async () => {
    const db = await makeTestDb()
    const owner = await createUserWithPassword(db, { email: 'o@x.co', name: 'O', role: 'empresa', password: 'Clave12345!' })
    const other = await createUserWithPassword(db, { email: 'p@x.co', name: 'P', role: 'empresa', password: 'Clave12345!' })
    const admin = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'admin', password: 'Clave12345!' })
    const cons = await createUserWithPassword(db, { email: 'c@x.co', name: 'C', role: 'consultor', password: 'Clave12345!' })
    const cons2 = await createUserWithPassword(db, { email: 'd@x.co', name: 'D', role: 'consultor', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId: owner, name: 'E', nit: '900' })
    await createCompanyForUser(db, { userId: other, name: 'F', nit: '901' })
    const id = await startConsultation(db, companyId)
    await db.insert(appointment).values({ consultantId: cons, companyId, consultationId: id, startsAt: new Date(), endsAt: new Date() })

    expect(await canViewConsultation(db, { id: owner, role: 'empresa' }, id)).toBe(true)
    expect(await canViewConsultation(db, { id: admin, role: 'admin' }, id)).toBe(true)
    expect(await canViewConsultation(db, { id: cons, role: 'consultor' }, id)).toBe(true)
    expect(await canViewConsultation(db, { id: other, role: 'empresa' }, id)).toBe(false)
    expect(await canViewConsultation(db, { id: cons2, role: 'consultor' }, id)).toBe(false)
    expect(await canViewConsultation(db, { id: admin, role: 'admin' }, 'no-existe')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/access.test.ts`
Expected: FAIL — `./access` no existe.

- [ ] **Step 3: `src/services/access.ts` y `src/services/audit.ts`**

```ts
// src/services/access.ts
import { and, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, companyMember, consultation } from '@/db/schema'
import type { Role } from '@/domain/types'

export async function canViewConsultation(db: Db, u: { id: string; role: Role }, consultationId: string): Promise<boolean> {
  const c = await db.query.consultation.findFirst({ where: eq(consultation.id, consultationId) })
  if (!c) return false
  if (u.role === 'admin') return true
  if (u.role === 'empresa') {
    const m = await db.query.companyMember.findFirst({
      where: and(eq(companyMember.userId, u.id), eq(companyMember.companyId, c.companyId)),
    })
    return Boolean(m)
  }
  const a = await db.query.appointment.findFirst({
    where: and(eq(appointment.consultantId, u.id), eq(appointment.companyId, c.companyId)),
  })
  return Boolean(a)
}
```

```ts
// src/services/audit.ts
import type { Db } from '@/db/client'
import { auditLog } from '@/db/schema'

export async function audit(
  db: Db,
  e: { userId: string | null; action: string; entity: string; entityId: string },
): Promise<void> {
  await db.insert(auditLog).values(e)
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/access.test.ts`
Expected: PASS.

- [ ] **Step 5: Acciones de carga, análisis y cierre** — agregar a `src/app/(app)/consulta/actions.ts`

Agregar estos imports al inicio del archivo:

```ts
import { getAnalyst } from '@/ai/analyst'
import { getStorage } from '@/storage/storage'
import { appUrl, getMailer } from '@/mail/mailer'
import { renderReportPdf } from '@/report/report-pdf'
import { removeUpload, saveUpload } from '@/services/uploads'
import { runAnalysis } from '@/services/analysis'
import { finalizeConsultation } from '@/services/report'
import { audit } from '@/services/audit'
```

Y agregar al final:

```ts
export async function uploadAction(id: string, fd: FormData) {
  const { user } = await owned(id)
  const storage = getStorage()
  for (const file of fd.getAll('files')) {
    if (!(file instanceof File) || file.size === 0) continue
    const r = await saveUpload(db, storage, {
      consultationId: id,
      name: file.name,
      size: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
    })
    if (!r.ok) redirect(`/consulta/${id}/examinar?error=${encodeURIComponent(`${file.name}: ${r.error}`)}`)
    await audit(db, { userId: user.id, action: 'subir_archivo', entity: 'upload', entityId: r.id })
  }
  redirect(`/consulta/${id}/examinar`)
}

export async function removeUploadAction(id: string, uploadId: string) {
  await owned(id)
  await removeUpload(db, id, uploadId)
  redirect(`/consulta/${id}/examinar`)
}

async function finish(id: string) {
  await finalizeConsultation(db, id, { mailer: getMailer(), renderPdf: renderReportPdf, baseUrl: appUrl() })
  redirect(`/consulta/${id}/resultado`)
}

export async function analyzeAction(id: string) {
  const { user } = await owned(id)
  await runAnalysis(db, id, { analyst: getAnalyst(), storage: getStorage() })
  await audit(db, { userId: user.id, action: 'analizar', entity: 'consultation', entityId: id })
  await finish(id)
}

export async function finalizeAction(id: string) {
  await owned(id)
  await finish(id)
}
```

- [ ] **Step 6: Componentes de resultado**

`src/ui/score.tsx`:

```tsx
import { LIGHT_LABEL, trafficLight } from '@/domain/scoring'

const DOT = { verde: 'bg-ok', ambar: 'bg-warn', rojo: 'bg-bad' } as const

export function Score({ value, size = 'lg' }: { value: number; size?: 'lg' | 'md' }) {
  const light = trafficLight(value)
  return (
    <div>
      <p className={size === 'lg' ? 'text-8xl font-semibold tracking-tight' : 'text-5xl font-semibold tracking-tight'}>
        {value}
        <span className="text-2xl font-normal text-muted">/100</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-muted">
        <span className={`size-2.5 rounded-full ${DOT[light]}`} aria-hidden />
        {LIGHT_LABEL[light]}
      </p>
    </div>
  )
}
```

`src/components/result-view.tsx`:

```tsx
import Link from 'next/link'
import type { ResultData } from '@/services/report'
import { RATIO_LABELS } from '@/domain/ratios'
import { SEVERITY_LABEL, type Severity } from '@/domain/types'
import { Score } from '@/ui/score'
import { buttonClass } from '@/ui/button'

const SEV_DOT: Record<Severity, string> = { critica: 'bg-bad', alta: 'bg-bad', media: 'bg-warn', baja: 'bg-muted' }

function FindingItem({ f }: { f: ResultData['findings'][number] }) {
  return (
    <li className="space-y-1 py-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <span className={`size-2 rounded-full ${SEV_DOT[f.severity]}`} aria-hidden />
        {SEVERITY_LABEL[f.severity]} · {f.niifSection}
      </p>
      <p className="font-medium">{f.title}</p>
      <p className="text-muted">{f.recommendation}</p>
    </li>
  )
}

export function ResultView({
  data,
  actions,
  pdfHref,
  mockNote = false,
}: {
  data: ResultData
  actions?: React.ReactNode
  pdfHref: string
  mockNote?: boolean
}) {
  const top = data.findings.slice(0, 5)
  const rest = data.findings.slice(5)
  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <p className="text-sm text-muted">{data.companyName} · Grupo {data.group} · {data.groupName}</p>
        <Score value={data.finalScore} />
        {actions && <div className="flex flex-wrap items-center gap-6">{actions}</div>}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Por dimensión</h2>
        <ul className="space-y-4">
          {data.dimensions.map((d) => (
            <li key={d.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2">
              <span>{d.name}</span>
              <span className="text-muted tabular-nums">{d.score === null ? 'No aplica' : Math.round(d.score)}</span>
              <div className="col-span-2 h-1 rounded-full bg-surface">
                <div className="h-1 rounded-full bg-brand" style={{ width: `${d.score ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Qué hacer primero</h2>
        {data.findings.length === 0 ? (
          <p className="text-muted">No encontramos brechas relevantes.</p>
        ) : (
          <ul className="divide-y divide-surface">
            {top.map((f) => <FindingItem key={f.id} f={f} />)}
          </ul>
        )}
        {rest.length > 0 && (
          <details>
            <summary className="cursor-pointer py-2 text-sm text-muted">Ver {rest.length} más</summary>
            <ul className="divide-y divide-surface">
              {rest.map((f) => <FindingItem key={f.id} f={f} />)}
            </ul>
          </details>
        )}
      </section>

      {data.ratios && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Indicadores</h2>
          <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-3">
            {RATIO_LABELS.map((r) => {
              const v = data.ratios![r.key]
              if (v === null) return null
              return (
                <div key={r.key}>
                  <dt className="text-sm text-muted">{r.label}</dt>
                  <dd className="text-xl font-medium tabular-nums">{r.percent ? `${Math.round(v * 100)} %` : v.toFixed(2)}</dd>
                </div>
              )
            })}
          </dl>
        </section>
      )}

      <footer className="space-y-3 text-sm text-muted">
        {data.analysisError && (
          <p>No pudimos leer sus estados financieros ({data.analysisError}). El índice usa solo el diagnóstico.</p>
        )}
        {mockNote && data.analysisStatus === 'listo' && <p>Análisis de demostración: aún no hay un modelo de IA configurado.</p>}
        <p>
          <Link href={pdfHref} className={buttonClass('link')} prefetch={false}>Descargar PDF</Link>
        </p>
        <p>Este reporte es orientativo y no constituye una opinión de auditoría.</p>
      </footer>
    </div>
  )
}
```

`src/components/upload-form.tsx`:

```tsx
'use client'
import { useRef } from 'react'
import { useFormStatus } from 'react-dom'

function DropArea({ onPick }: { onPick: () => void }) {
  const { pending } = useFormStatus()
  return (
    <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-surface transition-colors hover:bg-brand-soft">
      <span className="font-medium">{pending ? 'Subiendo…' : 'Elegir archivos'}</span>
      <span className="text-sm text-muted">PDF o Excel · hasta 4 MB</span>
      <input
        type="file"
        name="files"
        multiple
        accept=".pdf,.xlsx,.xls"
        className="sr-only"
        disabled={pending}
        onChange={onPick}
      />
    </label>
  )
}

export function UploadForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null)
  return (
    <form ref={ref} action={action}>
      <DropArea onPick={() => ref.current?.requestSubmit()} />
    </form>
  )
}
```

- [ ] **Step 7: Pantalla Examinar** — `src/app/(app)/consulta/[id]/examinar/page.tsx`

```tsx
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { listUploads } from '@/services/uploads'
import { analyzeAction, finalizeAction, removeUploadAction, uploadAction } from '../../actions'
import { UploadForm } from '@/components/upload-form'
import { Steps } from '@/ui/steps'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

export const maxDuration = 60

export default async function ExaminarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status === 'clasificar' || c.status === 'revisar') redirect(stepPath(id, c.status))

  if (c.flags.tieneEEFF !== true) {
    return (
      <>
        <Steps current={2} />
        <section className="space-y-6">
          <h1 className="text-3xl font-semibold">Sin estados financieros no hay nada que examinar</h1>
          <p className="max-w-prose text-muted">Le mostramos su resultado con lo que respondió. Un consultor puede ayudarle a prepararlos.</p>
          <form action={finalizeAction.bind(null, id)}>
            <SubmitButton pendingLabel="Calculando…">Ver resultado</SubmitButton>
          </form>
        </section>
      </>
    )
  }

  const files = await listUploads(db, id)
  return (
    <>
      <Steps current={2} />
      <section className="space-y-8">
        <h1 className="text-3xl font-semibold">Suba sus estados financieros</h1>
        <UploadForm action={uploadAction.bind(null, id)} />
        {error && <p className="text-sm text-bad">{error}</p>}
        {files.length > 0 && (
          <ul className="divide-y divide-surface">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-3">
                <span className="truncate">{f.fileName}</span>
                <form action={removeUploadAction.bind(null, id, f.id)}>
                  <button className={buttonClass('link')}>Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-6">
          {files.length > 0 && (
            <form action={analyzeAction.bind(null, id)}>
              <SubmitButton pendingLabel="Analizando… puede tardar un minuto">Analizar</SubmitButton>
            </form>
          )}
          <form action={finalizeAction.bind(null, id)}>
            <button className={buttonClass('link')}>{files.length > 0 ? 'Ver resultado sin analizar' : 'Continuar sin archivos'}</button>
          </form>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 8: Pantalla Resultado** — `src/app/(app)/consulta/[id]/resultado/page.tsx`

```tsx
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { getOwnedConsultation, stepPath } from '@/services/consultations'
import { getResultData } from '@/services/report'
import { isMockAnalyst } from '@/ai/analyst'
import { ResultView } from '@/components/result-view'
import { Steps } from '@/ui/steps'
import { ButtonLink, buttonClass } from '@/ui/button'

export default async function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { companyId } = await requireCompany()
  const c = await getOwnedConsultation(db, id, companyId)
  if (!c) notFound()
  if (c.status !== 'resultado') redirect(stepPath(id, c.status))
  const data = await getResultData(db, id)
  if (!data) notFound()

  const agenda = { href: '/agenda', label: data.needsConsultant ? 'Agendar con un consultor' : 'Hablar con un consultor' }
  const ruta = { href: '/academia', label: 'Ver mi ruta de aprendizaje' }
  const [primary, secondary] = data.needsConsultant ? [agenda, ruta] : [ruta, agenda]

  return (
    <>
      <Steps current={data.needsConsultant ? 4 : 3} />
      <ResultView
        data={data}
        pdfHref={`/consulta/${id}/resultado/pdf`}
        mockNote={isMockAnalyst()}
        actions={
          <>
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <Link href={secondary.href} className={buttonClass('link')}>{secondary.label}</Link>
          </>
        }
      />
    </>
  )
}
```

- [ ] **Step 9: Descarga del PDF** — `src/app/(app)/consulta/[id]/resultado/pdf/route.ts`

```ts
import { db } from '@/db'
import { getCurrentUser } from '@/lib/session'
import { canViewConsultation } from '@/services/access'
import { audit } from '@/services/audit'
import { getResultData } from '@/services/report'
import { renderReportPdf } from '@/report/report-pdf'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  if (!(await canViewConsultation(db, user, id))) return new Response('No encontrado', { status: 404 })
  const data = await getResultData(db, id)
  if (!data) return new Response('No encontrado', { status: 404 })

  await audit(db, { userId: user.id, action: 'descargar_reporte', entity: 'consultation', entityId: id })
  const pdf = await renderReportPdf(data)
  const name = data.companyName.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="crece-${name}.pdf"`,
    },
  })
}
```

- [ ] **Step 10: Inicio con el último resultado** — reemplazar `src/app/(app)/inicio/page.tsx`

```tsx
import Link from 'next/link'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { latestConsultation } from '@/services/consultations'
import { startConsultationAction } from '../consulta/actions'
import { Score } from '@/ui/score'
import { ButtonLink, buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

export default async function InicioPage() {
  const { user, companyId } = await requireCompany()
  const last = await latestConsultation(db, companyId)
  const firstName = user.name.split(' ')[0]

  if (last?.status === 'resultado' && last.finalScore !== null) {
    return (
      <section className="space-y-10 pt-6">
        <p className="text-muted">Hola, {firstName}. Su índice de salud NIIF:</p>
        <Score value={last.finalScore} />
        <div className="flex flex-wrap items-center gap-6">
          <ButtonLink href={`/consulta/${last.id}/resultado`}>Ver resultado</ButtonLink>
          <form action={startConsultationAction}>
            <button className={buttonClass('link')}>Nueva consulta</button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 pt-10">
      <h1 className="text-4xl font-semibold tracking-tight">Hola, {firstName}</h1>
      <p className="max-w-prose text-lg text-muted">Su consulta NIIF toma unos 15 minutos.</p>
      <form action={startConsultationAction}>
        <SubmitButton>{last ? 'Continuar consulta' : 'Iniciar consulta'}</SubmitButton>
      </form>
      <p className="text-sm text-muted">
        ¿Prefiere hablar con alguien? <Link href="/agenda" className="underline underline-offset-4">Agende un consultor</Link>
      </p>
    </section>
  )
}
```

- [ ] **Step 11: Verificar en el navegador**

Run: `npm run dev`. Completar una consulta respondiendo "Sí" a todo, subir cualquier Excel con texto (más de 50 caracteres) y pulsar "Analizar".
Expected: `/consulta/<id>/resultado` muestra 94/100 "Saludable", 5 dimensiones, 2 hallazgos de IA, indicadores y la nota "Análisis de demostración". "Descargar PDF" baja un PDF. En `.data/emails/` hay un `.html` del reporte y `…-reporte-crece.pdf`. `/inicio` muestra el índice y "Ver resultado".

Run: `npm test && npm run build`
Expected: todas las pruebas pasan; build exitoso.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(consulta): pasos Examinar y Comunicar, PDF descargable, acceso y auditoría"
```

---
### Task 13: Agenda con consultores (Escalar)

**Files:**
- Create: `src/services/agenda.ts`, `src/app/(app)/agenda/page.tsx`, `src/app/(app)/agenda/actions.ts`, `src/app/(app)/agenda/[appointmentId]/ics/route.ts`, `src/app/api/cron/recordatorios/route.ts`
- Modify: `src/app/(app)/inicio/page.tsx` (línea de la próxima cita)
- Test: `src/services/agenda.test.ts`

**Interfaces:**
- Consumes: `availableSlots`, `uniqueTimes`, `BOGOTA_OFFSET_MIN`, `buildIcs`, `formatDateTime`, `appointmentEmail`, `Mailer`, `appUrl`, `companyEmails`, `getSettings`.
- Produces:
  - `openSlots(db, now?: Date): Promise<Slot[]>` (14 días)
  - `type BookResult = { ok: true; appointmentId: string } | { ok: false; reason: 'ocupado' | 'ya-tiene-cita' }`
  - `bookAppointment(db, i: { companyId: string; startsAt: Date; now?: Date }): Promise<BookResult>` (asigna el consultor con menos citas)
  - `upcomingForCompany(db, companyId, now?)` → `{ id, startsAt, endsAt, consultantName } | null`
  - `cancelAppointment(db, appointmentId, companyId): Promise<boolean>`
  - `getAppointmentDetail(db, appointmentId)` → `{ appointment, companyName, consultantName, consultantEmail } | null`
  - `appointmentIcs(detail): string`
  - `notifyAppointment(db, appointmentId, kind: 'confirmada' | 'recordatorio' | 'cancelada', mailer, baseUrl): Promise<void>`
  - `dueReminders(db, now?): Promise<{ id: string }[]>`, `markReminded(db, id)`
  - `consultantAgenda(db, consultantId, now?)`, `getAppointmentForConsultant(db, appointmentId, consultantId)`, `saveNotes(db, appointmentId, consultantId, notes)`, `completeAppointment(db, appointmentId, consultantId)`
  - `getAvailability(db, consultantId)`, `setAvailability(db, consultantId, rules: { weekday: number; startMinute: number; endMinute: number }[])`

- [ ] **Step 1: Prueba que falla** — `src/services/agenda.test.ts`

```ts
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { seedDatabase, DEMO_CONSULTANT } from '@/db/seed-data'
import { fileMailer } from '@/mail/mailer'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import {
  bookAppointment,
  cancelAppointment,
  consultantAgenda,
  dueReminders,
  getAppointmentForConsultant,
  getAvailability,
  markReminded,
  notifyAppointment,
  openSlots,
  saveNotes,
  setAvailability,
  upcomingForCompany,
} from './agenda'

// Lunes 21 sep 2026, 08:00 en Bogotá
const now = new Date('2026-09-21T13:00:00Z')
let db: Db
let a: string
let b: string
let consultantId: string

async function company(email: string) {
  const u = await createUserWithPassword(db, { email, name: email, role: 'empresa', password: 'Clave12345!' })
  return createCompanyForUser(db, { userId: u, name: `Empresa ${email}`, nit: '900' })
}

beforeEach(async () => {
  db = await makeTestDb()
  await seedDatabase(db)
  a = await company('a@x.co')
  b = await company('b@x.co')
  consultantId = (await db.query.user.findFirst({ where: eq(user.email, DEMO_CONSULTANT.email) }))!.id
})

describe('agenda', () => {
  it('ofrece franjas con 2 horas de anticipación', async () => {
    const slots = await openSlots(db, now)
    expect(slots[0].startsAt.toISOString()).toBe('2026-09-21T16:00:00.000Z') // 11:00 Bogotá
  })

  it('reserva, evita dobles reservas y libera al cancelar', async () => {
    const startsAt = new Date('2026-09-21T16:00:00Z')
    const r = await bookAppointment(db, { companyId: a, startsAt, now })
    expect(r.ok).toBe(true)
    expect(await bookAppointment(db, { companyId: b, startsAt, now })).toEqual({ ok: false, reason: 'ocupado' })
    expect(await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T19:00:00Z'), now })).toEqual({ ok: false, reason: 'ya-tiene-cita' })

    const up = await upcomingForCompany(db, a, now)
    expect(up?.consultantName).toBe('Laura Consultora')
    expect(await cancelAppointment(db, up!.id, b)).toBe(false)
    expect(await cancelAppointment(db, up!.id, a)).toBe(true)
    expect((await bookAppointment(db, { companyId: b, startsAt, now })).ok).toBe(true)
  })

  it('recordatorios de las próximas 24 horas', async () => {
    await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    const due = await dueReminders(db, now)
    expect(due).toHaveLength(1)
    await markReminded(db, due[0].id)
    expect(await dueReminders(db, now)).toHaveLength(0)
  })

  it('envía correos con invitación a la empresa y al consultor', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'crece-ag-'))
    const r = await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    if (!r.ok) throw new Error('reserva fallida')
    await notifyAppointment(db, r.appointmentId, 'confirmada', fileMailer(dir), 'https://crece.test')
    const files = readdirSync(dir)
    expect(files.filter((f) => f.endsWith('.html'))).toHaveLength(2)
    expect(files.filter((f) => f.endsWith('.ics'))).toHaveLength(2)
  })

  it('panel del consultor: agenda, notas y disponibilidad', async () => {
    const r = await bookAppointment(db, { companyId: a, startsAt: new Date('2026-09-21T16:00:00Z'), now })
    if (!r.ok) throw new Error('reserva fallida')
    const list = await consultantAgenda(db, consultantId, now)
    expect(list).toHaveLength(1)
    expect(list[0].companyName).toBe('Empresa a@x.co')

    const other = await createUserWithPassword(db, { email: 'z@x.co', name: 'Z', role: 'consultor', password: 'Clave12345!' })
    expect(await getAppointmentForConsultant(db, r.appointmentId, other)).toBeNull()
    await saveNotes(db, r.appointmentId, consultantId, 'Revisar políticas')
    expect((await getAppointmentForConsultant(db, r.appointmentId, consultantId))?.notes).toBe('Revisar políticas')

    await setAvailability(db, consultantId, [{ weekday: 2, startMinute: 540, endMinute: 600 }])
    expect(await getAvailability(db, consultantId)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/agenda.test.ts`
Expected: FAIL — `./agenda` no existe.

- [ ] **Step 3: `src/services/agenda.ts`**

```ts
import { and, asc, count, desc, eq, gt, isNull, lt, lte } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, availability, company, consultation, user } from '@/db/schema'
import { availableSlots, type Slot } from '@/domain/slots'
import { BOGOTA_OFFSET_MIN, formatDateTime } from '@/domain/dates'
import { buildIcs } from '@/domain/ics'
import type { Mailer } from '@/mail/mailer'
import { appointmentEmail } from '@/mail/templates'
import { companyEmails } from './companies'
import { getSettings } from './settings'

export async function openSlots(db: Db, now = new Date()): Promise<Slot[]> {
  const settings = await getSettings(db)
  const rules = await db
    .select({ consultantId: availability.consultantId, weekday: availability.weekday, startMinute: availability.startMinute, endMinute: availability.endMinute })
    .from(availability)
  const busy = await db
    .select({ consultantId: appointment.consultantId, startsAt: appointment.startsAt, endsAt: appointment.endsAt })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
  return availableSlots({ rules, busy, now, days: 14, durationMin: settings.appointmentMinutes, offsetMin: BOGOTA_OFFSET_MIN })
}

export type BookResult = { ok: true; appointmentId: string } | { ok: false; reason: 'ocupado' | 'ya-tiene-cita' }

export async function bookAppointment(db: Db, i: { companyId: string; startsAt: Date; now?: Date }): Promise<BookResult> {
  const now = i.now ?? new Date()
  if (await upcomingForCompany(db, i.companyId, now)) return { ok: false, reason: 'ya-tiene-cita' }

  const settings = await getSettings(db)
  const endsAt = new Date(i.startsAt.getTime() + settings.appointmentMinutes * 60_000)
  const candidates = (await openSlots(db, now))
    .filter((s) => s.startsAt.getTime() === i.startsAt.getTime())
    .map((s) => s.consultantId)
  if (candidates.length === 0) return { ok: false, reason: 'ocupado' }

  const load = await db
    .select({ consultantId: appointment.consultantId, n: count() })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.startsAt, now)))
    .groupBy(appointment.consultantId)
  const loadOf = (id: string) => load.find((l) => l.consultantId === id)?.n ?? 0
  const consultantId = [...candidates].sort((x, y) => loadOf(x) - loadOf(y))[0]

  const last = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, i.companyId), eq(consultation.status, 'resultado')),
    orderBy: desc(consultation.completedAt),
  })

  return db.transaction(async (tx): Promise<BookResult> => {
    const clash = await tx
      .select({ id: appointment.id })
      .from(appointment)
      .where(
        and(
          eq(appointment.consultantId, consultantId),
          eq(appointment.status, 'reservada'),
          lt(appointment.startsAt, endsAt),
          gt(appointment.endsAt, i.startsAt),
        ),
      )
    if (clash.length > 0) return { ok: false, reason: 'ocupado' }
    const [row] = await tx
      .insert(appointment)
      .values({ consultantId, companyId: i.companyId, consultationId: last?.id ?? null, startsAt: i.startsAt, endsAt })
      .returning({ id: appointment.id })
    return { ok: true, appointmentId: row.id }
  })
}

export async function upcomingForCompany(db: Db, companyId: string, now = new Date()) {
  const [row] = await db
    .select({ id: appointment.id, startsAt: appointment.startsAt, endsAt: appointment.endsAt, consultantName: user.name })
    .from(appointment)
    .innerJoin(user, eq(user.id, appointment.consultantId))
    .where(and(eq(appointment.companyId, companyId), eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
    .orderBy(asc(appointment.startsAt))
    .limit(1)
  return row ?? null
}

export async function cancelAppointment(db: Db, appointmentId: string, companyId: string): Promise<boolean> {
  const rows = await db
    .update(appointment)
    .set({ status: 'cancelada' })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.companyId, companyId), eq(appointment.status, 'reservada')))
    .returning({ id: appointment.id })
  return rows.length > 0
}

export async function getAppointmentDetail(db: Db, appointmentId: string) {
  const [row] = await db
    .select({ appointment, companyName: company.name, consultantName: user.name, consultantEmail: user.email })
    .from(appointment)
    .innerJoin(company, eq(company.id, appointment.companyId))
    .innerJoin(user, eq(user.id, appointment.consultantId))
    .where(eq(appointment.id, appointmentId))
  return row ?? null
}

type Detail = NonNullable<Awaited<ReturnType<typeof getAppointmentDetail>>>

export function appointmentIcs(d: Detail): string {
  return buildIcs({
    uid: d.appointment.id,
    start: d.appointment.startsAt,
    end: d.appointment.endsAt,
    summary: `Consulta NIIF CRECE · ${d.companyName}`,
    description: `Consulta con ${d.consultantName}.`,
  })
}

export async function notifyAppointment(
  db: Db,
  appointmentId: string,
  kind: 'confirmada' | 'recordatorio' | 'cancelada',
  mailer: Mailer,
  baseUrl: string,
): Promise<void> {
  const d = await getAppointmentDetail(db, appointmentId)
  if (!d) return
  const when = formatDateTime(d.appointment.startsAt)
  const ics = kind === 'cancelada' ? [] : [{ filename: 'cita-crece.ics', content: Buffer.from(appointmentIcs(d)) }]
  const base = { when, companyName: d.companyName, consultantName: d.consultantName }

  const toCompany = appointmentEmail({ ...base, kind, url: `${baseUrl}/agenda` })
  await mailer.send({ to: await companyEmails(db, d.appointment.companyId), ...toCompany, attachments: ics })

  if (kind === 'recordatorio') return
  const toConsultant = appointmentEmail({
    ...base,
    kind: kind === 'confirmada' ? 'asignada' : 'cancelada',
    url: `${baseUrl}/consultor/casos/${appointmentId}`,
  })
  await mailer.send({ to: [d.consultantEmail], ...toConsultant, attachments: ics })
}

export async function dueReminders(db: Db, now = new Date()) {
  return db
    .select({ id: appointment.id })
    .from(appointment)
    .where(
      and(
        eq(appointment.status, 'reservada'),
        isNull(appointment.remindedAt),
        gt(appointment.startsAt, now),
        lte(appointment.startsAt, new Date(now.getTime() + 24 * 3_600_000)),
      ),
    )
}

export async function markReminded(db: Db, id: string): Promise<void> {
  await db.update(appointment).set({ remindedAt: new Date() }).where(eq(appointment.id, id))
}

// ── Consultor ─────────────────────────────────────────────────
export async function consultantAgenda(db: Db, consultantId: string, now = new Date()) {
  return db
    .select({
      id: appointment.id,
      startsAt: appointment.startsAt,
      companyName: company.name,
      finalScore: consultation.finalScore,
    })
    .from(appointment)
    .innerJoin(company, eq(company.id, appointment.companyId))
    .leftJoin(consultation, eq(consultation.id, appointment.consultationId))
    .where(and(eq(appointment.consultantId, consultantId), eq(appointment.status, 'reservada'), gt(appointment.endsAt, now)))
    .orderBy(asc(appointment.startsAt))
}

export async function getAppointmentForConsultant(db: Db, appointmentId: string, consultantId: string) {
  const row = await db.query.appointment.findFirst({
    where: and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)),
  })
  return row ?? null
}

export async function saveNotes(db: Db, appointmentId: string, consultantId: string, notes: string): Promise<void> {
  await db
    .update(appointment)
    .set({ notes })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)))
}

export async function completeAppointment(db: Db, appointmentId: string, consultantId: string): Promise<void> {
  await db
    .update(appointment)
    .set({ status: 'realizada' })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.consultantId, consultantId)))
}

export async function getAvailability(db: Db, consultantId: string) {
  return db.select().from(availability).where(eq(availability.consultantId, consultantId)).orderBy(asc(availability.weekday), asc(availability.startMinute))
}

export async function setAvailability(
  db: Db,
  consultantId: string,
  rules: { weekday: number; startMinute: number; endMinute: number }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(availability).where(eq(availability.consultantId, consultantId))
    if (rules.length > 0) await tx.insert(availability).values(rules.map((r) => ({ ...r, consultantId })))
  })
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/agenda.test.ts`
Expected: PASS (5 pruebas).

- [ ] **Step 5: Acciones** — `src/app/(app)/agenda/actions.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { appUrl, getMailer } from '@/mail/mailer'
import { bookAppointment, cancelAppointment, notifyAppointment } from '@/services/agenda'

export async function bookAction(fd: FormData) {
  const { companyId } = await requireCompany()
  const startsAt = new Date(String(fd.get('startsAt') ?? ''))
  if (Number.isNaN(startsAt.getTime())) redirect('/agenda')
  const r = await bookAppointment(db, { companyId, startsAt })
  if (!r.ok) redirect(`/agenda?error=${r.reason}`)
  try {
    await notifyAppointment(db, r.appointmentId, 'confirmada', getMailer(), appUrl())
  } catch (e) {
    console.error('No se pudo enviar la confirmación', e)
  }
  redirect('/agenda')
}

export async function cancelAction(appointmentId: string) {
  const { companyId } = await requireCompany()
  if (await cancelAppointment(db, appointmentId, companyId)) {
    try {
      await notifyAppointment(db, appointmentId, 'cancelada', getMailer(), appUrl())
    } catch (e) {
      console.error('No se pudo enviar la cancelación', e)
    }
  }
  redirect('/agenda')
}
```

- [ ] **Step 6: Pantalla Agenda (día → hora → confirmar)** — `src/app/(app)/agenda/page.tsx`

```tsx
import Link from 'next/link'
import { db } from '@/db'
import { requireCompany } from '@/lib/session'
import { openSlots, upcomingForCompany } from '@/services/agenda'
import { uniqueTimes } from '@/domain/slots'
import { formatDateTime, formatDay, formatTime, localDayKey } from '@/domain/dates'
import { bookAction, cancelAction } from './actions'
import { buttonClass } from '@/ui/button'
import { SubmitButton } from '@/ui/submit-button'

const option =
  'flex h-14 items-center justify-center rounded-2xl bg-surface font-medium capitalize transition-colors hover:bg-brand-soft'

const ERRORS: Record<string, string> = {
  ocupado: 'Ese horario acaba de ocuparse. Elija otro.',
  'ya-tiene-cita': 'Ya tiene una cita agendada.',
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; hora?: string; error?: string }>
}) {
  const { companyId } = await requireCompany()
  const { dia, hora, error } = await searchParams

  const upcoming = await upcomingForCompany(db, companyId)
  if (upcoming) {
    return (
      <section className="space-y-6 pt-6">
        <p className="text-muted">Su cita</p>
        <h1 className="text-3xl font-semibold first-letter:uppercase">{formatDateTime(upcoming.startsAt)}</h1>
        <p className="text-muted">Con {upcoming.consultantName}. Le enviamos la invitación a su correo.</p>
        <div className="flex flex-wrap items-center gap-6">
          <a href={`/agenda/${upcoming.id}/ics`} className={buttonClass('primary')}>Agregar a mi calendario</a>
          <form action={cancelAction.bind(null, upcoming.id)}>
            <button className={buttonClass('link')}>Cancelar cita</button>
          </form>
        </div>
      </section>
    )
  }

  const times = uniqueTimes(await openSlots(db))
  const days = [...new Set(times.map((t) => localDayKey(t)))].slice(0, 6)
  const errorText = error ? ERRORS[error] : null

  if (times.length === 0) {
    return (
      <section className="space-y-4 pt-6">
        <h1 className="text-3xl font-semibold">No hay horarios disponibles</h1>
        <p className="text-muted">Vuelva a intentarlo en unos días.</p>
      </section>
    )
  }

  const chosen = hora ? times.find((t) => t.toISOString() === hora) : undefined
  if (dia && chosen) {
    return (
      <section className="space-y-6 pt-6">
        <p className="text-sm text-muted">Paso 3 de 3</p>
        <h1 className="text-3xl font-semibold first-letter:uppercase">{formatDateTime(chosen)}</h1>
        <p className="text-muted">Consulta de 60 minutos con un consultor NIIF.</p>
        <div className="flex flex-wrap items-center gap-6">
          <form action={bookAction}>
            <input type="hidden" name="startsAt" value={chosen.toISOString()} />
            <SubmitButton pendingLabel="Agendando…">Confirmar cita</SubmitButton>
          </form>
          <Link href={`/agenda?dia=${dia}`} className={buttonClass('link')}>Elegir otra hora</Link>
        </div>
      </section>
    )
  }

  if (dia && days.includes(dia)) {
    const hours = times.filter((t) => localDayKey(t) === dia)
    return (
      <section className="space-y-8 pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted">Paso 2 de 3</p>
          <h1 className="text-3xl font-semibold">¿A qué hora?</h1>
          <p className="capitalize text-muted">{formatDay(hours[0])}</p>
        </div>
        <ul className="grid grid-cols-3 gap-3">
          {hours.map((h) => (
            <li key={h.toISOString()}>
              <Link href={`/agenda?dia=${dia}&hora=${encodeURIComponent(h.toISOString())}`} className={option}>
                {formatTime(h)}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/agenda" className={buttonClass('link')}>Otro día</Link>
      </section>
    )
  }

  return (
    <section className="space-y-8 pt-6">
      <div className="space-y-2">
        <p className="text-sm text-muted">Paso 1 de 3</p>
        <h1 className="text-3xl font-semibold">¿Qué día le sirve?</h1>
      </div>
      {errorText && <p className="text-sm text-bad">{errorText}</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {days.map((d) => (
          <li key={d}>
            <Link href={`/agenda?dia=${d}`} className={option}>
              {formatDay(times.find((t) => localDayKey(t) === d)!)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 7: Invitación .ics** — `src/app/(app)/agenda/[appointmentId]/ics/route.ts`

```ts
import { db } from '@/db'
import { getCurrentUser } from '@/lib/session'
import { appointmentIcs, getAppointmentDetail } from '@/services/agenda'
import { getCompanyIdForUser } from '@/services/companies'

export async function GET(_req: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const user = await getCurrentUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  const d = await getAppointmentDetail(db, appointmentId)
  if (!d) return new Response('No encontrado', { status: 404 })
  const allowed =
    d.appointment.consultantId === user.id || (await getCompanyIdForUser(db, user.id)) === d.appointment.companyId
  if (!allowed) return new Response('No encontrado', { status: 404 })
  return new Response(appointmentIcs(d), {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': 'attachment; filename="cita-crece.ics"',
    },
  })
}
```

- [ ] **Step 8: Cron de recordatorios** — `src/app/api/cron/recordatorios/route.ts`

```ts
import { db } from '@/db'
import { appUrl, getMailer } from '@/mail/mailer'
import { dueReminders, markReminded, notifyAppointment } from '@/services/agenda'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('No autorizado', { status: 401 })
  }
  const due = await dueReminders(db)
  let sent = 0
  for (const a of due) {
    try {
      await notifyAppointment(db, a.id, 'recordatorio', getMailer(), appUrl())
      await markReminded(db, a.id)
      sent++
    } catch (e) {
      console.error('Recordatorio fallido', a.id, e)
    }
  }
  return Response.json({ sent })
}
```

- [ ] **Step 9: Próxima cita en Inicio** — en `src/app/(app)/inicio/page.tsx`

Agregar imports:

```tsx
import { upcomingForCompany } from '@/services/agenda'
import { formatDateTime } from '@/domain/dates'
```

Después de `const last = …` agregar:

```tsx
  const upcoming = await upcomingForCompany(db, companyId)
  const appointmentLine = upcoming && (
    <p className="text-sm text-muted">
      Su cita: <Link href="/agenda" className="text-ink underline underline-offset-4">{formatDateTime(upcoming.startsAt)}</Link>
    </p>
  )
```

Y renderizar `{appointmentLine}` como último hijo de ambas `<section>`.

- [ ] **Step 10: Verificar en el navegador**

Run: `npm run dev`. Con una empresa, abrir `/agenda`.
Expected: paso 1 muestra hasta 6 días; al elegir un día aparecen sus horas; al elegir una hora aparece "Confirmar cita"; al confirmar se ve "Su cita" con la fecha, "Agregar a mi calendario" descarga el `.ics`, y en `.data/emails` hay dos correos (empresa y consultor) con `cita-crece.ics`. "Cancelar cita" vuelve al paso 1.

Run: `curl -s -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d= -f2)" http://localhost:3000/api/cron/recordatorios`
Expected: `{"sent":0}` o `{"sent":1}` si la cita es en menos de 24 horas.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(agenda): reserva en 3 pasos, asignación de consultor, ics, correos y recordatorios"
```

---

### Task 14: Academia NIIF

**Files:**
- Create: `src/academia/content.ts`, `src/services/academia.ts`, `src/app/(app)/academia/page.tsx`, `src/app/(app)/academia/[slug]/page.tsx`, `src/app/(app)/academia/actions.ts`
- Test: `src/services/academia.test.ts`

**Interfaces:**
- Consumes: `LESSONS`, `getLesson`, `latestConsultation`, `getResultData`.
- Produces:
  - `LESSON_CONTENT: Record<string, string>` (markdown por slug)
  - `completedLessons(db, userId): Promise<Set<string>>`, `markLessonDone(db, userId, slug): Promise<void>`
  - `learningPathForCompany(db, companyId): Promise<LessonMeta[]>`

- [ ] **Step 1: Prueba que falla** — `src/services/academia.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { LESSONS } from '@/academia/lessons'
import { LESSON_CONTENT } from '@/academia/content'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { completedLessons, learningPathForCompany, markLessonDone } from './academia'

describe('academia', () => {
  it('cada guía tiene contenido', () => {
    for (const l of LESSONS) expect(LESSON_CONTENT[l.slug]?.length, l.slug).toBeGreaterThan(200)
  })

  it('marca guías leídas sin duplicar', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    await markLessonDone(db, userId, 'inventarios')
    await markLessonDone(db, userId, 'inventarios')
    expect([...(await completedLessons(db, userId))]).toEqual(['inventarios'])
  })

  it('sin consulta terminada no hay ruta', async () => {
    const db = await makeTestDb()
    const userId = await createUserWithPassword(db, { email: 'a@x.co', name: 'A', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId, name: 'E', nit: '900' })
    expect(await learningPathForCompany(db, companyId)).toEqual([])
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/academia.test.ts`
Expected: FAIL — módulos no existen.

- [ ] **Step 3: `src/academia/content.ts`**

```ts
// Guías basadas en la NIIF para Pymes vigente en Colombia (Decreto 2420 de 2015 y modificatorios).
export const LESSON_CONTENT: Record<string, string> = {
  presentacion: `Un juego completo de estados financieros bajo NIIF para Pymes tiene cinco piezas: estado de situación financiera, estado de resultados, estado de cambios en el patrimonio, estado de flujos de efectivo y notas. Las microempresas del Grupo 3 presentan un juego simplificado: situación financiera, resultados y notas.

## Qué exige

- Cifras comparativas del año anterior.
- Activos y pasivos separados en corrientes y no corrientes: lo que se realiza o paga en los próximos 12 meses es corriente.
- Preparación bajo la hipótesis de negocio en marcha.
- Presentación al menos una vez al año.

## Cómo aplicarlo

1. Parta del balance de prueba cerrado y conciliado.
2. Agrupe las cuentas en las partidas del estado de situación financiera y del estado de resultados.
3. Agregue la columna del año anterior.
4. Con esas cifras, prepare el estado de cambios en el patrimonio y el flujo de efectivo.
5. Redacte las notas.

## Error frecuente

Entregar solo el balance y el estado de resultados que genera el software, sin comparativos ni notas.`,

  'flujo-efectivo': `El estado de flujos de efectivo explica por qué cambió el efectivo entre el inicio y el cierre del año.

## Qué exige

Clasificar los movimientos en tres actividades:

- **Operación**: cobros a clientes, pagos a proveedores y empleados, impuestos.
- **Inversión**: compra y venta de activos fijos e inversiones.
- **Financiación**: préstamos recibidos y pagados, aportes y dividendos.

## Cómo aplicarlo (método indirecto)

1. Empiece con la utilidad del año.
2. Sume los gastos que no movieron efectivo: depreciación, deterioros, provisiones.
3. Ajuste los cambios en cartera, inventarios y proveedores.
4. Agregue las actividades de inversión y financiación.
5. Verifique: efectivo inicial más flujo neto igual a efectivo final del balance.

## Error frecuente

Que el efectivo final del flujo no coincida con el del estado de situación financiera.`,

  notas: `Las notas explican las cifras. Sin ellas, los estados financieros están incompletos.

## Qué exige

- Una declaración de que los estados cumplen con la NIIF para Pymes.
- Las bases de medición y las políticas contables significativas.
- Los juicios de la gerencia y las fuentes clave de incertidumbre en las estimaciones.
- El detalle de las partidas importantes: cartera, inventarios, activos fijos, deudas y patrimonio.

## Cómo aplicarlo

1. Arme una plantilla con una nota por cada partida relevante.
2. Numere las notas y referencie cada número desde los estados.
3. Actualícelas cada cierre con las cifras y los hechos del año.

## Error frecuente

Copiar notas genéricas de otra empresa que no describen lo que su empresa hace.`,

  politicas: `Las políticas contables son las reglas que la empresa usa para registrar y medir sus operaciones.

## Qué exige

- Aplicar las mismas políticas de forma uniforme año tras año.
- **Cambio de política**: se aplica hacia atrás, ajustando los comparativos.
- **Cambio de estimación** (vida útil, deterioro de cartera): se aplica hacia adelante, desde el período del cambio.
- **Error de un período anterior**: se corrige hacia atrás, reexpresando las cifras comparativas.

## Cómo aplicarlo

1. Escriba un manual con una política por cada partida que aplica a su empresa.
2. Hágalo aprobar por la gerencia o la junta.
3. Revíselo cada año o cuando cambie el negocio.

## Error frecuente

Corregir un error de años anteriores contra la utilidad del año actual.`,

  'instrumentos-financieros': `La cartera de clientes, los préstamos bancarios, las cuentas por pagar y las inversiones simples son instrumentos financieros básicos.

## Qué exige

- Medirlos al costo amortizado con el método del interés efectivo cuando incluyen financiación.
- Las cuentas por cobrar y por pagar de corto plazo sin intereses se miden por su valor sin descontar.
- Al cierre, evaluar si hay evidencia objetiva de deterioro de la cartera (mora, dificultades del cliente) y reconocer la pérdida.

## Cómo aplicarlo

1. Haga un análisis de vencimientos de la cartera al cierre.
2. Estime lo que probablemente no se recuperará y regístrelo como deterioro.
3. Para cada préstamo, calcule la tasa efectiva incluyendo comisiones y registre los intereses con ella.

## Error frecuente

Aplicar solo el porcentaje fiscal de provisión de cartera, sin analizar a cada cliente.`,

  inventarios: `## Qué exige

- Medir al costo: compra, transporte, transformación y demás costos para dejarlos listos para la venta.
- Usar promedio ponderado o PEPS (primeras en entrar, primeras en salir). UEPS no está permitido.
- Al cierre, si el precio de venta estimado menos los costos para terminar y vender es menor que el costo, reducir el valor.

## Cómo aplicarlo

1. Haga un conteo físico y ajuste las diferencias.
2. Identifique productos dañados, vencidos o de baja rotación.
3. Compare, por línea, el costo con el precio de venta menos los costos de venta, y registre la diferencia.

## Error frecuente

Mantener al costo mercancía que ya se vende por debajo de lo que costó.`,

  'propiedad-planta-equipo': `## Qué exige

- Reconocer al costo: precio de compra más los costos para ponerlo a funcionar.
- Depreciar a lo largo de la vida útil que la empresa espera usarlo, descontando el valor residual.
- Revisar vida útil, valor residual y método si hay indicios de cambio.
- Depreciar por separado las partes importantes con vidas útiles distintas.

## Cómo aplicarlo

1. Levante un inventario de activos fijos con fecha, costo y ubicación.
2. Defina vidas útiles por grupo según el uso real, no solo según la tabla fiscal.
3. Calcule la depreciación mensual y concilie el auxiliar con la contabilidad.

## Error frecuente

Depreciar con tasas fiscales y dejar en cero activos que se siguen usando por años.`,

  arrendamientos: `La Sección 20 de la NIIF para Pymes vigente en Colombia clasifica cada contrato de arriendo o leasing.

## Qué exige

- **Financiero**: transfiere sustancialmente los riesgos y ventajas del activo, por ejemplo con una opción de compra muy favorable o un plazo que cubre casi toda su vida útil. Se reconoce un activo y una deuda.
- **Operativo**: todos los demás. El gasto se reconoce en línea recta durante el plazo.

## Cómo aplicarlo

1. Liste los contratos de arriendo y leasing vigentes.
2. Evalúe cada uno con los indicadores de la Sección 20.
3. Para los financieros, registre el activo y la deuda por el menor entre el valor razonable y el valor presente de los pagos.

## Error frecuente

Registrar un leasing con opción de compra solo como gasto mensual.

La tercera edición de la NIIF para Pymes cambia este modelo; esta guía se actualizará cuando se adopte en Colombia.`,

  provisiones: `## Qué exige

Reconocer una provisión cuando se cumplen las tres condiciones:

1. Hay una obligación presente por un hecho pasado.
2. Es probable que haya que pagar.
3. El monto se puede estimar de forma fiable.

Si el pago solo es posible, no se registra: se revela en notas como pasivo contingente.

## Cómo aplicarlo

1. Pida al área legal el estado de demandas y reclamaciones.
2. Revise garantías otorgadas y compromisos contractuales.
3. Estime el monto más probable, regístrelo y revíselo en cada cierre.

## Error frecuente

Crear provisiones para gastos futuros que no son obligaciones presentes.`,

  ingresos: `## Qué exige

- **Venta de bienes**: el ingreso se reconoce cuando se transfieren al comprador los riesgos y ventajas.
- **Servicios**: se reconoce según el grado de avance del servicio.
- Se mide por el valor de la contraprestación, descontando rebajas y descuentos.

## Cómo aplicarlo

1. Identifique en qué momento entrega cada tipo de bien o servicio.
2. Revise los cortes: facturas de fin de año con entregas en enero, anticipos recibidos.
3. Registre los anticipos como pasivo hasta que entregue.

## Error frecuente

Registrar como ingreso el anticipo de un cliente por un trabajo que aún no se hace.

La tercera edición de la NIIF para Pymes cambia a un modelo de cinco pasos; esta guía se actualizará cuando aplique.`,

  deterioro: `El deterioro ocurre cuando un activo vale menos de lo que dice la contabilidad.

## Qué exige

- En cada cierre, revisar si hay indicios: daño físico, obsolescencia, caída de ventas o cambios del mercado.
- Si los hay, estimar el importe recuperable (el mayor entre venderlo o seguir usándolo) y registrar la pérdida si es menor que el valor en libros.

## Cómo aplicarlo

1. Use una lista de verificación de indicios en cada cierre.
2. Documente la conclusión, aunque no haya deterioro.
3. Si lo hay, registre la pérdida y revélela en notas.

## Error frecuente

No revisar nunca, y dejar los activos sobrevalorados.`,

  'beneficios-empleados': `## Qué exige

Los beneficios de corto plazo (salarios, cesantías, intereses sobre cesantías, prima y vacaciones) se reconocen como gasto y pasivo a medida que el empleado trabaja, no cuando se pagan.

## Cómo aplicarlo

1. Cause cada mes las prestaciones y vacaciones.
2. Al cierre, concilie el pasivo laboral con la nómina y los saldos por empleado.
3. Revele el gasto por beneficios en notas.

## Error frecuente

Registrar las vacaciones solo cuando el empleado las disfruta.`,

  'impuesto-ganancias': `## Qué exige

- **Impuesto corriente**: el que se paga por la renta del año.
- **Impuesto diferido**: el efecto futuro de las diferencias entre el valor contable y el valor fiscal de activos y pasivos (diferencias temporarias).

Aplica a las empresas de los Grupos 1 y 2.

## Cómo aplicarlo

1. Liste activos y pasivos con su valor contable y su valor fiscal.
2. Calcule las diferencias temporarias.
3. Multiplíquelas por la tarifa que se espera aplicar y registre el activo o pasivo diferido.
4. Mantenga la conciliación fiscal separada de la contabilidad.

## Error frecuente

Ajustar la contabilidad a las cifras fiscales en lugar de conciliarlas.`,

  'hechos-posteriores': `Son los hechos ocurridos entre la fecha de cierre y la fecha en que se autoriza la publicación de los estados.

## Qué exige

- **Implican ajuste**: dan evidencia de condiciones que ya existían al cierre, como un cliente que ya estaba en dificultades y quiebra en enero. Se ajustan las cifras.
- **No implican ajuste**: surgen después del cierre, como un incendio en febrero. Se revelan en notas si son importantes.

## Cómo aplicarlo

Antes de aprobar los estados, revise actas, comunicaciones con abogados, cobros de cartera y ventas de inicio de año.

## Error frecuente

Aprobar los estados sin preguntar qué pasó después del cierre.`,

  'partes-relacionadas': `Son personas o empresas con capacidad de influir en la empresa: socios, sus familiares cercanos, la gerencia y empresas de los mismos dueños.

## Qué exige

Revelar en notas:

- La relación con cada parte.
- Las transacciones del año y los saldos al cierre: préstamos, compras, ventas, arriendos.
- La remuneración total del personal clave de la gerencia.

## Cómo aplicarlo

1. Mantenga una lista actualizada de partes relacionadas.
2. Márquelas en el software contable para extraer sus movimientos.
3. Prepare la nota en cada cierre.

## Error frecuente

No revelar préstamos a socios porque son "de la casa".`,

  'cierre-contable': `Un buen cierre hace que los estados financieros sean confiables y rápidos de preparar.

## Cierre mensual

1. Conciliar bancos.
2. Conciliar cartera y proveedores con sus auxiliares.
3. Causar nómina, prestaciones, servicios e intereses.
4. Registrar depreciaciones y amortizaciones.
5. Revisar inventarios contra el kárdex.
6. Dejar en cero las cuentas transitorias.
7. Guardar el soporte de cada ajuste.

## Además, al cierre anual

- Conteo físico de inventarios y activos fijos.
- Deterioro de cartera, inventarios y activos.
- Impuesto corriente y diferido.
- Revisión de hechos posteriores.

## Error frecuente

Dejar todo para diciembre, cuando los errores del año ya se acumularon.`,

  glosario: `**Activo**: recurso que controla la empresa y del que espera beneficios futuros.

**Pasivo**: obligación presente que la empresa deberá pagar.

**Patrimonio**: lo que queda de los activos después de restar los pasivos.

**Costo amortizado**: valor de un préstamo o una cuenta por cobrar que reparte los intereses a lo largo del plazo.

**Deterioro**: pérdida de valor de un activo por debajo de su valor en libros.

**Valor razonable**: precio que se recibiría al vender un activo entre partes informadas e independientes.

**Importe recuperable**: el mayor entre el valor razonable menos los costos de venta y el valor de uso de un activo.

**Negocio en marcha**: supuesto de que la empresa seguirá operando en el futuro previsible.

**Diferencia temporaria**: diferencia entre el valor contable y el fiscal que se revertirá en el futuro.

**Revelación**: información que se presenta en las notas.

**Reexpresión**: corrección de las cifras de períodos anteriores.

**SMMLV**: salario mínimo mensual legal vigente en Colombia.`,
}
```

- [ ] **Step 4: `src/services/academia.ts`**

```ts
import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { consultation, lessonProgress } from '@/db/schema'
import type { LessonMeta } from '@/academia/lessons'
import { getResultData } from './report'

export async function completedLessons(db: Db, userId: string): Promise<Set<string>> {
  const rows = await db.select({ slug: lessonProgress.lessonSlug }).from(lessonProgress).where(eq(lessonProgress.userId, userId))
  return new Set(rows.map((r) => r.slug))
}

export async function markLessonDone(db: Db, userId: string, slug: string): Promise<void> {
  await db.insert(lessonProgress).values({ userId, lessonSlug: slug }).onConflictDoNothing()
}

// Ruta de la última consulta terminada (aunque haya otra en curso)
export async function learningPathForCompany(db: Db, companyId: string): Promise<LessonMeta[]> {
  const last = await db.query.consultation.findFirst({
    where: and(eq(consultation.companyId, companyId), eq(consultation.status, 'resultado')),
    orderBy: desc(consultation.completedAt),
  })
  if (!last) return []
  return (await getResultData(db, last.id))?.path ?? []
}
```

- [ ] **Step 5: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/academia.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 6: Acción** — `src/app/(app)/academia/actions.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getLesson } from '@/academia/lessons'
import { markLessonDone } from '@/services/academia'

export async function markDoneAction(slug: string, nextHref: string) {
  const user = await requireUser()
  if (!getLesson(slug)) redirect('/academia')
  await markLessonDone(db, user.id, slug)
  redirect(nextHref)
}
```

- [ ] **Step 7: Índice de la Academia** — `src/app/(app)/academia/page.tsx`

```tsx
import Link from 'next/link'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getCompanyIdForUser } from '@/services/companies'
import { completedLessons, learningPathForCompany } from '@/services/academia'
import { LESSONS, type LessonMeta } from '@/academia/lessons'
import { ButtonLink } from '@/ui/button'

function LessonList({ items, done }: { items: LessonMeta[]; done: Set<string> }) {
  return (
    <ul className="divide-y divide-surface">
      {items.map((l) => (
        <li key={l.slug}>
          <Link href={`/academia/${l.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-brand-strong">
            <span className={done.has(l.slug) ? 'text-muted line-through decoration-muted/40' : ''}>{l.title}</span>
            <span className="shrink-0 text-sm text-muted">{done.has(l.slug) ? 'Leída' : `${l.minutes} min`}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function AcademiaPage() {
  const user = await requireUser()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const path = companyId ? await learningPathForCompany(db, companyId) : []
  const done = await completedLessons(db, user.id)
  const next = path.find((l) => !done.has(l.slug))
  const others = LESSONS.filter((l) => !path.some((p) => p.slug === l.slug))

  return (
    <div className="space-y-14 pt-6">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">Academia NIIF</h1>
        {path.length > 0 ? (
          <>
            <p className="text-muted">
              Su ruta según su diagnóstico · {path.filter((l) => done.has(l.slug)).length} de {path.length} leídas
            </p>
            {next && <ButtonLink href={`/academia/${next.slug}`}>Seguir con: {next.title}</ButtonLink>}
            <LessonList items={path} done={done} />
          </>
        ) : (
          <p className="max-w-prose text-muted">Termine una consulta y armaremos una ruta con lo que más necesita. Mientras tanto, puede leer cualquier guía.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{path.length > 0 ? 'Otras guías' : 'Guías'}</h2>
        <LessonList items={others} done={done} />
      </section>
      <p className="text-sm text-muted">Las guías siguen la NIIF para Pymes vigente en Colombia.</p>
    </div>
  )
}
```

- [ ] **Step 8: Guía** — `src/app/(app)/academia/[slug]/page.tsx`

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getLesson, LESSONS } from '@/academia/lessons'
import { LESSON_CONTENT } from '@/academia/content'
import { getCompanyIdForUser } from '@/services/companies'
import { completedLessons, learningPathForCompany } from '@/services/academia'
import { markDoneAction } from '../actions'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lesson = getLesson(slug)
  const content = LESSON_CONTENT[slug]
  if (!lesson || !content) notFound()

  const user = await requireUser()
  const companyId = user.role === 'empresa' ? await getCompanyIdForUser(db, user.id) : null
  const path = companyId ? await learningPathForCompany(db, companyId) : []
  const done = await completedLessons(db, user.id)
  const nextInPath = path.find((l) => l.slug !== slug && !done.has(l.slug))
  const nextHref = nextInPath ? `/academia/${nextInPath.slug}` : '/academia'

  return (
    <article className="max-w-prose space-y-8 pt-6">
      <div className="space-y-2">
        <p className="text-sm text-muted">
          {lesson.sections.length > 0 ? `Sección ${lesson.sections.join(', ')} · ` : ''}
          {lesson.minutes} min
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{lesson.title}</h1>
      </div>
      <div className="space-y-4 text-lg leading-relaxed">
        <ReactMarkdown
          components={{
            h2: (p) => <h2 className="pt-6 text-xl font-semibold" {...p} />,
            ul: (p) => <ul className="list-disc space-y-2 pl-6" {...p} />,
            ol: (p) => <ol className="list-decimal space-y-2 pl-6" {...p} />,
            strong: (p) => <strong className="font-semibold" {...p} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="flex flex-wrap items-center gap-6 pt-6">
        {done.has(slug) ? (
          <Link href={nextHref} className={buttonClass('primary')}>{nextInPath ? `Siguiente: ${nextInPath.title}` : 'Volver a la Academia'}</Link>
        ) : (
          <form action={markDoneAction.bind(null, slug, nextHref)}>
            <SubmitButton>Marcar como leída</SubmitButton>
          </form>
        )}
        <Link href="/academia" className={buttonClass('link')}>Todas las guías</Link>
      </div>
    </article>
  )
}
```

- [ ] **Step 9: Verificar en el navegador**

Run: `npm run dev`. Con una empresa que ya tiene resultado, abrir `/academia`.
Expected: "Su ruta según su diagnóstico" con las guías de sus brechas en orden de severidad y un botón "Seguir con: …"; al marcar una guía como leída pasa a la siguiente de la ruta. Sin consulta terminada, se ve el listado completo.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(academia): 17 guías NIIF para Pymes, ruta personalizada y progreso"
```

---

### Task 15: Panel del consultor

**Files:**
- Create: `src/app/(app)/consultor/page.tsx`, `src/app/(app)/consultor/disponibilidad/page.tsx`, `src/app/(app)/consultor/casos/[appointmentId]/page.tsx`, `src/app/(app)/consultor/actions.ts`
- (Servicios ya creados en la Task 13.)

**Interfaces:**
- Consumes: `consultantAgenda`, `getAppointmentForConsultant`, `getAppointmentDetail`, `saveNotes`, `completeAppointment`, `getAvailability`, `setAvailability`, `getResultData`, `ResultView`, `audit`, `companyEmails`.
- Produces: acciones `saveAvailabilityAction(fd)`, `saveNotesAction(appointmentId, fd)`, `completeAction(appointmentId)`.

- [ ] **Step 1: Acciones** — `src/app/(app)/consultor/actions.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { completeAppointment, saveNotes, setAvailability } from '@/services/agenda'

const DAYS = [1, 2, 3, 4, 5, 6]

export async function saveAvailabilityAction(fd: FormData) {
  const user = await requireUser(['consultor'])
  const rules = DAYS.flatMap((weekday) => {
    if (fd.get(`d${weekday}`) !== 'on') return []
    const from = Number(fd.get(`from${weekday}`))
    const to = Number(fd.get(`to${weekday}`))
    return to > from ? [{ weekday, startMinute: from * 60, endMinute: to * 60 }] : []
  })
  await setAvailability(db, user.id, rules)
  redirect('/consultor/disponibilidad?ok=1')
}

export async function saveNotesAction(appointmentId: string, fd: FormData) {
  const user = await requireUser(['consultor'])
  await saveNotes(db, appointmentId, user.id, String(fd.get('notes') ?? '').slice(0, 5000))
  redirect(`/consultor/casos/${appointmentId}?ok=1`)
}

export async function completeAction(appointmentId: string) {
  const user = await requireUser(['consultor'])
  await completeAppointment(db, appointmentId, user.id)
  redirect('/consultor')
}
```

- [ ] **Step 2: Agenda del consultor** — `src/app/(app)/consultor/page.tsx`

```tsx
import Link from 'next/link'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { consultantAgenda } from '@/services/agenda'
import { formatDateTime } from '@/domain/dates'

export default async function ConsultorPage() {
  const user = await requireUser(['consultor'])
  const items = await consultantAgenda(db, user.id)
  return (
    <section className="space-y-8 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Próximas citas</h1>
      {items.length === 0 ? (
        <p className="text-muted">No tiene citas agendadas.</p>
      ) : (
        <ul className="divide-y divide-surface">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/consultor/casos/${a.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-brand-strong">
                <span>
                  <span className="block font-medium">{a.companyName}</span>
                  <span className="text-sm text-muted first-letter:uppercase">{formatDateTime(a.startsAt)}</span>
                </span>
                <span className="text-2xl font-semibold tabular-nums">{a.finalScore ?? '—'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Disponibilidad** — `src/app/(app)/consultor/disponibilidad/page.tsx`

```tsx
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getAvailability } from '@/services/agenda'
import { saveAvailabilityAction } from '../actions'
import { SubmitButton } from '@/ui/submit-button'

const DAYS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
  { n: 6, label: 'Sábado' },
]
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6:00 a 19:00

const select = 'h-10 rounded-xl bg-surface px-3 text-ink outline-none focus:ring-2 focus:ring-brand'

export default async function DisponibilidadPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser(['consultor'])
  const { ok } = await searchParams
  const rules = await getAvailability(db, user.id)

  return (
    <form action={saveAvailabilityAction} className="space-y-8 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Disponibilidad</h1>
      <ul className="space-y-4">
        {DAYS.map((d) => {
          const day = rules.filter((r) => r.weekday === d.n)
          const from = day.length ? Math.min(...day.map((r) => r.startMinute)) / 60 : 8
          const to = day.length ? Math.max(...day.map((r) => r.endMinute)) / 60 : 17
          return (
            <li key={d.n} className="flex flex-wrap items-center gap-4">
              <label className="flex w-36 items-center gap-3">
                <input type="checkbox" name={`d${d.n}`} defaultChecked={day.length > 0} className="size-5 accent-brand-strong" />
                {d.label}
              </label>
              <select name={`from${d.n}`} defaultValue={from} className={select} aria-label={`${d.label} desde`}>
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
              <span className="text-muted">a</span>
              <select name={`to${d.n}`} defaultValue={to} className={select} aria-label={`${d.label} hasta`}>
                {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
              </select>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {ok && <span className="text-sm text-muted">Guardado</span>}
      </div>
    </form>
  )
}
```

Nota: el formulario guarda un bloque continuo por día. Si la semilla dejó dos bloques (mañana y tarde), al guardar se unen en uno; es el comportamiento esperado.

- [ ] **Step 4: Caso** — `src/app/(app)/consultor/casos/[appointmentId]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getAppointmentDetail, getAppointmentForConsultant } from '@/services/agenda'
import { getResultData } from '@/services/report'
import { companyEmails } from '@/services/companies'
import { audit } from '@/services/audit'
import { formatDateTime } from '@/domain/dates'
import { ResultView } from '@/components/result-view'
import { completeAction, saveNotesAction } from '../../actions'
import { SubmitButton } from '@/ui/submit-button'
import { buttonClass } from '@/ui/button'

export default async function CasoPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>
  searchParams: Promise<{ ok?: string }>
}) {
  const { appointmentId } = await params
  const { ok } = await searchParams
  const user = await requireUser(['consultor'])
  const appt = await getAppointmentForConsultant(db, appointmentId, user.id)
  if (!appt) notFound()
  const detail = (await getAppointmentDetail(db, appointmentId))!
  const emails = await companyEmails(db, appt.companyId)
  const data = appt.consultationId ? await getResultData(db, appt.consultationId) : null
  if (appt.consultationId) {
    await audit(db, { userId: user.id, action: 'ver_reporte', entity: 'consultation', entityId: appt.consultationId })
  }

  return (
    <div className="space-y-16 pt-6">
      <section className="space-y-2">
        <p className="text-sm text-muted first-letter:uppercase">{formatDateTime(appt.startsAt)}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{detail.companyName}</h1>
        <p className="text-muted">{emails.join(', ')}</p>
      </section>

      <form action={saveNotesAction.bind(null, appointmentId)} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted">Notas de la sesión</span>
          <textarea
            name="notes"
            defaultValue={appt.notes ?? ''}
            rows={5}
            className="w-full rounded-xl bg-surface p-4 text-ink outline-none focus:ring-2 focus:ring-brand"
          />
        </label>
        <div className="flex flex-wrap items-center gap-6">
          <SubmitButton pendingLabel="Guardando…">Guardar notas</SubmitButton>
          {ok && <span className="text-sm text-muted">Guardado</span>}
        </div>
      </form>

      {data ? (
        <ResultView data={data} pdfHref={`/consulta/${data.consultationId}/resultado/pdf`} />
      ) : (
        <p className="text-muted">Esta empresa aún no ha terminado una consulta.</p>
      )}

      {appt.status === 'reservada' && (
        <form action={completeAction.bind(null, appointmentId)}>
          <button className={buttonClass('link')}>Marcar la cita como realizada</button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verificar en el navegador**

Run: `npm run dev`. Agendar una cita con una empresa; salir y entrar como `consultor@crece.local / Consultor123!`.
Expected: `/consultor` lista la cita con el índice; el caso muestra la empresa, los correos, las notas (se guardan), el resultado completo y "Descargar PDF" funciona para el consultor. `/consultor/disponibilidad` guarda los cambios, y `/agenda` de la empresa refleja las nuevas horas.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(consultor): agenda, casos con reporte y notas, disponibilidad semanal"
```

---

### Task 16: Administración

**Files:**
- Create: `src/services/admin.ts`, `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/preguntas/page.tsx`, `src/app/(app)/admin/ajustes/page.tsx`, `src/app/(app)/admin/usuarios/page.tsx`, `src/app/(app)/admin/actions.ts`
- Test: `src/services/admin.test.ts`

**Interfaces:**
- Consumes: `getSettings`, `saveSettings`, `Settings`, `createUserWithPassword`, `audit`.
- Produces:
  - `adminMetrics(db, now?): Promise<{ companies: number; completed: number; avgScore: number | null; upcoming: number }>`
  - `listQuestions(db): Promise<Question[]>` (incluye inactivas), `updateQuestion(db, id, patch: { weight: number; active: boolean })`
  - `listUsers(db)`, `setUserRole(db, userId, role: Role)`
  - `settingsFromForm(fd: FormData, current: Settings): Settings`

- [ ] **Step 1: Prueba que falla** — `src/services/admin.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeTestDb } from '@/test/db'
import { seedDatabase } from '@/db/seed-data'
import { consultation } from '@/db/schema'
import { DEFAULT_SETTINGS } from '@/domain/settings'
import { createUserWithPassword } from './users'
import { createCompanyForUser } from './companies'
import { adminMetrics, listQuestions, listUsers, setUserRole, settingsFromForm, updateQuestion } from './admin'

describe('admin', () => {
  it('métricas básicas', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    const u = await createUserWithPassword(db, { email: 'e@x.co', name: 'E', role: 'empresa', password: 'Clave12345!' })
    const companyId = await createCompanyForUser(db, { userId: u, name: 'E', nit: '900' })
    await db.insert(consultation).values([
      { companyId, status: 'resultado', finalScore: 80, completedAt: new Date() },
      { companyId, status: 'resultado', finalScore: 60, completedAt: new Date() },
      { companyId },
    ])
    expect(await adminMetrics(db)).toEqual({ companies: 1, completed: 2, avgScore: 70, upcoming: 0 })
  })

  it('edita preguntas y roles', async () => {
    const db = await makeTestDb()
    await seedDatabase(db)
    await updateQuestion(db, 'd5-software', { weight: 3, active: false })
    const q = (await listQuestions(db)).find((x) => x.id === 'd5-software')
    expect(q).toMatchObject({ weight: 3, active: false })

    const u = await createUserWithPassword(db, { email: 'n@x.co', name: 'N', role: 'empresa', password: 'Clave12345!' })
    await setUserRole(db, u, 'consultor')
    expect((await listUsers(db)).find((x) => x.id === u)?.role).toBe('consultor')
  })

  it('convierte el formulario de ajustes', () => {
    const fd = new FormData()
    fd.set('smmlv', '1.750.905')
    fd.set('consultantThreshold', '65')
    fd.set('blend.diagnostic', '0,7')
    fd.set('severityPenalty.critica', '25')
    const s = settingsFromForm(fd, DEFAULT_SETTINGS)
    expect(s.smmlv).toBe(1_750_905)
    expect(s.consultantThreshold).toBe(65)
    expect(s.blend).toEqual({ diagnostic: 0.7, analysis: 0.3 })
    expect(s.severityPenalty.critica).toBe(25)
    expect(s.group1).toEqual(DEFAULT_SETTINGS.group1)
  })
})
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run src/services/admin.test.ts`
Expected: FAIL — `./admin` no existe.

- [ ] **Step 3: `src/services/admin.ts`**

```ts
import { and, asc, avg, count, eq, gt } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { appointment, company, consultation, question, user } from '@/db/schema'
import type { Settings } from '@/domain/settings'
import type { Question, Role } from '@/domain/types'

export async function adminMetrics(db: Db, now = new Date()) {
  const [{ companies }] = await db.select({ companies: count() }).from(company)
  const [{ completed, avgScore }] = await db
    .select({ completed: count(), avgScore: avg(consultation.finalScore) })
    .from(consultation)
    .where(eq(consultation.status, 'resultado'))
  const [{ upcoming }] = await db
    .select({ upcoming: count() })
    .from(appointment)
    .where(and(eq(appointment.status, 'reservada'), gt(appointment.startsAt, now)))
  return { companies, completed, avgScore: avgScore === null ? null : Math.round(Number(avgScore)), upcoming }
}

export async function listQuestions(db: Db): Promise<Question[]> {
  return db.select().from(question).orderBy(asc(question.order))
}

export async function updateQuestion(db: Db, id: string, patch: { weight: number; active: boolean }): Promise<void> {
  const weight = Math.min(3, Math.max(1, Math.round(patch.weight)))
  await db.update(question).set({ weight, active: patch.active }).where(eq(question.id, id))
}

export async function listUsers(db: Db) {
  return db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt })
    .from(user)
    .orderBy(asc(user.role), asc(user.name))
}

export async function setUserRole(db: Db, userId: string, role: Role): Promise<void> {
  await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, userId))
}

const num = (v: FormDataEntryValue | null, fallback: number): number => {
  if (v === null || String(v).trim() === '') return fallback
  // Acepta "1.750.905" (miles con punto) y "0,7" (decimal con coma)
  const s = String(v).trim()
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, '') : s
  const n = Number(normalized)
  return Number.isFinite(n) ? n : fallback
}

export function settingsFromForm(fd: FormData, current: Settings): Settings {
  const diagnostic = Math.min(1, Math.max(0, num(fd.get('blend.diagnostic'), current.blend.diagnostic)))
  return {
    smmlv: num(fd.get('smmlv'), current.smmlv),
    group1: {
      assetsSmmlv: num(fd.get('group1.assetsSmmlv'), current.group1.assetsSmmlv),
      employees: num(fd.get('group1.employees'), current.group1.employees),
    },
    group3: {
      assetsSmmlv: num(fd.get('group3.assetsSmmlv'), current.group3.assetsSmmlv),
      revenueSmmlv: num(fd.get('group3.revenueSmmlv'), current.group3.revenueSmmlv),
      employees: num(fd.get('group3.employees'), current.group3.employees),
    },
    dimensionWeights: {
      D1: num(fd.get('dimensionWeights.D1'), current.dimensionWeights.D1),
      D2: num(fd.get('dimensionWeights.D2'), current.dimensionWeights.D2),
      D3: num(fd.get('dimensionWeights.D3'), current.dimensionWeights.D3),
      D4: num(fd.get('dimensionWeights.D4'), current.dimensionWeights.D4),
      D5: num(fd.get('dimensionWeights.D5'), current.dimensionWeights.D5),
    },
    severityPenalty: {
      critica: num(fd.get('severityPenalty.critica'), current.severityPenalty.critica),
      alta: num(fd.get('severityPenalty.alta'), current.severityPenalty.alta),
      media: num(fd.get('severityPenalty.media'), current.severityPenalty.media),
      baja: num(fd.get('severityPenalty.baja'), current.severityPenalty.baja),
    },
    blend: { diagnostic, analysis: Math.round((1 - diagnostic) * 100) / 100 },
    consultantThreshold: num(fd.get('consultantThreshold'), current.consultantThreshold),
    appointmentMinutes: num(fd.get('appointmentMinutes'), current.appointmentMinutes),
  }
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run src/services/admin.test.ts`
Expected: PASS (3 pruebas).

- [ ] **Step 5: Acciones** — `src/app/(app)/admin/actions.ts`

```ts
'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { audit } from '@/services/audit'
import { getSettings, saveSettings } from '@/services/settings'
import { setUserRole, settingsFromForm, updateQuestion } from '@/services/admin'
import { createUserWithPassword } from '@/services/users'
import type { Role } from '@/domain/types'

const ROLES: Role[] = ['empresa', 'consultor', 'admin']

export async function updateQuestionAction(id: string, fd: FormData) {
  const admin = await requireUser(['admin'])
  await updateQuestion(db, id, { weight: Number(fd.get('weight')), active: fd.get('active') === 'on' })
  await audit(db, { userId: admin.id, action: 'editar_pregunta', entity: 'question', entityId: id })
  redirect(`/admin/preguntas#${id}`)
}

export async function saveSettingsAction(fd: FormData) {
  const admin = await requireUser(['admin'])
  await saveSettings(db, settingsFromForm(fd, await getSettings(db)))
  await audit(db, { userId: admin.id, action: 'editar_ajustes', entity: 'setting', entityId: 'app' })
  redirect('/admin/ajustes?ok=1')
}

export async function setRoleAction(userId: string, fd: FormData) {
  const admin = await requireUser(['admin'])
  const role = fd.get('role') as Role
  if (!ROLES.includes(role) || userId === admin.id) redirect('/admin/usuarios')
  await setUserRole(db, userId, role)
  await audit(db, { userId: admin.id, action: `rol_${role}`, entity: 'user', entityId: userId })
  redirect('/admin/usuarios')
}

export async function createConsultantAction(fd: FormData) {
  const admin = await requireUser(['admin'])
  const name = String(fd.get('name') ?? '').trim()
  const email = String(fd.get('email') ?? '').trim()
  const password = String(fd.get('password') ?? '')
  if (name.length < 2 || !email.includes('@') || password.length < 8) redirect('/admin/usuarios?error=1')
  const id = await createUserWithPassword(db, { name, email, password, role: 'consultor' })
  await audit(db, { userId: admin.id, action: 'crear_consultor', entity: 'user', entityId: id })
  redirect('/admin/usuarios')
}
```

- [ ] **Step 6: Resumen** — `src/app/(app)/admin/page.tsx`

```tsx
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
```

- [ ] **Step 7: Preguntas** — `src/app/(app)/admin/preguntas/page.tsx`

```tsx
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { listQuestions } from '@/services/admin'
import { DIMENSIONS } from '@/domain/types'
import { updateQuestionAction } from '../actions'

const select = 'h-9 rounded-lg bg-surface px-2 text-sm outline-none focus:ring-2 focus:ring-brand'

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
```

- [ ] **Step 8: Ajustes** — `src/app/(app)/admin/ajustes/page.tsx`

```tsx
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getSettings } from '@/services/settings'
import { DIMENSIONS, SEVERITY_LABEL, SEVERITY_ORDER } from '@/domain/types'
import { saveSettingsAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireUser(['admin'])
  const { ok } = await searchParams
  const s = await getSettings(db)
  return (
    <form action={saveSettingsAction} className="max-w-xl space-y-12 pt-6">
      <h1 className="text-4xl font-semibold tracking-tight">Ajustes</h1>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Clasificación</h2>
        <Field label="SMMLV (COP)" name="smmlv" defaultValue={s.smmlv} inputMode="numeric" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grupo 1 · activos (SMMLV)" name="group1.assetsSmmlv" defaultValue={s.group1.assetsSmmlv} />
          <Field label="Grupo 1 · empleados" name="group1.employees" defaultValue={s.group1.employees} />
          <Field label="Grupo 3 · activos (SMMLV)" name="group3.assetsSmmlv" defaultValue={s.group3.assetsSmmlv} />
          <Field label="Grupo 3 · ingresos (SMMLV)" name="group3.revenueSmmlv" defaultValue={s.group3.revenueSmmlv} />
          <Field label="Grupo 3 · empleados" name="group3.employees" defaultValue={s.group3.employees} />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Índice</h2>
        <div className="grid grid-cols-2 gap-4">
          {DIMENSIONS.map((d) => (
            <Field key={d.key} label={`Peso · ${d.name}`} name={`dimensionWeights.${d.key}`} defaultValue={s.dimensionWeights[d.key]} />
          ))}
          {SEVERITY_ORDER.map((sev) => (
            <Field key={sev} label={`Penalización · ${SEVERITY_LABEL[sev]}`} name={`severityPenalty.${sev}`} defaultValue={s.severityPenalty[sev]} />
          ))}
          <Field label="Peso del diagnóstico (0 a 1)" name="blend.diagnostic" defaultValue={s.blend.diagnostic} hint={`El análisis pesa ${s.blend.analysis}`} />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Derivación y agenda</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Umbral para consultor" name="consultantThreshold" defaultValue={s.consultantThreshold} />
          <Field label="Duración de la cita (min)" name="appointmentMinutes" defaultValue={s.appointmentMinutes} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <SubmitButton pendingLabel="Guardando…">Guardar</SubmitButton>
        {ok && <span className="text-sm text-muted">Guardado</span>}
      </div>
    </form>
  )
}
```

- [ ] **Step 9: Usuarios** — `src/app/(app)/admin/usuarios/page.tsx`

```tsx
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { listUsers } from '@/services/admin'
import { createConsultantAction, setRoleAction } from '../actions'
import { Field } from '@/ui/field'
import { SubmitButton } from '@/ui/submit-button'

const select = 'h-9 rounded-lg bg-surface px-2 text-sm outline-none focus:ring-2 focus:ring-brand'

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
```

- [ ] **Step 10: Verificar**

Run: `npm test && npm run build`
Expected: todas las pruebas pasan; build exitoso.

Manual: entrar como `admin@crece.local / Admin12345!`. En `/admin` se ven las métricas; en `/admin/preguntas`, desactivar una pregunta la quita del diagnóstico de una consulta nueva; en `/admin/ajustes`, cambiar el SMMLV cambia la clasificación; en `/admin/usuarios`, crear un consultor que después puede entrar y ve `/consultor`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(admin): resumen, preguntas y pesos, ajustes, usuarios y consultores"
```

---

### Task 17: Recorrido completo E2E (Playwright)

**Files:**
- Create: `playwright.config.ts`, `e2e/make-fixture.ts`, `e2e/consulta.spec.ts`
- Modify: `package.json` (script `e2e:serve`)

**Interfaces:**
- Consumes: la app completa con analista simulado (`AI_MODEL` vacío) y correo a archivos.

- [ ] **Step 1: Instalar el navegador**

Run: `npx playwright install chromium`

- [ ] **Step 2: Script para levantar un entorno E2E limpio** — agregar en `package.json` → `scripts`

```json
"e2e:serve": "rm -rf .data/e2e* && npm run db:migrate && npm run db:seed && tsx e2e/make-fixture.ts && next dev --port 3100"
```

- [ ] **Step 3: `e2e/make-fixture.ts`**

```ts
import { mkdirSync } from 'node:fs'
import * as XLSX from 'xlsx'

mkdirSync('.data', { recursive: true })
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ['Estado de situación financiera', '2025', '2024'],
    ['Activo corriente', 600000000, 550000000],
    ['Activo no corriente', 400000000, 350000000],
    ['Total activo', 1000000000, 900000000],
    ['Total pasivo', 450000000, 420000000],
    ['Patrimonio', 550000000, 480000000],
  ]),
  'Balance',
)
XLSX.writeFile(wb, '.data/e2e-fixture.xlsx')
console.log('Fixture creado en .data/e2e-fixture.xlsx')
```

- [ ] **Step 4: `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run e2e:serve',
    url: 'http://localhost:3100/entrar',
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: 'file:.data/e2e.db',
      DATABASE_AUTH_TOKEN: '',
      MAIL_DIR: '.data/e2e-emails',
      UPLOAD_DIR: '.data/e2e-uploads',
      BETTER_AUTH_URL: 'http://localhost:3100',
      BETTER_AUTH_SECRET: 'e2e-secreto-de-prueba-con-32-caracteres',
      AI_MODEL: '',
      RESEND_API_KEY: '',
      BLOB_READ_WRITE_TOKEN: '',
    },
  },
})
```

- [ ] **Step 5: `e2e/consulta.spec.ts`**

```ts
import { existsSync, readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

test('consulta completa: registro → clasificar → revisar → examinar → resultado → agenda', async ({ page }) => {
  const email = `e2e+${Date.now()}@crece.test`

  await page.goto('/registro')
  await page.getByLabel('Tu nombre').fill('Ana Contadora')
  await page.getByLabel('Empresa').fill('Panadería La Espiga SAS')
  await page.getByLabel('NIT').fill('900123456')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña').fill('Clave12345!')
  await page.getByLabel(/Autorizo el tratamiento/).check()
  await page.getByRole('button', { name: 'Crear cuenta' }).click()

  await page.getByRole('button', { name: 'Iniciar consulta' }).click()
  await page.getByLabel('Activos totales').fill('800000000')
  await page.getByLabel('Ingresos del último año').fill('1500000000')
  await page.getByLabel('Número de empleados').fill('25')
  await page.getByRole('button', { name: 'Clasificar' }).click()
  await expect(page.getByRole('heading', { name: 'Grupo 2' })).toBeVisible()
  await page.getByRole('link', { name: 'Continuar' }).click()

  // Banderas y preguntas: "Sí" a todo, una por pantalla
  for (let i = 0; i < 60 && !page.url().includes('/examinar'); i++) {
    const before = await page.locator('[data-step]').getAttribute('data-step')
    await page.getByRole('button', { name: 'Sí', exact: true }).click()
    await page.waitForFunction(
      (prev) => location.pathname.endsWith('/examinar') || document.querySelector('[data-step]')?.getAttribute('data-step') !== prev,
      before,
    )
  }
  await expect(page).toHaveURL(/\/examinar$/)

  await page.locator('input[type=file]').setInputFiles('.data/e2e-fixture.xlsx')
  await expect(page.getByText('e2e-fixture.xlsx')).toBeVisible()
  await page.getByRole('button', { name: 'Analizar' }).click()

  await expect(page).toHaveURL(/\/resultado$/)
  await expect(page.locator('main')).toContainText('94/100')
  await expect(page.getByText('Saludable')).toBeVisible()
  await expect(page.getByText('No se evidencia el cálculo del impuesto diferido')).toBeVisible()

  await page.getByRole('link', { name: 'Hablar con un consultor' }).click()
  await page.locator('main ul a').first().click()
  await page.locator('main ul a').first().click()
  await page.getByRole('button', { name: 'Confirmar cita' }).click()
  await expect(page.getByText('Su cita')).toBeVisible()
  await expect(page.getByText('Laura Consultora', { exact: false })).toBeVisible()

  expect(existsSync('.data/e2e-emails')).toBe(true)
  const emails = readdirSync('.data/e2e-emails')
  expect(emails.filter((f) => f.endsWith('.html')).length).toBeGreaterThanOrEqual(3) // reporte + cita empresa + cita consultor
  expect(emails.some((f) => f.endsWith('reporte-crece.pdf'))).toBe(true)
})
```

- [ ] **Step 6: Ejecutar**

Run: `npm run e2e`
Expected: 1 passed. Si falla, abrir el trace con `npx playwright show-trace test-results/**/trace.zip` y corregir el selector o la pantalla.

Nota: el recorrido depende de que haya horarios de consultor en los próximos 14 días (la semilla crea lunes a viernes). Si se corre un sábado por la noche sigue habiendo días hábiles en la ventana.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e package.json
git commit -m "test(e2e): recorrido completo de la consulta con analista simulado"
```

---

### Task 18: Despliegue en Vercel y documentación

**Files:**
- Create: `vercel.json`
- Modify: `README.md`

- [ ] **Step 1: `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/recordatorios", "schedule": "0 13 * * *" }]
}
```

(13:00 UTC = 8:00 en Bogotá. Vercel envía `Authorization: Bearer $CRON_SECRET` automáticamente cuando la variable existe.)

- [ ] **Step 2: `README.md`** (reemplazar)

````markdown
# CRECE · Consulta NIIF para pymes

Diagnóstico, análisis de estados financieros con IA, agenda con consultores y academia NIIF.
Método **CRECE**: Clasificar → Revisar → Examinar → Comunicar → Escalar/Educar.

## Correr en local

```bash
cp .env.example .env          # y poner BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- App: http://localhost:3000
- Admin demo: `admin@crece.local` / `Admin12345!`
- Consultor demo: `consultor@crece.local` / `Consultor123!`
- Base de datos: `local.db` (SQLite)
- Correos: se guardan en `.data/emails/`
- Archivos subidos: `.data/uploads/`
- IA: con `AI_MODEL` vacío se usa un analista simulado

## Pruebas

```bash
npm test        # unitarias e integración (Vitest)
npm run e2e     # recorrido completo (Playwright)
```

## Desplegar en Vercel

1. **Base de datos (Turso, compatible con SQLite)**
   ```bash
   turso db create crece
   turso db show crece --url          # → DATABASE_URL (libsql://…)
   turso db tokens create crece       # → DATABASE_AUTH_TOKEN
   ```
2. **Migrar y sembrar Turso** desde su máquina:
   ```bash
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:migrate
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… \
   SEED_ADMIN_EMAIL=usted@empresa.com SEED_ADMIN_PASSWORD='una-clave-segura' \
   SEED_DEMO_CONSULTANT=false npm run db:seed
   ```
3. **Proyecto en Vercel**: `vercel link`, luego crear un Blob store **privado** y conectarlo al proyecto (agrega `BLOB_READ_WRITE_TOKEN`).
4. **Variables de entorno** (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | de Turso |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://su-dominio` |
   | `RESEND_API_KEY`, `MAIL_FROM` | de Resend, con dominio verificado |
   | `CRON_SECRET` | texto aleatorio |
   | `AI_MODEL` | vacío hasta elegir proveedor; luego `proveedor/modelo` del AI Gateway |
   | `AI_GATEWAY_API_KEY` | opcional en Vercel (usa OIDC); necesaria en local |

5. `vercel deploy --prod`

## Elegir el proveedor de IA

El análisis usa el Vercel AI SDK con AI Gateway: basta con poner `AI_MODEL` (por ejemplo, un modelo de OpenAI o de Google) y redeplegar. No hay que cambiar código.

## Aviso

Los umbrales de clasificación (SMMLV y límites por grupo) son configurables en `/admin/ajustes` y deben validarse con un contador. Los reportes son orientativos y no constituyen una opinión de auditoría.
````

- [ ] **Step 3: Verificación final**

Run: `npm test && npm run build && npm run e2e`
Expected: todo pasa.

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "docs: guía de uso local y despliegue en Vercel con Turso, Blob y Resend"
```

---

## Cobertura de la spec

| Spec | Tareas |
|---|---|
| §2 Método CRECE, dimensiones, banderas | 3, 6, 8 |
| §2.2 Índice | 3, 11 |
| §2.3 Derivación | 3, 11, 12 |
| §2.4 Clasificación | 2, 8, 16 |
| §3 Analista IA agnóstico + chequeos + indicadores | 4, 9, 10 |
| §4 Módulos 1–13 | 7 (1), 2/8 (2), 3/8 (3), 3 (4), 9 (5), 10 (6), 11/12 (7), 13 (8), 11/13 (9), 14 (10), 12 (11), 15 (12), 16 (13) |
| Transversales: auditoría, acceso por empresa, aviso legal | 12, 13, 15, 16 |
| §5 Arquitectura (SQLite local, Turso, Blob, Resend, Better Auth) | 1, 6, 7, 9, 11, 18 |
| §6 Interfaz (Hick, minimal, paleta, sin landing, rutas) | 1, 7, 8, 12–16 |
| §7 Errores | 9, 10, 11, 12, 13 |
| §8 Pruebas | 2–17 |
| §9–10 Despliegue y fases | 18 |
