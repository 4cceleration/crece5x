// Administración de crece5x por línea de comandos. No hay panel web de administración:
// quien administra necesita acceso a la base de datos (DATABASE_URL / DATABASE_AUTH_TOKEN).
// Uso: npm run admin -- <grupo> <comando> [opciones]
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { userInfo } from 'node:os'
import { parseArgs } from 'node:util'
import { db } from '@/db'
import { WEB_ROLES, type Role } from '@/domain/types'
import {
  adminMetrics,
  findUserByEmail,
  flattenSettings,
  getQuestion,
  listQuestions,
  listUsers,
  recentAudit,
  SETTING_KEYS,
  setSetting,
  setUserRole,
  updateQuestion,
} from '@/services/admin'
import { audit } from '@/services/audit'
import { getSettings, saveSettings } from '@/services/settings'
import { createUserWithPassword } from '@/services/users'

const HELP = `crece5x · administración

  npm run admin -- resumen
  npm run admin -- preguntas listar [--dimension D1..D5]
  npm run admin -- preguntas editar <id> [--peso 1|2|3] [--activa si|no]
  npm run admin -- ajustes ver
  npm run admin -- ajustes cambiar <clave> <valor>
  npm run admin -- usuarios listar
  npm run admin -- usuarios rol <correo> <empresa|consultor>
  npm run admin -- usuarios crear-consultor --nombre "Nombre" --correo correo@dominio [--clave ...]
  npm run admin -- auditoria [--limite 20]

Usa la base de datos de DATABASE_URL (${process.env.DATABASE_URL ?? 'file:local.db'}).`

const actor = `cli:${userInfo().username}`

async function log(action: string, entity: string, entityId: string) {
  await audit(db, { userId: null, action: `${actor}:${action}`, entity, entityId })
}

function fail(message: string): never {
  throw new Error(message)
}

async function run(argv: string[]) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      dimension: { type: 'string' },
      peso: { type: 'string' },
      activa: { type: 'string' },
      nombre: { type: 'string' },
      correo: { type: 'string' },
      clave: { type: 'string' },
      limite: { type: 'string' },
    },
  })
  const [group, command, ...args] = positionals

  switch (`${group ?? ''} ${command ?? ''}`.trim()) {
    case 'resumen': {
      const m = await adminMetrics(db)
      console.table({
        Empresas: m.companies,
        'Consultas terminadas': m.completed,
        'Índice promedio': m.avgScore ?? '—',
        'Citas próximas': m.upcoming,
      })
      return
    }

    case 'preguntas listar': {
      const dim = values.dimension?.toUpperCase()
      const rows = (await listQuestions(db)).filter((q) => !dim || q.dimension === dim)
      console.table(
        rows.map((q) => ({
          id: q.id,
          dim: q.dimension,
          peso: q.weight,
          activa: q.active ? 'sí' : 'no',
          seccion: q.niifSection,
          pregunta: q.text.length > 70 ? `${q.text.slice(0, 67)}…` : q.text,
        })),
      )
      return
    }

    case 'preguntas editar': {
      const id = args[0] ?? fail('Falta el id de la pregunta')
      const q = (await getQuestion(db, id)) ?? fail(`No existe la pregunta ${id}`)
      const weight = values.peso === undefined ? q.weight : Number(values.peso)
      if (![1, 2, 3].includes(weight)) fail('--peso debe ser 1, 2 o 3')
      if (values.activa !== undefined && !['si', 'sí', 'no'].includes(values.activa)) fail('--activa debe ser si o no')
      const active = values.activa === undefined ? q.active : values.activa !== 'no'
      await updateQuestion(db, id, { weight, active })
      await log('editar_pregunta', 'question', id)
      console.log(`Pregunta ${id}: peso ${weight}, ${active ? 'activa' : 'inactiva'}.`)
      return
    }

    case 'ajustes ver': {
      const flat = flattenSettings(await getSettings(db))
      console.table(Object.entries(SETTING_KEYS).map(([clave, spec]) => ({ clave, valor: flat[clave], descripcion: spec.help })))
      return
    }

    case 'ajustes cambiar': {
      const [key, raw] = args
      if (!key || raw === undefined) fail('Uso: ajustes cambiar <clave> <valor>')
      const before = flattenSettings(await getSettings(db))[key]
      await saveSettings(db, setSetting(await getSettings(db), key, raw))
      await log(`ajuste_${key}`, 'setting', 'app')
      console.log(`${key}: ${before} → ${flattenSettings(await getSettings(db))[key]}`)
      return
    }

    case 'usuarios listar': {
      console.table(
        (await listUsers(db)).map((u) => ({
          correo: u.email,
          nombre: u.name,
          rol: u.role,
          acceso_web: WEB_ROLES.includes(u.role) ? 'sí' : 'no',
        })),
      )
      return
    }

    case 'usuarios rol': {
      const [email, role] = args
      if (!email || !role) fail('Uso: usuarios rol <correo> <empresa|consultor>')
      if (!WEB_ROLES.includes(role as Role)) fail(`Rol inválido: ${role}. Opciones: ${WEB_ROLES.join(', ')}`)
      const u = (await findUserByEmail(db, email)) ?? fail(`No existe el usuario ${email}`)
      await setUserRole(db, u.id, role as Role)
      await log(`rol_${role}`, 'user', u.id)
      console.log(`${u.email}: ${u.role} → ${role}`)
      return
    }

    case 'usuarios crear-consultor': {
      const name = values.nombre?.trim() ?? ''
      const email = values.correo?.trim().toLowerCase() ?? ''
      if (name.length < 2) fail('--nombre es obligatorio')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('--correo no es válido')
      if (await findUserByEmail(db, email)) fail(`Ya existe un usuario con ${email}`)
      const password = values.clave ?? randomBytes(9).toString('base64url')
      if (password.length < 8) fail('--clave necesita al menos 8 caracteres')
      const id = await createUserWithPassword(db, { name, email, password, role: 'consultor' })
      await log('crear_consultor', 'user', id)
      console.log(`Consultor creado: ${email}`)
      if (!values.clave) console.log(`Contraseña temporal: ${password}  (compártala por un canal seguro; puede cambiarla con "¿Olvidaste tu contraseña?")`)
      return
    }

    case 'auditoria': {
      const limit = Math.min(500, Math.max(1, Number(values.limite ?? 20) || 20))
      console.table(
        (await recentAudit(db, limit)).map((a) => ({
          fecha: a.at.toISOString().replace('T', ' ').slice(0, 19),
          accion: a.action,
          entidad: a.entity,
          id: a.entityId,
          usuario: a.userId ?? '—',
        })),
      )
      return
    }

    case '':
    case 'ayuda':
      console.log(HELP)
      return

    default:
      fail(`Comando desconocido: ${positionals.join(' ')}\n\n${HELP}`)
  }
}

run(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((e: unknown) => {
    console.error(`Error: ${e instanceof Error ? e.message : String(e)}`)
    process.exit(1)
  })
