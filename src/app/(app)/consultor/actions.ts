'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { completeAppointment, getAppointmentForConsultant, saveNotes, setAvailability } from '@/services/agenda'

const DAYS = [1, 2, 3, 4, 5, 6]

// Horas enteras del día: un formulario manipulado no debe generar franjas fuera de rango
const validHour = (h: number) => Number.isInteger(h) && h >= 0 && h <= 24

export async function saveAvailabilityAction(fd: FormData) {
  const user = await requireUser(['consultor'])
  const rules = DAYS.flatMap((weekday) => {
    if (fd.get(`d${weekday}`) !== 'on') return []
    const from = Number(fd.get(`from${weekday}`))
    const to = Number(fd.get(`to${weekday}`))
    return validHour(from) && validHour(to) && to > from ? [{ weekday, startMinute: from * 60, endMinute: to * 60 }] : []
  })
  await setAvailability(db, user.id, rules)
  redirect('/consultor/disponibilidad?ok=1')
}

export async function saveNotesAction(appointmentId: string, fd: FormData) {
  const user = await requireUser(['consultor'])
  await saveNotes(db, appointmentId, user.id, String(fd.get('notes') ?? '').slice(0, 5000))
  redirect(`/consultor/casos/${appointmentId}?ok=1`)
}

export async function completeAction(appointmentId: string) {
  const user = await requireUser(['consultor'])
  const appt = await getAppointmentForConsultant(db, appointmentId, user.id)
  if (appt?.status === 'reservada') await completeAppointment(db, appointmentId, user.id)
  redirect('/consultor')
}
