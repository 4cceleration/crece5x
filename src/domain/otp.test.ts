import { describe, expect, it } from 'vitest'
import { checkOtp, hashOtp, newOtp, otpExpiry, OTP_MAX_ATTEMPTS } from './otp'

describe('newOtp', () => {
  it('son seis dígitos, ceros incluidos', () => {
    for (let i = 0; i < 200; i++) expect(newOtp()).toMatch(/^\d{6}$/)
  })
})

describe('checkOtp', () => {
  const code = '123456'
  const stored = (over: Partial<{ expiresAt: Date; attempts: number }> = {}) => ({
    codeHash: hashOtp(code),
    expiresAt: otpExpiry(),
    attempts: 0,
    ...over,
  })

  it('acepta el código correcto, con espacios de sobra', () => {
    expect(checkOtp(stored(), ' 123456 ')).toEqual({ ok: true })
  })

  it('rechaza el código equivocado', () => {
    expect(checkOtp(stored(), '654321')).toEqual({ ok: false, reason: 'incorrecto' })
  })

  it('rechaza el código vencido antes de compararlo', () => {
    expect(checkOtp(stored({ expiresAt: new Date(Date.now() - 1000) }), code)).toEqual({ ok: false, reason: 'vencido' })
  })

  it('se agota tras cinco intentos', () => {
    expect(checkOtp(stored({ attempts: OTP_MAX_ATTEMPTS }), code)).toEqual({ ok: false, reason: 'agotado' })
  })
})
