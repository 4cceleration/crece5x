import { describe, expect, it } from 'vitest'
import { caretAfterFormat, formatThousands } from './money'

describe('formatThousands', () => {
  it('agrupa de a tres con punto e ignora lo que no es dígito', () => {
    expect(formatThousands('100000000')).toBe('100.000.000')
    expect(formatThousands('1.500.000.000')).toBe('1.500.000.000')
    expect(formatThousands('12a34')).toBe('1.234')
    expect(formatThousands('000123')).toBe('123')
    expect(formatThousands('')).toBe('')
  })

  it('mantiene el cursor detrás del mismo dígito', () => {
    // "1000|0" → "10.000", 4 dígitos antes del cursor → después del cuarto dígito
    expect(caretAfterFormat('10.000', 4)).toBe(5)
    expect(caretAfterFormat('10.000', 0)).toBe(0)
    expect(caretAfterFormat('10.000', 9)).toBe(6)
  })
})
