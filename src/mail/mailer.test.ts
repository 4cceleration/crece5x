import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fileMailer, getMailer } from './mailer'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('fileMailer', () => {
  it('no pisa correos con el mismo asunto enviados en el mismo instante', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-21T13:00:00Z'))
    const dir = mkdtempSync(join(tmpdir(), 'crece-fm-'))
    const mailer = fileMailer(dir)

    await mailer.send({ to: ['empresa@x.co'], subject: 'Cita cancelada: lunes', html: '<p>empresa</p>' })
    await mailer.send({ to: ['consultor@x.co'], subject: 'Cita cancelada: lunes', html: '<p>consultor</p>' })

    const files = readdirSync(dir).filter((f) => f.endsWith('.html'))
    expect(files).toHaveLength(2)
    const bodies = files.map((f) => readFileSync(join(dir, f), 'utf8'))
    expect(bodies.some((b) => b.includes('Para: empresa@x.co'))).toBe(true)
    expect(bodies.some((b) => b.includes('Para: consultor@x.co'))).toBe(true)
  })
})

describe('getMailer', () => {
  const mail = { to: ['a@x.co'], subject: 'Hola', html: '<p>hola</p>' }

  it('en producción guarda archivos si MAIL_DIR está definido (la prueba E2E corre con next start)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'crece-gm-'))
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('MAIL_DIR', dir)

    await getMailer().send(mail)

    expect(readdirSync(dir).filter((f) => f.endsWith('.html'))).toHaveLength(1)
  })

  it('en producción sin MAIL_DIR ni Resend solo escribe en la consola', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('MAIL_DIR', '')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    await getMailer().send(mail)

    expect(log).toHaveBeenCalledWith(expect.stringContaining('[correo] Hola'))
  })
})
