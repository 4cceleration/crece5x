// Formato de cifras para pantalla (es-CO): punto de miles, coma decimal
const es = (n: number, decimals = 0) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export function formatCompactCOP(value: number): string {
  const sign = value < 0 ? '-' : ''
  const n = Math.abs(value)
  // Un billón (10^12) en cifras grandes: "$ 3.180.232 M" no se lee y desborda las tarjetas
  if (n >= 1_000_000_000_000) {
    const billions = n / 1_000_000_000_000
    const text = es(billions, 1)
    return `${sign}$ ${text} ${text === '1,0' ? 'billón' : 'billones'}`
  }
  if (n >= 1_000_000) {
    const millions = n / 1_000_000
    return `${sign}$ ${es(millions, millions < 10 ? 1 : 0)} M`
  }
  if (n >= 1_000) return `${sign}$ ${es(n / 1_000)} mil`
  return `${sign}$ ${es(n)}`
}

export function formatPercent(ratio: number, decimals = 0): string {
  return `${es(ratio * 100, decimals)} %`
}

// Variación: signo explícito y menos tipográfico para que no se lea como guion
export function formatSignedPercent(ratio: number): string {
  const text = `${es(Math.abs(ratio) * 100, 1)} %`
  if (ratio > 0) return `+${text}`
  if (ratio < 0) return `−${text}`
  return text
}
