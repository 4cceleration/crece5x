import { describe, expect, it } from 'vitest'
import { classify } from './classify'
import { DEFAULT_SETTINGS, mergeSettings } from './settings'

const S = DEFAULT_SETTINGS
const base = { assets: 0, revenue: 0, employees: 0, issuesSecurities: false, publicInterest: false }
const smmlv = (n: number) => n * S.smmlv

describe('classify', () => {
  it('Grupo 1 si emite valores', () => {
    expect(classify({ ...base, issuesSecurities: true }, S).group).toBe(1)
  })

  it('Grupo 1 si es de interés público', () => {
    expect(classify({ ...base, publicInterest: true }, S).group).toBe(1)
  })

  it('Grupo 1 por activos sobre 30.000 SMMLV', () => {
    const r = classify({ ...base, assets: smmlv(30_001), employees: 50 }, S)
    expect(r.group).toBe(1)
    expect(r.reason).toContain('activos')
  })

  it('Grupo 1 por más de 200 empleados', () => {
    expect(classify({ ...base, assets: smmlv(1000), employees: 201 }, S).group).toBe(1)
  })

  it('Grupo 3 para microempresa', () => {
    const r = classify({ ...base, assets: smmlv(100), revenue: smmlv(1000), employees: 4 }, S)
    expect(r.group).toBe(3)
  })

  it('Grupo 2 si supera un límite de microempresa', () => {
    expect(classify({ ...base, assets: smmlv(100), revenue: smmlv(1000), employees: 11 }, S).group).toBe(2)
    expect(classify({ ...base, assets: smmlv(600), revenue: smmlv(1000), employees: 4 }, S).group).toBe(2)
    expect(classify({ ...base, assets: smmlv(100), revenue: smmlv(7000), employees: 4 }, S).group).toBe(2)
  })

  it('usa el SMMLV configurado', () => {
    const s = mergeSettings({ smmlv: 2_000_000 })
    expect(classify({ ...base, assets: 30_001 * 2_000_000, employees: 20 }, s).group).toBe(1)
    expect(classify({ ...base, assets: 30_001 * 1_423_500, employees: 20 }, s).group).toBe(2)
  })
})
