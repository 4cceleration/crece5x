import { createHash, randomInt } from 'node:crypto'

// Código de un solo uso para confirmar el correo nuevo: seis dígitos, quince minutos y cinco intentos.
// Se guarda solo el hash, nunca el código.

export const OTP_LENGTH = 6
export const OTP_MINUTES = 15
export const OTP_MAX_ATTEMPTS = 5

export function newOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0')
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex')
}

export function otpExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + OTP_MINUTES * 60_000)
}

export type OtpCheck = { ok: true } | { ok: false; reason: 'vencido' | 'agotado' | 'incorrecto' }

export function checkOtp(
  stored: { codeHash: string; expiresAt: Date; attempts: number },
  code: string,
  now: Date = new Date(),
): OtpCheck {
  if (stored.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: 'vencido' }
  if (stored.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: 'agotado' }
  if (hashOtp(code) !== stored.codeHash) return { ok: false, reason: 'incorrecto' }
  return { ok: true }
}
