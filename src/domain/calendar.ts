// Cuadrícula de un mes (lunes primero) a partir de claves 'YYYY-MM' y 'YYYY-MM-DD', sin zonas horarias
export type CalendarCell = { key: string; day: number; inMonth: boolean }

const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

export function monthKey(dayKey: string): string {
  return dayKey.slice(0, 7)
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthGrid(month: string): CalendarCell[][] {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const offset = (first.getUTCDay() + 6) % 7 // lunes = 0
  const start = new Date(Date.UTC(y, m - 1, 1 - offset))
  const weeks: CalendarCell[][] = []
  const cursor = new Date(start)
  do {
    const week: CalendarCell[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ key: keyOf(cursor), day: cursor.getUTCDate(), inMonth: cursor.getUTCMonth() === m - 1 })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  } while (cursor.getUTCMonth() === m - 1)
  return weeks
}

export function monthTitle(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 1)))
}
