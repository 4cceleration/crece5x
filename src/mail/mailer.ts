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
      // El destinatario evita que dos correos con el mismo asunto (p. ej. cancelación a empresa y consultor) se pisen
      const base = `${Date.now()}-${slug(m.subject)}-${slug(m.to[0] ?? 'sin-destinatario')}`
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
  // MAIL_DIR también fuerza archivos en producción (p. ej. la prueba E2E, que corre con next start)
  if (process.env.MAIL_DIR || process.env.NODE_ENV !== 'production') return fileMailer(process.env.MAIL_DIR ?? '.data/emails')
  return consoleMailer
}

export function appUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}
