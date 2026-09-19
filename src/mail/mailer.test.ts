import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fileMailer } from './mailer'

afterEach(() => vi.useRealTimers())

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
