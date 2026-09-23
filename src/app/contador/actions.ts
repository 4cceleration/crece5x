'use server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { getStorage } from '@/storage/storage'
import { appUrl, getMailer } from '@/mail/mailer'
import { accountantDoneEmail } from '@/mail/templates'
import { saveUpload } from '@/services/uploads'
import { companyNotificationEmails } from '@/services/companies'
import { findOpenInvite, listInviteUploads, markInviteDone, removeInviteUpload } from '@/services/invites'
import { audit } from '@/services/audit'

// Tope por enlace: nadie debería necesitar más archivos para un cierre
const MAX_FILES = 10

const page = (token: string, query = '') => `/contador/${token}${query}`

async function openInvite(token: string) {
  const invite = await findOpenInvite(db, token)
  // Vencido o reemplazado: la página explica qué pasó
  if (!invite) redirect(page(token))
  return invite
}

export async function accountantUploadAction(token: string, fd: FormData) {
  const invite = await openInvite(token)
  const storage = getStorage()
  let count = (await listInviteUploads(db, invite.id)).length
  for (const file of fd.getAll('files')) {
    if (!(file instanceof File) || file.size === 0) continue
    if (count >= MAX_FILES) redirect(page(token, `?error=${encodeURIComponent(`Puede subir hasta ${MAX_FILES} archivos.`)}`))
    const r = await saveUpload(db, storage, {
      consultationId: invite.consultationId,
      inviteId: invite.id,
      name: file.name,
      size: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
      text: (fd.get(`texto:${file.name}`) as string | null)?.trim() || null,
    })
    if (!r.ok) redirect(page(token, `?error=${encodeURIComponent(`${file.name}: ${r.error}`)}`))
    await audit(db, { userId: null, action: 'contador_subir_archivo', entity: 'upload', entityId: r.id })
    count++
  }
  redirect(page(token))
}

export async function accountantRemoveAction(token: string, uploadId: string) {
  const invite = await openInvite(token)
  await removeInviteUpload(db, invite.id, uploadId)
  redirect(page(token))
}

// El contador avisa que terminó: la empresa recibe un correo para ir a analizar
export async function accountantDoneAction(token: string) {
  const invite = await openInvite(token)
  const files = await listInviteUploads(db, invite.id)
  if (files.length === 0) redirect(page(token))

  await markInviteDone(db, invite.id)
  await audit(db, { userId: null, action: 'contador_termino', entity: 'accountant_invite', entityId: invite.id })
  const to = await companyNotificationEmails(db, invite.companyId)
  if (to.length > 0) {
    try {
      await getMailer().send({
        to,
        ...accountantDoneEmail({
          companyName: invite.companyName,
          accountantEmail: invite.email,
          files: files.length,
          url: `${appUrl()}/consulta/${invite.consultationId}/examinar`,
        }),
      })
    } catch (e) {
      console.error('No se pudo avisar a la empresa', e)
    }
  }
  redirect(page(token, '?listo=1'))
}
