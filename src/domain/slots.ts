export type AvailabilityRule = { consultantId: string; weekday: number; startMinute: number; endMinute: number }
export type Busy = { consultantId: string; startsAt: Date; endsAt: Date }
export type Slot = { consultantId: string; startsAt: Date }

const DAY = 86_400_000
const MIN = 60_000

export function availableSlots(i: {
  rules: AvailabilityRule[]
  busy: Busy[]
  now: Date
  days: number
  durationMin: number
  offsetMin: number
  minNoticeMin?: number
}): Slot[] {
  const notice = (i.minNoticeMin ?? 120) * MIN
  const nowLocal = new Date(i.now.getTime() + i.offsetMin * MIN)
  const firstDay = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate())
  const out: Slot[] = []

  for (let d = 0; d < i.days; d++) {
    const dayLocal = firstDay + d * DAY
    const weekday = new Date(dayLocal).getUTCDay()
    for (const r of i.rules) {
      if (r.weekday !== weekday) continue
      for (let m = r.startMinute; m + i.durationMin <= r.endMinute; m += i.durationMin) {
        const start = dayLocal + m * MIN - i.offsetMin * MIN
        if (start <= i.now.getTime() + notice) continue
        const end = start + i.durationMin * MIN
        const taken = i.busy.some(
          (b) => b.consultantId === r.consultantId && b.startsAt.getTime() < end && b.endsAt.getTime() > start,
        )
        if (!taken) out.push({ consultantId: r.consultantId, startsAt: new Date(start) })
      }
    }
  }
  return out.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
}

export function uniqueTimes(slots: Slot[]): Date[] {
  const seen = new Set<number>()
  const out: Date[] = []
  for (const s of slots) {
    const t = s.startsAt.getTime()
    if (!seen.has(t)) {
      seen.add(t)
      out.push(s.startsAt)
    }
  }
  return out
}
