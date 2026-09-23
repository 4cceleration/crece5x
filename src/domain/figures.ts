import type { Extracted } from '@/ai/schemas'
import type { NewFinding, Severity } from './types'

// Cifras que una pyme tiene a la mano aunque no lleve contabilidad formal. Con ellas se arma un
// balance y un estado de resultados estimados, y se buscan alertas con reglas fijas (sin IA)
export type Figures = {
  /** Ventas de los últimos 3 meses */
  sales: number
  /** Gastos de los últimos 3 meses: arriendo, nómina, servicios, compras */
  expenses: number
  /** Dinero disponible en caja y bancos hoy */
  cash: number
  /** Lo que le deben los clientes */
  receivables: number
  /** Valor aproximado de la mercancía o materia prima */
  inventory: number
  /** Maquinaria, vehículos, equipos e inmuebles de la empresa */
  fixedAssets: number
  /** Lo que debe a proveedores, impuestos y empleados */
  payables: number
  /** Préstamos con bancos o terceros */
  loans: number
}

export const FIGURE_FIELDS: { key: keyof Figures; label: string; hint: string; required?: boolean }[] = [
  { key: 'sales', label: 'Ventas de los últimos 3 meses', hint: 'Lo que facturó o cobró en total', required: true },
  { key: 'expenses', label: 'Gastos de los últimos 3 meses', hint: 'Arriendo, nómina, servicios, compras', required: true },
  { key: 'cash', label: 'Dinero disponible hoy', hint: 'En caja y en cuentas bancarias', required: true },
  { key: 'receivables', label: 'Lo que le deben sus clientes', hint: 'Ventas a crédito que no le han pagado' },
  { key: 'inventory', label: 'Mercancía o materia prima', hint: 'Valor aproximado de lo que tiene en bodega' },
  { key: 'fixedAssets', label: 'Maquinaria, vehículos, equipos e inmuebles', hint: 'Lo que valdrían hoy' },
  { key: 'payables', label: 'Lo que debe a proveedores, impuestos y empleados', hint: 'Cuentas por pagar' },
  { key: 'loans', label: 'Préstamos con bancos o terceros', hint: 'Saldo que le falta por pagar' },
]

/** Las ventas y gastos de 3 meses se llevan a 12 para que los indicadores sean comparables con los de un cierre */
export const ANNUALIZE = 4

export function figuresToExtracted(f: Figures): Extracted {
  const currentAssets = f.cash + f.receivables + f.inventory
  const totalAssets = currentAssets + f.fixedAssets
  const totalLiabilities = f.payables + f.loans
  return {
    statements: { esf: false, eri: false, flujo: false, patrimonio: false, notas: false },
    periods: [
      {
        label: 'Estimado 12 meses',
        totalAssets,
        currentAssets,
        nonCurrentAssets: f.fixedAssets,
        totalLiabilities,
        currentLiabilities: f.payables,
        nonCurrentLiabilities: f.loans,
        equity: totalAssets - totalLiabilities,
        cash: f.cash,
        inventories: f.inventory,
        revenue: f.sales * ANNUALIZE,
        netIncome: (f.sales - f.expenses) * ANNUALIZE,
      },
    ],
    cashFlow: null,
    currency: 'COP',
  }
}

const fmt = (v: number) => `$ ${Math.round(v).toLocaleString('es-CO')}`

function alert(severity: Severity, title: string, detail: string, recommendation: string, lesson: string | null): NewFinding {
  return { source: 'chequeo', severity, title, detail, niifSection: 'Salud financiera', recommendation, lesson }
}

export const EMPIRICAL_FINDING: NewFinding = {
  source: 'chequeo',
  severity: 'alta',
  title: 'Lleva la contabilidad de forma empírica',
  detail: 'Sin registros contables no puede demostrar sus cifras ante un banco, la DIAN o un cliente grande, y las decisiones se toman a ojo.',
  niifSection: 'Sección 3',
  recommendation: 'Empiece por separar las cuentas personales de las de la empresa, guardar todas las facturas y preparar su primer cierre con un contador.',
  lesson: 'cierre-contable',
}

// Alertas que salen solo de las cifras escritas. `empirical`: la empresa no lleva contabilidad formal
export function figuresFindings(f: Figures, { empirical }: { empirical: boolean }): NewFinding[] {
  const out: NewFinding[] = empirical ? [EMPIRICAL_FINDING] : []
  const assets = f.cash + f.receivables + f.inventory + f.fixedAssets
  const liabilities = f.payables + f.loans
  const monthlyExpenses = f.expenses / 3

  if (liabilities > assets) {
    out.push(alert('critica', 'Debe más de lo que tiene', `Sus deudas suman ${fmt(liabilities)} y lo que tiene suma ${fmt(assets)}.`, 'Revise con un consultor cómo reorganizar las deudas antes de tomar nuevas.', null))
  } else if (assets > 0 && liabilities / assets > 0.7) {
    out.push(alert('media', 'Más del 70 % de lo que tiene está financiado con deudas', `Deudas ${fmt(liabilities)} frente a ${fmt(assets)} en activos.`, 'Evite endeudarse más hasta bajar esa proporción.', 'instrumentos-financieros'))
  }
  if (f.expenses > f.sales) {
    out.push(alert('alta', 'Sus gastos superan sus ventas', `En tres meses vendió ${fmt(f.sales)} y gastó ${fmt(f.expenses)}.`, 'Identifique los gastos que puede recortar y revise sus precios.', null))
  }
  if (monthlyExpenses > 0 && f.cash < monthlyExpenses) {
    out.push(alert('alta', 'El dinero disponible alcanza para menos de un mes de gastos', `Tiene ${fmt(f.cash)} y gasta cerca de ${fmt(monthlyExpenses)} al mes.`, 'Arme una reserva de al menos un mes de gastos y cobre a tiempo la cartera.', null))
  }
  if (f.payables > f.cash + f.receivables + f.inventory) {
    out.push(alert('alta', 'Lo que tiene a corto plazo no alcanza para pagarle a sus proveedores', `Debe ${fmt(f.payables)} a proveedores, impuestos y empleados.`, 'Negocie plazos con sus proveedores y priorice los pagos de impuestos y nómina.', null))
  }
  if (f.sales > 0 && f.receivables > f.sales) {
    out.push(alert('media', 'Sus clientes le deben más de lo que vende en tres meses', `Le deben ${fmt(f.receivables)}.`, 'Defina plazos de pago y haga seguimiento semanal a la cartera.', 'instrumentos-financieros'))
  }
  return out
}

export function parseFigures(read: (key: keyof Figures) => number): Figures {
  return Object.fromEntries(FIGURE_FIELDS.map((f) => [f.key, Math.max(0, read(f.key))])) as Figures
}
