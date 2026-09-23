import { boolean, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core'
import type { Extracted } from '@/ai/schemas'
import type { ClassificationInput } from '@/domain/classify'
import type { Ratios } from '@/domain/ratios'
import type { PlanKey } from '@/domain/plans'
import type { Eeff } from '@/domain/eeff'
import type { Figures } from '@/domain/figures'
import type { AnswerValue, Dimension, FindingSource, Flag, Flags, Group, Role, Severity } from '@/domain/types'

export type ConsultationStatus = 'clasificar' | 'revisar' | 'examinar' | 'resultado'
export type AnalysisStatus = 'pendiente' | 'procesando' | 'listo' | 'error'
/** archivos: la IA leyó lo que subió; cifras: la empresa escribió lo que tiene a la mano (no gasta el cupo de IA) */
export type AnalysisSource = 'archivos' | 'cifras'
export type AppointmentStatus = 'reservada' | 'cancelada' | 'realizada'

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
const uuid = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const createdAt = () => ts('created_at').notNull().$defaultFn(() => new Date())

// ── Better Auth ────────────────────────────────────────────────
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').$type<Role>().notNull().default('empresa'),
  // Preferencias de correo: los avisos de la consulta vienen aceptados; el marketing se pide aparte
  notifyByEmail: boolean('notify_by_email').notNull().default(true),
  marketingEmails: boolean('marketing_emails').notNull().default(false),
  marketingConsentAt: ts('marketing_consent_at'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

// Cambio de correo pendiente: el código de seis dígitos se envía a la dirección nueva
export const emailChange = pgTable('email_change', {
  id: uuid(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  newEmail: text('new_email').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: ts('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: createdAt(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: ts('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
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

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdAt: createdAt(),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

// ── Empresas ───────────────────────────────────────────────────
export const company = pgTable('company', {
  id: uuid(),
  nit: text('nit').notNull(),
  name: text('name').notNull(),
  country: text('country').notNull().default('CO'),
  // Maqueta de planes: la empresa se cambia sola desde /planes, todavía sin cobro
  plan: text('plan').$type<PlanKey>().notNull().default('gratis'),
  planSince: ts('plan_since'),
  consentAt: ts('consent_at').notNull(),
  createdAt: createdAt(),
})

export const companyMember = pgTable(
  'company_member',
  {
    companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.userId] })],
)

// ── Consulta ───────────────────────────────────────────────────
export const consultation = pgTable(
  'consultation',
  {
    id: uuid(),
    companyId: text('company_id').notNull().references(() => company.id, { onDelete: 'cascade' }),
    status: text('status').$type<ConsultationStatus>().notNull().default('clasificar'),
    group: integer('niif_group').$type<Group>(),
    groupReason: text('group_reason'),
    classificationInput: jsonb('classification_input').$type<ClassificationInput>(),
    flags: jsonb('flags').$type<Partial<Flags>>().notNull().$defaultFn(() => ({})),
    // Qué tiene de su último cierre; null mientras no responde la primera pantalla de Revisar
    eeff: text('eeff').$type<Eeff>(),
    // "Los tiene mi contador": desde cuándo espera los archivos y cuántos recordatorios se le enviaron
    waitingSince: ts('waiting_since'),
    waitingReminders: integer('waiting_reminders').notNull().default(0),
    diagnosticScore: doublePrecision('diagnostic_score'),
    analysisScore: doublePrecision('analysis_score'),
    finalScore: doublePrecision('final_score'),
    needsConsultant: boolean('needs_consultant'),
    createdAt: createdAt(),
    completedAt: ts('completed_at'),
  },
  (t) => [index('consultation_company_idx').on(t.companyId)],
)

export const question = pgTable('question', {
  id: text('id').primaryKey(),
  dimension: text('dimension').$type<Dimension>().notNull(),
  text: text('text').notNull(),
  help: text('help').notNull(),
  gap: text('gap').notNull(),
  fix: text('fix').notNull(),
  weight: integer('weight').notNull(),
  requiresFlag: text('requires_flag').$type<Flag>(),
  groups: jsonb('groups').$type<Group[]>().notNull(),
  niifSection: text('niif_section').notNull(),
  lesson: text('lesson').notNull(),
  order: integer('sort_order').notNull(),
  active: boolean('active').notNull().default(true),
})

export const answer = pgTable(
  'answer',
  {
    consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull().references(() => question.id, { onDelete: 'cascade' }),
    value: text('value').$type<AnswerValue>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.consultationId, t.questionId] })],
)

export const upload = pgTable('upload', {
  id: uuid(),
  consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  // Texto reconocido en el navegador (OCR) cuando el PDF viene escaneado
  text: text('text'),
  // Si lo subió el contador desde su enlace; solo puede quitar los suyos
  inviteId: text('invite_id').references(() => accountantInvite.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
})

// Enlace para que el contador suba los estados financieros sin crear cuenta. Uno por consulta:
// reenviar cambia el token y el anterior deja de servir. Se guarda solo el hash del token
export const accountantInvite = pgTable('accountant_invite', {
  id: uuid(),
  consultationId: text('consultation_id').notNull().unique().references(() => consultation.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: ts('expires_at').notNull(),
  // Cuando el contador avisa que terminó de subir
  doneAt: ts('done_at'),
  createdAt: createdAt(),
})

export const analysis = pgTable('analysis', {
  id: uuid(),
  consultationId: text('consultation_id').notNull().unique().references(() => consultation.id, { onDelete: 'cascade' }),
  status: text('status').$type<AnalysisStatus>().notNull().default('pendiente'),
  source: text('source').$type<AnalysisSource>().notNull().default('archivos'),
  // Lo que escribió, para volver a mostrarlo en el formulario
  figures: jsonb('figures').$type<Figures>(),
  extracted: jsonb('extracted').$type<Extracted>(),
  ratios: jsonb('ratios').$type<Ratios>(),
  error: text('error'),
  updatedAt: ts('updated_at').notNull().$defaultFn(() => new Date()),
})

// La explicación de una gráfica se guarda: volver a tocar "?" no gasta otro análisis
export const chartExplanation = pgTable(
  'chart_explanation',
  {
    id: uuid(),
    consultationId: text('consultation_id').notNull().references(() => consultation.id, { onDelete: 'cascade' }),
    chartKey: text('chart_key').notNull(),
    text: text('text').notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.consultationId, t.chartKey)],
)

export const finding = pgTable(
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
export const availability = pgTable('availability', {
  id: uuid(),
  consultantId: text('consultant_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
})

export const appointment = pgTable(
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
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    lessonSlug: text('lesson_slug').notNull(),
    completedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonSlug] })],
)

export const setting = pgTable('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
})

export const auditLog = pgTable('audit_log', {
  id: uuid(),
  userId: text('user_id'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  at: ts('at').notNull().$defaultFn(() => new Date()),
})
