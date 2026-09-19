'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { requireUser } from '@/lib/session'
import { getLesson } from '@/academia/lessons'
import { markLessonDone } from '@/services/academia'

export async function markDoneAction(slug: string, nextHref: string) {
  const user = await requireUser()
  if (!getLesson(slug)) redirect('/academia')
  await markLessonDone(db, user.id, slug)
  redirect(nextHref)
}
