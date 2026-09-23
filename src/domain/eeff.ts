// Cómo lleva la contabilidad y qué tiene de su último cierre. Se pregunta al abrir la consulta y decide
// cómo sigue Examinar: subir archivos, invitar al contador o escribir las cifras que tenga a la mano
export type Eeff = 'completos' | 'contador' | 'parciales' | 'empirica'

export const ACCOUNTING_QUESTION = '¿Cómo lleva la contabilidad de su empresa?'

export const ACCOUNTING_OPTIONS = [
  { key: 'formal', label: 'Contabilidad formal', hint: 'Con contador y software o libros contables' },
  { key: 'empirica', label: 'De forma empírica', hint: 'Cuadernos, hojas de cálculo o de memoria' },
] as const

export const FORMAL_QUESTION = '¿Qué tiene de su último cierre?'

export const FORMAL_OPTIONS: { key: Exclude<Eeff, 'empirica'>; label: string; hint: string }[] = [
  { key: 'completos', label: 'Estados financieros completos', hint: 'Balance, estado de resultados y notas' },
  { key: 'contador', label: 'Los tiene mi contador', hint: 'Le pedimos que los suba por usted' },
  { key: 'parciales', label: 'Declaración de renta o balance de prueba', hint: 'O reportes de su software contable' },
]

export const EEFF_LABEL: Record<Eeff, string> = {
  completos: 'Contabilidad formal, con estados financieros',
  contador: 'Contabilidad formal, estados con el contador',
  parciales: 'Contabilidad formal, con declaración de renta o balance de prueba',
  empirica: 'Contabilidad empírica',
}

export function isEeff(value: string): value is Eeff {
  return value === 'empirica' || FORMAL_OPTIONS.some((o) => o.key === value)
}

/** Tiene estados financieros formales, aunque todavía no los haya subido */
export function hasFormalStatements(eeff: Eeff | null): boolean {
  return eeff === 'completos' || eeff === 'contador'
}

// Días después de elegir "Los tiene mi contador" en que se le recuerda a la empresa, si no hay archivos
export const WAITING_REMINDER_DAYS = [3, 7]

/** Cuántos días dura el enlace que recibe el contador */
export const INVITE_DAYS = 7

/** De dónde salieron las cifras del análisis, cuando no fueron estados financieros */
export type AnalysisBasis = 'estados' | 'parciales' | 'cifras'

export const BASIS_NOTE: Record<Exclude<AnalysisBasis, 'estados'>, string> = {
  parciales:
    'Resultado preliminar: el análisis salió de su declaración de renta o balance de prueba, no de estados financieros NIIF.',
  cifras:
    'Resultado estimado: el análisis salió de las cifras que usted escribió, llevadas a 12 meses. No reemplaza unos estados financieros.',
}
