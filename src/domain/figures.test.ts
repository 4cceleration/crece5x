import { describe, expect, it } from 'vitest'
import { computeRatios } from './ratios'
import { figuresFindings, figuresToExtracted, type Figures } from './figures'

const M = 1_000_000

const sana: Figures = {
  sales: 300 * M,
  expenses: 240 * M,
  cash: 120 * M,
  receivables: 60 * M,
  inventory: 40 * M,
  fixedAssets: 200 * M,
  payables: 50 * M,
  loans: 100 * M,
}

const titles = (f: Figures, empirical = false) => figuresFindings(f, { empirical }).map((x) => x.title)

describe('cifras a la mano', () => {
  it('arma un balance que cuadra y lleva ventas y utilidad a 12 meses', () => {
    const p = figuresToExtracted(sana).periods[0]
    expect(p.totalAssets).toBe(420 * M)
    expect(p.totalLiabilities).toBe(150 * M)
    expect(p.equity).toBe(270 * M)
    expect(p.revenue).toBe(1200 * M)
    expect(p.netIncome).toBe(240 * M)
    expect(computeRatios(p).netMargin).toBe(0.2)
  })

  it('una empresa sana solo recibe el hallazgo de contabilidad empírica', () => {
    expect(titles(sana)).toEqual([])
    expect(titles(sana, true)).toEqual(['Lleva la contabilidad de forma empírica'])
  })

  it('alerta cuando debe más de lo que tiene', () => {
    const f = figuresFindings({ ...sana, loans: 1000 * M }, { empirical: false })
    expect(f[0]).toMatchObject({ severity: 'critica', title: 'Debe más de lo que tiene' })
  })

  it('alerta gastos mayores que ventas, poca caja, proveedores y cartera', () => {
    const t = titles({ ...sana, expenses: 400 * M, cash: 10 * M, receivables: 350 * M, payables: 500 * M })
    expect(t).toContain('Sus gastos superan sus ventas')
    expect(t).toContain('El dinero disponible alcanza para menos de un mes de gastos')
    expect(t).toContain('Lo que tiene a corto plazo no alcanza para pagarle a sus proveedores')
    expect(t).toContain('Sus clientes le deben más de lo que vende en tres meses')
  })
})
