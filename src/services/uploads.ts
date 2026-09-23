import { and, asc, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { upload } from '@/db/schema'
import type { Storage } from '@/storage/storage'

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

export function validateFile(f: { name: string; size: number }): string | null {
  if (!(extOf(f.name) in MIME)) return 'Solo se aceptan archivos PDF o Excel.'
  if (f.size === 0) return 'El archivo está vacío.'
  if (f.size > MAX_UPLOAD_BYTES) return 'El archivo supera 4 MB.'
  return null
}

export async function saveUpload(
  db: Db,
  storage: Storage,
  i: { consultationId: string; name: string; size: number; bytes: Buffer; text?: string | null; inviteId?: string },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const error = validateFile(i)
  if (error) return { ok: false, error }
  const ext = extOf(i.name)
  const id = crypto.randomUUID()
  const storageKey = `consultas/${i.consultationId}/${id}.${ext}`
  await storage.put(storageKey, i.bytes, MIME[ext])
  await db
    .insert(upload)
    .values({ id, consultationId: i.consultationId, fileName: i.name, storageKey, mime: MIME[ext], size: i.size, text: i.text ?? null, inviteId: i.inviteId ?? null })
  return { ok: true, id }
}

export async function listUploads(db: Db, consultationId: string) {
  return db.select().from(upload).where(eq(upload.consultationId, consultationId)).orderBy(asc(upload.createdAt))
}

export async function removeUpload(db: Db, consultationId: string, uploadId: string): Promise<void> {
  await db.delete(upload).where(and(eq(upload.id, uploadId), eq(upload.consultationId, consultationId)))
}
