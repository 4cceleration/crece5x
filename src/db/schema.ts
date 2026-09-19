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
