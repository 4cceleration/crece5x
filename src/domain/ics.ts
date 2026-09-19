const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function buildIcs(e: { uid: string; start: Date; end: Date; summary: string; description: string }): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRECE//Consulta NIIF//ES',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@crece`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.summary)}`,
    `DESCRIPTION:${esc(e.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
