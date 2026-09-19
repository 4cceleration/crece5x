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
