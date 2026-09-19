// Formato de miles colombiano (100.000.000) para campos de dinero; al guardar, el servidor ignora los puntos
export function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Posición del cursor tras reformatear: se conserva la cantidad de dígitos a su izquierda
export function caretAfterFormat(formatted: string, digitsBeforeCaret: number): number {
  if (digitsBeforeCaret <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++
    if (seen === digitsBeforeCaret) return i + 1
  }
  return formatted.length
}
