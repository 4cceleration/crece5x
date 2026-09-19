export const BOGOTA_OFFSET_MIN = -300
const TZ = 'America/Bogota'

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, dateStyle: 'full', timeStyle: 'short' }).format(d)
}

export function formatDay(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' }).format(d)
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d)
}

export function localDayKey(d: Date, offsetMin = BOGOTA_OFFSET_MIN): string {
  return new Date(d.getTime() + offsetMin * 60_000).toISOString().slice(0, 10)
}

export function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d)
}

// Partes de una fecha para fichas de calendario: { weekday: 'mar', day: '22', month: 'sept' }
export function formatDayParts(d: Date): { weekday: string; day: string; month: string } {
  const part = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('es-CO', { timeZone: TZ, ...o }).format(d).replace('.', '')
  return { weekday: part({ weekday: 'short' }), day: part({ day: 'numeric' }), month: part({ month: 'short' }) }
}

export function localHour(d: Date, offsetMin = BOGOTA_OFFSET_MIN): number {
  return new Date(d.getTime() + offsetMin * 60_000).getUTCHours()
}
