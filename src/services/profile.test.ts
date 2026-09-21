import { beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { makeTestDb } from '@/test/db'
import type { Db } from '@/db/client'
import { emailChange, user } from '@/db/schema'
import { OTP_MAX_ATTEMPTS } from '@/domain/otp'
import { createUserWithPassword } from './users'
import { cancelEmailChange, confirmEmailChange, getProfile, requestEmailChange, setEmailPreferences } from './profile'

let db: Db
let userId: string

beforeEach(async () => {
  db = await makeTestDb()
  userId = await createUserWithPassword(db, { email: 'ana@ejemplo.co', name: 'Ana', role: 'empresa', password: 'Clave12345!' })
})

describe('preferencias de correo', () => {
  it('vienen con los avisos aceptados y el marketing no', async () => {
    const profile = (await getProfile(db, userId))!
    expect(profile).toMatchObject({ email: 'ana@ejemplo.co', notifyByEmail: true, marketingEmails: false, pendingEmail: null })
  })

  it('guarda la fecha en que aceptó el marketing y la borra al rechazarlo', async () => {
    await setEmailPreferences(db, userId, { notifyByEmail: false, marketingEmails: true })
    const aceptado = await db.query.user.findFirst({ where: eq(user.id, userId) })
    expect(aceptado!.notifyByEmail).toBe(false)
    expect(aceptado!.marketingConsentAt).toBeInstanceOf(Date)

    await setEmailPreferences(db, userId, { notifyByEmail: true, marketingEmails: false })
    const rechazado = await db.query.user.findFirst({ where: eq(user.id, userId) })
    expect(rechazado!.marketingConsentAt).toBeNull()
  })
})

describe('cambio de correo con código', () => {
  it('cambia el correo cuando el código es el que se envió', async () => {
    const pedido = await requestEmailChange(db, userId, ' Nueva@Ejemplo.co ')
    expect(pedido.ok).toBe(true)
    if (!pedido.ok) return

    expect(pedido.newEmail).toBe('nueva@ejemplo.co')
    expect((await getProfile(db, userId))!.pendingEmail).toBe('nueva@ejemplo.co')
    // En la base solo queda el hash
    const fila = await db.query.emailChange.findFirst({ where: eq(emailChange.userId, userId) })
    expect(fila!.codeHash).not.toBe(pedido.code)

    expect(await confirmEmailChange(db, userId, pedido.code)).toEqual({ ok: true, email: 'nueva@ejemplo.co' })
    const cambiado = await db.query.user.findFirst({ where: eq(user.id, userId) })
    expect(cambiado!.email).toBe('nueva@ejemplo.co')
    expect(cambiado!.emailVerified).toBe(true)
    expect(await db.query.emailChange.findFirst({ where: eq(emailChange.userId, userId) })).toBeUndefined()
  })

  it('no acepta un correo ya registrado ni el mismo que tiene', async () => {
    await createUserWithPassword(db, { email: 'otra@ejemplo.co', name: 'Otra', role: 'empresa', password: 'Clave12345!' })
    expect(await requestEmailChange(db, userId, 'otra@ejemplo.co')).toEqual({ ok: false, error: 'ocupado' })
    expect(await requestEmailChange(db, userId, 'ana@ejemplo.co')).toEqual({ ok: false, error: 'igual' })
    expect(await requestEmailChange(db, userId, 'sin-arroba')).toEqual({ ok: false, error: 'invalido' })
  })

  it('cuenta los intentos fallidos y se agota', async () => {
    const pedido = await requestEmailChange(db, userId, 'nueva@ejemplo.co')
    if (!pedido.ok) throw new Error('no se pudo pedir el cambio')

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      expect(await confirmEmailChange(db, userId, '000000')).toEqual({ ok: false, error: 'incorrecto' })
    }
    // Agotado: ni siquiera el código bueno sirve ya
    expect(await confirmEmailChange(db, userId, pedido.code)).toEqual({ ok: false, error: 'agotado' })
    expect((await db.query.user.findFirst({ where: eq(user.id, userId) }))!.email).toBe('ana@ejemplo.co')
  })

  it('el código vencido se descarta', async () => {
    const pedido = await requestEmailChange(db, userId, 'nueva@ejemplo.co')
    if (!pedido.ok) throw new Error('no se pudo pedir el cambio')
    await db.update(emailChange).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(emailChange.userId, userId))

    expect(await confirmEmailChange(db, userId, pedido.code)).toEqual({ ok: false, error: 'vencido' })
    expect((await getProfile(db, userId))!.pendingEmail).toBeNull()
  })

  it('pedir otro código reemplaza el anterior, y se puede cancelar', async () => {
    const primero = await requestEmailChange(db, userId, 'nueva@ejemplo.co')
    const segundo = await requestEmailChange(db, userId, 'otra-nueva@ejemplo.co')
    if (!primero.ok || !segundo.ok) throw new Error('no se pudo pedir el cambio')

    expect(await confirmEmailChange(db, userId, primero.code)).toEqual({ ok: false, error: 'incorrecto' })
    await cancelEmailChange(db, userId)
    expect(await confirmEmailChange(db, userId, segundo.code)).toEqual({ ok: false, error: 'sin-solicitud' })
  })
})
