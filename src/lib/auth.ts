import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { getMailer } from '@/mail/mailer'
import { passwordResetEmail } from '@/mail/templates'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      const { subject, html } = passwordResetEmail({ name: user.name, url })
      await getMailer().send({ to: [user.email], subject, html })
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'empresa',
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
})
