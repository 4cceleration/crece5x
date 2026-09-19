import { db } from '@/db'
import { getCurrentUser } from '@/lib/session'
import { canViewConsultation } from '@/services/access'
import { audit } from '@/services/audit'
import { getResultData } from '@/services/report'
import { renderReportPdf } from '@/report/report-pdf'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) return new Response('No autorizado', { status: 401 })
  if (!(await canViewConsultation(db, user, id))) return new Response('No encontrado', { status: 404 })
  const data = await getResultData(db, id)
  if (!data) return new Response('No encontrado', { status: 404 })

  await audit(db, { userId: user.id, action: 'descargar_reporte', entity: 'consultation', entityId: id })
  const pdf = await renderReportPdf(data)
  const name = data.companyName.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="crece-${name}.pdf"`,
    },
  })
}
